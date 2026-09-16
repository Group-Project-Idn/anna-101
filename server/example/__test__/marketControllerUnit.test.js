jest.mock('../models', () => ({
  Quote: { findAll: jest.fn() },
}));

const { MarketController } = require('../controllers/marketController');
const { Quote } = require('../models');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('MarketController - Unit Tests (mocked models)', () => {
  beforeEach(() => {
    Quote.findAll.mockReset();
  });

  it('should handle quotes with associated Stock', async () => {
    const quote = {
      id: 1,
      current_price: 100.5,
      change: 2.5,
      change_percent: 2.5,
      Stock: { id: 10, symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
    };
    Quote.findAll
      .mockResolvedValueOnce([quote])  // gainers
      .mockResolvedValueOnce([]);       // losers

    const res = mockRes();
    await MarketController.getMovers({}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      gainers: [{
        id: 10, symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology',
        price: 100.5, change: 2.5, change_percent: 2.5,
      }],
      losers: [],
    });
  });

  it('should handle quotes WITHOUT associated Stock (null-safe mapping)', async () => {
    const quote = {
      id: 1,
      current_price: 100.5,
      change: 2.5,
      change_percent: 2.5,
      Stock: null,
    };
    Quote.findAll
      .mockResolvedValueOnce([])      // gainers
      .mockResolvedValueOnce([quote]); // losers

    const res = mockRes();
    await MarketController.getMovers({}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      gainers: [],
      losers: [{
        id: null, symbol: null, name: null, sector: null,
        price: 100.5, change: 2.5, change_percent: 2.5,
      }],
    });
  });

  it('should pass errors to next() when findAll fails', async () => {
    const boom = new Error('DB down');
    Quote.findAll.mockRejectedValue(boom);

    const next = jest.fn();
    await MarketController.getMovers({}, mockRes(), next);

    expect(next).toHaveBeenCalledWith(boom);
  });
});