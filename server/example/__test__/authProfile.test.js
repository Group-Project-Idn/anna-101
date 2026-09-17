const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');
const { signToken } = require('../helpers/jwt');

let access_token;
let testUser;

beforeAll(async () => {
  // Clean up
  await sequelize.models.User.destroy({
    where: { email: 'profiletest@example.com' },
  });

  // Create test user
  testUser = await sequelize.models.User.create({
    email: 'profiletest@example.com',
    password: 'password123',
    name: 'Profile Test User',
  });

  access_token = signToken({
    id: testUser.id,
    email: testUser.email,
    name: testUser.name,
  });
});

afterAll(async () => {
  await sequelize.models.User.destroy({
    where: { email: 'profiletest@example.com' },
  });
});

describe('PUT /api/auth/me', () => {
  describe('PUT /api/auth/me - success', () => {
    it('should update user name', async () => {
      const body = {
        name: 'Updated Name',
      };

      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${access_token}`)
        .send(body);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Profile updated successfully.');
      expect(res.body.user).toHaveProperty('name', 'Updated Name');
    });

    it('should update avatar_url', async () => {
      const body = {
        avatar_url: 'https://example.com/avatar.jpg',
      };

      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${access_token}`)
        .send(body);

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('avatar_url', 'https://example.com/avatar.jpg');
    });

    it('should update both name and avatar_url', async () => {
      const body = {
        name: 'Full Update',
        avatar_url: 'https://example.com/new-avatar.jpg',
      };

      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${access_token}`)
        .send(body);

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('name', 'Full Update');
      expect(res.body.user).toHaveProperty('avatar_url', 'https://example.com/new-avatar.jpg');
    });
  });

  describe('PUT /api/auth/me - failed', () => {
    it('should return 401 when no token provided', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .send({ name: 'No Auth' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 when name is empty', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${access_token}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });
});

describe('POST /api/auth/google', () => {
  describe('POST /api/auth/google - failed', () => {
    it('should return 400 when id_token is missing', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'ID token is required.');
    });

    it('should return 401 when id_token is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({ id_token: 'invalid-token' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });
});