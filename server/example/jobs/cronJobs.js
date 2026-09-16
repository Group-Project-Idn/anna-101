const cron = require('node-cron');
const { Stock, Quote, Candle, News } = require('../models');
const finnhubService = require('../services/finnhubService');
const twelveDataService = require('../services/twelveDataService');
const { isCrypto } = require('../constants/stocks');
const { STOCKS } = require('../constants/stocks');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const updateQuotesJob = async () => {
  console.log('[Cron] Starting quote update job...');
  const stocks = await Stock.findAll();

  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];
    try {
      // Crypto (mis. BTC) tidak ada di Finnhub /quote REST -> pakai Twelve Data /quote
      const quoteData = isCrypto(stock.symbol)
        ? await twelveDataService.getCryptoQuote(stock.symbol)
        : await finnhubService.getQuote(stock.symbol);

      await Quote.upsert({
        stock_id: stock.id,
        current_price: quoteData.current_price,
        change: quoteData.change,
        change_percent: quoteData.change_percent,
        high: quoteData.high,
        low: quoteData.low,
        open: quoteData.open,
        previous_close: quoteData.previous_close,
        fetched_at: new Date(quoteData.timestamp * 1000),
      });

      console.log(`[Cron] Updated quote for ${stock.symbol}: $${quoteData.current_price}`);
    } catch (error) {
      console.error(`[Cron] Failed to update quote for ${stock.symbol}:`, error.message);
    }

    await delay(1100);
  }

  console.log('[Cron] Quote update job completed.');
};

const updateCandlesJob = async () => {
  console.log('[Cron] Starting candle update job...');
  const stocks = await Stock.findAll();

  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];
    try {
      // Crypto butuh format "BTC/USD" di Twelve Data
      const tsSymbol = isCrypto(stock.symbol) ? `${stock.symbol}/USD` : stock.symbol;
      const candles = await twelveDataService.getTimeSeries(tsSymbol, '1m');

      if (candles.length > 0) {
        const latestCandle = candles[0];

        await Candle.upsert({
          stock_id: stock.id,
          datetime: latestCandle.datetime,
          open: latestCandle.open,
          high: latestCandle.high,
          low: latestCandle.low,
          close: latestCandle.close,
          volume: latestCandle.volume,
          interval: '1day',
        });

        console.log(`[Cron] Updated candle for ${stock.symbol}: $${latestCandle.close}`);
      }
    } catch (error) {
      console.error(`[Cron] Failed to update candle for ${stock.symbol}:`, error.message);
    }

    await delay(8500);
  }

  console.log('[Cron] Candle update job completed.');
};

const updateNewsJob = async () => {
  console.log('[Cron] Starting news update job...');
  const stocks = await Stock.findAll();
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];
    try {
      // Crypto tidak didukung endpoint /company-news -> pakai berita crypto umum
      const newsData = isCrypto(stock.symbol)
        ? await finnhubService.getCryptoNews(weekAgo, today)
        : await finnhubService.getCompanyNews(stock.symbol, weekAgo, today);

      if (newsData.length > 0) {
        await News.destroy({ where: { stock_id: stock.id } });

        const newsRecords = newsData.map((n) => ({
          stock_id: stock.id,
          headline: n.headline,
          summary: n.summary,
          source: n.source,
          url: n.url,
          image_url: n.image_url,
          published_at: n.published_at,
        }));

        await News.bulkCreate(newsRecords, {
          ignoreDuplicates: true,
        });

        console.log(`[Cron] Updated news for ${stock.symbol}: ${newsData.length} articles`);
      }
    } catch (error) {
      console.error(`[Cron] Failed to update news for ${stock.symbol}:`, error.message);
    }

    await delay(1100);
  }

  console.log('[Cron] News update job completed.');
};

const cleanupCandlesJob = async () => {
  console.log('[Cron] Starting candle cleanup job...');
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    const deleted = await Candle.destroy({
      where: {
        interval: ['1min', '5min', '15min', '30min', '1h'],
        datetime: { [require('sequelize').Op.lt]: sevenDaysAgo },
      },
    });
    console.log(`[Cron] Cleaned up ${deleted} old candle records.`);
  } catch (error) {
    console.error('[Cron] Failed to cleanup candles:', error.message);
  }
};

const startCronJobs = () => {
  cron.schedule('*/4 * * * *', updateQuotesJob); // tiap 4 menit
  cron.schedule('0 21 * * *', updateCandlesJob); // tiap hari jam 21:00
  cron.schedule('0 */4 * * *', updateNewsJob); // tiap 4 jam, di menit ke-0 (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
  cron.schedule('0 2 * * *', cleanupCandlesJob); // tiap hari jam 02:00

  console.log('[Cron] All cron jobs scheduled.');
};

module.exports = {
  startCronJobs,
  updateQuotesJob,
  updateCandlesJob,
  updateNewsJob,
  cleanupCandlesJob,
};
