const { Watchlist, Stock, Quote } = require('../models');

class WatchlistController {
  static async getAll(req, res, next) {
    try {
      const { id: user_id } = req.loginInfo;

      const watchlist = await Watchlist.findAll({
        where: { user_id },
        include: [
          {
            model: Stock,
            include: [Quote],
          },
        ],
        order: [['added_at', 'DESC']],
      });

      const result = watchlist.map((item) => ({
        id: item.id,
        stock_id: item.stock_id,
        symbol: item.Stock ? item.Stock.symbol : null,
        name: item.Stock ? item.Stock.name : null,
        sector: item.Stock ? item.Stock.sector : null,
        price: item.Stock && item.Stock.Quote ? item.Stock.Quote.current_price : null,
        change_percent: item.Stock && item.Stock.Quote ? item.Stock.Quote.change_percent : null,
        added_at: item.added_at,
      }));

      res.status(200).json({ watchlist: result });
    } catch (error) {
      next(error);
    }
  }

  static async add(req, res, next) {
    try {
      const { id: user_id } = req.loginInfo;
      const { stock_id } = req.body;

      if (!stock_id) {
        throw { name: 'BadRequest', message: 'stock_id is required.' };
      }

      const stock = await Stock.findOne({ where: { id: stock_id } });
      if (!stock) {
        throw { name: 'NotFound', message: 'Stock not found.' };
      }

      const existing = await Watchlist.findOne({
        where: { user_id, stock_id },
      });

      if (existing) {
        throw { name: 'BadRequest', message: 'Stock already in watchlist.' };
      }

      const watchlistItem = await Watchlist.create({
        user_id,
        stock_id,
      });

      res.status(201).json({
        message: 'Stock added to watchlist.',
        data: {
          id: watchlistItem.id,
          stock_id: watchlistItem.stock_id,
          added_at: watchlistItem.added_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async remove(req, res, next) {
    try {
      const { id: user_id } = req.loginInfo;
      const { stock_id } = req.params;

      const watchlistItem = await Watchlist.findOne({
        where: { user_id, stock_id },
      });

      if (!watchlistItem) {
        throw { name: 'NotFound', message: 'Stock not found in watchlist.' };
      }

      await watchlistItem.destroy();

      res.status(200).json({
        message: 'Stock removed from watchlist.',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { WatchlistController };
