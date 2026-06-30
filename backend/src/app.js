import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import meetingRoutes from './routes/meetings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');

function attachFrontend(app) {
  const staticDir = [path.join(backendRoot, 'public'), path.join(backendRoot, '..', 'frontend', 'dist')].find(
    (dir) => fs.existsSync(path.join(dir, 'index.html'))
  );
  if (!staticDir) return;

  app.use(express.static(staticDir, { index: false }));
  app.get(/^(?!\/api)(?!\/socket\.io).*/, (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (origin === env.clientUrl) return callback(null, true);
        if (/\.vercel\.app$/i.test(origin)) return callback(null, true);
        return callback(null, env.clientUrl);
      },
      credentials: true,
    })
  );
  app.use(express.json());

  const api = express.Router();

  api.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: env.nodeEnv,
      supabase: Boolean(env.supabase.url && env.supabase.secretKey),
    });
  });

  api.use('/auth', authRoutes);
  api.use('/meetings', meetingRoutes);

  // Mount at /api (local) and / (Vercel backend service may strip /api prefix)
  app.use('/api', api);
  app.use(api);

  attachFrontend(app);

  app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
    });
  });

  return app;
}
