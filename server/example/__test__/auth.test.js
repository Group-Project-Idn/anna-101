const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');
const { signToken } = require('../helpers/jwt');
const { hashPassword, comparePassword } = require('../helpers/bcrypt');

let access_token;
let testUser;

beforeAll(async () => {
  // Clean up any existing test user
  await sequelize.models.User.destroy({
    where: { email: 'test@example.com' },
  });

  // Create test user - password will be hashed by beforeCreate hook
  testUser = await sequelize.models.User.create({
    email: 'test@example.com',
    password: 'password123', // Plain password - hook will hash it
    name: 'Test User',
  });

  // Generate access token
  access_token = signToken({
    id: testUser.id,
    email: testUser.email,
    name: testUser.name,
  });
});

afterAll(async () => {
  // Clean up test data
  await sequelize.models.User.destroy({
    where: { email: 'test@example.com' },
  });
  await sequelize.models.User.destroy({
    where: { email: 'newuser@example.com' },
  });
  await sequelize.models.Stock.destroy({
    where: { symbol: 'TEST' },
  });
});

describe('POST /api/auth/register', () => {
  describe('POST /api/auth/register - success', () => {
    it('should return 201 and access_token', async () => {
      const body = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      const res = await request(app).post('/api/auth/register').send(body);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', 'newuser@example.com');
    });
  });

  describe('POST /api/auth/register - failed', () => {
    it('should return 400 when email is missing', async () => {
      const body = {
        password: 'password123',
        name: 'No Email User',
      };

      const res = await request(app).post('/api/auth/register').send(body);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 when password is too short', async () => {
      const body = {
        email: 'shortpass@example.com',
        password: '123',
        name: 'Short Password',
      };

      const res = await request(app).post('/api/auth/register').send(body);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 when email already registered', async () => {
      const body = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Duplicate User',
      };

      const res = await request(app).post('/api/auth/register').send(body);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Email already registered.');
    });
  });
});

describe('POST /api/auth/login', () => {
  describe('POST /api/auth/login - success', () => {
    it('should return 200 and access_token', async () => {
      const body = {
        email: 'test@example.com',
        password: 'password123',
      };

      const res = await request(app).post('/api/auth/login').send(body);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });
  });

  describe('POST /api/auth/login - failed', () => {
    it('should return 400 when email is missing', async () => {
      const body = {
        password: 'password123',
      };

      const res = await request(app).post('/api/auth/login').send(body);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 401 when password is wrong', async () => {
      const body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const res = await request(app).post('/api/auth/login').send(body);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 401 when email not found', async () => {
      const body = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const res = await request(app).post('/api/auth/login').send(body);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });
});

describe('GET /api/auth/me', () => {
  describe('GET /api/auth/me - success', () => {
    it('should return 200 and user data', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${access_token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });
  });

  describe('GET /api/auth/me - failed', () => {
    it('should return 401 when no token provided', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 401 when token is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });
});