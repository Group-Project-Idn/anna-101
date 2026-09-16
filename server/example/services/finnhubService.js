const axios = require('axios');

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

const finnhubClient = axios.create({
  baseURL: FINNHUB_BASE_URL,
  timeout: 10000,
  headers: {
    'X-Finnhub-Token': FINNHUB_API_KEY,
  },
});

const getQuote = async (symbol) => {
  try {
    const { data } = await finnhubClient.get('/quote', {
      params: { symbol },
    });
    return {
      current_price: data.c,
      change: data.d,
      change_percent: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      previous_close: data.pc,
      timestamp: data.t,
    };
  } catch (error) {
    console.error(`Finnhub getQuote error for ${symbol}:`, error.message);
    throw error;
  }
};

const getCompanyProfile = async (symbol) => {
  try {
    const { data } = await finnhubClient.get('/stock/profile2', {
      params: { symbol },
    });
    return {
      country: data.country,
      currency: data.currency,
      exchange: data.exchange,
      ipo: data.ipo,
      market_cap: data.marketCapitalization,
      name: data.name,
      phone: data.phone,
      share_outstanding: data.shareOutstanding,
      ticker: data.ticker,
      weburl: data.weburl,
      logo: data.logo,
      industry: data.finnhubIndustry,
    };
  } catch (error) {
    console.error(`Finnhub getCompanyProfile error for ${symbol}:`, error.message);
    throw error;
  }
};

const getCompanyNews = async (symbol, fromDate, toDate) => {
  try {
    const { data } = await finnhubClient.get('/company-news', {
      params: {
        symbol,
        from: fromDate,
        to: toDate,
      },
    });
    return data.map((item) => ({
      headline: item.headline,
      summary: item.summary,
      source: item.source,
      url: item.url,
      image_url: item.image,
      published_at: new Date(item.datetime * 1000),
    }));
  } catch (error) {
    console.error(`Finnhub getCompanyNews error for ${symbol}:`, error.message);
    throw error;
  }
};

// Berita crypto umum (Finnhub /company-news tidak mendukung simbol crypto).
// Endpoint: GET /news?category=crypto — shape item-nya sama dengan company-news.
const getCryptoNews = async (fromDate, toDate) => {
  try {
    const { data } = await finnhubClient.get('/news', {
      params: {
        category: 'crypto',
        from: fromDate,
        to: toDate,
        minId: 0,
      },
    });
    return data.slice(0, 10).map((item) => ({
      headline: item.headline,
      summary: item.summary,
      source: item.source,
      url: item.url,
      image_url: item.image,
      published_at: new Date(item.datetime * 1000),
    }));
  } catch (error) {
    console.error('Finnhub getCryptoNews error:', error.message);
    throw error;
  }
};

const getCompanyMetrics = async (symbol) => {
  try {
    const { data } = await finnhubClient.get('/stock/metric', {
      params: { symbol, metric: 'all' },
    });
    const m = data?.metric || {};
    return {
      pe_ratio: m.peBasicExclExtraTTM ?? m.peTTM ?? m.peExclExtraTTM ?? null,
      market_cap: m.marketCapitalization ?? null,
      week52_high: m['52WeekHigh'] ?? null,
      week52_low: m['52WeekLow'] ?? null,
      beta: m.beta ?? null,
    };
  } catch (error) {
    console.error(`Finnhub getCompanyMetrics error for ${symbol}:`, error.message);
    return null;
  }
};

module.exports = {
  getQuote,
  getCompanyProfile,
  getCompanyNews,
  getCryptoNews,
  getCompanyMetrics,
};
