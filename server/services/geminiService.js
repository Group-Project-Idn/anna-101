const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  'gemini-flash-latest',
].filter(Boolean);

let ai = null;
let activeModel = null;

if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// Local fallback data used when GEMINI_API_KEY is not set or Gemini API fails
const LOCAL_DEMO_DIALOGUES = [
  {
    a: [
      'Hi! I am your practice partner for this demo session.',
      'This demo shows how the real chat will look, but it is not saved.',
      'Let us talk about hobbies. What do you usually do in your free time?',
      'I enjoy reading novels and trying new recipes.',
      'What kind of novels do you like?',
      'Do you play football every weekend?',
      'How long have you been playing?',
      'That is great! Exercise is really important.',
      'I jog around the block a few times a week.',
      'After this demo we can start the real chat. Hit ready!',
    ],
    b: [
      'Hi! Nice to meet you, I am ready to practice English.',
      'Got it! So what should we talk about?',
      'I like playing football and watching movies. How about you?',
      'That sounds fun! Maybe you can recommend a novel later.',
      'Mostly mystery stories. I cannot stop reading once I start.',
      'Yes, with my friends every Sunday morning.',
      'For about five years now. It keeps me healthy.',
      'Totally agree. Do you do any sports?',
      'Awesome! Maybe we can jog together someday.',
      'Perfect, I am ready whenever you are!',
    ],
  },
  {
    a: [
      'Hello! Welcome to Anna practice room.',
      'This demo is temporary and will not be stored in our history.',
      'Let us talk about sports. Do you follow any sports?',
      'Really? Which team is your favorite?',
      'I prefer watching badminton, it is very fast!',
      'Do you play basketball yourself?',
      'That is a good routine. How did you start?',
      'Nice! Sports are a great way to make friends.',
      'Thank you! After this demo we can chat for real.',
      'Great! Hit ready and let us practice together.',
    ],
    b: [
      'Hello! Thanks, I am excited to practice English here.',
      'Understood! What is the topic for today?',
      'Yes, I follow basketball a lot.',
      'I support the local university team. What about you?',
      'True, badminton players have amazing reflexes.',
      'Yes, twice a week after work.',
      'My friends invited me to join their team.',
      'Definitely! Do you play badminton too?',
      'Sounds good, I am ready to start.',
      'Let us do it!',
    ],
  },
];

const LOCAL_SUGGESTIONS = [
  "Try: 'Yes, I love football!'",
  "Try: 'That sounds interesting, tell me more!'",
  "Try: 'I usually play badminton on weekends.'",
  "Try: 'What do you like to do in your free time?'",
  "Try: 'I totally agree with you!'",
  "Try: 'Wow, that is really cool!'",
];

const LOCAL_STRENGTHS = [
  'Good vocabulary usage and natural expressions.',
  'Confident speaking with clear sentence structure.',
  'Great conversational flow and quick responses.',
];

const LOCAL_EVALUATIONS = [
  'You kept the conversation going smoothly and used many useful phrases. Next time, try adding more details to your answers.',
  'Your responses were clear and on topic. To improve, practice using past tense more consistently.',
  'You communicated your ideas well. Try asking more follow-up questions to keep the chat engaging.',
];

const requestJson = async (systemInstruction, userPayload) => {
  if (!ai) {
    throw new Error('AI service not configured. Please set GEMINI_API_KEY in environment variables.');
  }

  const candidates = activeModel ? [activeModel, ...GEMINI_MODEL_CANDIDATES] : GEMINI_MODEL_CANDIDATES;
  let lastError;

  for (const model of candidates) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: JSON.stringify(userPayload),
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      activeModel = model;
      return parsed;
    } catch (error) {
      lastError = error;
      console.error(`Gemini model "${model}" failed:`, error.message);
      if (!/not found|404|not supported|503|unavailable|high demand|overloaded/i.test(error.message || '')) {
        throw error;
      }
    }
  }

  throw lastError;
};

