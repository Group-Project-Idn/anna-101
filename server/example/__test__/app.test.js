const request = require('supertest');

// Mock dotenv so env injection is fully controllable: the real .env always
// sets CLIENT_ORIGIN, which would otherwise make the falsy branch of
// `CLIENT_ORIGIN || 'http://localhost:5173'` (and the dotenv skip branch)
// unreachable from tests.
jest.mock('dotenv', () => ({ config: jest.fn() }));

describe('app.js', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.dontMock('../models');
    delete process.env.NODE_ENV;
    delete process.env.CLIENT_ORIGIN;
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.CLIENT_ORIGIN;
    jest.dontMock('../models');
  });

  describe('dotenv loading', () => {
    it('should call dotenv.config when NODE_ENV is not production', () => {
      // Re-require dotenv AFTER resetModules so we observe the same mock
      // instance that the freshly loaded app.js will use.
      const mockDotenv = require('dotenv');
      mockDotenv.config.mockClear();

      const app = require('../app');

      expect(mockDotenv.config).toHaveBeenCalled();
      expect(app).toBeDefined();
    });

    it('should skip dotenv.config when NODE_ENV is production', () => {
      const mockDotenv = require('dotenv');
      mockDotenv.config.mockClear();

      // config/config.json's production entry uses the mysql dialect whose
      // driver (mysql2) is not installed, so stub ../models to let the app
      // load purely to exercise the NODE_ENV branch.
      jest.doMock('../models', () => ({
        sequelize: {},
        Sequelize: jest.fn(),
        User: {},
        Stock: {},
        Quote: {},
        Candle: {},
        News: {},
        AiInsight: {},
        Watchlist: {},
      }));

      process.env.NODE_ENV = 'production';
      const app = require('../app');

      expect(mockDotenv.config).not.toHaveBeenCalled();
      expect(app).toBeDefined();
    });
  });

  describe('CORS origin', () => {
    it('should use CLIENT_ORIGIN for the CORS origin when provided', async () => {
      process.env.CLIENT_ORIGIN = 'https://client.example.com';
      const app = require('../app');

      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'https://client.example.com');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('https://client.example.com');
    });

    it('should fall back to http://localhost:5173 when CLIENT_ORIGIN is unset', async () => {
      const app = require('../app');

      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });
  });

  describe('error handling middleware', () => {
    let app;
    let serverErrorSpy;

    beforeEach(() => {
      app = require('../app');
      serverErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      serverErrorSpy.mockRestore();
    });

    it('should respond with 400 JSON when body parsing throws (err has status + message)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ "broken": ');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(serverErrorSpy).toHaveBeenCalled();
    });

    it('should use err.status and err.message when present (unit test)', () => {
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const err = Object.assign(new Error('Custom failure'), { status: 418 });

      app.errorHandler(err, {}, mockRes, jest.fn());

      expect(mockRes.status).toHaveBeenCalledWith(418);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Custom failure' });
      expect(serverErrorSpy).toHaveBeenCalledWith('Server error:', err);
    });

    it('should fall back to 500 + Internal server error for errors without status/message (unit test)', () => {
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      app.errorHandler(new Error(''), {}, mockRes, jest.fn());

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });

    it('should expose the error handler on the app instance', () => {
      expect(typeof app.errorHandler).toBe('function');
    });
  });
});