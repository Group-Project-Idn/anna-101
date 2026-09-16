const { isCrypto, toTwelveDataSymbol, toFinnhubWsSymbol, fromFinnhubWsSymbol, CRYPTO_SYMBOLS } = require('../constants/stocks');

describe('Constants - Crypto Functions', () => {
  describe('isCrypto', () => {
    it('should return true for crypto symbols', () => {
      expect(isCrypto('BTC')).toBe(true);
    });

    it('should return false for stock symbols', () => {
      expect(isCrypto('AAPL')).toBe(false);
      expect(isCrypto('MSFT')).toBe(false);
      expect(isCrypto('GOOGL')).toBe(false);
    });

    it('should handle lowercase input', () => {
      expect(isCrypto('btc')).toBe(true);
    });

    it('should handle null/undefined/empty', () => {
      expect(isCrypto(null)).toBe(false);
      expect(isCrypto(undefined)).toBe(false);
      expect(isCrypto('')).toBe(false);
    });
  });

  describe('toTwelveDataSymbol', () => {
    it('should convert crypto to Twelve Data format', () => {
      expect(toTwelveDataSymbol('BTC')).toBe('BTC/USD');
    });

    it('should return stock symbols as-is', () => {
      expect(toTwelveDataSymbol('AAPL')).toBe('AAPL');
      expect(toTwelveDataSymbol('MSFT')).toBe('MSFT');
    });

    it('should handle lowercase input', () => {
      expect(toTwelveDataSymbol('btc')).toBe('BTC/USD');
    });

    it('should handle null/undefined/empty input', () => {
      expect(toTwelveDataSymbol(null)).toBe('');
      expect(toTwelveDataSymbol(undefined)).toBe('');
      expect(toTwelveDataSymbol('')).toBe('');
    });
  });

  describe('toFinnhubWsSymbol', () => {
    it('should convert crypto to Finnhub WebSocket format', () => {
      expect(toFinnhubWsSymbol('BTC')).toBe('BINANCE:BTCUSDT');
    });

    it('should return stock symbols as-is', () => {
      expect(toFinnhubWsSymbol('AAPL')).toBe('AAPL');
    });

    it('should handle null/undefined/empty input', () => {
      expect(toFinnhubWsSymbol(null)).toBe('');
      expect(toFinnhubWsSymbol(undefined)).toBe('');
      expect(toFinnhubWsSymbol('')).toBe('');
    });
  });

  describe('fromFinnhubWsSymbol', () => {
    it('should convert Finnhub WebSocket format back to symbol', () => {
      expect(fromFinnhubWsSymbol('BINANCE:BTCUSDT')).toBe('BTC');
    });

    it('should return stock symbols as-is', () => {
      expect(fromFinnhubWsSymbol('AAPL')).toBe('AAPL');
    });
  });
});