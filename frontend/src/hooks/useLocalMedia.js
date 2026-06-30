import { useState, useRef, useCallback, useEffect } from 'react';

export function useLocalMedia() {
  const [localStream, setLocalStream] = useState(null);
  const [audioMuted, setAudioMuted] = useState(true);
  const [videoOff, setVideoOff] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const applyStream = useCallback((stream) => {
    cameraStreamRef.current = stream;
    setLocalStream(stream);
    if (stream) {
      const at = stream.getAudioTracks()[0];
      const vt = stream.getVideoTracks()[0];
      setAudioMuted(!at || !at.enabled);
      setVideoOff(!vt || !vt.enabled);
    }
  }, []);

  const startMedia = useCallback(
    async ({ audio = true, video = true } = {}) => {
      if (!audio && !video) {
        setAudioMuted(true);
        setVideoOff(true);
        return null;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio, video });
        stream.getAudioTracks().forEach((t) => {
          t.enabled = audio;
        });
        stream.getVideoTracks().forEach((t) => {
          t.enabled = video;
        });
        applyStream(stream);
        setAudioMuted(!audio);
        setVideoOff(!video);
        return stream;
      } catch (err) {
        console.error('Failed to get user media:', err);
        if (video && audio) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            applyStream(stream);
            setVideoOff(true);
            setAudioMuted(false);
            return stream;
          } catch {
            /* fall through */
          }
        }
        setAudioMuted(true);
        setVideoOff(true);
        return null;
      }
    },
    [applyStream]
  );

  const toggleAudio = useCallback(async () => {
    let stream = localStream || cameraStreamRef.current;
    if (!stream?.getAudioTracks().length) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const track = audioStream.getAudioTracks()[0];
        if (stream) {
          stream.addTrack(track);
          setLocalStream(new MediaStream(stream.getTracks()));
        } else {
          applyStream(new MediaStream([track]));
        }
        setAudioMuted(false);
        return false;
      } catch {
        return true;
      }
    }
    const track = stream.getAudioTracks()[0];
    track.enabled = !track.enabled;
    setAudioMuted(!track.enabled);
    return !track.enabled;
  }, [localStream, applyStream]);

  const toggleVideo = useCallback(async () => {
    let stream = localStream || cameraStreamRef.current;
    const track = stream?.getVideoTracks()[0];

    if (track) {
      track.enabled = !track.enabled;
      setVideoOff(!track.enabled);
      setLocalStream(new MediaStream(stream.getTracks()));
      return !track.enabled;
    }

    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const newTrack = videoStream.getVideoTracks()[0];
      if (stream) {
        stream.addTrack(newTrack);
        setLocalStream(new MediaStream(stream.getTracks()));
        cameraStreamRef.current = stream;
      } else {
        const newStream = new MediaStream([newTrack]);
        applyStream(newStream);
      }
      setVideoOff(false);
      return false;
    } catch (err) {
      console.error('Camera failed:', err);
      return true;
    }
  }, [localStream, applyStream]);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });
      screenStreamRef.current = screenStream;

      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrack.onended = () => stopScreenShare();

      const base = cameraStreamRef.current || localStream;
      const newStream = new MediaStream([
        ...(base?.getAudioTracks() || []),
        screenTrack,
      ]);
      setLocalStream(newStream);
      setScreenSharing(true);
      setVideoOff(false);
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
      const restored = new MediaStream(camera.getTracks());
      setLocalStream(restored);
      const vt = restored.getVideoTracks()[0];
      setVideoOff(!vt || !vt.enabled);
    } else {
      setLocalStream(null);
      setVideoOff(true);
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
    setAudioMuted,
    setVideoOff,
  };
}
