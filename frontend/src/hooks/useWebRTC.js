import { useRef, useCallback, useEffect, useState } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useWebRTC({ localStream, enabled, signaling }) {
  const peersRef = useRef(new Map());
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const localStreamRef = useRef(localStream);
  const signalingRef = useRef(signaling);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    signalingRef.current = signaling;
  }, [signaling]);

  const updateRemoteStream = useCallback((peerId, stream) => {
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      if (stream) next.set(peerId, stream);
      else next.delete(peerId);
      return next;
    });
  }, []);

  const renegotiatePeer = useCallback(async (pc, peerId) => {
    if (!pc || pc.signalingState === 'closed') return;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signalingRef.current?.sendSignal('offer', { to: peerId, offer: pc.localDescription });
    } catch (err) {
      console.error('WebRTC renegotiation failed:', err);
    }
  }, []);

  const syncLocalTracks = useCallback(
    async (pc, peerId, stream) => {
      if (!stream) return false;
      let needsRenegotiate = false;
      const senders = pc.getSenders();
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      const videoSender = senders.find((s) => s.track?.kind === 'video');
      const audioSender = senders.find((s) => s.track?.kind === 'audio');

      if (videoTrack) {
        if (videoSender) {
          await videoSender.replaceTrack(videoTrack).catch(() => {});
        } else {
          pc.addTrack(videoTrack, stream);
          needsRenegotiate = true;
        }
      } else if (videoSender) {
        await videoSender.replaceTrack(null).catch(() => {});
      }

      if (audioTrack) {
        if (audioSender) {
          await audioSender.replaceTrack(audioTrack).catch(() => {});
        } else {
          pc.addTrack(audioTrack, stream);
          needsRenegotiate = true;
        }
      } else if (audioSender) {
        await audioSender.replaceTrack(null).catch(() => {});
      }

      if (needsRenegotiate) await renegotiatePeer(pc, peerId);
      return needsRenegotiate;
    },
    [renegotiatePeer]
  );

  useEffect(() => {
    if (!enabled) return;
    peersRef.current.forEach((pc, peerId) => {
      syncLocalTracks(pc, peerId, localStreamRef.current);
    });
  }, [localStream, enabled, syncLocalTracks]);

  const createPeerConnection = useCallback(
    (peerId, isInitiator) => {
      if (peersRef.current.has(peerId)) {
        return peersRef.current.get(peerId);
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current.set(peerId, pc);

      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream) updateRemoteStream(peerId, remoteStream);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && signalingRef.current) {
          signalingRef.current.sendSignal('ice', {
            to: peerId,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          pc.close();
          peersRef.current.delete(peerId);
          updateRemoteStream(peerId, null);
        }
      };

      if (isInitiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            signalingRef.current?.sendSignal('offer', {
              to: peerId,
              offer: pc.localDescription,
            });
          })
          .catch(console.error);
      }

      return pc;
    },
    [updateRemoteStream]
  );

  const removePeer = useCallback(
    (peerId) => {
      const pc = peersRef.current.get(peerId);
      if (pc) {
        pc.close();
        peersRef.current.delete(peerId);
      }
      updateRemoteStream(peerId, null);
    },
    [updateRemoteStream]
  );

  const handleSignal = useCallback(
    async (payload) => {
      const { type, from, offer, answer, candidate } = payload;
      if (!from) return;

      if (type === 'offer' && offer) {
        let pc = peersRef.current.get(from);
        const isNew = !pc;
        if (!pc) pc = createPeerConnection(from, false);

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const ans = await pc.createAnswer();
        await pc.setLocalDescription(ans);
        signalingRef.current?.sendSignal('answer', { to: from, answer: pc.localDescription });

        if (isNew) {
          await syncLocalTracks(pc, from, localStreamRef.current);
        }
      } else if (type === 'answer' && answer) {
        const pc = peersRef.current.get(from);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          } catch {
            /* ignore stale signaling */
          }
        }
      } else if (type === 'ice' && candidate) {
        const pc = peersRef.current.get(from);
        if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }
    },
    [createPeerConnection, syncLocalTracks]
  );

  const connectToExistingPeers = useCallback(
    (peerIds) => {
      peerIds.forEach((peerId) => {
        if (peerId) createPeerConnection(peerId, true);
      });
    },
    [createPeerConnection]
  );

  const cleanup = useCallback(() => {
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    setRemoteStreams(new Map());
  }, []);

  return {
    remoteStreams,
    connectToExistingPeers,
    cleanup,
    removePeer,
    handleSignal,
    onPeerJoined: () => {},
  };
}
