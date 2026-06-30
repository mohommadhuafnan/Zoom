import { useState, useRef, useCallback, useEffect } from 'react';

export function useLocalMedia() {
  const [localStream, setLocalStream] = useState(null);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const startMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      cameraStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to get user media:', err);
      // Audio-only fallback
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        cameraStreamRef.current = stream;
        setLocalStream(stream);
        setVideoOff(true);
        return stream;
      } catch {
        throw err;
      }
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (!localStream) return false;
    const track = localStream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setAudioMuted(!track.enabled);
      return !track.enabled;
    }
    return audioMuted;
  }, [localStream, audioMuted]);

  const toggleVideo = useCallback(() => {
    if (!localStream) return false;
    const track = localStream.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setVideoOff(!track.enabled);
      return !track.enabled;
    }
    return videoOff;
  }, [localStream, videoOff]);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });
      screenStreamRef.current = screenStream;

      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrack.onended = () => stopScreenShare();

      // Replace video track in local stream for WebRTC
      const newStream = new MediaStream([
        ...(localStream?.getAudioTracks() || []),
        screenTrack,
      ]);
      setLocalStream(newStream);
      setScreenSharing(true);
      return newStream;
    } catch (err) {
      console.error('Screen share failed:', err);
      return null;
    }
  }, [localStream]);

  const stopScreenShare = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;

    const camera = cameraStreamRef.current;
    if (camera) {
      setLocalStream(camera);
    }
    setScreenSharing(false);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (screenSharing) {
      stopScreenShare();
      return false;
    }
    const result = await startScreenShare();
    return !!result;
  }, [screenSharing, startScreenShare, stopScreenShare]);

  const stopAll = useCallback(() => {
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    screenStreamRef.current = null;
    setLocalStream(null);
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  return {
    localStream,
    audioMuted,
    videoOff,
    screenSharing,
    startMedia,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    stopScreenShare,
    stopAll,
  };
}
