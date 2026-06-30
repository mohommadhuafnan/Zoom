import { supabase, supabaseConfigured } from '../lib/supabase.js';
import { dedupeParticipants } from '../utils/mediaUtils.js';
import { getSocket, connectSocket, connectSocketAsGuest } from './socket.js';

function mapPresenceToParticipant(presence) {
  return {
    peerId: presence.peerId,
    socketId: presence.peerId,
    displayName: presence.displayName,
    isHost: !!presence.isHost,
    audioMuted: !!presence.audioMuted,
    videoOff: !!presence.videoOff,
    screenSharing: !!presence.screenSharing,
  };
}

function removeRealtimeChannel(channelName) {
  const topic = `realtime:${channelName}`;
  for (const ch of supabase.getChannels()) {
    if (ch.topic === topic) {
      supabase.removeChannel(ch);
    }
  }
}

function connectSocketSignaling({ meetingCode, peerId, displayName, token, guestName, guestId, handlers }) {
  if (token) connectSocket(token);
  else connectSocketAsGuest(guestName || displayName, guestId || peerId);

  const socket = getSocket();
  if (!socket) throw new Error('Could not connect to signaling server');

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Connection timed out')), 20000);

    const onConnect = () => {
      clearTimeout(timeout);
      socket.off('connect_error', onError);

      socket.on('room:joined', ({ participants, existingPeers }) => {
        handlers.onParticipants?.(dedupeParticipants(participants));
        handlers.onExistingPeers?.(existingPeers);
      });
      socket.on('peer:joined', (peer) => handlers.onPeerJoined?.(peer));
      socket.on('peer:left', ({ socketId }) => handlers.onPeerLeft?.({ peerId: socketId }));
      socket.on('participants:update', (list) => handlers.onParticipants?.(dedupeParticipants(list)));
      socket.on('webrtc:offer', (p) => handlers.onSignal?.({ type: 'offer', ...p }));
      socket.on('webrtc:answer', (p) => handlers.onSignal?.({ type: 'answer', ...p }));
      socket.on('webrtc:ice-candidate', (p) => handlers.onSignal?.({ type: 'ice', ...p }));
      socket.on('chat:message', (msg) => handlers.onChat?.(msg));
      socket.on('waiting-room:admitted', () => handlers.onAdmitted?.());
      socket.on('waiting-room:denied', () => handlers.onDenied?.());
      socket.on('meeting:ended', () => handlers.onMeetingEnded?.());
      socket.on('host:force-mute', () => handlers.onForceMute?.());
      socket.on('host:removed', () => handlers.onRemoved?.());

      socket.emit('room:join', { meetingCode }, (response) => {
        if (response?.error) {
          reject(new Error(response.error));
          return;
        }
        if (response?.waiting) {
          handlers.onWaiting?.(response.meeting);
          resolve({ mode: 'socket', waiting: true, meeting: response.meeting, isHost: false });
          return;
        }
        resolve({
          mode: 'socket',
          waiting: false,
          meeting: response.meeting,
          isHost: response.isHost,
        });
      });
    };

    const onError = (err) => {
      clearTimeout(timeout);
      reject(new Error(err.message || 'Connection failed'));
    };

    if (socket.connected) onConnect();
    else {
      socket.once('connect', onConnect);
      socket.once('connect_error', onError);
    }
  }).then((result) => ({
    ...result,
    peerId: socket.id,
    sendSignal(type, payload) {
      const map = {
        offer: 'webrtc:offer',
        answer: 'webrtc:answer',
        ice: 'webrtc:ice-candidate',
      };
      const event = map[type];
      if (!event) return;
      if (type === 'ice') socket.emit(event, { to: payload.to, candidate: payload.candidate });
      else socket.emit(event, { to: payload.to, [type]: payload[type] });
    },
    sendChat(content) {
      socket.emit('chat:message', { content });
    },
    updateMediaState(state) {
      socket.emit('media:state', state);
    },
    endMeeting() {
      socket.emit('host:end-meeting');
    },
    muteParticipant(targetPeerId) {
      socket.emit('host:mute-participant', { targetSocketId: targetPeerId });
    },
    removeParticipant(targetPeerId) {
      socket.emit('host:remove-participant', { targetSocketId: targetPeerId });
    },
    leave() {
      socket.disconnect();
    },
  }));
}

