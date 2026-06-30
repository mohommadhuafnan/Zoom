import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import meetingRoutes from './routes/meetings.js';

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
    });
  });

  api.use('/auth', authRoutes);
  api.use('/meetings', meetingRoutes);

  // Mount at /api (local) and / (Vercel backend service may strip /api prefix)
  app.use('/api', api);
  app.use(api);

  app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
    });
  });

  return app;
}
