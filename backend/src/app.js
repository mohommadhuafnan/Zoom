import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import meetingRoutes from './routes/meetings.js';
import appRoutes from './routes/app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDesktop = process.env.DESKTOP_MODE === 'true';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (origin === env.clientUrl) return callback(null, true);
        if (isDesktop && /^http:\/\/localhost(:\d+)?$/i.test(origin)) {
          return callback(null, true);
        }
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
      desktop: isDesktop,
      publicAppUrl: env.publicAppUrl,
      supabase: Boolean(env.supabase.url && env.supabase.secretKey),
    });
  });

  api.use('/auth', authRoutes);
  api.use('/meetings', meetingRoutes);
  api.use('/app', appRoutes);

  app.use('/api', api);
  app.use(api);

  if (isDesktop) {
    const publicDir = path.join(__dirname, '../public');
    app.use(express.static(publicDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/health') return next();
      res.sendFile(path.join(publicDir, 'index.html'), (err) => {
        if (err) next(err);
      });
    });
  }

  app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
    });
  });

  return app;
}
