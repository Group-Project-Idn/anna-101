const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');
const { signToken } = require('../helpers/jwt');
const { hashPassword } = require('../helpers/bcrypt');

let access_token;
let testUser;
let testStock;

beforeAll(async () => {
  // Create test user
  testUser = await sequelize.models.User.create({
    email: 'stocktester@example.com',
    password: hashPassword('password123'),
    name: 'Stock Tester',
  });

  // Generate access token
  access_token = signToken({
    id: testUser.id,
    email: testUser.email,
    name: testUser.name,
  });

  // Create test stock
  testStock = await sequelize.models.Stock.create({
    symbol: 'TEST',
    name: 'Test Stock Inc.',
    sector: 'Technology',
    exchange: 'NASDAQ',
  });

  // Create test quote
  await sequelize.models.Quote.create({
    stock_id: testStock.id,
    current_price: 150.00,
    change: 2.50,
    change_percent: 1.69,
    high: 152.00,
    low: 148.00,
    open: 149.00,
    previous_close: 147.50,
  });

  // Create test candles
  const candles = [];
  const baseDate = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);
    candles.push({
      stock_id: testStock.id,
      datetime: date,
      open: 150 + Math.random() * 10,
      high: 155 + Math.random() * 10,
      low: 145 + Math.random() * 10,
      close: 150 + Math.random() * 10,
      volume: Math.floor(Math.random() * 1000000),
      interval: '1day',
    });
  }
  await sequelize.models.Candle.bulkCreate(candles);
});

afterAll(async () => {
  // Clean up test data
  await sequelize.models.Candle.destroy({
    where: { stock_id: testStock?.id },
  });
  await sequelize.models.Quote.destroy({
    where: { stock_id: testStock?.id },
  });
  await sequelize.models.Stock.destroy({
    where: { symbol: 'TEST' },
  });
  await sequelize.models.User.destroy({
    where: { email: 'stocktester@example.com' },
  });
});

describe('GET /api/stocks', () => {
  describe('GET /api/stocks - success', () => {
    it('should return 200 and list of stocks', async () => {
      const res = await request(app).get('/api/stocks');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('stocks');
      expect(Array.isArray(res.body.stocks)).toBe(true);
    });

    it('should filter stocks by sector', async () => {
      const res = await request(app).get('/api/stocks?sector=Technology');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('stocks');
      res.body.stocks.forEach(stock => {
        expect(stock.sector).toBe('Technology');
      });
    });
  });
});

describe('GET /api/stocks/:symbol', () => {
  describe('GET /api/stocks/:symbol - success', () => {
    it('should return 200 and stock details', async () => {
      const res = await request(app).get('/api/stocks/TEST');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('symbol', 'TEST');
      expect(res.body).toHaveProperty('name', 'Test Stock Inc.');
      expect(res.body).toHaveProperty('quote');
      expect(res.body.quote).toHaveProperty('current_price');
    });
  });

  describe('GET /api/stocks/:symbol - failed', () => {
    it('should return 404 when stock not found', async () => {
      const res = await request(app).get('/api/stocks/NONEXISTENT');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
    });
  });
});

describe('GET /api/stocks/:symbol/history', () => {
  describe('GET /api/stocks/:symbol/history - success', () => {
    it('should return 200 and candle data', async () => {
      const res = await request(app).get('/api/stocks/TEST/history?range=1m&interval=1day');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should filter by range (1m)', async () => {
      const res = await request(app).get('/api/stocks/TEST/history?range=1m&interval=1day');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      
      // Check that all candles are within 1 month range
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      res.body.data.forEach(candle => {
        const candleDate = new Date(candle.datetime);
        expect(candleDate.getTime()).toBeGreaterThanOrEqual(oneMonthAgo.getTime());
      });
    });

    it('should filter by range (3m)', async () => {
      const res = await request(app).get('/api/stocks/TEST/history?range=3m&interval=1day');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      
      // Check that all candles are within 3 months range
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      res.body.data.forEach(candle => {
        const candleDate = new Date(candle.datetime);
        expect(candleDate.getTime()).toBeGreaterThanOrEqual(threeMonthsAgo.getTime());
      });
    });
  });

  describe('GET /api/stocks/:symbol/history - failed', () => {
    it('should return 404 when stock not found', async () => {
      const res = await request(app).get('/api/stocks/NONEXISTENT/history');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
    });
  });
});

describe('GET /api/health', () => {
  it('should return 200 and status ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });
});