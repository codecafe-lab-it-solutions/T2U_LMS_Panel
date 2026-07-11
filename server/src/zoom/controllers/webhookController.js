const { decrypt } = require('../utils/encryption');
const webhookService = require('../services/ZoomWebhookService');
const logger = require('../utils/zoomLogger');

const prisma = require('../../lib/prisma');

const webhookController = {
  /**
   * POST /zoom/webhooks
   *
   * Handles all Zoom webhook events.
   * Always responds 200 immediately (Zoom requires fast ACK).
   * Actual processing happens asynchronously after the response.
   */
  async handle(req, res) {
    const signature  = req.headers['x-zm-signature'];
    const timestamp  = req.headers['x-zm-request-timestamp'];
    // rawBody is captured by the raw-body middleware in index.js
    const rawBody    = req.rawBody || JSON.stringify(req.body);
    const payload    = req.body;
    const event      = payload?.event;
    const orgId      = req.query.org || 'default';

    logger.info('webhookController.handle', { event, orgId });

    try {
      // Zoom endpoint URL validation (one-time setup handshake)
      if (event === 'endpoint.url_validation') {
        const plainToken = payload?.payload?.plainToken;
        if (!plainToken) return res.status(400).json({ error: 'Missing plainToken' });

        const config = await prisma.zoomConfiguration.findFirst({
          where: { organization_id: orgId, is_active: true },
        });

        if (!config?.webhook_secret) {
          return res.status(400).json({ error: 'No webhook secret configured. Add one in Zoom Configuration.' });
        }

        const webhookSecret = decrypt(config.webhook_secret);
        const response      = webhookService.handleEndpointValidation(plainToken, webhookSecret);
        return res.status(200).json(response);
      }

      // Signature verification for all real events
      if (signature && timestamp) {
        try {
          const config = await prisma.zoomConfiguration.findFirst({
            where: { organization_id: orgId, is_active: true },
          });
          if (config?.webhook_secret) {
            const webhookSecret = decrypt(config.webhook_secret);
            const valid         = webhookService.verifySignature(rawBody, signature, timestamp, webhookSecret);
            if (!valid) {
              logger.warn('webhookController invalid signature', { event, orgId });
              return res.status(401).json({ error: 'Invalid webhook signature' });
            }
          }
        } catch (sigErr) {
          // If we can't verify, log and continue (fail open for now — tighten in prod)
          logger.warn('webhookController signature check error', { error: sigErr.message });
        }
      }

      // ACK immediately — Zoom times out if we take too long
      res.status(200).json({ message: 'Webhook received' });

      // Process the event without blocking the response
      setImmediate(() => {
        webhookService.processEvent(event, payload).catch(err => {
          logger.error('webhookController async processEvent error', { event, error: err.message });
        });
      });
    } catch (err) {
      logger.error('webhookController.handle fatal error', { error: err.message });
      if (!res.headersSent) {
        res.status(500).json({ error: 'Webhook handler error' });
      }
    }
  },
};

module.exports = webhookController;
