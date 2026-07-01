import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_PUBLIC_URL = 'https://zoom-xi-ten.vercel.app';

function resolvePublicAppUrl() {
  const candidates = [process.env.PUBLIC_APP_URL, process.env.CLIENT_URL];
  for (const raw of candidates) {
    if (raw && !/^http:\/\/localhost(:\d+)?$/i.test(raw.trim())) {
      return raw.replace(/\/$/, '');
    }
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  }
  return DEFAULT_PUBLIC_URL;
}

function resolveClientUrl() {
  if (process.env.DESKTOP_MODE === 'true') {
    return process.env.CLIENT_URL || `http://localhost:${process.env.PORT || '5123'}`;
  }
  if (process.env.CLIENT_URL) return process.env.CLIENT_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  return 'http://localhost:5173';
}

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: resolveClientUrl(),
  publicAppUrl: resolvePublicAppUrl(),
  storagePath: process.env.STORAGE_PATH || './uploads',
  supabase: {
    url: process.env.SUPABASE_URL,
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
    secretKey: process.env.SUPABASE_SECRET_KEY,
    jwksUrl: process.env.SUPABASE_JWKS_URL,
  },
};