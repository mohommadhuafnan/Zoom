import { useRef, useCallback, useEffect, useState } from 'react';
import { getSocket } from '../services/socket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

/**
 * Mesh WebRTC hook — each peer connects directly to every other peer.
 * Structured so an SFU adapter can replace this later without changing UI components.
 */
export function useWebRTC({ meetingCode, localStream, enabled }) {
  const peersRef = useRef(new Map());
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const localStreamRef = useRef(localStream);

  useEffect(() => {
    localStreamRef.current = localStream;
    peersRef.current.forEach((pc, socketId) => {
      const senders = pc.getSenders();
      const videoTrack = localStream?.getVideoTracks()[0];
      const audioTrack = localStream?.getAudioTracks()[0];
      const videoSender = senders.find((s) => s.track?.kind === 'video');
      const audioSender = senders.find((s) => s.track?.kind === 'audio');
      if (videoSender && videoTrack) videoSender.replaceTrack(videoTrack).catch(() => {});
      else if (videoTrack) pc.addTrack(videoTrack, localStream);
      if (audioSender && audioTrack) audioSender.replaceTrack(audioTrack).catch(() => {});
      else if (audioTrack) pc.addTrack(audioTrack, localStream);
    });
  }, [localStream]);

  const updateRemoteStream = useCallback((socketId, stream) => {
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      if (stream) next.set(socketId, stream);
      else next.delete(socketId);
      return next;
    });
  }, []);

  const createPeerConnection = useCallback(
    (socketId, isInitiator) => {
      if (peersRef.current.has(socketId)) {
        return peersRef.current.get(socketId);
      }

      const socket = getSocket();
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current.set(socketId, pc);

      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream) updateRemoteStream(socketId, remoteStream);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc:ice-candidate', {
            to: socketId,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          pc.close();
          peersRef.current.delete(socketId);
          updateRemoteStream(socketId, null);
        }
      };

      if (isInitiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            socket.emit('webrtc:offer', { to: socketId, offer: pc.localDescription });
          })
          .catch(console.error);
      }

      return pc;
    },
    [updateRemoteStream]
  );

  const removePeer = useCallback(
    (socketId) => {
      const pc = peersRef.current.get(socketId);
      if (pc) {
        pc.close();
        peersRef.current.delete(socketId);
      }
      updateRemoteStream(socketId, null);
    },
    [updateRemoteStream]
  );

  useEffect(() => {
    if (!enabled || !meetingCode) return;

    const socket = getSocket();
    if (!socket) return;

    const onPeerJoined = ({ socketId }) => {
      createPeerConnection(socketId, true);
    };

    const onPeerLeft = ({ socketId }) => {
      removePeer(socketId);
    };

    const onOffer = async ({ from, offer }) => {
      const pc = createPeerConnection(from, false);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc:answer', { to: from, answer: pc.localDescription });
    };

    const onAnswer = async ({ from, answer }) => {
      const pc = peersRef.current.get(from);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const onIceCandidate = async ({ from, candidate }) => {
      const pc = peersRef.current.get(from);
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }
    };

    socket.on('peer:joined', onPeerJoined);
    socket.on('peer:left', onPeerLeft);
    socket.on('webrtc:offer', onOffer);
    socket.on('webrtc:answer', onAnswer);
    socket.on('webrtc:ice-candidate', onIceCandidate);

    return () => {
      socket.off('peer:joined', onPeerJoined);
      socket.off('peer:left', onPeerLeft);
      socket.off('webrtc:offer', onOffer);
      socket.off('webrtc:answer', onAnswer);
      socket.off('webrtc:ice-candidate', onIceCandidate);
    };
  }, [enabled, meetingCode, createPeerConnection, removePeer]);

  const connectToExistingPeers = useCallback(
    (peerSocketIds) => {
      peerSocketIds.forEach((socketId) => createPeerConnection(socketId, true));
    },
    [createPeerConnection]
  );

  const cleanup = useCallback(() => {
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    setRemoteStreams(new Map());
  }, []);

  return { remoteStreams, connectToExistingPeers, cleanup, removePeer };
}
