import type { Router } from 'express';
import { UserController } from './user.controller';
import { validate } from '@middlewares/validate.middleware';
import { authMiddleware } from '@middlewares/auth.middleware';
import { rateLimitConfigs } from '@config/rateLimiter';
import rateLimit from 'express-rate-limit';
import {
  createUserSchema,
  updateUserSchema,
  loginSchema,
} from './user.validation';

export function setupUserRoutes(router: Router): void {
  // Rate limiter for auth endpoints
  const authLimiter = rateLimit({
    windowMs: rateLimitConfigs.auth.windowMs,
    max: rateLimitConfigs.auth.maxRequests,
    message: 'Too many attempts, please try again later',
  });

  // Public routes
  router.post(
    '/register',
    authLimiter,
    validate(createUserSchema, { source: 'body' }),
    UserController.register
  );

  router.post(
    '/login',
    authLimiter,
    validate(loginSchema, { source: 'body' }),
    UserController.login
  );

  // Protected routes
  router.get('/', authMiddleware, UserController.listUsers);

  router.get('/:id', authMiddleware, UserController.getUser);

  router.put(
    '/:id',
    authMiddleware,
    validate(updateUserSchema, { source: 'body' }),
    UserController.updateUser
  );

  router.delete('/:id', authMiddleware, UserController.deleteUser);

  router.post(
    '/:id/change-password',
    authMiddleware,
    UserController.changePassword
  );
}
