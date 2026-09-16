jest.mock('../models', () => ({
  Watchlist: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  Stock: { findOne: jest.fn() },
  Quote: {},
}));

const { WatchlistController } = require('../controllers/watchlistController');
const { Watchlist, Stock } = require('../models');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (loginInfo = { id: 1 }, body = {}, params = {}) => ({
  loginInfo,
  body,
  params,
});

describe('WatchlistController - getAll (mocked models)', () => {
  beforeEach(() => {
    Watchlist.findAll.mockReset();
  });

  it('should map items with associated Stock + Quote', async () => {
    Watchlist.findAll.mockResolvedValue([
      {
        id: 5,
        stock_id: 10,
        added_at: '2024-01-01T00:00:00Z',
        Stock: { symbol: 'AAPL', name: 'Apple', sector: 'Tech', Quote: { current_price: 100, change_percent: 1.5 } },
      },
    ]);

    const res = mockRes();
    await WatchlistController.getAll(mockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      watchlist: [{
        id: 5, stock_id: 10, symbol: 'AAPL', name: 'Apple',
        sector: 'Tech', price: 100, change_percent: 1.5,
        added_at: '2024-01-01T00:00:00Z',
      }],
    });
  });

  it('should map items WITHOUT Stock (null-safe)', async () => {
    Watchlist.findAll.mockResolvedValue([
      { id: 5, stock_id: 10, added_at: '2024-01-01T00:00:00Z', Stock: null },
    ]);

    const res = mockRes();
    await WatchlistController.getAll(mockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      watchlist: [{
        id: 5, stock_id: 10, symbol: null, name: null, sector: null,
        price: null, change_percent: null,
        added_at: '2024-01-01T00:00:00Z',
      }],
    });
  });

  it('should map items with Stock but no Quote (null-safe price)', async () => {
    Watchlist.findAll.mockResolvedValue([
      {
        id: 5,
        stock_id: 10,
        added_at: '2024-01-01T00:00:00Z',
        Stock: { symbol: 'AAPL', name: 'Apple', sector: 'Tech', Quote: null },
      },
    ]);

    const res = mockRes();
    await WatchlistController.getAll(mockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      watchlist: [{
        id: 5, stock_id: 10, symbol: 'AAPL', name: 'Apple', sector: 'Tech',
        price: null, change_percent: null,
        added_at: '2024-01-01T00:00:00Z',
      }],
    });
  });

  it('should pass errors to next() when findAll fails', async () => {
    const boom = new Error('DB down');
    Watchlist.findAll.mockRejectedValue(boom);

    const next = jest.fn();
    await WatchlistController.getAll(mockReq(), mockRes(), next);

    expect(next).toHaveBeenCalledWith(boom);
  });
});

describe('WatchlistController - add (mocked models)', () => {
  beforeEach(() => {
    Stock.findOne.mockReset();
    Watchlist.findOne.mockReset();
    Watchlist.create.mockReset();
  });
  it('should throw BadRequest when stock_id is missing', async () => {
    const res = mockRes();
    const next = jest.fn();
    await WatchlistController.add(mockReq({ id: 1 }, {}), res, next);

    expect(next).toHaveBeenCalledWith({
      name: 'BadRequest',
      message: 'stock_id is required.',
    });
    expect(Stock.findOne).not.toHaveBeenCalled();
  });

  it('should throw NotFound when stock does not exist', async () => {
    Stock.findOne.mockResolvedValue(null);

    const res = mockRes();
    const next = jest.fn();
    await WatchlistController.add(mockReq({ id: 1 }, { stock_id: 99 }), res, next);

    expect(Stock.findOne).toHaveBeenCalledWith({ where: { id: 99 } });
    expect(next).toHaveBeenCalledWith({
      name: 'NotFound',
      message: 'Stock not found.',
    });
  });

  it('should throw BadRequest when stock already in watchlist', async () => {
    Stock.findOne.mockResolvedValue({ id: 99 });
    Watchlist.findOne.mockResolvedValue({ id: 5, user_id: 1, stock_id: 99 });

    const res = mockRes();
    const next = jest.fn();
    await WatchlistController.add(mockReq({ id: 1 }, { stock_id: 99 }), res, next);

    expect(next).toHaveBeenCalledWith({
      name: 'BadRequest',
      message: 'Stock already in watchlist.',
    });
    expect(Watchlist.create).not.toHaveBeenCalled();
  });

  it('should create watchlist item and return 201', async () => {
    Stock.findOne.mockResolvedValue({ id: 99 });
    Watchlist.findOne.mockResolvedValue(null);
    Watchlist.create.mockResolvedValue({ id: 7, stock_id: 99, added_at: '2024-01-01T00:00:00Z' });

    const res = mockRes();
    await WatchlistController.add(mockReq({ id: 1 }, { stock_id: 99 }), res, jest.fn());

    expect(Watchlist.create).toHaveBeenCalledWith({ user_id: 1, stock_id: 99 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Stock added to watchlist.',
      data: { id: 7, stock_id: 99, added_at: '2024-01-01T00:00:00Z' },
    });
  });

  it('should pass errors to next() when create fails', async () => {
    Stock.findOne.mockResolvedValue({ id: 99 });
    Watchlist.findOne.mockResolvedValue(null);
    const boom = new Error('DB down');
    Watchlist.create.mockRejectedValue(boom);

    const next = jest.fn();
    await WatchlistController.add(mockReq({ id: 1 }, { stock_id: 99 }), mockRes(), next);

    expect(next).toHaveBeenCalledWith(boom);
  });
});

describe('WatchlistController - remove (mocked models)', () => {
  beforeEach(() => {
    Watchlist.findOne.mockReset();
  });

  it('should throw NotFound when watchlist item does not exist', async () => {
    Watchlist.findOne.mockResolvedValue(null);

    const res = mockRes();
    const next = jest.fn();
    await WatchlistController.remove(mockReq({ id: 1 }, {}, { stock_id: 999 }), res, next);

    expect(Watchlist.findOne).toHaveBeenCalledWith({ where: { user_id: 1, stock_id: 999 } });
    expect(next).toHaveBeenCalledWith({
      name: 'NotFound',
      message: 'Stock not found in watchlist.',
    });
  });

  it('should destroy the item and return 200', async () => {
    const destroy = jest.fn().mockResolvedValue(undefined);
    Watchlist.findOne.mockResolvedValue({ id: 3, user_id: 1, stock_id: 999, destroy });

    const res = mockRes();
    await WatchlistController.remove(mockReq({ id: 1 }, {}, { stock_id: 999 }), res, jest.fn());

    expect(destroy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Stock removed from watchlist.' });
  });

  it('should pass errors to next() when findOne fails', async () => {
    const boom = new Error('DB down');
    Watchlist.findOne.mockRejectedValue(boom);

    const next = jest.fn();
    await WatchlistController.remove(mockReq({ id: 1 }, {}, { stock_id: 999 }), mockRes(), next);

    expect(next).toHaveBeenCalledWith(boom);
  });
});