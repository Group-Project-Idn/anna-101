const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');

let testStock1, testStock2;

beforeAll(async () => {
  // Clean up
  await sequelize.models.Stock.destroy({ where: { symbol: { [require('sequelize').Op.in]: ['MKT1', 'MKT2'] } } });

  // Create test stocks with quotes
  testStock1 = await sequelize.models.Stock.create({
    symbol: 'MKT1',
    name: 'Market Test Stock 1',
    sector: 'Technology',
    exchange: 'NASDAQ',
  });

  testStock2 = await sequelize.models.Stock.create({
    symbol: 'MKT2',
    name: 'Market Test Stock 2',
    sector: 'Finance',
    exchange: 'NYSE',
  });

  await sequelize.models.Quote.create({
    stock_id: testStock1.id,
    current_price: 100.00,
    change: 5.00,
    change_percent: 5.26,
  });

  await sequelize.models.Quote.create({
    stock_id: testStock2.id,
    current_price: 200.00,
    change: -3.00,
    change_percent: -1.48,
  });
});

afterAll(async () => {
  await sequelize.models.Quote.destroy({
    where: { stock_id: { [require('sequelize').Op.in]: [testStock1?.id, testStock2?.id] } },
  });
  await sequelize.models.Stock.destroy({
    where: { symbol: { [require('sequelize').Op.in]: ['MKT1', 'MKT2'] } },
  });
});

describe('GET /api/market/movers', () => {
  describe('GET /api/market/movers - success', () => {
    it('should return 200 with gainers and losers', async () => {
      const res = await request(app).get('/api/market/movers');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('gainers');
      expect(res.body).toHaveProperty('losers');
      expect(Array.isArray(res.body.gainers)).toBe(true);
      expect(Array.isArray(res.body.losers)).toBe(true);
    });

    it('should return gainers sorted by change_percent DESC', async () => {
      const res = await request(app).get('/api/market/movers');

      expect(res.status).toBe(200);
      if (res.body.gainers.length > 1) {
        expect(res.body.gainers[0].change_percent).toBeGreaterThanOrEqual(
          res.body.gainers[1].change_percent
        );
      }
    });

    it('should return losers sorted by change_percent ASC', async () => {
      const res = await request(app).get('/api/market/movers');

      expect(res.status).toBe(200);
      if (res.body.losers.length > 1) {
        expect(res.body.losers[0].change_percent).toBeLessThanOrEqual(
          res.body.losers[1].change_percent
        );
      }
    });

    it('should return stock details in movers', async () => {
      const res = await request(app).get('/api/market/movers');

      expect(res.status).toBe(200);
      if (res.body.gainers.length > 0) {
        expect(res.body.gainers[0]).toHaveProperty('symbol');
        expect(res.body.gainers[0]).toHaveProperty('name');
        expect(res.body.gainers[0]).toHaveProperty('price');
        expect(res.body.gainers[0]).toHaveProperty('change_percent');
      }
    });
  });
});