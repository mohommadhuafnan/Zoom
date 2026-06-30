import { useState } from 'react';
import { Minimize2, Maximize2 } from 'lucide-react';
import VideoTile from './VideoTile';
import { streamHasActiveVideo } from '../../utils/mediaUtils';

export default function ParticipantPiP({
  participants,
  myPeerId,
  displayName,
  localStream,
  remoteStreams,
  hidePeerId,
}) {
  const [minimized, setMinimized] = useState(false);

  const tiles = participants.filter((p) => {
    const id = p.peerId || p.socketId;
    return id && id !== hidePeerId;
  });

  if (!tiles.length) return null;

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="absolute bottom-4 right-4 z-30 flex items-center gap-2 bg-black/80 border border-white/20 text-white text-sm px-3 py-2 rounded-full shadow-lg hover:bg-black/90"
      >
        <Maximize2 className="w-4 h-4" />
        Participants ({tiles.length})
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 z-30 w-56 sm:w-64 bg-black/85 border border-white/20 rounded-xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-white text-xs font-medium">Participants</span>
        <button
          type="button"
          onClick={() => setMinimized(true)}
          className="p-1 text-white/60 hover:text-white rounded"
          title="Minimize"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>
      <div className="p-2 flex flex-col gap-2 max-h-48 overflow-y-auto">
        {tiles.map((p) => {
          const peerId = p.peerId || p.socketId;
          const isLocal = peerId === myPeerId;
          const stream = isLocal ? localStream : remoteStreams.get(peerId);
          const showVideoOff = p.videoOff && !streamHasActiveVideo(stream);
          return (
            <div key={peerId} className="h-24 shrink-0">
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
