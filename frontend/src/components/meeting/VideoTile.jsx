import { useEffect, useRef } from 'react';
import { streamHasActiveVideo, streamIsScreenShare } from '../../utils/mediaUtils';

export default function VideoTile({
  stream,
  name,
  muted = false,
  isLocal = false,
  videoOff = false,
  fill = false,
  isScreenShare = false,
  className = '',
}) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const sharingScreen = isScreenShare || streamIsScreenShare(stream);
  const hasActiveVideo = streamHasActiveVideo(stream);
  const hasActiveAudio = stream?.getAudioTracks().some((t) => t.enabled && t.readyState === 'live');
  const showPlaceholder = !hasActiveVideo || (!sharingScreen && videoOff);

  useEffect(() => {
    const videoEl = videoRef.current;
    const audioEl = audioRef.current;
    if (!stream) {
      if (videoEl) videoEl.srcObject = null;
      if (audioEl) audioEl.srcObject = null;
      return;
    }

    if (!showPlaceholder && videoEl) {
      videoEl.srcObject = stream;
      videoEl.play().catch(() => {});
    } else if (videoEl) {
      videoEl.srcObject = null;
    }

    if (!isLocal && hasActiveAudio && audioEl) {
      audioEl.srcObject = stream;
      audioEl.play().catch(() => {});
    } else if (audioEl) {
      audioEl.srcObject = null;
    }
  }, [stream, showPlaceholder, isLocal, hasActiveAudio]);

  return (
    <div
      className={`relative bg-zinc-900 overflow-hidden ${className} ${
        fill ? 'h-full min-h-0 rounded-lg' : 'rounded-xl aspect-video min-h-[180px]'
      }`}
    >
      {!isLocal && hasActiveAudio && (
        <audio ref={audioRef} autoPlay playsInline className="hidden" />
      )}
      {!showPlaceholder ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted || isLocal}
          className={`w-full h-full ${
            sharingScreen ? 'object-contain bg-black' : 'object-cover'
          } ${isLocal && !sharingScreen ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-zinc-800/80">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-zinc-600 flex items-center justify-center text-xl sm:text-2xl font-semibold text-white">
            {name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        </div>
      )}
      {sharingScreen && !showPlaceholder && (
        <div className="absolute top-2 left-2 bg-green-600/90 text-white text-xs px-2 py-1 rounded-md font-medium">
          Screen share
        </div>
      )}
      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded max-w-[90%] truncate">
        {name}
        {isLocal ? ' (me)' : ''}
      </div>
    </div>
  );
}
