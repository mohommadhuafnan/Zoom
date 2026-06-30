import { useState, useRef, useCallback, useEffect } from 'react';

const AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48000,
  channelCount: 1,
};

const VIDEO_CONSTRAINTS = {
  width: { ideal: 1280, max: 1920 },
  height: { ideal: 720, max: 1080 },
  frameRate: { ideal: 30, max: 30 },
  facingMode: 'user',
};

export function useLocalMedia() {
  const [localStream, setLocalStream] = useState(null);
  const [audioMuted, setAudioMuted] = useState(true);
  const [videoOff, setVideoOff] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const refreshCameraStream = useCallback(() => {
    const cam = cameraStreamRef.current;
    if (!cam) {
      setCameraStream(null);
      return;
    }
    const tracks = cam.getTracks().filter((t) => t.readyState === 'live');
    setCameraStream(tracks.length ? new MediaStream(tracks) : null);
  }, []);

  const applyStream = useCallback((stream) => {
    cameraStreamRef.current = stream;
    setLocalStream(stream);
    if (stream) {
      const at = stream.getAudioTracks()[0];
      const vt = stream.getVideoTracks()[0];
      setAudioMuted(!at || !at.enabled);
      setVideoOff(!vt || !vt.enabled);
    }
    refreshCameraStream();
  }, [refreshCameraStream]);

  const startMedia = useCallback(
    async ({ audio = true, video = true } = {}) => {
      if (!audio && !video) {
        setAudioMuted(true);
        setVideoOff(true);
        return null;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: audio ? AUDIO_CONSTRAINTS : false,
          video: video ? VIDEO_CONSTRAINTS : false,
        });
        stream.getAudioTracks().forEach((t) => {
          t.enabled = audio;
        });
        stream.getVideoTracks().forEach((t) => {
          t.enabled = video;
        });
        applyStream(stream);
        setAudioMuted(!audio);
        setVideoOff(!video);
        refreshCameraStream();
        return stream;
      } catch (err) {
        console.error('Failed to get user media:', err);
        if (video && audio) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: AUDIO_CONSTRAINTS,
              video: false,
            });
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
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: AUDIO_CONSTRAINTS,
          video: false,
        });
        const track = audioStream.getAudioTracks()[0];
        if (stream) {
          stream.addTrack(track);
          setLocalStream(new MediaStream(stream.getTracks()));
        } else {
          applyStream(new MediaStream([track]));
        }
        setAudioMuted(false);
        refreshCameraStream();
        return false;
      } catch {
        return true;
      }
    }
    const track = stream.getAudioTracks()[0];
    track.enabled = !track.enabled;
    setAudioMuted(!track.enabled);
    setLocalStream(new MediaStream(stream.getTracks()));
    refreshCameraStream();
    return !track.enabled;
  }, [localStream, applyStream, refreshCameraStream]);

  const toggleVideo = useCallback(async () => {
    let stream = localStream || cameraStreamRef.current;
    const track = stream?.getVideoTracks()[0];

    if (track) {
      track.enabled = !track.enabled;
      setVideoOff(!track.enabled);
      setLocalStream(new MediaStream(stream.getTracks()));
      refreshCameraStream();
      return !track.enabled;
    }

    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: VIDEO_CONSTRAINTS,
        audio: false,
      });
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
      refreshCameraStream();
      return false;
    } catch (err) {
      console.error('Camera failed:', err);
      return true;
    }
  }, [localStream, applyStream, refreshCameraStream]);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });
      screenStreamRef.current = screenStream;

      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrack.onended = () => stopScreenShare();

      const base = cameraStreamRef.current || localStream;
      const audioTracks = [
        ...(base?.getAudioTracks() || []),
        ...screenStream.getAudioTracks(),
      ];
      const uniqueAudio = audioTracks.filter(
        (t, i, arr) => arr.findIndex((x) => x.id === t.id) === i
      );

      const newStream = new MediaStream([...uniqueAudio, screenTrack]);
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
    refreshCameraStream();
  }, [refreshCameraStream]);

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
    setCameraStream(null);
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  return {
    localStream,
    cameraStream,
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
