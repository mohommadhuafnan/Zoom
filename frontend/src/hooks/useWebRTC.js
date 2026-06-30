import { useRef, useCallback, useEffect, useState } from 'react';
import { getIceServers } from '../config/iceServers.js';

function shouldInitiate(myPeerId, peerId) {
  if (!myPeerId || !peerId) return false;
  return String(myPeerId).localeCompare(String(peerId)) < 0;
}

export function useWebRTC({ localStream, enabled, signaling, myPeerId }) {
  const peersRef = useRef(new Map());
  const remoteStreamsRef = useRef(new Map());
  const pendingCandidatesRef = useRef(new Map());
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

  const flushPendingCandidates = useCallback(async (peerId, pc) => {
    const queued = pendingCandidatesRef.current.get(peerId) || [];
    pendingCandidatesRef.current.delete(peerId);
    for (const candidate of queued) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    }
  }, []);

  const renegotiatePeer = useCallback(async (pc, peerId) => {
    if (!pc || pc.signalingState === 'closed') return;
    const sig = getSignaling();
    if (!sig) return;
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      sig.sendSignal('offer', { to: peerId, offer: pc.localDescription });
    } catch (err) {
      console.error('WebRTC renegotiation failed:', err);
    }
  }, []);

  const addLocalTracksToPc = useCallback((pc, stream) => {
    if (!stream?.getTracks().length) {
      if (pc.getTransceivers().length === 0) {
        pc.addTransceiver('audio', { direction: 'recvonly' });
        pc.addTransceiver('video', { direction: 'recvonly' });
      }
      return;
    }

    const senders = pc.getSenders();
    for (const track of stream.getTracks()) {
      const sender = senders.find((s) => s.track?.kind === track.kind);
      if (sender) sender.replaceTrack(track).catch(() => {});
      else pc.addTrack(track, stream);
    }
  }, []);

  const syncLocalTracks = useCallback(
    async (pc, peerId, stream) => {
      if (!stream) return false;
      let needsRenegotiate = false;
      const senders = pc.getSenders();
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      if (videoTrack) {
        const vs = senders.find((s) => s.track?.kind === 'video');
        if (vs) await vs.replaceTrack(videoTrack).catch(() => {});
        else {
          pc.addTrack(videoTrack, stream);
          needsRenegotiate = true;
        }
      }

      if (audioTrack) {
        const as = senders.find((s) => s.track?.kind === 'audio');
        if (as) await as.replaceTrack(audioTrack).catch(() => {});
        else {
          pc.addTrack(audioTrack, stream);
          needsRenegotiate = true;
        }
      }

      if (needsRenegotiate && pc.signalingState === 'stable') {
        await renegotiatePeer(pc, peerId);
      }
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
      stream
        .getTracks()
        .filter((t) => t.kind === track.kind)
        .forEach((t) => stream.removeTrack(t));
      stream.addTrack(track);
      track.onended = () => {
        stream.removeTrack(track);
        updateRemoteStream(
          peerId,
          stream.getTracks().length ? new MediaStream(stream.getTracks()) : null
        );
      };
      updateRemoteStream(peerId, new MediaStream(stream.getTracks()));
    },
    [updateRemoteStream]
  );

  const createPeerConnection = useCallback(
    (peerId, isInitiator, sigOverride, streamOverride) => {
      if (peersRef.current.has(peerId)) {
        return peersRef.current.get(peerId);
      }

      const sig = sigOverride || getSignaling();
      const pc = new RTCPeerConnection(getIceServers());
      peersRef.current.set(peerId, pc);

      const stream = streamOverride || localStreamRef.current;
      addLocalTracksToPc(pc, stream);

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
          peersRef.current.delete(peerId);
          updateRemoteStream(peerId, null);
        }
      };

      if (isInitiator && sig) {
        pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
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
    [addLocalTracksToPc, attachRemoteTrack, updateRemoteStream, renegotiatePeer]
  );

  const removePeer = useCallback(
    (peerId) => {
      const pc = peersRef.current.get(peerId);
      if (pc) {
        pc.close();
        peersRef.current.delete(peerId);
      }
      pendingCandidatesRef.current.delete(peerId);
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
        if (!pc) pc = createPeerConnection(from, false);

        if (pc.signalingState === 'have-local-offer') {
          await pc.setLocalDescription({ type: 'rollback' });
        }

        await syncLocalTracks(pc, from, localStreamRef.current);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await flushPendingCandidates(from, pc);

        const ans = await pc.createAnswer();
        await pc.setLocalDescription(ans);
        getSignaling()?.sendSignal('answer', { to: from, answer: pc.localDescription });
      } else if (type === 'answer' && answer) {
        const pc = peersRef.current.get(from);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            await flushPendingCandidates(from, pc);
          } catch {
            /* stale signaling */
          }
        }
      } else if (type === 'ice' && candidate) {
        const pc = peersRef.current.get(from);
        if (!pc?.remoteDescription) {
          const q = pendingCandidatesRef.current.get(from) || [];
          q.push(candidate);
          pendingCandidatesRef.current.set(from, q);
          return;
        }
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }
    },
    [createPeerConnection, syncLocalTracks, flushPendingCandidates]
  );

  const ensurePeerConnections = useCallback(
    (peerIds, sigOverride, streamOverride) => {
      if (sigOverride) signalingRef.current = sigOverride;
      const sig = sigOverride || getSignaling();
      if (!sig) return;

      const stream = streamOverride || localStreamRef.current;
      if (streamOverride) localStreamRef.current = streamOverride;

      (peerIds || []).forEach((peerId) => {
        if (!peerId || peerId === myPeerIdRef.current) return;
        if (peersRef.current.has(peerId)) return;
        const initiator = shouldInitiate(myPeerIdRef.current, peerId);
        createPeerConnection(peerId, initiator, sig, stream);
      });
    },
    [createPeerConnection]
  );

  const connectToExistingPeers = useCallback(
    (peerIds, sigOverride, streamOverride) => {
      ensurePeerConnections(peerIds, sigOverride, streamOverride);
    },
    [ensurePeerConnections]
  );

  const cleanup = useCallback(() => {
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    remoteStreamsRef.current.clear();
    pendingCandidatesRef.current.clear();
    setRemoteStreams(new Map());
  }, []);

  return {
    remoteStreams,
    connectToExistingPeers,
    ensurePeerConnections,
    cleanup,
    removePeer,
    handleSignal,
  };
}
