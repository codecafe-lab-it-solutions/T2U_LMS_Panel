const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;    // 96-bit IV for GCM
const TAG_LENGTH = 16;   // 128-bit auth tag

/**
 * Derives a 32-byte key from ZOOM_ENCRYPTION_KEY env var using SHA-256.
 * The env var can be any string — SHA-256 always produces 32 bytes.
 */
function getKey() {
  const raw = process.env.ZOOM_ENCRYPTION_KEY;
  if (!raw) throw new Error('ZOOM_ENCRYPTION_KEY is not set in environment variables');
  return crypto.createHash('sha256').update(raw).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 */
function encrypt(plaintext) {
  if (!plaintext) throw new Error('Cannot encrypt empty value');
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * Falls back to returning the value as-is for backward-compatibility
 * with plaintext secrets stored before encryption was introduced.
 */
function decrypt(encryptedValue) {
  if (!encryptedValue) return encryptedValue;

  const parts = encryptedValue.split(':');
  if (parts.length !== 3) {
    // Backward-compat: treat as plaintext (existing ZoomAccount records)
    return encryptedValue;
  }

  try {
    const key = getKey();
    const [ivHex, tagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const ciphertext = Buffer.from(cipherHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    // If decryption fails, treat as plaintext (backward-compat)
    return encryptedValue;
  }
}

/** Returns true if the value looks like an encrypted payload */
function isEncrypted(value) {
  return typeof value === 'string' && value.split(':').length === 3;
}

module.exports = { encrypt, decrypt, isEncrypted };
