// Nama variabel harus diawali "mock" agar boleh direferensikan dari factory jest.mock.
const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn(() => ({
    interactions: { create: mockGenerateContent },
  })),
}));

describe('geminiService', () => {
  let geminiService;

  const loadService = (env = {}) => {
    jest.resetModules();
    process.env.GEMINI_API_KEY = env.key !== undefined ? env.key : 'test-api-key';
    process.env.GEMINI_MODEL = env.model !== undefined ? env.model : 'gemini-test-model';
    // eslint-disable-next-line global-require
    return require('../services/geminiService');
  };

  const insightPayload = {
    summary: 'Saham menunjukkan tren positif.',
    sentiment: 'Bullish',
    confidence: 82,
    highlights: ['Momentum naik', 'Volume sehat'],
    risk_note: 'Volatilitas pasar tetap tinggi.',
  };

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  beforeEach(() => {
    mockGenerateContent.mockReset();
  });

  test('throws ServiceUnavailable when GEMINI_API_KEY is not configured', async () => {
    geminiService = loadService({ key: '' });

    await expect(geminiService.generateInsight({ symbol: 'AAPL' })).rejects.toMatchObject({
      name: 'ServiceUnavailable',
    });
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  test('returns parsed insight for plain JSON response', async () => {
    mockGenerateContent.mockResolvedValue({ output_text: JSON.stringify(insightPayload) });
    geminiService = loadService();

    const result = await geminiService.generateInsight({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      sector: 'Technology',
      newsHeadlines: ['Apple beats earnings'],
      recentPrices: [{ date: '2024-01-02', close: 151.2 }],
    });

    expect(result).toEqual(insightPayload);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    expect(mockGenerateContent.mock.calls[0][0].model).toBe('gemini-test-model');
    expect(mockGenerateContent.mock.calls[0][0].input).toContain('AAPL');
    expect(mockGenerateContent.mock.calls[0][0].input).toContain('Apple beats earnings');
  });

  test('strips markdown fences before parsing JSON', async () => {
    mockGenerateContent.mockResolvedValue({
      output_text: '```json\n' + JSON.stringify(insightPayload) + '\n```',
    });
    geminiService = loadService();

    const result = await geminiService.generateInsight({ symbol: 'MSFT' });

    expect(result).toEqual(insightPayload);
  });

    test('retries next model on 404 and caches the active model', async () => {
    mockGenerateContent
      .mockRejectedValueOnce(new Error('models/gemini-test-model is not found (404)'))
      .mockResolvedValueOnce({ output_text: JSON.stringify(insightPayload) })
      .mockResolvedValue({ output_text: JSON.stringify(insightPayload) });
    geminiService = loadService();

    const result = await geminiService.generateInsight({ symbol: 'AAPL' });

    expect(result).toEqual(insightPayload);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(mockGenerateContent.mock.calls[1][0].model).toBe('gemini-3.6-flash');

    // Panggilan berikutnya memakai kandidat yang sudah aktif (activeModel)
    await geminiService.generateInsight({ symbol: 'MSFT' });
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    expect(mockGenerateContent.mock.calls[2][0].model).toBe('gemini-3.6-flash');
  });

  test('throws immediately on non-retryable error', async () => {
    mockGenerateContent.mockRejectedValue(new Error('API key not valid'));
    geminiService = loadService();

    await expect(geminiService.generateInsight({ symbol: 'AAPL' })).rejects.toThrow(
      'Failed to generate AI insight: API key not valid',
    );
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  test('throws immediately when error message is falsy (empty string)', async () => {
    const err = new Error('');
    // Force message to be an empty string to cover the `||` falsy branch
    err.message = '';
    mockGenerateContent.mockRejectedValue(err);
    geminiService = loadService();

    await expect(geminiService.generateInsight({ symbol: 'AAPL' })).rejects.toThrow(
      'Failed to generate AI insight:',
    );
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  test('wraps last error when all model candidates are exhausted', async () => {
    mockGenerateContent.mockRejectedValue(new Error('404 not found'));
    geminiService = loadService();

    await expect(geminiService.generateInsight({ symbol: 'AAPL' })).rejects.toThrow(
      'Failed to generate AI insight: 404 not found',
    );
    // 1 kandidat dari GEMINI_MODEL + 3 kandidat default
    expect(mockGenerateContent).toHaveBeenCalledTimes(4);
  });

  test('rethrows ServiceUnavailable unwrapped when service is overloaded', async () => {
    const overload = Object.assign(new Error('503 overloaded'), {
      name: 'ServiceUnavailable',
    });
    mockGenerateContent.mockRejectedValue(overload);
    geminiService = loadService();

    await expect(geminiService.generateInsight({ symbol: 'AAPL' })).rejects.toMatchObject({
      name: 'ServiceUnavailable',
      message: '503 overloaded',
    });
  });
});
