import { io } from 'socket.io-client';

function getSocketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (import.meta.env.PROD && typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:5000';
}

let socket = null;

export function getSocket() {
  return socket;
}

export function connectSocket(token) {
  if (socket?.connected) return socket;

  socket = io(getSocketUrl(), {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Connected to signaling server');
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
