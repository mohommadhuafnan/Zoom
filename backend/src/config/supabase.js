import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { env } from './env.js';

let supabaseClient = null;

export function getSupabase() {
  if (!supabaseClient) {
    const { url, secretKey } = env.supabase;
    if (!url || !secretKey) {
      const missing = [!url && 'SUPABASE_URL', !secretKey && 'SUPABASE_SECRET_KEY'].filter(Boolean).join(', ');
      throw new Error(
        `Missing ${missing} — add them in Vercel → Settings → Environment Variables (Production + Preview)`
      );
    }
    supabaseClient = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { transport: ws },
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
