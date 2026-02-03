import { USER_ROLES } from '@utils/constants';

/**
 * Policy-based access control (ABAC)
 * Determines if user can perform action on resource
 */
export class UserPolicy {
  /**
   * Can view user details
   */
  static canViewUser(user: Express.Request['user'], targetUserId: string): boolean {
    if (!user) return false;

    // Admin can view any user
    if (user.roles.includes(USER_ROLES.ADMIN)) return true;

    // User can view their own profile
    if (user.id === targetUserId) return true;

    return false;
  }

  /**
   * Can update user
   */
  static canUpdateUser(
    user: Express.Request['user'],
    targetUserId: string
  ): boolean {
    if (!user) return false;

    // Admin can update any user
    if (user.roles.includes(USER_ROLES.ADMIN)) return true;

    // User can update their own profile
    if (user.id === targetUserId) return true;

    return false;
  }

  /**
   * Can delete user
   */
  static canDeleteUser(
    user: Express.Request['user'],
    targetUserId: string
  ): boolean {
    if (!user) return false;

    // Only admin can delete users
    if (user.roles.includes(USER_ROLES.ADMIN)) return true;

    // User can delete their own account (optional)
    if (user.id === targetUserId) return true;

    return false;
  }

  /**
   * Can list users
   */
  static canListUsers(user: Express.Request['user']): boolean {
    if (!user) return false;

    // Only admin can list all users
    return user.roles.includes(USER_ROLES.ADMIN);
  }

  /**
   * Can change password
   */
  static canChangePassword(
    user: Express.Request['user'],
    targetUserId: string
  ): boolean {
    if (!user) return false;

    // User can change their own password
    if (user.id === targetUserId) return true;

    // Admin can change any password
    if (user.roles.includes(USER_ROLES.ADMIN)) return true;

    return false;
  }
}
