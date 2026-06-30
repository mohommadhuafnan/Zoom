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

  attachSocketHandlers(socket);
  return socket;
}

export function connectSocketAsGuest(displayName, guestId) {
  if (socket?.connected) return socket;

  socket = io(getSocketUrl(), {
    auth: { guestName: displayName, guestId },
    transports: ['websocket', 'polling'],
  });

  attachSocketHandlers(socket);
  return socket;
}

function attachSocketHandlers(sock) {
  sock.off('connect');
  sock.off('connect_error');
  sock.on('connect', () => {
    console.log('Connected to signaling server');
  });
  sock.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
