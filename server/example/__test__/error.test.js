const request = require('supertest');
const app = require('../app');
const { signToken } = require('../helpers/jwt');

let access_token;

beforeAll(async () => {
  access_token = signToken({
    id: 999,
    email: 'test@example.com',
    name: 'Test User',
  });
});

describe('Error Handling', () => {
  describe('404 - Not Found', () => {
    it('should return 404 for unknown route', async () => {
      const res = await request(app).get('/api/unknown-route');

      expect(res.status).toBe(404);
    });
  });

  describe('Error Handler Middleware', () => {
    it('should handle SequelizeValidationError', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should handle BadRequest errors', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: '', password: 'validpassword', name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should handle Unauthorized errors', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should handle NotFound errors', async () => {
      const res = await request(app).get('/api/stocks/NONEXISTENT');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
    });
  });
});

describe('GET /api/health', () => {
  it('should return 200 with status ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });
});

describe('API Root', () => {
  it('should return API info', async () => {
    const res = await request(app).get('/api');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'S&P 500 AI Dashboard API');
  });
});

describe('Stock Controller - Error Paths', () => {
  it('should handle getNews when stock not found', async () => {
    const res = await request(app).get('/api/stocks/INVALID/news');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });

  it('should handle getInsight when stock not found', async () => {
    const res = await request(app).get('/api/stocks/INVALID/insight');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });

  it('should handle getHistory when stock not found', async () => {
    const res = await request(app).get('/api/stocks/INVALID/history');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });
});

describe('Auth Controller - Google Login Error', () => {
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