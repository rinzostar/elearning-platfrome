import { createClient } from '@supabase/supabase-js';

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iqzhyvggnulolrwpdfxr.supabase.co/").replace(/\/$/, '');
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlxemh5dmdnbnVsb2xyd3BkZnhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTg4ODMsImV4cCI6MjA5MjI3NDg4M30.ZTs2-hv0crgKdD3LAnDryq7-xOdMPeD-JDsko7bsfZs";

export const HAS_SUPABASE = Boolean(url && anon);

export const supabase = HAS_SUPABASE
  ? createClient(url, anon, { auth: { persistSession: true } })
  : null;

// server-only client (do NOT import from client components)
export function adminClient() {
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) throw new Error('Missing Supabase env vars');
  return createClient(url, service, { auth: { persistSession: false } });
}
