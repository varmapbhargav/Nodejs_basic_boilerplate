import { getRedisClient } from '@config/redis';
import { logger } from '@config/logger';
import { v4 as uuidv4 } from 'uuid';

export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class SessionService {
  private static readonly SESSION_PREFIX = 'session:';
  private static readonly SESSION_TTL = 7 * 24 * 60 * 60; // 7 days

  /**
   * Create new session
   */
  static async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Session> {
    const redis = getRedisClient();
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_TTL * 1000);

    const session: Session = {
      id: sessionId,
      userId,
      createdAt: now,
      expiresAt,
      lastActivityAt: now,
      ipAddress,
      userAgent,
    };

    await redis.setEx(
      `${this.SESSION_PREFIX}${sessionId}`,
      this.SESSION_TTL,
      JSON.stringify(session)
    );

    logger.info({ sessionId, userId }, 'Session created');

    return session;
  }

  /**
   * Get session by ID
   */
  static async getSession(sessionId: string): Promise<Session | null> {
    const redis = getRedisClient();
    const data = await redis.get(`${this.SESSION_PREFIX}${sessionId}`);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as Session;
  }

  /**
   * Update session activity
   */
  static async updateActivity(sessionId: string): Promise<void> {
    const redis = getRedisClient();
    const session = await this.getSession(sessionId);

    if (!session) {
      return;
    }

    session.lastActivityAt = new Date();

    await redis.setEx(
      `${this.SESSION_PREFIX}${sessionId}`,
      this.SESSION_TTL,
      JSON.stringify(session)
    );
  }

  /**
   * Revoke session
   */
  static async revokeSession(sessionId: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(`${this.SESSION_PREFIX}${sessionId}`);
    logger.info({ sessionId }, 'Session revoked');
  }

  /**
   * Revoke all sessions for user
   */
  static async revokeAllUserSessions(userId: string): Promise<void> {
    const redis = getRedisClient();
    const keys = await redis.keys(`${this.SESSION_PREFIX}*`);

    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const session = JSON.parse(data) as Session;
        if (session.userId === userId) {
          await redis.del(key);
        }
      }
    }

    logger.warn({ userId }, 'All user sessions revoked');
  }

  /**
   * Get all active sessions for user
   */
  static async getUserSessions(userId: string): Promise<Session[]> {
    const redis = getRedisClient();
    const keys = await redis.keys(`${this.SESSION_PREFIX}*`);
    const sessions: Session[] = [];

    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const session = JSON.parse(data) as Session;
        if (session.userId === userId) {
          sessions.push(session);
        }
      }
    }

    return sessions;
  }
}
