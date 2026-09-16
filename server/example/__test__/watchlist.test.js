const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');
const { signToken } = require('../helpers/jwt');

let access_token;
let testUser;
let testStock;

beforeAll(async () => {
  // Clean up
  await sequelize.models.User.destroy({ where: { email: 'watchlist@example.com' } });
  await sequelize.models.Stock.destroy({ where: { symbol: 'WATCH' } });

  // Create test user
  testUser = await sequelize.models.User.create({
    email: 'watchlist@example.com',
    password: 'password123',
    name: 'Watchlist Tester',
  });

  access_token = signToken({
    id: testUser.id,
    email: testUser.email,
    name: testUser.name,
  });

  // Create test stock
  testStock = await sequelize.models.Stock.create({
    symbol: 'WATCH',
    name: 'Watchlist Test Stock',
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
  await sequelize.models.Watchlist.destroy({ where: { user_id: testUser?.id } });
  await sequelize.models.Quote.destroy({ where: { stock_id: testStock?.id } });
  await sequelize.models.Stock.destroy({ where: { symbol: 'WATCH' } });
  await sequelize.models.User.destroy({ where: { email: 'watchlist@example.com' } });
});

describe('GET /api/watchlist', () => {
  describe('GET /api/watchlist - success', () => {
    it('should return 200 and empty watchlist', async () => {
      const res = await request(app)
        .get('/api/watchlist')
        .set('Authorization', `Bearer ${access_token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('watchlist');
      expect(Array.isArray(res.body.watchlist)).toBe(true);
    });
  });

  describe('GET /api/watchlist - failed', () => {
    it('should return 401 when no token provided', async () => {
      const res = await request(app).get('/api/watchlist');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });
});

describe('POST /api/watchlist', () => {
  describe('POST /api/watchlist - success', () => {
    it('should add stock to watchlist', async () => {
      const body = {
        stock_id: testStock.id,
      };

      const res = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${access_token}`)
        .send(body);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Stock added to watchlist.');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('stock_id', testStock.id);
    });
  });

  describe('POST /api/watchlist - failed', () => {
    it('should return 400 when stock_id is missing', async () => {
      const res = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${access_token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'stock_id is required.');
    });

    it('should return 404 when stock not found', async () => {
      const res = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${access_token}`)
        .send({ stock_id: 99999 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Stock not found.');
    });

    it('should return 400 when stock already in watchlist', async () => {
      const res = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${access_token}`)
        .send({ stock_id: testStock.id });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Stock already in watchlist.');
    });

    it('should return 401 when no token provided', async () => {
      const res = await request(app)
        .post('/api/watchlist')
        .send({ stock_id: testStock.id });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });
});

describe('GET /api/watchlist - with items', () => {
  it('should return watchlist with items', async () => {
    const res = await request(app)
      .get('/api/watchlist')
      .set('Authorization', `Bearer ${access_token}`);

    expect(res.status).toBe(200);
    expect(res.body.watchlist.length).toBeGreaterThan(0);
    expect(res.body.watchlist[0]).toHaveProperty('symbol', 'WATCH');
    expect(res.body.watchlist[0]).toHaveProperty('name', 'Watchlist Test Stock');
  });
});

describe('DELETE /api/watchlist/:stock_id', () => {
  describe('DELETE /api/watchlist/:stock_id - success', () => {
    it('should remove stock from watchlist', async () => {
      const res = await request(app)
        .delete(`/api/watchlist/${testStock.id}`)
        .set('Authorization', `Bearer ${access_token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Stock removed from watchlist.');
    });
  });

  describe('DELETE /api/watchlist/:stock_id - failed', () => {
    it('should return 404 when stock not in watchlist', async () => {
      const res = await request(app)
        .delete(`/api/watchlist/${testStock.id}`)
        .set('Authorization', `Bearer ${access_token}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Stock not found in watchlist.');
    });

    it('should return 401 when no token provided', async () => {
      const res = await request(app)
        .delete(`/api/watchlist/${testStock.id}`);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });
});