function connectSupabaseSignaling({ meetingCode, peerId, displayName, isHost, handlers }) {
  const channelName = `meeting:${meetingCode}`;
  removeRealtimeChannel(channelName);

  const channel = supabase.channel(channelName, {
    config: { presence: { key: peerId } },
  });

  let joined = false;
  let presencePayload = {
    peerId,
    displayName,
    isHost,
    audioMuted: true,
    videoOff: true,
    screenSharing: false,
  };

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const list = Object.values(state)
        .flat()
        .map(mapPresenceToParticipant);
      handlers.onParticipants?.(dedupeParticipants(list));
    })
    .on('presence', { event: 'join' }, ({ newPresences }) => {
      newPresences.forEach((p) => {
        const peer = mapPresenceToParticipant(p);
        if (peer.peerId !== peerId) handlers.onPeerJoined?.(peer);
      });
    })
    .on('presence', { event: 'leave' }, ({ leftPresences }) => {
      leftPresences.forEach((p) => {
        handlers.onPeerLeft?.({ peerId: p.peerId });
      });
    })
    .on('broadcast', { event: 'signal' }, ({ payload }) => {
      if (payload?.to && payload.to !== peerId) return;
      handlers.onSignal?.(payload);
    })
    .on('broadcast', { event: 'chat' }, ({ payload }) => {
      handlers.onChat?.(payload);
    })
    .on('broadcast', { event: 'meeting-ended' }, () => {
      handlers.onMeetingEnded?.();
    });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Realtime connection timed out')), 20000);

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timeout);
        await channel.track(presencePayload);
        joined = true;

        const state = channel.presenceState();
        const existingPeers = dedupeParticipants(
          Object.values(state)
            .flat()
            .map(mapPresenceToParticipant)
        )
          .map((p) => p.peerId)
          .filter((id) => id && id !== peerId);

        handlers.onExistingPeers?.(existingPeers);

        resolve({
          mode: 'supabase',
          waiting: false,
          isHost,
          peerId,
          sendSignal(type, payload) {
            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: { type, from: peerId, ...payload },
            });
          },
          sendChat(content) {
            channel.send({
              type: 'broadcast',
              event: 'chat',
              payload: {
                id: crypto.randomUUID(),
                senderId: peerId,
                senderName: displayName,
                content,
                createdAt: new Date().toISOString(),
              },
            });
          },
          updateMediaState(media) {
            presencePayload = {
              ...presencePayload,
              audioMuted: !!media.audioMuted,
              videoOff: !!media.videoOff,
              screenSharing: !!media.screenSharing,
            };
            channel.track(presencePayload);
          },
          endMeeting() {
            channel.send({ type: 'broadcast', event: 'meeting-ended', payload: {} });
          },
          muteParticipant() {},
          removeParticipant() {},
          async leave() {
            if (joined) await channel.untrack();
            supabase.removeChannel(channel);
          },
        });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(timeout);
        reject(new Error('Could not join meeting room'));
      }
    });
  });
}

export function useSupabaseSignaling() {
  return supabaseConfigured;
}

const WAIT_CHANNEL_PREFIX = 'meeting-wait:';

export function subscribeMeetingStarted(meetingCode, onStarted) {
  if (!supabaseConfigured) return () => {};
  const channelName = `${WAIT_CHANNEL_PREFIX}${meetingCode}`;
  removeRealtimeChannel(channelName);
  const channel = supabase.channel(channelName);
  channel.on('broadcast', { event: 'meeting-started' }, () => onStarted());
  channel.subscribe();
  return () => supabase.removeChannel(channel);
}

export async function broadcastMeetingStarted(meetingCode) {
  if (!supabaseConfigured) return;
  const channelName = `${WAIT_CHANNEL_PREFIX}${meetingCode}`;
  removeRealtimeChannel(channelName);
  const channel = supabase.channel(channelName);
  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, 2500);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'meeting-started',
          payload: { at: Date.now() },
        });
        clearTimeout(timeout);
        setTimeout(resolve, 150);
      }
    });
  });
  supabase.removeChannel(channel);
}

export function connectMeetingSignaling(options) {
  if (supabaseConfigured) {
    return connectSupabaseSignaling(options);
  }
  return connectSocketSignaling(options);
}
