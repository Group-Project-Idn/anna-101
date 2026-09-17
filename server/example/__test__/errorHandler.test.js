const { sequelize } = require('../models');
const request = require('supertest');
const app = require('../app');

describe('Error Handler Middleware - Direct Unit Tests', () => {
  const { errorHandler } = require('../middlewares/errorHandler');

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it('should handle SequelizeDatabaseError with 400 + Invalid input', () => {
    const res = mockRes();
    errorHandler({ name: 'SequelizeDatabaseError' }, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid input.' });
  });

  it('should handle SequelizeForeignKeyConstraintError with 400 + Invalid input', () => {
    const res = mockRes();
    errorHandler({ name: 'SequelizeForeignKeyConstraintError' }, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid input.' });
  });

  it('should handle Forbidden error with 403', () => {
    const res = mockRes();
    errorHandler({ name: 'Forbidden', message: 'No access.' }, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'No access.' });
  });

  it('should use default message when Forbidden error has no message', () => {
    const res = mockRes();
    errorHandler({ name: 'Forbidden' }, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'You do not have access.' });
  });

  it('should handle ServiceUnavailable with 503', () => {
    const res = mockRes();
    errorHandler({ name: 'ServiceUnavailable', message: 'Down.' }, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ message: 'Down.' });
  });

  it('should use default message for ServiceUnavailable without message', () => {
    const res = mockRes();
    errorHandler({ name: 'ServiceUnavailable' }, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ message: 'Service temporarily unavailable.' });
  });

  it('should fall back to 500 + Internal server error for unknown errors', () => {
    const res = mockRes();
    errorHandler({ name: 'UnknownError' }, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error.' });
  });
});

describe('Error Handler Middleware', () => {
  describe('SequelizeValidationError', () => {
    it('should return 400 with validation error message', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 for unique constraint error', async () => {
      // Create a user first
      await sequelize.models.User.create({
        email: 'unique@test.com',
        password: 'password123',
        name: 'Test'
      });

      // Try to create duplicate
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'unique@test.com',
          password: 'password123',
          name: 'Test'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');

      // Cleanup
      await sequelize.models.User.destroy({ where: { email: 'unique@test.com' } });
    });
  });

  describe('BadRequest Error', () => {
    it('should return 400 with custom message', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({}); // Missing required fields

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });

    it('should return 400 for missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('Unauthorized Error', () => {
    it('should return 401 for missing token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 401 for invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });

    it('should return 401 for malformed authorization header', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token123');

      expect(res.status).toBe(401);
    });
  });

  describe('NotFound Error', () => {
    it('should return 404 for non-existent stock', async () => {
      const res = await request(app).get('/api/stocks/NONEXISTENT123');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent history', async () => {
      const res = await request(app).get('/api/stocks/NONEXISTENT/history');

      expect(res.status).toBe(404);
    });
  });

  describe('ServiceUnavailable Error', () => {
    it('should return 401 for invalid Google token', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({ id_token: 'invalid' });

      // Should return 401 for invalid token
      expect(res.status).toBe(401);
    });
  });

  describe('Watchlist Authentication', () => {
    it('should return 401 for watchlist without token', async () => {
      const res = await request(app).get('/api/watchlist');
      expect(res.status).toBe(401);
    });

    it('should return 401 for adding to watchlist without token', async () => {
      const res = await request(app)
        .post('/api/watchlist')
        .send({ stock_id: 1 });
      expect(res.status).toBe(401);
    });

    it('should return 401 for deleting from watchlist without token', async () => {
      const res = await request(app).delete('/api/watchlist/1');
      expect(res.status).toBe(401);
    });
  });
});