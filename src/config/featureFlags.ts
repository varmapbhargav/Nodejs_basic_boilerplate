import { getRedisClient } from './redis';
import { logger } from './logger';

export interface FeatureFlagContext {
  userId?: string;
  userEmail?: string;
  environment?: string;
  customAttributes?: Record<string, any>;
}

export class FeatureFlagService {
  private static readonly CACHE_KEY_PREFIX = 'ff:';
  private static readonly CACHE_TTL = 300; // 5 minutes

  /**
   * Check if a feature flag is enabled
   * Supports global flags, user-based flags, and environment-based flags
   */
  static async isEnabled(
    flagName: string,
    context?: FeatureFlagContext
  ): Promise<boolean> {
    try {
      const redis = getRedisClient();

      // Build cache key
      const cacheKey = this.buildCacheKey(flagName, context);

      // Try cache first
      const cached = await redis.get(cacheKey);
      if (cached !== null) {
        return cached === 'true';
      }

      // Check global flag
      const globalFlag = await redis.get(`${this.CACHE_KEY_PREFIX}${flagName}`);
      if (globalFlag !== null) {
        const isEnabled = globalFlag === 'true';
        await redis.setEx(cacheKey, this.CACHE_TTL, String(isEnabled));
        return isEnabled;
      }

      // Check user-specific flag
      if (context?.userId) {
        const userFlag = await redis.get(
          `${this.CACHE_KEY_PREFIX}user:${context.userId}:${flagName}`
        );
        if (userFlag !== null) {
          const isEnabled = userFlag === 'true';
          await redis.setEx(cacheKey, this.CACHE_TTL, String(isEnabled));
          return isEnabled;
        }
      }

      // Check environment-specific flag
      if (context?.environment) {
        const envFlag = await redis.get(
          `${this.CACHE_KEY_PREFIX}env:${context.environment}:${flagName}`
        );
        if (envFlag !== null) {
          const isEnabled = envFlag === 'true';
          await redis.setEx(cacheKey, this.CACHE_TTL, String(isEnabled));
          return isEnabled;
        }
      }

      // Default: flag is disabled if not found
      return false;
    } catch (error) {
      logger.error({ error, flagName }, 'Failed to check feature flag');
      // Fail open in case of error
      return false;
    }
  }

  /**
   * Enable a feature flag globally
   */
  static async enableGlobal(flagName: string): Promise<void> {
    const redis = getRedisClient();
    await redis.set(`${this.CACHE_KEY_PREFIX}${flagName}`, 'true');
    await this.invalidateCache(flagName);
    logger.info({ flagName }, 'Feature flag enabled globally');
  }

  /**
   * Disable a feature flag globally (kill switch)
   */
  static async disableGlobal(flagName: string): Promise<void> {
    const redis = getRedisClient();
    await redis.set(`${this.CACHE_KEY_PREFIX}${flagName}`, 'false');
    await this.invalidateCache(flagName);
    logger.warn({ flagName }, 'Feature flag disabled globally (KILL SWITCH)');
  }

  /**
   * Enable feature for specific user
   */
  static async enableForUser(flagName: string, userId: string): Promise<void> {
    const redis = getRedisClient();
    await redis.set(
      `${this.CACHE_KEY_PREFIX}user:${userId}:${flagName}`,
      'true'
    );
    logger.info({ flagName, userId }, 'Feature flag enabled for user');
  }

  /**
   * Disable feature for specific user
   */
  static async disableForUser(flagName: string, userId: string): Promise<void> {
    const redis = getRedisClient();
    await redis.set(
      `${this.CACHE_KEY_PREFIX}user:${userId}:${flagName}`,
      'false'
    );
    logger.info({ flagName, userId }, 'Feature flag disabled for user');
  }

  /**
   * Enable feature for environment
   */
  static async enableForEnvironment(
    flagName: string,
    environment: string
  ): Promise<void> {
    const redis = getRedisClient();
    await redis.set(
      `${this.CACHE_KEY_PREFIX}env:${environment}:${flagName}`,
      'true'
    );
    logger.info({ flagName, environment }, 'Feature flag enabled for environment');
  }

  /**
   * Get all flags status
   */
  static async getAllFlags(): Promise<Record<string, boolean>> {
    const redis = getRedisClient();
    const keys = await redis.keys(`${this.CACHE_KEY_PREFIX}*`);

    const flags: Record<string, boolean> = {};

    for (const key of keys) {
      const value = await redis.get(key);
      flags[key] = value === 'true';
    }

    return flags;
  }

  private static buildCacheKey(
    flagName: string,
    context?: FeatureFlagContext
  ): string {
    if (context?.userId) {
      return `${this.CACHE_KEY_PREFIX}cache:${flagName}:user:${context.userId}`;
    }
    if (context?.environment) {
      return `${this.CACHE_KEY_PREFIX}cache:${flagName}:env:${context.environment}`;
    }
    return `${this.CACHE_KEY_PREFIX}cache:${flagName}`;
  }

  private static async invalidateCache(flagName: string): Promise<void> {
    const redis = getRedisClient();
    const cacheKeys = await redis.keys(`${this.CACHE_KEY_PREFIX}cache:${flagName}:*`);
    if (cacheKeys.length > 0) {
      await redis.del(cacheKeys);
    }
  }
}
