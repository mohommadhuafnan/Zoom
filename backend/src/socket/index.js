import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import {
  getMeetingByCode,
  logParticipationJoin,
  logParticipationLeave,
  saveChatMessage,
  endMeeting,
} from '../services/meetingService.js';
import { getUserById } from '../services/authService.js';

/** @type {Map<string, Map<string, ParticipantState>>} roomCode -> socketId -> state */
const rooms = new Map();

/** @type {Map<string, string>} socketId -> participationId (for DB logging) */
const participationMap = new Map();

function getRoom(roomCode) {
  if (!rooms.has(roomCode)) rooms.set(roomCode, new Map());
  return rooms.get(roomCode);
}

function broadcastParticipants(io, roomCode) {
  const room = getRoom(roomCode);
  const list = Array.from(room.values());
  io.to(roomCode).emit('participants:update', list);
}

export function setupSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const guestName = socket.handshake.auth?.guestName?.trim();
      const guestId = socket.handshake.auth?.guestId;

      if (token) {
        const decoded = jwt.verify(token, env.jwtSecret);
        const user = await getUserById(decoded.userId);
        if (!user) return next(new Error('User not found'));
        socket.user = user;
        return next();
      }

      if (guestName && guestId) {
        if (guestName.length < 2 || guestName.length > 40) {
          return next(new Error('Display name must be 2–40 characters'));
        }
        socket.user = {
          id: `guest_${guestId}`,
          displayName: guestName,
          isGuest: true,
        };
        return next();
      }

      return next(new Error('Authentication required'));
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (${socket.user.displayName})`);

    socket.on('room:join', async ({ meetingCode }, callback) => {
      try {
        const meeting = await getMeetingByCode(meetingCode);
        if (!meeting) {
          return callback?.({ error: 'Meeting not found' });
        }
        if (meeting.endedAt) {
          return callback?.({ error: 'This meeting has ended' });
        }

        const isHost = meeting.hostId === socket.user.id;
        if (!meeting.isActive && !isHost) {
          return callback?.({
            error: 'The host has not started the meeting yet',
            waitingForHost: true,
          });
        }
        const room = getRoom(meetingCode);

        if (meeting.waitingRoom && !isHost) {
          socket.join(`${meetingCode}:waiting`);
          socket.emit('waiting-room:joined', { meetingCode, meetingTitle: meeting.title });
          io.to(meeting.hostId).emit('waiting-room:participant', {
            socketId: socket.id,
            user: socket.user,
            meetingCode,
          });
          return callback?.({ waiting: true, meeting });
        }

        await joinRoom(socket, io, meeting, isHost);
        callback?.({ success: true, meeting, isHost });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    socket.on('waiting-room:admit', async ({ socketId, meetingCode }) => {
      const meeting = await getMeetingByCode(meetingCode);
      if (!meeting || meeting.hostId !== socket.user.id) return;

      const waitingSocket = io.sockets.sockets.get(socketId);
      if (!waitingSocket) return;

      waitingSocket.leave(`${meetingCode}:waiting`);
      await joinRoom(waitingSocket, io, meeting, false);
      waitingSocket.emit('waiting-room:admitted');
    });

    socket.on('waiting-room:deny', ({ socketId, meetingCode }) => {
      getMeetingByCode(meetingCode).then((meeting) => {
        if (!meeting || meeting.hostId !== socket.user.id) return;
        const waitingSocket = io.sockets.sockets.get(socketId);
        waitingSocket?.emit('waiting-room:denied');
        waitingSocket?.disconnect();
      });
    });

    // WebRTC signaling — SDP & ICE only, no media
    socket.on('webrtc:offer', ({ to, offer }) => {
      io.to(to).emit('webrtc:offer', { from: socket.id, offer });
    });

    socket.on('webrtc:answer', ({ to, answer }) => {
      io.to(to).emit('webrtc:answer', { from: socket.id, answer });
    });

    socket.on('webrtc:ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('webrtc:ice-candidate', { from: socket.id, candidate });
    });

    socket.on('media:state', ({ audioMuted, videoOff, screenSharing }) => {
      const roomCode = socket.roomCode;
      if (!roomCode) return;
      const room = getRoom(roomCode);
      const participant = room.get(socket.id);
      if (participant) {
        participant.audioMuted = audioMuted;
        participant.videoOff = videoOff;
        participant.screenSharing = screenSharing;
        broadcastParticipants(io, roomCode);
      }
    });

    socket.on('chat:message', async ({ content }) => {
      const roomCode = socket.roomCode;
      if (!roomCode || !content?.trim()) return;

      const meeting = await getMeetingByCode(roomCode);
      if (!meeting) return;

      const msg = await saveChatMessage({
        meetingId: meeting.id,
        senderId: socket.user.id,
        senderName: socket.user.displayName,
        content: content.trim(),
      });

      io.to(roomCode).emit('chat:message', {
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        content: msg.content,
        createdAt: msg.createdAt,
      });
    });

    socket.on('host:mute-participant', ({ targetSocketId }) => {
      io.to(targetSocketId).emit('host:force-mute');
    });

    socket.on('host:remove-participant', ({ targetSocketId }) => {
      const target = io.sockets.sockets.get(targetSocketId);
      target?.emit('host:removed');
      target?.disconnect(true);
    });

    socket.on('host:end-meeting', async () => {
      const roomCode = socket.roomCode;
      if (!roomCode) return;
      const meeting = await getMeetingByCode(roomCode);
      if (!meeting || meeting.hostId !== socket.user.id) return;

      await endMeeting(meeting.id, socket.user.id);
      io.to(roomCode).emit('meeting:ended');
      const room = getRoom(roomCode);
      for (const sid of room.keys()) {
        io.sockets.sockets.get(sid)?.disconnect(true);
      }
      rooms.delete(roomCode);
    });

    socket.on('disconnect', async () => {
      const roomCode = socket.roomCode;
      if (roomCode) {
        const room = getRoom(roomCode);
        room.delete(socket.id);

        const participationId = participationMap.get(socket.id);
        if (participationId) {
          await logParticipationLeave(participationId).catch(() => {});
          participationMap.delete(socket.id);
        }

        socket.to(roomCode).emit('peer:left', { socketId: socket.id });
        broadcastParticipants(io, roomCode);

        if (room.size === 0) rooms.delete(roomCode);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

async function joinRoom(socket, io, meeting, isHost) {
  const roomCode = meeting.meetingCode;
  socket.join(roomCode);
  socket.roomCode = roomCode;
  if (isHost) socket.join(meeting.hostId);

  if (!socket.user.isGuest) {
    const participation = await logParticipationJoin({
      meetingId: meeting.id,
      userId: socket.user.id,
      role: isHost ? 'host' : 'participant',
    });
    participationMap.set(socket.id, participation.id);
  }

  const room = getRoom(roomCode);
  const state = {
    socketId: socket.id,
    userId: socket.user.id,
    displayName: socket.user.displayName,
    isHost,
    audioMuted: false,
    videoOff: false,
    screenSharing: false,
  };
  room.set(socket.id, state);

  const existingPeers = Array.from(room.keys()).filter((id) => id !== socket.id);
  socket.emit('room:joined', { participants: Array.from(room.values()), existingPeers });
  socket.to(roomCode).emit('peer:joined', state);
  broadcastParticipants(io, roomCode);
}
