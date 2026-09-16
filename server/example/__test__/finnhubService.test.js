const mockGet = jest.fn();

jest.mock('axios', () => ({
  create: () => ({ get: mockGet }),
}));

require('dotenv').config();

const service = require('../services/finnhubService');

describe('finnhubService', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  beforeEach(() => {
    mockGet.mockReset();
  });

  describe('getQuote', () => {
    it('should map Finnhub quote response to standard format', async () => {
      mockGet.mockResolvedValue({
        data: { c: 150.5, d: 2.5, dp: 1.67, h: 152.0, l: 148.0, o: 149.0, pc: 148.0, t: 1234567890 },
      });

      const result = await service.getQuote('AAPL');

      expect(result).toEqual({
        current_price: 150.5, change: 2.5, change_percent: 1.67,
        high: 152.0, low: 148.0, open: 149.0, previous_close: 148.0, timestamp: 1234567890,
      });
      expect(mockGet).toHaveBeenCalledWith('/quote', { params: { symbol: 'AAPL' } });
    });

    it('should throw and log on API error', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));
      await expect(service.getQuote('AAPL')).rejects.toThrow('Network error');
      expect(console.error).toHaveBeenCalledWith('Finnhub getQuote error for AAPL:', 'Network error');
    });
  });

  describe('getCompanyProfile', () => {
    it('should map company profile response', async () => {
      mockGet.mockResolvedValue({
        data: {
          country: 'US', currency: 'USD', exchange: 'NASDAQ',
          ipo: '1980-12-12', marketCapitalization: 2800000,
          name: 'Apple Inc.', phone: '1234567890',
          shareOutstanding: 16000000000, ticker: 'AAPL',
          weburl: 'https://apple.com', logo: 'https://logo.png',
          finnhubIndustry: 'Technology',
        },
      });

      const result = await service.getCompanyProfile('AAPL');

      expect(result).toEqual({
        country: 'US', currency: 'USD', exchange: 'NASDAQ',
        ipo: '1980-12-12', market_cap: 2800000, name: 'Apple Inc.',
        phone: '1234567890', share_outstanding: 16000000000,
        ticker: 'AAPL', weburl: 'https://apple.com',
        logo: 'https://logo.png', industry: 'Technology',
      });
      expect(mockGet).toHaveBeenCalledWith('/stock/profile2', { params: { symbol: 'AAPL' } });
    });

    it('should throw and log on API error', async () => {
      mockGet.mockRejectedValue(new Error('Profile fetch failed'));
      await expect(service.getCompanyProfile('AAPL')).rejects.toThrow('Profile fetch failed');
      expect(console.error).toHaveBeenCalledWith('Finnhub getCompanyProfile error for AAPL:', 'Profile fetch failed');
    });
  });

  describe('getCompanyNews', () => {
    it('should map company news with date conversion', async () => {
      mockGet.mockResolvedValue({
        data: [
          { headline: 'Headline 1', summary: 'Summary 1', source: 'Source 1',
            url: 'https://example.com/1', image: 'https://image1.png', datetime: 1700000000 },
          { headline: 'Headline 2', summary: 'Summary 2', source: 'Source 2',
            url: 'https://example.com/2', image: 'https://image2.png', datetime: 1700001000 },
        ],
      });

      const result = await service.getCompanyNews('AAPL', '2024-01-01', '2024-01-31');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        headline: 'Headline 1', summary: 'Summary 1', source: 'Source 1',
        url: 'https://example.com/1', image_url: 'https://image1.png',
        published_at: new Date(1700000000 * 1000),
      });
      expect(result[1].published_at).toEqual(new Date(1700001000 * 1000));
      expect(mockGet).toHaveBeenCalledWith('/company-news', {
        params: { symbol: 'AAPL', from: '2024-01-01', to: '2024-01-31' },
      });
    });

    it('should throw and log on API error', async () => {
      mockGet.mockRejectedValue(new Error('News fetch failed'));
      await expect(service.getCompanyNews('AAPL', '2024-01-01', '2024-01-31')).rejects.toThrow('News fetch failed');
      expect(console.error).toHaveBeenCalledWith('Finnhub getCompanyNews error for AAPL:', 'News fetch failed');
    });
  });

  describe('getCryptoNews', () => {
    it('should slice to 10 items and map crypto news', async () => {
      const newsItems = Array.from({ length: 15 }, (_, i) => ({
        headline: `Headline ${i}`, summary: `Summary ${i}`,
        source: `Source ${i}`, url: `https://example.com/${i}`,
        image: `https://image${i}.png`, datetime: 1700000000 + i,
      }));

      mockGet.mockResolvedValue({ data: newsItems });

      const result = await service.getCryptoNews('2024-01-01', '2024-01-31');

      expect(result).toHaveLength(10);
      expect(result[0]).toEqual({
        headline: 'Headline 0', summary: 'Summary 0', source: 'Source 0',
        url: 'https://example.com/0', image_url: 'https://image0.png',
        published_at: new Date(1700000000 * 1000),
      });
      expect(result[9].headline).toBe('Headline 9');
      expect(mockGet).toHaveBeenCalledWith('/news', {
        params: { category: 'crypto', from: '2024-01-01', to: '2024-01-31', minId: 0 },
      });
    });

    it('should throw and log on API error', async () => {
      mockGet.mockRejectedValue(new Error('Crypto news fetch failed'));
      await expect(service.getCryptoNews('2024-01-01', '2024-01-31')).rejects.toThrow('Crypto news fetch failed');
      expect(console.error).toHaveBeenCalledWith('Finnhub getCryptoNews error:', 'Crypto news fetch failed');
    });
  });

  describe('getCompanyMetrics', () => {
    it('should map metrics with primary pe_ratio value', async () => {
      mockGet.mockResolvedValue({
        data: { metric: { peBasicExclExtraTTM: 28.5, marketCapitalization: 2800000,
          '52WeekHigh': 180.0, '52WeekLow': 120.0, beta: 1.29 } },
      });

      const result = await service.getCompanyMetrics('AAPL');

      expect(result).toEqual({
        pe_ratio: 28.5, market_cap: 2800000,
        week52_high: 180.0, week52_low: 120.0, beta: 1.29,
      });
      expect(mockGet).toHaveBeenCalledWith('/stock/metric', {
        params: { symbol: 'AAPL', metric: 'all' },
      });
    });

    it('should fallback to peTTM when peBasicExclExtraTTM is null', async () => {
      mockGet.mockResolvedValue({
        data: { metric: { peBasicExclExtraTTM: null, peTTM: 25.3,
          marketCapitalization: 1000, '52WeekHigh': 150, '52WeekLow': 100, beta: 1.1 } },
      });

      const result = await service.getCompanyMetrics('AAPL');
      expect(result.pe_ratio).toBe(25.3);
    });

    it('should fallback to peExclExtraTTM when first two are null', async () => {
      mockGet.mockResolvedValue({
        data: { metric: { peBasicExclExtraTTM: null, peTTM: null,
          peExclExtraTTM: 30.1, marketCapitalization: 1000,
          '52WeekHigh': 150, '52WeekLow': 100, beta: 1.1 } },
      });

      const result = await service.getCompanyMetrics('AAPL');
      expect(result.pe_ratio).toBe(30.1);
    });

    it('should return null for pe_ratio when all pe fields are null', async () => {
      mockGet.mockResolvedValue({
        data: { metric: { peBasicExclExtraTTM: null, peTTM: null,
          peExclExtraTTM: null, marketCapitalization: 1000,
          '52WeekHigh': 150, '52WeekLow': 100, beta: 1.1 } },
      });

      const result = await service.getCompanyMetrics('AAPL');
      expect(result.pe_ratio).toBeNull();
      expect(result.market_cap).toBe(1000);
    });

    it('should return all null when metric is empty object', async () => {
      mockGet.mockResolvedValue({ data: { metric: {} } });
      const result = await service.getCompanyMetrics('AAPL');
      expect(result).toEqual({
        pe_ratio: null, market_cap: null,
        week52_high: null, week52_low: null, beta: null,
      });
    });

    it('should return all null when data.metric is undefined', async () => {
      mockGet.mockResolvedValue({ data: {} });
      const result = await service.getCompanyMetrics('AAPL');
      expect(result).toEqual({
        pe_ratio: null, market_cap: null,
        week52_high: null, week52_low: null, beta: null,
      });
    });

    it('should return null on API error instead of throwing', async () => {
      mockGet.mockRejectedValue(new Error('Metrics fetch failed'));
      const result = await service.getCompanyMetrics('AAPL');
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Finnhub getCompanyMetrics error for AAPL:', 'Metrics fetch failed',
      );
    });
  });
});