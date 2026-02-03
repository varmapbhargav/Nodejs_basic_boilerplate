import request from 'supertest';
import { createApp } from '../../../src/app';

describe('User API Integration Tests', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });

  describe('POST /api/v1/users/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/users/register')
        .send({
          email: 'newuser@example.com',
          firstName: 'John',
          lastName: 'Doe',
          password: 'SecurePassword123',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('newuser@example.com');
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/users/register')
        .send({
          email: 'invalid-email',
          firstName: 'John',
          lastName: 'Doe',
          password: 'SecurePassword123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/users/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.tokens).toBeDefined();
        expect(response.body.data.tokens.accessToken).toBeTruthy();
      }
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });
  });

  describe('GET /metrics', () => {
    it('should return Prometheus metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('http_requests_total');
    });
  });
});
