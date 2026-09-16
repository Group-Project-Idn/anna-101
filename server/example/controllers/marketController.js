const { Quote } = require('../models');

class MarketController {
  static async getMovers(req, res, next) {
    try {
      const gainers = await Quote.findAll({
        order: [['change_percent', 'DESC']],
        limit: 5,
        include: ['Stock'],
      });

      const losers = await Quote.findAll({
        order: [['change_percent', 'ASC']],
        limit: 5,
        include: ['Stock'],
      });

      const formatMover = (quote) => ({
        id: quote.Stock ? quote.Stock.id : null,
        symbol: quote.Stock ? quote.Stock.symbol : null,
        name: quote.Stock ? quote.Stock.name : null,
        sector: quote.Stock ? quote.Stock.sector : null,
        price: quote.current_price,
        change: quote.change,
        change_percent: quote.change_percent,
      });

      res.status(200).json({
        gainers: gainers.map(formatMover),
        losers: losers.map(formatMover),
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { MarketController };
