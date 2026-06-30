import { useRef, useCallback, useEffect, useState } from 'react';
import { getIceServers } from '../config/iceServers.js';

export function useWebRTC({ localStream, enabled, signaling, myPeerId }) {
  const peersRef = useRef(new Map());
  const remoteStreamsRef = useRef(new Map());
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const localStreamRef = useRef(localStream);
  const signalingRef = useRef(signaling);
  const myPeerIdRef = useRef(myPeerId);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    signalingRef.current = signaling;
  }, [signaling]);

  useEffect(() => {
    myPeerIdRef.current = myPeerId;
  }, [myPeerId]);

  const updateRemoteStream = useCallback((peerId, stream) => {
    if (stream) remoteStreamsRef.current.set(peerId, stream);
    else remoteStreamsRef.current.delete(peerId);
    setRemoteStreams(new Map(remoteStreamsRef.current));
  }, []);

  const getSignaling = () => signalingRef.current;

  const renegotiatePeer = useCallback(async (pc, peerId) => {
    if (!pc || pc.signalingState === 'closed') return;
    const sig = getSignaling();
    if (!sig) return;
    try {
      const offer = await pc.createOffer({ iceRestart: false });
      await pc.setLocalDescription(offer);
      sig.sendSignal('offer', { to: peerId, offer: pc.localDescription });
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

  const attachRemoteTrack = useCallback(
    (peerId, track) => {
      let stream = remoteStreamsRef.current.get(peerId);
      if (!stream) {
        stream = new MediaStream();
        remoteStreamsRef.current.set(peerId, stream);
      }
      stream.getTracks()
        .filter((t) => t.kind === track.kind)
        .forEach((t) => stream.removeTrack(t));
      stream.addTrack(track);
      track.onended = () => {
        stream.removeTrack(track);
        updateRemoteStream(peerId, stream.getTracks().length ? new MediaStream(stream.getTracks()) : null);
      };
      updateRemoteStream(peerId, new MediaStream(stream.getTracks()));
    },
    [updateRemoteStream]
  );

  const createPeerConnection = useCallback(
    (peerId, isInitiator, sigOverride) => {
      if (peersRef.current.has(peerId)) {
        return peersRef.current.get(peerId);
      }

      const sig = sigOverride || getSignaling();
      const pc = new RTCPeerConnection(getIceServers());
      peersRef.current.set(peerId, pc);

      const stream = localStreamRef.current;
      if (stream?.getTracks().length) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      } else {
        pc.addTransceiver('audio', { direction: 'recvonly' });
        pc.addTransceiver('video', { direction: 'recvonly' });
      }

      pc.ontrack = (event) => {
        if (event.track) attachRemoteTrack(peerId, event.track);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && sig) {
          sig.sendSignal('ice', {
            to: peerId,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed') {
          pc.restartIce?.();
          renegotiatePeer(pc, peerId);
        } else if (pc.connectionState === 'closed') {
          pc.close();
          peersRef.current.delete(peerId);
          updateRemoteStream(peerId, null);
        }
      };

      if (isInitiator && sig) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            sig.sendSignal('offer', {
              to: peerId,
              offer: pc.localDescription,
            });
          })
          .catch(console.error);
      }

      return pc;
    },
    [attachRemoteTrack, updateRemoteStream, renegotiatePeer]
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
      if (!from || from === myPeerIdRef.current) return;

      if (type === 'offer' && offer) {
        let pc = peersRef.current.get(from);
        const isNew = !pc;
        if (!pc) pc = createPeerConnection(from, false);

        if (pc.signalingState === 'have-local-offer') {
          await pc.setLocalDescription({ type: 'rollback' });
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const ans = await pc.createAnswer();
        await pc.setLocalDescription(ans);
        getSignaling()?.sendSignal('answer', { to: from, answer: pc.localDescription });

        if (isNew) {
          await syncLocalTracks(pc, from, localStreamRef.current);
        }
      } else if (type === 'answer' && answer) {
        const pc = peersRef.current.get(from);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          } catch {
            /* stale signaling */
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
    (peerIds, sigOverride) => {
      if (sigOverride) signalingRef.current = sigOverride;
      (peerIds || []).forEach((peerId) => {
        if (peerId && peerId !== myPeerIdRef.current) {
          createPeerConnection(peerId, true, sigOverride || getSignaling());
        }
      });
    },
    [createPeerConnection]
  );

  const cleanup = useCallback(() => {
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    remoteStreamsRef.current.clear();
    setRemoteStreams(new Map());
  }, []);

  return {
    remoteStreams,
    connectToExistingPeers,
    cleanup,
    removePeer,
    handleSignal,
  };
}
