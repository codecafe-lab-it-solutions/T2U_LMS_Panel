const { encrypt, decrypt } = require('../utils/encryption');
const authService = require('../services/ZoomAuthService');
const { validateConfiguration } = require('../validators/zoomValidators');
const logger = require('../utils/zoomLogger');

const prisma = require('../../lib/prisma');

/** Standard API response shape used across all Zoom endpoints */
function respond(res, status, message, data = null, errors = null) {
  return res.status(status).json({
    success:   status < 400,
    message,
    data,
    errors,
    timestamp: new Date().toISOString(),
  });
}

/** Safe config object — never returns client_secret or webhook_secret */
function sanitize(cfg) {
  return {
    id:              cfg.id,
    organization_id: cfg.organization_id,
    account_id:      cfg.account_id,
    client_id:       cfg.client_id,
    app_name:        cfg.app_name,
    has_webhook_secret: !!cfg.webhook_secret,
    is_active:       cfg.is_active,
    created_by:      cfg.created_by,
    created_at:      cfg.created_at,
    updated_at:      cfg.updated_at,
  };
}

const configurationController = {
  /** POST /zoom/configuration */
  async create(req, res) {
    try {
      const {
        account_id, client_id, client_secret,
        app_name, webhook_secret,
        organization_id = 'default',
      } = req.body;

      const errors = validateConfiguration({ account_id, client_id, client_secret });
      if (errors.length) return respond(res, 400, 'Validation failed', null, errors);

      // Verify credentials against Zoom before persisting
      try {
        await authService.validateCredentials(account_id.trim(), client_id.trim(), client_secret.trim());
      } catch (credErr) {
        return respond(res, 400, 'Zoom credential validation failed', null, [credErr.message]);
      }

      // Deactivate any existing active config for this org (only one active allowed)
      await prisma.zoomConfiguration.updateMany({
        where: { organization_id, is_active: true },
        data:  { is_active: false },
      });

      const config = await prisma.zoomConfiguration.create({
        data: {
          organization_id,
          account_id:     account_id.trim(),
          client_id:      client_id.trim(),
          client_secret:  encrypt(client_secret.trim()),
          app_name:       app_name || null,
          webhook_secret: webhook_secret ? encrypt(webhook_secret.trim()) : null,
          is_active:      true,
          created_by:     req.user.id,
        },
      });

      logger.info('configurationController.create', {
        configId:       config.id,
        organizationId: organization_id,
        createdBy:      req.user.id,
      });

      return respond(res, 201, 'Zoom configuration saved', sanitize(config));
    } catch (err) {
      logger.error('configurationController.create error', { error: err.message });
      return respond(res, 500, 'Failed to save configuration', null, [err.message]);
    }
  },

  /** GET /zoom/configuration */
  async list(req, res) {
    try {
      const organizationId = req.query.organization_id || 'default';
      const configs = await prisma.zoomConfiguration.findMany({
        where:   { organization_id: organizationId },
        orderBy: { created_at: 'desc' },
      });
      return respond(res, 200, 'Configurations retrieved', configs.map(sanitize));
    } catch (err) {
      logger.error('configurationController.list error', { error: err.message });
      return respond(res, 500, 'Failed to retrieve configurations', null, [err.message]);
    }
  },

  /** PUT /zoom/configuration/:id */
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        account_id, client_id, client_secret,
        app_name, webhook_secret, is_active,
      } = req.body;

      const existing = await prisma.zoomConfiguration.findUnique({ where: { id } });
      if (!existing) return respond(res, 404, 'Configuration not found');

      // If any credential field changes, re-validate against Zoom
      if (account_id || client_id || client_secret) {
        const testAccountId  = account_id  || existing.account_id;
        const testClientId   = client_id   || existing.client_id;
        const testSecret     = client_secret || decrypt(existing.client_secret);

        try {
          await authService.validateCredentials(testAccountId, testClientId, testSecret);
        } catch (credErr) {
          return respond(res, 400, 'Zoom credential validation failed', null, [credErr.message]);
        }

        // Invalidate cached token since credentials changed
        authService.invalidateToken(id);
      }

      const updateData = {};
      if (account_id    !== undefined) updateData.account_id    = account_id.trim();
      if (client_id     !== undefined) updateData.client_id     = client_id.trim();
      if (client_secret !== undefined) updateData.client_secret = encrypt(client_secret.trim());
      if (app_name      !== undefined) updateData.app_name      = app_name;
      if (webhook_secret !== undefined) updateData.webhook_secret = encrypt(webhook_secret.trim());
      if (is_active     !== undefined) updateData.is_active     = is_active;

      const updated = await prisma.zoomConfiguration.update({ where: { id }, data: updateData });

      logger.info('configurationController.update', { configId: id, updatedBy: req.user.id });
      return respond(res, 200, 'Configuration updated', sanitize(updated));
    } catch (err) {
      logger.error('configurationController.update error', { error: err.message });
      return respond(res, 500, 'Failed to update configuration', null, [err.message]);
    }
  },

  /** DELETE /zoom/configuration/:id */
  async remove(req, res) {
    try {
      const { id } = req.params;
      await prisma.zoomConfiguration.delete({ where: { id } });
      authService.invalidateToken(id);

      logger.info('configurationController.delete', { configId: id, deletedBy: req.user.id });
      return respond(res, 200, 'Configuration deleted');
    } catch (err) {
      logger.error('configurationController.delete error', { error: err.message });
      return respond(res, 500, 'Failed to delete configuration', null, [err.message]);
    }
  },

  /** POST /zoom/configuration/:id/test */
  async test(req, res) {
    try {
      const { id } = req.params;
      const config = await prisma.zoomConfiguration.findUnique({ where: { id } });
      if (!config) return respond(res, 404, 'Configuration not found');

      const result = await authService.validateCredentials(
        config.account_id,
        config.client_id,
        decrypt(config.client_secret)
      );

      logger.info('configurationController.test success', { configId: id });
      return respond(res, 200, 'Zoom credentials are valid', result);
    } catch (err) {
      logger.error('configurationController.test error', { error: err.message });
      return respond(res, 400, 'Credential validation failed', null, [err.message]);
    }
  },
};

module.exports = configurationController;
