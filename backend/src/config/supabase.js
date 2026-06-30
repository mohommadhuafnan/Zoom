import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

let supabaseClient = null;

export function getSupabase() {
  if (!supabaseClient) {
    const { url, secretKey } = env.supabase;
    if (!url || !secretKey) {
      throw new Error(
        'Missing SUPABASE_URL or SUPABASE_SECRET_KEY — add them in Vercel Environment Variables'
      );
    }
    supabaseClient = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabaseClient;
}

/** @deprecated use getSupabase() */
export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      return getSupabase()[prop];
    },
  }
);

function throwIfError(error, fallbackMessage) {
  if (!error) return;
  const err = new Error(error.message || fallbackMessage);
  err.status = error.code === '23505' ? 409 : 500;
  throw err;
}

export { throwIfError };
