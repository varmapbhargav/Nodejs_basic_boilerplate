import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { logger } from '@config/logger';
import { getConfig } from '@config/index';

export class EncryptionService {
  /**
   * Hash password
   */
  static async hashPassword(password: string): Promise<string> {
    const config = getConfig();
    return bcrypt.hash(password, config.security.bcryptRounds);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate random token (for password reset, email verification, etc.)
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash token for storage (prevents exposure if database is compromised)
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Encrypt sensitive data with AES-256
   */
  static encryptData(data: string, encryptionKey: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(encryptionKey, 'hex'),
      iv
    );

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Prepend IV to encrypted data
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  static decryptData(encryptedData: string, encryptionKey: string): string {
    try {
      const [ivHex, encrypted] = encryptedData.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(encryptionKey, 'hex'),
        iv
      );

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error({ error }, 'Failed to decrypt data');
      throw error;
    }
  }

  /**
   * Generate HMAC for data integrity verification
   */
  static generateHmac(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify HMAC
   */
  static verifyHmac(data: string, hmac: string, secret: string): boolean {
    const expectedHmac = this.generateHmac(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(hmac),
      Buffer.from(expectedHmac)
    );
  }
}
