import { useState, useRef, useCallback } from 'react';

export function useRecording(localStream, remoteStreams) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = useCallback(() => {
    if (isRecording) return;

    const tracks = [];
    if (localStream) {
      localStream.getTracks().forEach((t) => tracks.push(t));
    }
    remoteStreams.forEach((stream) => {
      stream.getTracks().forEach((t) => {
        if (!tracks.some((existing) => existing.id === t.id)) tracks.push(t);
      });
    });

    if (tracks.length === 0) {
      alert('No media streams available to record');
      return;
    }

    const combined = new MediaStream(tracks);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const recorder = new MediaRecorder(combined, { mimeType });
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setRecordingUrl(url);
    };

    recorder.start(1000);
    recorderRef.current = recorder;
    setIsRecording(true);
  }, [isRecording, localStream, remoteStreams]);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (recorder?.state === 'recording') {
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
          const url = URL.createObjectURL(blob);
          setRecordingUrl(url);
          resolve(url);
        };
        recorder.stop();
      } else {
        resolve(recordingUrl);
      }
      recorderRef.current = null;
      setIsRecording(false);
    });
  }, [recordingUrl]);

  const downloadRecording = useCallback(() => {
    if (!recordingUrl) return;
    const a = document.createElement('a');
    a.href = recordingUrl;
    a.download = `unimeet-recording-${Date.now()}.webm`;
    a.click();
  }, [recordingUrl]);

  return {
    isRecording,
    recordingUrl,
    startRecording,
    stopRecording,
    downloadRecording,
  };
}
