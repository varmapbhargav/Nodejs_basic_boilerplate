import type { Request, Response } from 'express';
import { UserService } from './user.service';
import { ResponseHandler } from '@utils/apiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import { AuditService } from '@observability/logging';
import { UserPolicy } from './user.policy';
import { AuthorizationError } from '@utils/errors';
import type {
  CreateUserInput,
  UpdateUserInput,
  LoginInput,
  PaginationInput,
} from './user.validation';

/**
 * Controller handles HTTP concerns only
 * Business logic delegated to service layer
 */
export class UserController {
  /**
   * POST /api/v1/users/register
   * Register new user
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as CreateUserInput;

    const user = await UserService.register(input);

    await AuditService.logAction(
      req,
      'REGISTER',
      'user',
      'success',
      { resourceId: user.id }
    );

    ResponseHandler.success(res, user, 201, req);
  });

  /**
   * POST /api/v1/users/login
   * Login user
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as LoginInput;

    const result = await UserService.login(input, req.ip, req.get('user-agent'));

    await AuditService.logAction(
      req,
      'LOGIN',
      'user',
      'success',
      { resourceId: result.user.id }
    );

    ResponseHandler.success(
      res,
      {
        user: result.user,
        tokens: result.tokens,
        sessionId: result.sessionId,
      },
      200,
      req
    );
  });

  /**
   * GET /api/v1/users/:id
   * Get user by ID
   */
  static getUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id;

    // Check policy
    if (!UserPolicy.canViewUser(req.user, userId)) {
      throw new AuthorizationError();
    }

    const user = await UserService.getUserById(userId);

    await AuditService.logAction(
      req,
      'READ',
      'user',
      'success',
      { resourceId: userId }
    );

    ResponseHandler.success(res, user, 200, req);
  });

  /**
   * PUT /api/v1/users/:id
   * Update user
   */
  static updateUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const input = req.body as UpdateUserInput;

    // Check policy
    if (!UserPolicy.canUpdateUser(req.user, userId)) {
      throw new AuthorizationError();
    }

    const user = await UserService.updateUser(userId, input);

    await AuditService.logAction(
      req,
      'UPDATE',
      'user',
      'success',
      { resourceId: userId }
    );

    ResponseHandler.success(res, user, 200, req);
  });

  /**
   * DELETE /api/v1/users/:id
   * Delete user
   */
  static deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id;

    // Check policy
    if (!UserPolicy.canDeleteUser(req.user, userId)) {
      throw new AuthorizationError();
    }

    await UserService.deleteUser(userId);

    await AuditService.logAction(
      req,
      'DELETE',
      'user',
      'success',
      { resourceId: userId }
    );

    ResponseHandler.success(res, { message: 'User deleted successfully' }, 200, req);
  });

  /**
   * GET /api/v1/users
   * List all users (admin only)
   */
  static listUsers = asyncHandler(async (req: Request, res: Response) => {
    // Check policy
    if (!UserPolicy.canListUsers(req.user)) {
      throw new AuthorizationError();
    }

    const { page, pageSize } = req.query as unknown as PaginationInput;

    const result = await UserService.listUsers(page, pageSize);

    await AuditService.logAction(
      req,
      'LIST',
      'users',
      'success'
    );

    ResponseHandler.paginated(
      res,
      result.users,
      result.pagination,
      200,
      req
    );
  });

  /**
   * POST /api/v1/users/:id/change-password
   * Change user password
   */
  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    // Check policy
    if (!UserPolicy.canChangePassword(req.user, userId)) {
      throw new AuthorizationError();
    }

    await UserService.changePassword(userId, currentPassword, newPassword);

    await AuditService.logAction(
      req,
      'PASSWORD_CHANGE',
      'user',
      'success',
      { resourceId: userId }
    );

    ResponseHandler.success(
      res,
      { message: 'Password changed successfully' },
      200,
      req
    );
  });
}
