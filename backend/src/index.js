import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import meetingRoutes from './routes/meetings.js';
import { setupSocket } from './socket/index.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.clientUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);

setupSocket(io);

httpServer.listen(env.port, () => {
  console.log(`UniMeet backend running on http://localhost:${env.port}`);
  console.log(`Signaling server ready (Socket.io)`);
  console.log(`CORS allowed for ${env.clientUrl}`);
});

export { io };
