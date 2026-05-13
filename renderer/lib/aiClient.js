import { courseChatPrompt, courseGenerationPrompt, parseGeneratedCourse } from './gemini';

const MISTRAL_KEY = 'dcxWdterV9OBvYyaHu4VSPfoFrahv9O1';
const MISTRAL_LARGE = 'mistral-large-2411';
const MISTRAL_MEDIUM = 'mistral-medium-2508';
const MISTRAL_SMALL = 'mistral-small-2506';

function cleanAiError(message = '') {
  const m = String(message);
  if (/Mistral API key missing/i.test(m)) {
    return 'Mistral key is missing.';
  }
  if (/leaked|api key not valid|API_KEY_INVALID|permission|denied|PERMISSION_DENIED/i.test(m)) {
    return 'The current API key is blocked or invalid.';
  }
  if (/quota|RESOURCE_EXHAUSTED|rate_limit/i.test(m)) {
    return 'AI quota is exhausted. Try again later.';
  }
  if (/network|fetch/i.test(m)) {
    return 'Network error. Please check your internet connection.';
  }
  return m || 'AI request failed. Try again.';
}

class AiClientError extends Error {
  constructor(message) {
    super(cleanAiError(message));
    this.name = 'AiClientError';
  }
}

async function directMistral(prompt, temperature = 0.4, model = MISTRAL_LARGE) {
  console.log(`[Renderer AI] Calling Mistral: model=${model}, promptLen=${prompt?.length}`);

  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
    }),
  });

  console.log(`[Renderer AI] Mistral Response: status=${res.status}, model=${model}`);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`[Renderer AI] Mistral Error (${model}):`, JSON.stringify(data));
    throw new AiClientError(data?.error?.message || `Mistral request failed for ${model}`);
  }

  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    console.warn(`[Renderer AI] Mistral (${model}) returned empty text. Full response:`, JSON.stringify(data));
    throw new Error(`Mistral (${model}) returned no text`);
  }
  return text;
}

async function callAi(prompt, temperature = 0.4) {
  console.log(`[Renderer AI] callAi initiated with Mistral chain`);
  const models = [MISTRAL_LARGE, MISTRAL_MEDIUM, MISTRAL_SMALL];
  let lastErr = null;

  for (const model of models) {
    try {
      return await directMistral(prompt, temperature, model);
    } catch (err) {
      console.warn(`[Renderer AI] Mistral model ${model} failed, trying next... Error: ${err.message}`);
      lastErr = err;
    }
  }

  console.error(`[Renderer AI] All Mistral models failed. Last error:`, lastErr?.message);
  throw lastErr || new Error('All AI models failed');
}

export async function generateCourseDraft({ moduleName, request }) {
  if (typeof window !== 'undefined' && window.electronAPI?.generateCourse) {
    const data = await window.electronAPI.generateCourse({ moduleName, request });
    if (data?.error) throw new AiClientError(data.error);
    return data.course;
  }
  const text = await callAi(courseGenerationPrompt({ moduleName, request }), 0.5);
  return parseGeneratedCourse(text);
}

export async function chatWithCourse({ mode, question, course }) {
  if (typeof window !== 'undefined' && window.electronAPI?.chatCourse) {
    const data = await window.electronAPI.chatCourse({ mode, question, course });
    if (data?.error) throw new AiClientError(data.error);
    return data.answer;
  }
  return callAi(courseChatPrompt({ mode, question, course }), 0.3);
}

