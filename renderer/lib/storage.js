import { supabase, HAS_SUPABASE } from './supabase';

export async function uploadFile(bucket, file) {
  if (!HAS_SUPABASE) return { path: '#mock', url: '#', name: file.name };
  const path = `${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, url: pub.publicUrl, name: file.name };
}

export function publicUrl(bucket, path) {
  if (!HAS_SUPABASE || !path) return path || '#';
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
