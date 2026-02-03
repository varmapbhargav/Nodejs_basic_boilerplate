import jwt, { SignOptions } from 'jsonwebtoken';
import { logger } from '@config/logger';
import { getConfig } from '@config/index';
import { getRedisClient } from '@config/redis';
import { AuthenticationError } from '@utils/errors';
import type { AuthTokens, TokenPayload } from '../../types/common';

export class TokenService {
  /**
   * Generate JWT access token
   */
  static generateAccessToken(
    userId: string,
    email: string,
    roles: string[]
  ): string {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      userId,
      email,
      roles,
    };

    return jwt.sign(payload, getConfig().security.jwtAccessSecret, {
      expiresIn: getConfig().security.jwtAccessExpiry,
    } as SignOptions);
  }

  /**
   * Generate JWT refresh token
   */
  static generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      getConfig().security.jwtRefreshSecret,
      {
        expiresIn: getConfig().security.jwtRefreshExpiry,
      } as SignOptions
    );
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokenPair(
    userId: string,
    email: string,
    roles: string[]
  ): AuthTokens {
    const accessToken = this.generateAccessToken(userId, email, roles);
    const refreshToken = this.generateRefreshToken(userId);

    // Parse expiry for response
    const decoded = jwt.decode(accessToken) as TokenPayload;
    const expiresIn = decoded.exp ? (decoded.exp - decoded.iat) * 1000 : 0;

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string, secret?: string): TokenPayload {
    try {
      const config = getConfig();
      const decoded = jwt.verify(
        token,
        secret || config.security.jwtAccessSecret
      ) as TokenPayload;

      return decoded;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const decoded = jwt.verify(
        refreshToken,
        getConfig().security.jwtRefreshSecret
      ) as { userId: string; type: string };

      if (decoded.type !== 'refresh') {
        throw new AuthenticationError('Invalid token type');
      }

      // Check if token is revoked
      const isRevoked = await this.isTokenRevoked(refreshToken);
      if (isRevoked) {
        throw new AuthenticationError('Token has been revoked');
      }

      // For now, we'll create a new access token
      // In production, you'd fetch user data from database
      const accessToken = jwt.sign(
        { userId: decoded.userId },
        getConfig().security.jwtAccessSecret,
        {
          expiresIn: getConfig().security.jwtAccessExpiry,
        } as SignOptions
      );

      const decodedAccess = jwt.decode(accessToken) as TokenPayload;
      const expiresIn = decodedAccess.exp
        ? (decodedAccess.exp - decodedAccess.iat) * 1000
        : 0;

      return { accessToken, expiresIn };
    } catch (error) {
      throw new AuthenticationError('Failed to refresh token');
    }
  }

  /**
   * Revoke token (add to blacklist)
   */
  static async revokeToken(token: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as TokenPayload;

      if (!decoded || !decoded.exp) {
        return;
      }

      const redis = getRedisClient();
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);

      if (ttl > 0) {
        await redis.setEx(`token:revoked:${token}`, ttl, '1');
        logger.info({ tokenId: decoded.userId }, 'Token revoked');
      }
    } catch (error) {
      logger.error({ error }, 'Failed to revoke token');
    }
  }

  /**
   * Check if token is revoked
   */
  static async isTokenRevoked(token: string): Promise<boolean> {
    try {
      const redis = getRedisClient();
      const result = await redis.get(`token:revoked:${token}`);
      return result === '1';
    } catch (error) {
      logger.error({ error }, 'Failed to check token revocation');
      return false;
    }
  }
}
