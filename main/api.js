const { ipcMain } = require('electron');
const { createClient } = require('@supabase/supabase-js');
const { AccessToken } = require('livekit-server-sdk');

const MISTRAL_KEY = 'dcxWdterV9OBvYyaHu4VSPfoFrahv9O1';
const MISTRAL_LARGE = 'mistral-large-2411';
const MISTRAL_MEDIUM = 'mistral-medium-2508';
const MISTRAL_SMALL = 'mistral-small-2506';

async function directMistral({ prompt, temperature = 0.4, model = MISTRAL_LARGE }) {
  console.log(`[Main AI] Calling Mistral: model=${model}, promptLen=${prompt?.length}`);

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

  console.log(`[Main AI] Mistral Response: status=${res.status}, model=${model}`);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`[Main AI] Mistral Error (${model}):`, JSON.stringify(data));
    throw new Error(data?.error?.message || `Mistral request failed for ${model}`);
  }

  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    console.warn(`[Main AI] Mistral (${model}) returned empty text. Full response:`, JSON.stringify(data));
    throw new Error(`Mistral (${model}) returned no text`);
  }
  return text;
}

async function callAi({ prompt, temperature = 0.4 }) {
  console.log(`[Main AI] callAi initiated with Mistral chain`);
  const models = [MISTRAL_LARGE, MISTRAL_MEDIUM, MISTRAL_SMALL];
  let lastErr = null;

  for (const model of models) {
    try {
      return await directMistral({ prompt, temperature, model });
    } catch (err) {
      console.warn(`[Main AI] Mistral model ${model} failed, trying next... Error: ${err.message}`);
      lastErr = err;
    }
  }

  console.error(`[Main AI] All Mistral models failed. Last error:`, lastErr?.message);
  throw lastErr || new Error('All AI models failed');
}

function parseGeneratedCourse(text) {
  const titleMatch = text.match(/^TITLE:\s*(.+)$/im);
  const contentMatch = text.match(/CONTENT:\s*([\s\S]*)$/i);
  return {
    title: (titleMatch?.[1] || 'Generated course').trim(),
    content: (contentMatch?.[1] || text).trim(),
  };
}

function courseGenerationPrompt({ moduleName, request }) {
  return `Create a complete course lesson for a university e-learning platform.

Module: ${moduleName || 'Unknown module'}
Professor request: ${request}

Return only this format:
TITLE: concise lesson title
CONTENT:
Clear lesson content with sections, explanation, examples, and a short exercise. If a useful public YouTube URL is known, include it as a plain URL on its own line. Do not invent citations.`;
}

function courseChatPrompt({ mode, question, course }) {
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

function setupApiHandlers() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iqzhyvggnulolrwpdfxr.supabase.co/";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_secret_OC4ElD0yH6L_0IKBhu1FDQ_JGILMttX";
  const apiKey = "APIVVDbGVMUAfMJ";
  const apiSecret = "GWsoRdfjwIU6wE0aq0M0ZzxK02Fhm5okymK6yaPA1UL";

  const adminClient = () => createClient(url, service, { 
  auth: { persistSession: false },
  realtime: { enabled: false }
});

  ipcMain.handle('api:start-live', async (event, { module_id, host_id }) => {
    try {
      if (!module_id || !host_id) throw new Error('Missing fields');
      const sb = adminClient();
      const room_name = `module-${module_id}`;
      const { data: active, error: activeError } = await sb.from('livestreams')
        .select('*')
        .eq('module_id', module_id)
        .eq('room_name', room_name)
        .eq('status', 'live')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (activeError) throw new Error(activeError.message);
      if (active) return { ok: true, livestream: active };

      const { data, error } = await sb.from('livestreams')
        .insert({ module_id, host_id, room_name, status: 'live' })
        .select().single();
      if (error) throw new Error(error.message);
      return { ok: true, livestream: data };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle('api:end-live', async (event, { livestream_id, module_id }) => {
    try {
      const sb = adminClient();
      let q = sb.from('livestreams').update({ status: 'ended' }).eq('status', 'live');
      if (livestream_id) q = q.eq('id', livestream_id);
      else if (module_id) q = q.eq('module_id', module_id);
      else throw new Error('Missing fields');
      const { error } = await q;
      if (error) throw new Error(error.message);
      return { ok: true };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle('api:livekit-token', async (event, { roomName, identity, name, isHost }) => {
    try {
      if (!apiKey || !apiSecret) throw new Error('LiveKit env missing');
      const at = new AccessToken(apiKey, apiSecret, { identity, name });
      at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: !!isHost,
        canPublishData: true,
        canSubscribe: true,
      });
      const token = await at.toJwt();
      return { token };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle('api:create-user', async (event, { email, password, full_name, role }) => {
    try {
      const sb = adminClient();
      const { data, error } = await sb.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role }
      });
      if (error) throw new Error(error.message);
      return { ok: true, user: data.user };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle('api:create-post', async (event, { author_id, content, link = null, file_path = null }) => {
    try {
      if (!author_id || !content) throw new Error('Missing fields');
      const sb = adminClient();
      const { data, error } = await sb
        .from('posts')
        .insert({ author_id, content, link, file_path })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, post: data };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle('api:report-post', async (event, { post_id, reporter_id }) => {
    try {
      if (!post_id || !reporter_id) throw new Error('Missing fields');
      const sb = adminClient();
      const { error } = await sb.from('reports').insert({ post_id, reporter_id });
      if (error) throw new Error(error.message);
      return { ok: true };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle('api:delete-post', async (event, { id }) => {
    try {
      if (!id) throw new Error('Missing post id');
      const sb = adminClient();
      await sb.from('reports').delete().eq('post_id', id);
      const { error } = await sb.from('posts').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return { ok: true };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle('api:dismiss-reports', async (event, { post_id }) => {
    try {
      if (!post_id) throw new Error('Missing post id');
      const sb = adminClient();
      const { error } = await sb.from('reports').delete().eq('post_id', post_id);
      if (error) throw new Error(error.message);
      return { ok: true };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle('api:upload-file', async (event, { bucket, path: filePath, bytes, contentType }) => {
    try {
      if (!bucket || !filePath || !bytes) throw new Error('Missing upload fields');
      const sb = adminClient();
      const body = Buffer.from(new Uint8Array(bytes));
      const { error } = await sb.storage.from(bucket).upload(filePath, body, {
        contentType: contentType || 'application/octet-stream',
        upsert: true,
      });
      if (error) throw new Error(error.message);
      const { data } = sb.storage.from(bucket).getPublicUrl(filePath);
      return { ok: true, path: filePath, url: data.publicUrl };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle('api:ai-course', async (event, { moduleName, request }) => {
    try {
      if (!request?.trim()) throw new Error('Describe the course to generate');
      const text = await callAi({
        prompt: courseGenerationPrompt({ moduleName, request }),
        temperature: 0.5,
      });
      return { ok: true, course: parseGeneratedCourse(text), raw: text };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle('api:ai-course-chat', async (event, { mode = 'chat', question = '', course }) => {
    try {
      if (mode !== 'summary' && !question.trim()) throw new Error('Ask a question first');
      const answer = await callAi({
        prompt: courseChatPrompt({ mode, question, course }),
        temperature: 0.3,
      });
      return { ok: true, answer };
    } catch (e) {
      return { error: e.message };
    }
  });
}

module.exports = { setupApiHandlers };
