import { adminClient } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { livestream_id } = req.body || {};
    if (!livestream_id) return res.status(400).json({ error: 'Missing fields' });
    const sb = adminClient();
    await sb.from('livestreams').update({ status: 'ended' }).eq('id', livestream_id);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
