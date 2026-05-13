const MISTRAL_KEY = 'dcxWdterV9OBvYyaHu4VSPfoFrahv9O1';
const MISTRAL_LARGE = 'mistral-large-2411';
const MISTRAL_MEDIUM = 'mistral-medium-2508';
const MISTRAL_SMALL = 'mistral-small-2506';

async function directMistral({ prompt, temperature = 0.4, model = MISTRAL_LARGE }) {
  if (!prompt?.trim()) throw new Error('Prompt is empty');

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

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Mistral request failed for ${model}`);
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error(`Mistral (${model}) returned no text`);
  return text;
}

export async function callAi({ prompt, temperature = 0.4 }) {
  const models = [MISTRAL_LARGE, MISTRAL_MEDIUM, MISTRAL_SMALL];
  let lastErr = null;

  for (const model of models) {
    try {
      return await directMistral({ prompt, temperature, model });
    } catch (err) {
      console.warn(`[Renderer Gemini] model ${model} failed:`, err.message);
      lastErr = err;
    }
  }
  throw lastErr || new Error('All Mistral models failed');
}

export { callAi as callMistral };


export function courseGenerationPrompt({ moduleName, request }) {
  return `Create a complete course lesson for a university e-learning platform.

Module: ${moduleName || 'Unknown module'}
Professor request: ${request}

Return only this format:
TITLE: concise lesson title
CONTENT:
Clear lesson content with sections, explanation, examples, and a short exercise. If a useful public YouTube URL is known, include it as a plain URL on its own line. Do not invent citations.`;
}

export function courseChatPrompt({ mode, question, course }) {
  const base = `You are a course assistant. Answer only using the course material below. If the answer is not in the material, say what is missing.

Course title: ${course?.title || 'Untitled'}
Course content:
${course?.content || ''}

Course video URL:
${course?.yt_url || 'none'}`;

  if (mode === 'summary') {
    return `${base}

Summarize this course for a student. Include:
- main idea
- key points
- important terms
- what to review next`;
  }

  return `${base}

Student question: ${question}

Give a direct, helpful answer.`;
}

export function parseGeneratedCourse(text) {
  const titleMatch = text.match(/^TITLE:\s*(.+)$/im);
  const contentMatch = text.match(/CONTENT:\s*([\s\S]*)$/i);
  return {
    title: (titleMatch?.[1] || 'Generated course').trim(),
    content: (contentMatch?.[1] || text).trim(),
  };
}