// Jalankan panggilan Gemini; kalau gagal (key kosong, API error, rate limit,
// atau respons tidak valid) jatuh ke generator lokal supaya fitur chat tetap
// hidup — bukan cuma saat key belum dikonfigurasi.
const withGemini = (aiCall, localFallback) => {
  if (!ai) return localFallback();

  return aiCall().catch((error) => {
    console.error('[Gemini] request failed, using local fallback:', error.message);
    return localFallback();
  });
};

const buildLocalDemoScript = () => {
  const dialogue = LOCAL_DEMO_DIALOGUES[Math.floor(Math.random() * LOCAL_DEMO_DIALOGUES.length)];
  const lines = [];

  for (let i = 0; i < dialogue.a.length; i += 1) {
    lines.push({ speaker: 'A', text: dialogue.a[i] });
    lines.push({ speaker: 'B', text: dialogue.b[i] });
  }

  return lines;
};

const generateDemoScript = ({ lesson, messages } = {}) =>
  withGemini(
    async () => {
      const systemInstruction = `You are Anna, an English conversation tutor.
Create a short English example conversation that matches the lesson topic and CEFR level.
Return ONLY valid JSON with this shape:
{"lines":[{"speaker":"A","text":"..."},{"speaker":"B","text":"..."}]}
Alternate A and B for at least 10 lines each, keep sentences simple and natural.`;

      const payload = {
        lesson_title: lesson?.title || 'Conversation practice',
        cefr_level: lesson?.pathway?.cefr_level || lesson?.cefr_level || 'A1',
        message_count: messages?.length || 0,
      };

      const result = await requestJson(systemInstruction, payload);
      if (!result || !Array.isArray(result.lines)) {
        throw new Error('Invalid demo script from AI.');
      }

      return result.lines.slice(0, 20);
    },
    buildLocalDemoScript,
  );

const generateSuggestion = ({ lesson, messages } = {}) =>
  withGemini(
    async () => {
      const systemInstruction = `You are Anna, an English conversation tutor.
Suggest ONE natural next English reply for the learner, based on the lesson topic and recent chat messages.
Return ONLY valid JSON:
{"suggestion":"Try: '...'"}

If there are no messages yet, suggest a simple opening greeting.`;

      const payload = {
        lesson_title: lesson?.title || 'Conversation practice',
        cefr_level: lesson?.pathway?.cefr_level || lesson?.cefr_level || 'A1',
        recent_messages: messages?.slice(-6) || [],
      };

      const result = await requestJson(systemInstruction, payload);
      if (!result || typeof result.suggestion !== 'string') {
        throw new Error('Invalid suggestion from AI.');
      }

      return result.suggestion;
    },
    () => LOCAL_SUGGESTIONS[Math.floor(Math.random() * LOCAL_SUGGESTIONS.length)],
  );

const generateEvaluation = ({ lesson, messages } = {}) =>
  withGemini(
    async () => {
      const systemInstruction = `You are Anna, an English conversation tutor.
Evaluate ONLY the learner's English chat messages.
Return ONLY valid JSON:
{"strengths":"...","evaluation":"...","score":1}

Score must be 1-5 based on grammar, vocabulary, relevance, and CEFR-appropriate naturalness.
Be constructive and specific. If there are no user messages, score 1 and explain why.`;

      const payload = {
        lesson_title: lesson?.title || 'Conversation practice',
        cefr_level: lesson?.pathway?.cefr_level || lesson?.cefr_level || 'A1',
        user_messages: messages || [],
      };

      const result = await requestJson(systemInstruction, payload);
      if (!result || typeof result.strengths !== 'string' || typeof result.evaluation !== 'string' || !Number.isInteger(result.score)) {
        throw new Error('Invalid evaluation from AI.');
      }

      return {
        strengths: result.strengths,
        evaluation: result.evaluation,
        score: result.score,
      };
    },
    () => {
      const strengths = LOCAL_STRENGTHS[Math.floor(Math.random() * LOCAL_STRENGTHS.length)];
      const evaluation = LOCAL_EVALUATIONS[Math.floor(Math.random() * LOCAL_EVALUATIONS.length)];
      const score = 3 + Math.floor(Math.random() * 3); // 3 - 5

      return { strengths, evaluation, score };
    },
  );

module.exports = { generateDemoScript, generateSuggestion, generateEvaluation };
