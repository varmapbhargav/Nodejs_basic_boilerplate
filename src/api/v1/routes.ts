import { Router } from 'express';
import { setupUserRoutes } from './modules/user/user.routes';

export function setupV1Routes(): Router {
  const router = Router();

  // Mount user routes
  const usersRouter = Router();
  setupUserRoutes(usersRouter);
  router.use('/users', usersRouter);

  // Health check endpoint
  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0' });
  });

  return router;
}
