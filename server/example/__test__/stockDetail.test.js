const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');
const { signToken } = require('../helpers/jwt');

let access_token;
let testUser;
let testStock;

beforeAll(async () => {
  // Clean up
  await sequelize.models.User.destroy({ where: { email: 'stockdetail@example.com' } });
  await sequelize.models.Stock.destroy({ where: { symbol: 'DETAIL' } });

  // Create test user
  testUser = await sequelize.models.User.create({
    email: 'stockdetail@example.com',
    password: 'password123',
    name: 'Stock Detail Tester',
  });

  access_token = signToken({
    id: testUser.id,
    email: testUser.email,
    name: testUser.name,
  });

  // Create test stock
  testStock = await sequelize.models.Stock.create({
    symbol: 'DETAIL',
    name: 'Detail Test Stock',
    sector: 'Technology',
    exchange: 'NASDAQ',
  });

  await sequelize.models.Quote.create({
    stock_id: testStock.id,
    current_price: 100.00,
    change: 2.00,
    change_percent: 2.04,
    high: 102.00,
    low: 98.00,
    open: 99.00,
    previous_close: 98.00,
  });

  // Create test news
  await sequelize.models.News.create({
    stock_id: testStock.id,
    headline: 'Test News Headline',
    summary: 'Test news summary',
    source: 'Test Source',
    url: 'https://example.com/news',
    published_at: new Date(),
  });

  // Create test AI insight
  await sequelize.models.AiInsight.create({
    stock_id: testStock.id,
    content: {
      summary: 'Test insight summary',
      sentiment: 'bullish',
      confidence: 85,
      highlights: ['Point 1', 'Point 2'],
      risk_note: 'Test risk note',
    },
    generated_at: new Date(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
});

afterAll(async () => {
  await sequelize.models.AiInsight.destroy({ where: { stock_id: testStock?.id } });
  await sequelize.models.News.destroy({ where: { stock_id: testStock?.id } });
  await sequelize.models.Quote.destroy({ where: { stock_id: testStock?.id } });
  await sequelize.models.Stock.destroy({ where: { symbol: 'DETAIL' } });
  await sequelize.models.User.destroy({ where: { email: 'stockdetail@example.com' } });
});

describe('GET /api/stocks/:symbol/news', () => {
  describe('GET /api/stocks/:symbol/news - success', () => {
    it('should return 200 with news articles', async () => {
      const res = await request(app).get('/api/stocks/DETAIL/news');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('articles');
      expect(Array.isArray(res.body.articles)).toBe(true);
    });

    it('should return news with correct structure', async () => {
      const res = await request(app).get('/api/stocks/DETAIL/news');

      expect(res.status).toBe(200);
      if (res.body.articles.length > 0) {
        expect(res.body.articles[0]).toHaveProperty('headline');
        expect(res.body.articles[0]).toHaveProperty('source');
        expect(res.body.articles[0]).toHaveProperty('url');
      }
    });
  });

  describe('GET /api/stocks/:symbol/news - failed', () => {
    it('should return 404 when stock not found', async () => {
      const res = await request(app).get('/api/stocks/NONEXISTENT/news');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
    });
  });
});

describe('GET /api/stocks/:symbol/insight', () => {
  describe('GET /api/stocks/:symbol/insight - success', () => {
    it('should return 200 with AI insight', async () => {
      const res = await request(app).get('/api/stocks/DETAIL/insight');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('summary');
      expect(res.body).toHaveProperty('sentiment');
      expect(res.body).toHaveProperty('confidence');
    });

    it('should return insight with correct structure', async () => {
      const res = await request(app).get('/api/stocks/DETAIL/insight');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('keyPoints');
      expect(Array.isArray(res.body.keyPoints)).toBe(true);
    });
  });

  describe('GET /api/stocks/:symbol/insight - failed', () => {
    it('should return 404 when stock not found', async () => {
      const res = await request(app).get('/api/stocks/NONEXISTENT/insight');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
    });
  });
});

describe('GET /api/stocks/:symbol/history - edge cases', () => {
  it('should return empty array when no candles in range', async () => {
    const res = await request(app).get('/api/stocks/DETAIL/history?range=1m&interval=5m');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should handle different intervals', async () => {
    const res = await request(app).get('/api/stocks/DETAIL/history?range=1m&interval=1w');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  it('should handle 5y range', async () => {
    const res = await request(app).get('/api/stocks/DETAIL/history?range=5y&interval=1day');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });
});