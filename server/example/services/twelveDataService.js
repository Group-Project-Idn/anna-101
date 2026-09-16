const axios = require('axios');
const { toTwelveDataSymbol } = require('../constants/stocks');

const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;

const twelveDataClient = axios.create({
  baseURL: TWELVE_DATA_BASE_URL,
  timeout: 15000,
});

// Maksimalkan outputsize sampai 5000 (max API) untuk data lebih lengkap
// Berdasarkan dokumentasi: 1 request = 1 credit, max 5000 data point
const TIME_SERIES_INTERVAL_MAP = {
  '1m': { interval: '1day', outputsize: 252 },      // ~1 tahun hari trading
  '3m': { interval: '1day', outputsize: 5000 },      // Max: ~20 tahun data harian
  '1y': { interval: '1day', outputsize: 5000 },      // Max: ~20 tahun data harian
  '5y': { interval: '1day', outputsize: 5000 },      // Max: ~20 tahun data harian
};

// Interval langsung dari client: 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1M
const CLIENT_INTERVAL_MAP = {
  '5m': { interval: '5min', outputsize: 5000 },      // ~2 minggu data 5-min
  '15m': { interval: '15min', outputsize: 5000 },    // ~2 bulan data 15-min
  '30m': { interval: '30min', outputsize: 5000 },    // ~3 bulan data 30-min
  '1h': { interval: '1h', outputsize: 5000 },        // ~7 bulan data 1-jam
  '4h': { interval: '4h', outputsize: 5000 },        // ~2.2 tahun data 4-jam
  '1d': { interval: '1day', outputsize: 5000 },      // ~20 tahun data harian
  '1w': { interval: '1week', outputsize: 5000 },     // ~96 tahun data mingguan
  '1M': { interval: '1month', outputsize: 5000 },    // ~416 tahun data bulanan
};

const getTimeSeries = async (symbol, range = '1m', intervalOverride = null) => {
  try {
    const resolved = intervalOverride && CLIENT_INTERVAL_MAP[intervalOverride]
      ? CLIENT_INTERVAL_MAP[intervalOverride]
      : TIME_SERIES_INTERVAL_MAP[range] || TIME_SERIES_INTERVAL_MAP['1m'];
    const { interval, outputsize } = resolved;

    const { data } = await twelveDataClient.get('/time_series', {
      params: {
        // crypto (mis. BTC) dipetakan ke format Twelve Data: "BTC/USD"
        symbol: toTwelveDataSymbol(symbol),
        interval,
        outputsize,
        apikey: TWELVE_DATA_API_KEY,
      },
    });

    if (data.status === 'error') {
      throw new Error(data.message || 'Twelve Data API error');
    }

    if (!data.values || !Array.isArray(data.values)) {
      return [];
    }

    return data.values.map((item) => ({
      datetime: item.datetime,
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: item.volume ? parseInt(item.volume, 10) : null,
      interval,
    }));
  } catch (error) {
    console.error(`Twelve Data getTimeSeries error for ${symbol}:`, error.message);
    throw error;
  }
};

// Quote crypto via Twelve Data /quote (Finnhub /quote REST hanya untuk saham US).
// Response field-nya sama bentuknya dengan getQuote Finnhub supaya controller/cron
// tidak perlu tahu bedanya.
const getCryptoQuote = async (symbol) => {
  try {
    const { data } = await twelveDataClient.get('/quote', {
      params: {
        symbol: toTwelveDataSymbol(symbol),
        apikey: TWELVE_DATA_API_KEY,
      },
    });

    if (data.status === 'error' || data.close == null) {
      throw new Error(data.message || 'Twelve Data quote error');
    }

    return {
      current_price: parseFloat(data.close),
      change: data.change != null ? parseFloat(data.change) : null,
      change_percent: data.percent_change != null ? parseFloat(data.percent_change) : null,
      high: data.high != null ? parseFloat(data.high) : null,
      low: data.low != null ? parseFloat(data.low) : null,
      open: data.open != null ? parseFloat(data.open) : null,
      previous_close: data.previous_close != null ? parseFloat(data.previous_close) : null,
      timestamp: data.datetime ? Math.floor(new Date(`${data.datetime.replace(' ', 'T')}Z`).getTime() / 1000) : Math.floor(Date.now() / 1000),
    };
  } catch (error) {
    console.error(`Twelve Data getCryptoQuote error for ${symbol}:`, error.message);
    throw error;
  }
};

module.exports = {
  getTimeSeries,
  getCryptoQuote,
};
