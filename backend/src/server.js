import { createServer } from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { setupSocket } from './socket/index.js';
import { env } from './config/env.js';

const app = createApp();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.clientUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setupSocket(io);

httpServer.listen(env.port, () => {
  console.log(`UniMeet backend running on http://localhost:${env.port}`);
  console.log(`Signaling server ready (Socket.io)`);
  console.log(`CORS allowed for ${env.clientUrl}`);
});

export { io };
