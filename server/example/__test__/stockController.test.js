const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');

jest.mock('../services/geminiService', () => ({
  generateInsight: jest.fn().mockResolvedValue({
    summary: 'Mock summary',
    sentiment: 'bullish',
    confidence: 0.8,
    highlights: ['Point 1', 'Point 2'],
    risk_note: 'Mock risk note',
  }),
}));

const geminiService = require('../services/geminiService');

let testStock;

beforeAll(async () => {
  // Clean up
  await sequelize.models.Stock.destroy({ where: { symbol: 'CTRL' } });

  // Create test stock
  testStock = await sequelize.models.Stock.create({
    symbol: 'CTRL',
    name: 'Controller Test Stock',
    sector: 'Technology',
    exchange: 'NASDAQ',
  });

  await sequelize.models.Quote.create({
    stock_id: testStock.id,
    current_price: 100.00,
    change: 2.00,
    change_percent: 2.04,
  });
});

afterAll(async () => {
  await sequelize.models.News.destroy({ where: { stock_id: testStock?.id } });
  await sequelize.models.AiInsight.destroy({ where: { stock_id: testStock?.id } });
  await sequelize.models.Quote.destroy({ where: { stock_id: testStock?.id } });
  await sequelize.models.Stock.destroy({ where: { symbol: 'CTRL' } });
});

describe('Stock Controller - getNews', () => {
  it('should return empty articles when no news in DB', async () => {
    const res = await request(app).get('/api/stocks/CTRL/news');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('articles');
    expect(Array.isArray(res.body.articles)).toBe(true);
  });

  it('should return news with query limit', async () => {
    const res = await request(app).get('/api/stocks/CTRL/news?limit=5');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('articles');
  });

  it('should return 404 for non-existent stock', async () => {
    const res = await request(app).get('/api/stocks/INVALID/news');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });
});

describe('Stock Controller - getInsight', () => {
  it('should generate and return insight when none exists', async () => {
    const res = await request(app).get('/api/stocks/CTRL/insight');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('summary', 'Mock summary');
    expect(res.body).toHaveProperty('sentiment', 'bullish');
    expect(res.body).toHaveProperty('confidence', 0.8);
    expect(res.body).toHaveProperty('keyPoints');
    expect(res.body).toHaveProperty('risk_note', 'Mock risk note');
    expect(geminiService.generateInsight).toHaveBeenCalled();
  });

  it('should return cached insight without regenerating', async () => {
    geminiService.generateInsight.mockClear();

    const res = await request(app).get('/api/stocks/CTRL/insight');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('summary', 'Mock summary');
    // Fresh insight (< 24h) should not trigger regeneration
    expect(geminiService.generateInsight).not.toHaveBeenCalled();
  });

  it('should return 404 for non-existent stock', async () => {
    const res = await request(app).get('/api/stocks/INVALID/insight');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });
});

describe('Stock Controller - getHistory edge cases', () => {
  it('should handle 1y range', async () => {
    const res = await request(app).get('/api/stocks/CTRL/history?range=1y&interval=1day');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  it('should handle 5y range', async () => {
    const res = await request(app).get('/api/stocks/CTRL/history?range=5y&interval=1day');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  it('should handle intraday intervals', async () => {
    const res = await request(app).get('/api/stocks/CTRL/history?range=1m&interval=1h');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  it('should handle weekly interval', async () => {
    const res = await request(app).get('/api/stocks/CTRL/history?range=1y&interval=1w');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  it('should handle monthly interval', async () => {
    const res = await request(app).get('/api/stocks/CTRL/history?range=5y&interval=1M');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });
});