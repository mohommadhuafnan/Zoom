import { useEffect, useRef } from 'react';

export default function VideoTile({ stream, name, muted = false, isLocal = false, videoOff = false, fill = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream) {
      el.srcObject = stream;
    } else {
      el.srcObject = null;
    }
  }, [stream]);

  const showPlaceholder = !stream || videoOff || (isLocal && stream && !stream.getVideoTracks()[0]?.enabled);

  return (
    <div
      className={`relative bg-zinc-900 overflow-hidden ${
        fill ? 'h-full min-h-0 rounded-lg' : 'rounded-xl aspect-video min-h-[180px]'
      }`}
    >
      {!showPlaceholder ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted || isLocal}
          className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
          <div className="w-20 h-20 rounded-full bg-zinc-600 flex items-center justify-center text-2xl font-semibold text-white">
            {name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
        {name}{isLocal ? ' (me)' : ''}
      </div>
    </div>
  );
}
