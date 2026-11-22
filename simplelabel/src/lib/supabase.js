import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oqigkuywngvhzrisjkuo.supabase.co';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const localUrl = localStorage.getItem('simplelabel_supabase_url') || '';
const localKey = localStorage.getItem('simplelabel_supabase_anon_key') || '';

export const SUPABASE_URL = localUrl || envUrl;
export const SUPABASE_ANON_KEY = localKey || envKey;

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  SUPABASE_URL.startsWith('http')
);

export const supabase = isSupabaseConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export function saveSupabaseConfig(url, key) {
  if (url) localStorage.setItem('simplelabel_supabase_url', url.trim());
  if (key) localStorage.setItem('simplelabel_supabase_anon_key', key.trim());
  window.location.reload();
}

export function resetSupabaseConfig() {
  localStorage.removeItem('simplelabel_supabase_url');
  localStorage.removeItem('simplelabel_supabase_anon_key');
  window.location.reload();
}
