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
  const sharingScreen = isScreenShare || streamIsScreenShare(stream);
  const hasActiveVideo = streamHasActiveVideo(stream);
  const showPlaceholder = !hasActiveVideo || (!sharingScreen && videoOff);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream && !showPlaceholder) {
      el.srcObject = stream;
    } else {
      el.srcObject = null;
    }
  }, [stream, showPlaceholder]);

  return (
    <div
      className={`relative bg-zinc-900 overflow-hidden ${className} ${
        fill ? 'h-full min-h-0 rounded-lg' : 'rounded-xl aspect-video min-h-[180px]'
      }`}
    >
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
        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
          <div className="w-20 h-20 rounded-full bg-zinc-600 flex items-center justify-center text-2xl font-semibold text-white">
            {name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        </div>
      )}
      {sharingScreen && !showPlaceholder && (
        <div className="absolute top-2 left-2 bg-green-600/90 text-white text-xs px-2 py-1 rounded-md font-medium">
          Screen share
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md max-w-[90%] truncate">
        {name}
        {isLocal ? ' (me)' : ''}
      </div>
    </div>
  );
}
