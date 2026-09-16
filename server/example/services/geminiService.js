const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Urutan model yang dicoba: override dari .env -> model yang direkomendasikan Google.
// CATATAN: gemini-1.5-flash & gemini-2.5-flash sudah ditutup untuk user baru (404).
const GEMINI_MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
].filter(Boolean);

let ai = null;
let activeModel = null;

if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

const buildPrompt = (stockData) => `Analyze the following stock data and provide a JSON response with the structure:
{
  "summary": "3-4 sentence descriptive analysis in Indonesian language (NO buy/sell recommendations)",
  "sentiment": "Bullish" or "Bearish" or "Neutral",
  "confidence": number between 0-100,
  "highlights": ["2-3 key points as strings"],
  "risk_note": "One risk note as string"
}

Stock Data:
Symbol: ${stockData.symbol}
Company: ${stockData.name}
Sector: ${stockData.sector}
Current Price: $${stockData.current_price}
Change: ${stockData.change_percent}%
52-Week High: $${stockData.week52_high}
52-Week Low: $${stockData.week52_low}
P/E Ratio: ${stockData.pe_ratio}
Market Cap: $${stockData.market_cap}M
Beta: ${stockData.beta}

Recent News Headlines:
${stockData.newsHeadlines ? stockData.newsHeadlines.join('\n') : 'No recent news available.'}

Price History (last 7 days):
${stockData.recentPrices ? stockData.recentPrices.map((p) => `${p.date}: $${p.close}`).join('\n') : 'No recent price data.'}

Respond ONLY with valid JSON, no markdown formatting, no additional text.`;

// Coba kandidat model secara berurutan; 404 model tidak tersedia -> pindah ke berikutnya.
// Model yang berhasil diingat (activeModel) supaya panggilan berikutnya tidak retry.
const requestInsight = async (stockData) => {
  const candidates = activeModel ? [activeModel] : GEMINI_MODEL_CANDIDATES;
  let lastError;

  for (const model of candidates) {
    try {
      const response = await ai.interactions.create({
        model,
        input: buildPrompt(stockData),
      });

      // Interactions API (baru): convenience property `output_text`.
      // Teks masih bisa terbungkus markdown ```json ... ```
      const text = response.output_text;

      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const insight = JSON.parse(cleanedText);

      activeModel = model;
      return {
        summary: insight.summary,
        sentiment: insight.sentiment,
        confidence: insight.confidence,
        highlights: insight.highlights,
        risk_note: insight.risk_note,
      };
    } catch (error) {
      lastError = error;
      console.error(`Gemini model "${model}" failed:`, error.message);
      // 404 (model tidak ada/ditutup) atau 503 (high demand) -> coba kandidat berikutnya
      if (!/not found|404|not supported|503|unavailable|high demand|overloaded/i.test(error.message || '')) {
        throw error;
      }
    }
  }

  throw lastError;
};

const generateInsight = async (stockData) => {
  if (!GEMINI_API_KEY || !ai) {
    throw { name: 'ServiceUnavailable', message: 'AI service not configured. Please set GEMINI_API_KEY in environment variables.' };
  }

  try {
    return await requestInsight(stockData);
  } catch (error) {
    if (error.name === 'ServiceUnavailable') {
      throw error;
    }
    console.error('Gemini generateInsight error:', error.message);
    throw new Error('Failed to generate AI insight: ' + error.message);
  }
};

module.exports = {
  generateInsight,
};
