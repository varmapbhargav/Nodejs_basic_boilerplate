import { logger } from '@config/logger';
import { UserRepository } from './user.repository';
import { EncryptionService } from '@services/encryption.service';
import { TokenService } from '@services/auth/token.service';
import { SessionService } from '@services/auth/session.service';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
} from '@utils/errors';
import type { UserBase, UserResponse, AuthTokens } from '../../../../types/common';
import type { CreateUserInput, UpdateUserInput, LoginInput } from './user.validation';

/**
 * Service contains all business logic
 * No HTTP concerns here
 */
export class UserService {
  /**
   * Register new user
   */
  static async register(input: CreateUserInput): Promise<UserResponse> {
    try {
      // Check if user exists
      const existingUser = await UserRepository.findByEmail(input.email);
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const passwordHash = await EncryptionService.hashPassword(input.password);

      // Create user
      const user = await UserRepository.create({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash,
        roles: ['user'],
        isActive: true,
      });

      logger.info({ userId: user.id, email: user.email }, 'User registered');

      return this.formatUserResponse(user);
    } catch (error) {
      logger.error({ error }, 'Failed to register user');
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login(
    input: LoginInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: UserResponse; tokens: AuthTokens; sessionId: string }> {
    try {
      // Find user by email
      const user = await UserRepository.findByEmail(input.email);
      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await EncryptionService.comparePassword(
        input.password,
        user.passwordHash || ''
      );

      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Create session
      const session = await SessionService.createSession(
        user.id,
        ipAddress,
        userAgent
      );

      // Generate tokens
      const tokens = TokenService.generateTokenPair(user.id, user.email, user.roles);

      logger.info({ userId: user.id, sessionId: session.id }, 'User logged in');

      return {
        user: this.formatUserResponse(user),
        tokens,
        sessionId: session.id,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to login user');
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<UserResponse> {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      return this.formatUserResponse(user);
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get user');
      throw error;
    }
  }

  /**
   * Update user
   */
  static async updateUser(
    userId: string,
    input: UpdateUserInput
  ): Promise<UserResponse> {
    try {
      // Check if email is being changed to existing email
      if (input.email) {
        const existingUser = await UserRepository.findByEmail(input.email);
        if (existingUser && existingUser.id !== userId) {
          throw new ConflictError('Email already in use');
        }
      }

      const updated = await UserRepository.update(userId, input);

      logger.info({ userId }, 'User profile updated');

      return this.formatUserResponse(updated);
    } catch (error) {
      logger.error({ error, userId }, 'Failed to update user');
      throw error;
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      await UserRepository.delete(userId);

      // Revoke all sessions
      await SessionService.revokeAllUserSessions(userId);

      logger.info({ userId }, 'User deleted');
    } catch (error) {
      logger.error({ error, userId }, 'Failed to delete user');
      throw error;
    }
  }

  /**
   * Change password
   */
  static async changePassword(
    userId: string,
    _currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // TODO: Fetch full user with password hash from database
      // For now, mock verification
      await EncryptionService.hashPassword(newPassword);
      await UserRepository.update(userId, {});

      logger.info({ userId }, 'Password changed');
    } catch (error) {
      logger.error({ error, userId }, 'Failed to change password');
      throw error;
    }
  }

  /**
   * List all users
   */
  static async listUsers(page: number = 1, pageSize: number = 20) {
    try {
      const skip = (page - 1) * pageSize;
      const { users, total } = await UserRepository.findAll({
        skip,
        limit: pageSize,
      });

      const pages = Math.ceil(total / pageSize);

      return {
        users: users.map((u) => this.formatUserResponse(u)),
        pagination: { page, pageSize, total, pages },
      };
    } catch (error) {
      logger.error({ error }, 'Failed to list users');
      throw error;
    }
  }

  /**
   * Format user for API response (remove sensitive data)
   */
  private static formatUserResponse(user: UserBase): UserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      permissions: this.getUserPermissions(user.roles),
    };
  }

  /**
   * Get permissions based on roles
   */
  private static getUserPermissions(roles: string[]): string[] {
    const permissionMap: Record<string, string[]> = {
      admin: ['user:create', 'user:read', 'user:update', 'user:delete', 'admin:read', 'admin:write'],
      user: ['user:read'],
    };

    const permissions = new Set<string>();

    roles.forEach((role) => {
      const rolePermissions = permissionMap[role] || [];
      rolePermissions.forEach((p) => permissions.add(p));
    });

    return Array.from(permissions);
  }
}
