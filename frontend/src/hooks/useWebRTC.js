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
  const makingOfferRef = useRef(new Map());
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

  const addLocalTracksToPc = useCallback(async (pc, stream) => {
    for (const kind of ['audio', 'video']) {
      const track = stream?.getTracks().find((t) => t.kind === kind) ?? null;
      let sender = pc.getSenders().find((s) => s.track?.kind === kind);
      if (!sender) {
        const tr = pc.addTransceiver(kind, { direction: 'sendrecv' });
        sender = tr.sender;
      } else {
        const tr = pc.getTransceivers().find((t) => t.sender === sender);
        if (tr && tr.direction !== 'sendrecv') tr.direction = 'sendrecv';
      }
      await sender.replaceTrack(track);
    }
  }, []);

  const sendOffer = useCallback(async (pc, peerId) => {
    if (!pc || pc.signalingState === 'closed') return;
    const sig = getSignaling();
    if (!sig) return;
    if (makingOfferRef.current.get(peerId)) return;
    makingOfferRef.current.set(peerId, true);
    try {
      await addLocalTracksToPc(pc, localStreamRef.current);
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      sig.sendSignal('offer', { to: peerId, offer: pc.localDescription });
    } catch (err) {
      console.error('WebRTC offer failed:', err);
    } finally {
      makingOfferRef.current.set(peerId, false);
    }
  }, [addLocalTracksToPc]);

  const renegotiatePeer = useCallback(
    async (pc, peerId) => {
      if (!pc || pc.signalingState !== 'stable') return;
      await sendOffer(pc, peerId);
    },
    [sendOffer]
  );

  const syncLocalTracks = useCallback(
    async (pc, peerId, stream) => {
      const beforeIds = new Set(
        pc.getSenders().map((s) => s.track?.id).filter(Boolean)
      );
      await addLocalTracksToPc(pc, stream);
      const afterTracks = pc.getSenders().map((s) => s.track).filter(Boolean);
      const addedTrack = afterTracks.some((t) => !beforeIds.has(t.id));
      if (addedTrack && pc.signalingState === 'stable' && pc.remoteDescription) {
        await renegotiatePeer(pc, peerId);
      }
      return addedTrack;
    },
    [addLocalTracksToPc, renegotiatePeer]
  );

  const lastLocalTracksKey = useRef('');

  useEffect(() => {
    if (!enabled) return;
    const key =
      localStream?.getTracks().map((t) => `${t.kind}:${t.id}:${t.enabled}`).join('|') || '';
    if (key === lastLocalTracksKey.current) return;
    lastLocalTracksKey.current = key;
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
    async (peerId, isInitiator, sigOverride, streamOverride) => {
      if (peersRef.current.has(peerId)) {
        const existing = peersRef.current.get(peerId);
        await addLocalTracksToPc(existing, streamOverride || localStreamRef.current);
        return existing;
      }

      const sig = sigOverride || getSignaling();
      const pc = new RTCPeerConnection({
        ...getIceServers(),
        bundlePolicy: 'max-bundle',
      });
      peersRef.current.set(peerId, pc);

      const stream = streamOverride || localStreamRef.current;
      if (streamOverride) localStreamRef.current = streamOverride;

      await addLocalTracksToPc(pc, stream);

      pc.ontrack = (event) => {
        const track = event.track;
        if (!track) return;
        if (event.streams?.[0]) {
          const ms = event.streams[0];
          remoteStreamsRef.current.set(peerId, ms);
          setRemoteStreams(new Map(remoteStreamsRef.current));
          track.onended = () => {
            if (!ms.getTracks().some((t) => t.readyState === 'live')) {
              updateRemoteStream(peerId, null);
            }
          };
          return;
        }
        attachRemoteTrack(peerId, track);
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
        await sendOffer(pc, peerId);
      }

      return pc;
    },
    [addLocalTracksToPc, attachRemoteTrack, updateRemoteStream, renegotiatePeer, sendOffer]
  );

  const removePeer = useCallback(
    (peerId) => {
      const pc = peersRef.current.get(peerId);
      if (pc) {
        pc.close();
        peersRef.current.delete(peerId);
      }
      pendingCandidatesRef.current.delete(peerId);
      makingOfferRef.current.delete(peerId);
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
        if (!pc) pc = await createPeerConnection(from, false);

        if (pc.signalingState === 'have-local-offer') {
          await pc.setLocalDescription({ type: 'rollback' });
        }

        await addLocalTracksToPc(pc, localStreamRef.current);
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
    [createPeerConnection, flushPendingCandidates, addLocalTracksToPc]
  );

  const ensurePeerConnections = useCallback(
    async (peerIds, sigOverride, streamOverride) => {
      if (sigOverride) signalingRef.current = sigOverride;
      const sig = sigOverride || getSignaling();
      if (!sig) return;

      const stream = streamOverride || localStreamRef.current;
      if (streamOverride) localStreamRef.current = streamOverride;

      for (const peerId of peerIds || []) {
        if (!peerId || peerId === myPeerIdRef.current) continue;
        const initiator = shouldInitiate(myPeerIdRef.current, peerId);
        await createPeerConnection(peerId, initiator, sig, stream);
      }
    },
    [createPeerConnection]
  );

  const connectToExistingPeers = useCallback(
    (peerIds, sigOverride, streamOverride) => {
      return ensurePeerConnections(peerIds, sigOverride, streamOverride);
    },
    [ensurePeerConnections]
  );

  const renegotiateIfNoStream = useCallback(
    (peerIds) => {
      (peerIds || []).forEach((peerId) => {
        if (!peerId || peerId === myPeerIdRef.current) return;
        const remote = remoteStreamsRef.current.get(peerId);
        const hasVideo = remote?.getVideoTracks().some((t) => t.readyState === 'live');
        if (hasVideo) return;
        const pc = peersRef.current.get(peerId);
        if (!pc || pc.signalingState === 'closed') return;
        if (['connected', 'completed', 'failed', 'disconnected'].includes(pc.connectionState)) {
          renegotiatePeer(pc, peerId);
        } else if (!pc) {
          ensurePeerConnections([peerId]);
        }
      });
    },
    [renegotiatePeer, ensurePeerConnections]
  );

  const cleanup = useCallback(() => {
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    remoteStreamsRef.current.clear();
    pendingCandidatesRef.current.clear();
    makingOfferRef.current.clear();
    setRemoteStreams(new Map());
  }, []);

  return {
    remoteStreams,
    connectToExistingPeers,
    ensurePeerConnections,
    renegotiateIfNoStream,
    cleanup,
    removePeer,
    handleSignal,
  };
};
