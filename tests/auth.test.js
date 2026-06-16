import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/user.model.js';

// We need to set mock environment variables required by tokens
beforeAll(() => {
  process.env.ACCESS_TOKEN_SECRET = 'test-access-secret';
  process.env.ACCESS_TOKEN_EXPIRY = '15m';
  process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
  process.env.REFRESH_TOKEN_EXPIRY = '7d';
});

const testUser = {
  fullName: 'Test User',
  username: 'testuser123',
  email: 'testuser@example.com',
  password: 'password123',
};

describe('Auth Endpoints', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe(testUser.username);
      expect(res.body.data.password).toBeUndefined(); // Password shouldn't be returned

      const userInDb = await User.findOne({ email: testUser.email });
      expect(userInDb).toBeTruthy();
      expect(userInDb.username).toBe(testUser.username);
    });

    it('should fail if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ username: 'onlyusername' });

      expect(res.statusCode).toBe(400); // Bad Request (Joi validation error)
      expect(res.body.success).toBe(false);
    });

    it('should fail if email is already in use', async () => {
      // First create standard user via endpoint
      await request(app).post('/api/v1/auth/register').send(testUser);
      
      // Try again
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...testUser, username: 'anotherusername' }); // Same email

      expect(res.statusCode).toBe(409); // Conflict
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create user directly in DB for login tests
      await User.create({ ...testUser });
    });

    it('should successfully login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'].some(c => c.startsWith('accessToken='))).toBe(true);
      expect(res.headers['set-cookie'].some(c => c.startsWith('refreshToken='))).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('should fail to login with wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });

      expect(res.statusCode).toBe(401); // Unauthorized
      expect(res.body.success).toBe(false);
    });

    it('should access a protected route using the login cookie', async () => {
      const agent = request.agent(app);

      await agent.post('/api/v1/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      const res = await agent.get('/api/v1/users/me');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.email).toBe(testUser.email);
    });
  });
});
