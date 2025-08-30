import request from 'supertest';
import app from '../../app';
import { TEST_USERS, db } from '../setup';

describe('Authentication API', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: TEST_USERS.admin.username,
          password: TEST_USERS.admin.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.user.username).toBe(TEST_USERS.admin.username);
      expect(response.body.data.user.role).toBe(TEST_USERS.admin.role);
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: TEST_USERS.admin.username,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: '',
          password: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should update last login timestamp', async () => {
      // Get user before login
      const userBefore = await db.query(
        'SELECT "lastLogin" FROM users WHERE username = $1',
        [TEST_USERS.fieldAgent.username]
      );

      await request(app)
        .post('/api/auth/login')
        .send({
          username: TEST_USERS.fieldAgent.username,
          password: TEST_USERS.fieldAgent.password
        });

      // Get user after login
      const userAfter = await db.query(
        'SELECT "lastLogin" FROM users WHERE username = $1',
        [TEST_USERS.fieldAgent.username]
      );

      expect(new Date(userAfter.rows[0].lastLogin)).toBeInstanceOf(Date);
      if (userBefore.rows[0].lastLogin) {
        expect(new Date(userAfter.rows[0].lastLogin).getTime())
          .toBeGreaterThan(new Date(userBefore.rows[0].lastLogin).getTime());
      }
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: TEST_USERS.admin.username,
          password: TEST_USERS.admin.password
        });

      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: TEST_USERS.admin.username,
          password: TEST_USERS.admin.password
        });

      accessToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: TEST_USERS.manager.username,
          password: TEST_USERS.manager.password
        });

      accessToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should return current user info', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(TEST_USERS.manager.username);
      expect(response.body.data.user.role).toBe(TEST_USERS.manager.role);
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on login attempts', async () => {
      const promises = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              username: 'invalid',
              password: 'invalid'
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in response', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: TEST_USERS.admin.username,
          password: TEST_USERS.admin.password
        });

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });
});
