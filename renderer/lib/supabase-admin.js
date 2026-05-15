// Server-only admin client - DO NOT import in client components
import { createClient } from '@supabase/supabase-js';

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iqzhyvggnulolrwpdfxr.supabase.co/").replace(/\/$/, '');
const ws = require('ws');

export function adminClient() {
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) throw new Error('Missing Supabase env vars');
  return createClient(url, service, { 
    auth: { persistSession: false },
    realtime: { transport: ws }
  });
}