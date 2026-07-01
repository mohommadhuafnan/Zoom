import { useState } from 'react';
import { Minimize2, Maximize2 } from 'lucide-react';
import VideoTile from './VideoTile';
import { streamHasActiveVideo } from '../../utils/mediaUtils';
import { resolveParticipantStream } from '../../utils/meetingGrid';

export default function ParticipantPiP({
  participants,
  myPeerId,
  displayName,
  localStream,
  cameraStream,
  screenSharing,
  remoteStreams,
  hidePeerId,
}) {
  const [minimized, setMinimized] = useState(false);

  const tiles = participants.filter((p) => {
    const id = p.peerId || p.socketId;
    return id && id !== hidePeerId;
  });

  if (!tiles.length) return null;

  const getStream = (p) => {
    const peerId = p.peerId || p.socketId;
    const isLocal = peerId === myPeerId;
    if (isLocal && screenSharing && cameraStream) return cameraStream;
    return resolveParticipantStream(peerId, isLocal, localStream, remoteStreams, myPeerId);
  };

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/15 text-white text-xs px-3 py-2 rounded-full shadow-lg hover:bg-black/65"
      >
        <Maximize2 className="w-3.5 h-3.5" />
        {tiles.length}
      </button>
    );
  }

  return (
    <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2 max-w-[min(100%,420px)]">
      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/15 rounded-full px-2 py-1 shadow-lg">
        <span className="text-white/80 text-[10px] font-medium px-1">Participants</span>
        <button
          type="button"
          onClick={() => setMinimized(true)}
          className="p-1 text-white/60 hover:text-white rounded-full hover:bg-white/10"
          title="Minimize"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
        {tiles.map((p) => {
          const peerId = p.peerId || p.socketId;
          const isLocal = peerId === myPeerId;
          const stream = getStream(p);
          const showVideoOff = isLocal && p.videoOff && !streamHasActiveVideo(stream);
          return (
            <div
              key={peerId}
              className="w-28 sm:w-32 h-20 sm:h-24 shrink-0 rounded-lg overflow-hidden shadow-xl ring-1 ring-white/20 bg-black/30 backdrop-blur-sm"
            >
              <VideoTile
                stream={stream}
                name={p.displayName || (isLocal ? displayName : 'Participant')}
                isLocal={isLocal}
                muted={isLocal}
                videoOff={showVideoOff}
                fill
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
