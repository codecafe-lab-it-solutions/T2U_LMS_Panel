const { decrypt } = require('../utils/encryption');
const logger = require('../utils/zoomLogger');

const prisma = require('../../lib/prisma');

const ZOOM_OAUTH_URL = 'https://zoom.us/oauth/token';
const ZOOM_API_BASE  = 'https://api.zoom.us/v2';

// Per-config token cache: configId -> { accessToken, expiresAt }
const tokenCache = new Map();

// Refresh 5 minutes before actual expiry to avoid edge-case failures
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/**
 * Exponential-backoff retry wrapper.
 * Retries on any thrown error; caller decides what to retry.
 */
async function withRetry(fn, maxAttempts = 3, label = '') {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) {
        const delayMs = Math.pow(2, attempt - 1) * 1000; // 1 s, 2 s, 4 s
        logger.warn('ZoomAuthService retry', { label, attempt, delayMs, error: err.message });
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  throw lastErr;
}

class ZoomAuthService {
  /**
   * Fetches the active ZoomConfiguration for an organization.
   * Throws if none found — callers must configure credentials first.
   */
  async getConfiguration(organizationId = 'default') {
    const config = await prisma.zoomConfiguration.findFirst({
      where: { organization_id: organizationId, is_active: true },
      orderBy: { created_at: 'desc' },
    });
    if (!config) {
      throw new Error(
        `No active Zoom configuration for organization "${organizationId}". ` +
        'Please add credentials via POST /api/zoom/configuration.'
      );
    }
    return config;
  }

  /**
   * Returns a valid access token, reading from cache or refreshing if needed.
   * Never generates a token on every call — uses cache-first approach.
   */
  async getAccessToken(organizationId = 'default') {
    const config = await this.getConfiguration(organizationId);
    const cached = tokenCache.get(config.id);

    if (cached && cached.expiresAt > Date.now() + EXPIRY_BUFFER_MS) {
      logger.debug('ZoomAuthService cache hit', { configId: config.id });
      return cached.accessToken;
    }

    logger.info('ZoomAuthService refreshing token', { configId: config.id, organizationId });
    return withRetry(() => this._fetchToken(config), 3, 'getAccessToken');
  }

  /**
   * Generates a new OAuth token from Zoom and caches it.
   */
  async _fetchToken(config) {
    const clientSecret = decrypt(config.client_secret);
    const credentials  = Buffer.from(`${config.client_id}:${clientSecret}`).toString('base64');

    const res = await fetch(
      `${ZOOM_OAUTH_URL}?grant_type=account_credentials&account_id=${config.account_id}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const reason = body.reason || body.message || res.status;
      logger.error('ZoomAuthService token fetch failed', { configId: config.id, reason });
      throw new Error(`Zoom OAuth failed: ${reason}`);
    }

    const data = await res.json();
    const expiresInMs = (data.expires_in || 3600) * 1000;

    tokenCache.set(config.id, {
      accessToken: data.access_token,
      expiresAt:   Date.now() + expiresInMs,
    });

    logger.info('ZoomAuthService token cached', { configId: config.id, expiresIn: data.expires_in });
    return data.access_token;
  }

  /**
   * Removes a cached token, forcing a fresh fetch on next call.
   */
  invalidateToken(configId) {
    tokenCache.delete(configId);
    logger.info('ZoomAuthService token invalidated', { configId });
  }

  /**
   * Validates raw credentials (accountId + clientId + clientSecret) without
   * touching the DB.  Called before saving a new ZoomConfiguration to ensure
   * the credentials actually work.
   */
  async validateCredentials(accountId, clientId, clientSecret) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await fetch(
      `${ZOOM_OAUTH_URL}?grant_type=account_credentials&account_id=${accountId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!tokenRes.ok) {
      const body = await tokenRes.json().catch(() => ({}));
      throw new Error(`Zoom credential validation failed: ${body.reason || tokenRes.status}`);
    }

    const { access_token } = await tokenRes.json();

    // Verify the token actually works by fetching the user profile
    const meRes = await fetch(`${ZOOM_API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!meRes.ok) throw new Error('Zoom account verification failed after token generation');

    const me = await meRes.json();
    logger.info('ZoomAuthService credential validation success', { email: me.email });

    return {
      valid:        true,
      email:        me.email,
      display_name: me.display_name,
      plan_type:    me.type,
    };
  }
}

module.exports = new ZoomAuthService();
