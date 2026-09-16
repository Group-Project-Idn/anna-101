const mockGet = jest.fn();

jest.mock('axios', () => ({
  create: () => ({ get: mockGet }),
}));

require('dotenv').config();

const service = require('../services/twelveDataService');

describe('twelveDataService', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  beforeEach(() => {
    mockGet.mockReset();
  });

  describe('getTimeSeries', () => {
    it('should map time series data with default range (1m)', async () => {
      mockGet.mockResolvedValue({
        data: { values: [
          { datetime: '2024-01-01', open: '150.0', high: '152.0', low: '148.0',
            close: '151.0', volume: '1000000' },
          { datetime: '2024-01-02', open: '151.0', high: '153.0', low: '149.0',
            close: '152.0', volume: '1200000' },
        ] },
      });

      const result = await service.getTimeSeries('AAPL');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        datetime: '2024-01-01', open: 150.0, high: 152.0, low: 148.0,
        close: 151.0, volume: 1000000, interval: '1day',
      });
      expect(mockGet).toHaveBeenCalledWith('/time_series', {
        params: { symbol: 'AAPL', interval: '1day', outputsize: 252,
          apikey: process.env.TWELVE_DATA_API_KEY },
      });
    });

    it('should use default range when range argument is omitted', async () => {
      mockGet.mockResolvedValue({ data: { values: [] } });
      await service.getTimeSeries('AAPL');
      expect(mockGet).toHaveBeenCalledWith('/time_series', {
        params: { symbol: 'AAPL', interval: '1day', outputsize: 252,
          apikey: process.env.TWELVE_DATA_API_KEY },
      });
    });

    it('should use intervalOverride when provided and valid (1h)', async () => {
      mockGet.mockResolvedValue({ data: { values: [] } });
      await service.getTimeSeries('AAPL', '1m', '1h');
      expect(mockGet).toHaveBeenCalledWith('/time_series', {
        params: { symbol: 'AAPL', interval: '1h', outputsize: 5000,
          apikey: process.env.TWELVE_DATA_API_KEY },
      });
    });

    it('should use intervalOverride for 5m', async () => {
      mockGet.mockResolvedValue({ data: { values: [] } });
      await service.getTimeSeries('MSFT', '1m', '5m');
      expect(mockGet).toHaveBeenCalledWith('/time_series', {
        params: { symbol: 'MSFT', interval: '5min', outputsize: 5000,
          apikey: process.env.TWELVE_DATA_API_KEY },
      });
    });

    it('should fall back to range map when intervalOverride is invalid', async () => {
      mockGet.mockResolvedValue({ data: { values: [] } });
      await service.getTimeSeries('AAPL', '3m', 'invalid');
      expect(mockGet).toHaveBeenCalledWith('/time_series', {
        params: { symbol: 'AAPL', interval: '1day', outputsize: 5000,
          apikey: process.env.TWELVE_DATA_API_KEY },
      });
    });

    it('should use range 3m', async () => {
      mockGet.mockResolvedValue({ data: { values: [] } });
      await service.getTimeSeries('AAPL', '3m');
      expect(mockGet).toHaveBeenCalledWith('/time_series', {
        params: { symbol: 'AAPL', interval: '1day', outputsize: 5000,
          apikey: process.env.TWELVE_DATA_API_KEY },
      });
    });

    it('should use range 1y', async () => {
      mockGet.mockResolvedValue({ data: { values: [] } });
      await service.getTimeSeries('AAPL', '1y');
      expect(mockGet).toHaveBeenCalledWith('/time_series', {
        params: { symbol: 'AAPL', interval: '1day', outputsize: 5000,
          apikey: process.env.TWELVE_DATA_API_KEY },
      });
    });

    it('should use range 5y', async () => {
      mockGet.mockResolvedValue({ data: { values: [] } });
      await service.getTimeSeries('AAPL', '5y');
      expect(mockGet).toHaveBeenCalledWith('/time_series', {
        params: { symbol: 'AAPL', interval: '1day', outputsize: 5000,
          apikey: process.env.TWELVE_DATA_API_KEY },
      });
    });

    it('should fallback to 1m when range is unknown', async () => {
      mockGet.mockResolvedValue({ data: { values: [] } });
      await service.getTimeSeries('AAPL', 'unknown-range');
      expect(mockGet).toHaveBeenCalledWith('/time_series', {
        params: { symbol: 'AAPL', interval: '1day', outputsize: 252,
          apikey: process.env.TWELVE_DATA_API_KEY },
      });
    });

    it('should map crypto symbols correctly (BTC -> BTC/USD)', async () => {
      mockGet.mockResolvedValue({ data: { values: [] } });
      await service.getTimeSeries('BTC', '1m');
      expect(mockGet).toHaveBeenCalledWith('/time_series', {
        params: { symbol: 'BTC/USD', interval: '1day', outputsize: 252,
          apikey: process.env.TWELVE_DATA_API_KEY },
      });
    });

    it('should return empty array when values is an empty array', async () => {
      mockGet.mockResolvedValue({ data: { values: [] } });
      expect(await service.getTimeSeries('AAPL')).toEqual([]);
    });

    it('should return empty array when values is not provided', async () => {
      mockGet.mockResolvedValue({ data: {} });
      expect(await service.getTimeSeries('AAPL')).toEqual([]);
    });

    it('should return empty array when values is not an array', async () => {
      mockGet.mockResolvedValue({ data: { values: 'not-an-array' } });
      expect(await service.getTimeSeries('AAPL')).toEqual([]);
    });

    it('should parse volume as null when volume field is absent', async () => {
      mockGet.mockResolvedValue({
        data: { values: [
          { datetime: '2024-01-01', open: '150.0', high: '152.0',
            low: '148.0', close: '151.0' },
        ] },
      });
      const result = await service.getTimeSeries('AAPL');
      expect(result[0].volume).toBeNull();
    });

    it('should throw when API returns error status', async () => {
      mockGet.mockResolvedValue({
        data: { status: 'error', message: 'Invalid symbol' },
      });
      await expect(service.getTimeSeries('AAPL')).rejects.toThrow('Invalid symbol');
    });

    it('should throw with default message when error has no message', async () => {
      mockGet.mockResolvedValue({ data: { status: 'error' } });
      await expect(service.getTimeSeries('AAPL')).rejects.toThrow('Twelve Data API error');
    });

    it('should throw on API network error', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));
      await expect(service.getTimeSeries('AAPL')).rejects.toThrow('Network error');
      expect(console.error).toHaveBeenCalledWith(
        'Twelve Data getTimeSeries error for AAPL:', 'Network error',
      );
    });
  });

  describe('getCryptoQuote', () => {
    const expectedTimestamp = (datetime) =>
      Math.floor(new Date(`${datetime.replace(' ', 'T')}Z`).getTime() / 1000);

    it('should map crypto quote with all fields present', async () => {
      mockGet.mockResolvedValue({
        data: {
          close: '45000.0', change: '500.0', percent_change: '1.12',
          high: '45500.0', low: '44500.0', open: '45000.0',
          previous_close: '44500.0', datetime: '2024-01-15 10:30',
        },
      });

      const result = await service.getCryptoQuote('BTC');

      expect(result).toEqual({
        current_price: 45000.0, change: 500.0, change_percent: 1.12,
        high: 45500.0, low: 44500.0, open: 45000.0,
        previous_close: 44500.0,
        timestamp: expectedTimestamp('2024-01-15 10:30'),
      });
      expect(mockGet).toHaveBeenCalledWith('/quote', {
        params: { symbol: 'BTC/USD',
          apikey: process.env.TWELVE_DATA_API_KEY },
      });
    });

    it('should return null for optional fields when not provided', async () => {
      mockGet.mockResolvedValue({ data: { close: '45000.0' } });

      const result = await service.getCryptoQuote('BTC');

      expect(result.current_price).toBe(45000.0);
      expect(result.change).toBeNull();
      expect(result.change_percent).toBeNull();
      expect(result.high).toBeNull();
      expect(result.low).toBeNull();
      expect(result.open).toBeNull();
      expect(result.previous_close).toBeNull();
    });

    it('should use Date.now() when datetime is not provided', async () => {
      mockGet.mockResolvedValue({ data: { close: '45000.0' } });

      const before = Math.floor(Date.now() / 1000);
      const result = await service.getCryptoQuote('BTC');
      const after = Math.floor(Date.now() / 1000);

      expect(result.timestamp).toBeGreaterThanOrEqual(before);
      expect(result.timestamp).toBeLessThanOrEqual(after);
    });

    it('should throw when API returns error status', async () => {
      mockGet.mockResolvedValue({
        data: { status: 'error', message: 'Invalid symbol' },
      });
      await expect(service.getCryptoQuote('BTC')).rejects.toThrow('Invalid symbol');
    });

    it('should throw with default message when error has no message', async () => {
      mockGet.mockResolvedValue({ data: { status: 'error' } });
      await expect(service.getCryptoQuote('BTC')).rejects.toThrow('Twelve Data quote error');
    });

    it('should throw when close is null', async () => {
      mockGet.mockResolvedValue({ data: { close: null } });
      await expect(service.getCryptoQuote('BTC')).rejects.toThrow('Twelve Data quote error');
      expect(console.error).toHaveBeenCalledWith(
        'Twelve Data getCryptoQuote error for BTC:', 'Twelve Data quote error',
      );
    });

    it('should throw on API network error', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));
      await expect(service.getCryptoQuote('BTC')).rejects.toThrow('Network error');
      expect(console.error).toHaveBeenCalledWith(
        'Twelve Data getCryptoQuote error for BTC:', 'Network error',
      );
    });
  });
});