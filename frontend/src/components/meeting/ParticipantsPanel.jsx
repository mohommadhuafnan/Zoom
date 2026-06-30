import { X, ExternalLink, Mic, MicOff, Video, VideoOff, MoreHorizontal } from 'lucide-react';

export default function ParticipantsPanel({
  participants,
  isHost,
  mySocketId,
  onClose,
  onMute,
  onRemove,
  onMuteAll,
}) {
  return (
    <aside className="w-80 bg-zoom-panel border-l border-white/10 flex flex-col shrink-0">
      <header className="h-12 flex items-center justify-between px-4 border-b border-white/10">
        <span className="text-white text-sm font-medium">Participants ({participants.length})</span>
        <div className="flex gap-1">
          <button className="p-1.5 text-white/60 hover:text-white rounded"><ExternalLink className="w-4 h-4" /></button>
          <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white rounded"><X className="w-4 h-4" /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {participants.map((p) => {
          const id = p.peerId || p.socketId;
          return (
          <div
            key={id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5"
          >
            <div className="w-8 h-8 rounded-full bg-zoom-blue flex items-center justify-center text-white text-sm font-medium shrink-0">
              {p.displayName?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">
                {p.displayName}
                {p.isHost ? ' (Host)' : ''}
                {p.socketId === mySocketId || p.peerId === mySocketId ? ', me' : ''}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {p.audioMuted ? (
                <MicOff className="w-4 h-4 text-red-400" />
              ) : (
                <Mic className="w-4 h-4 text-white/60" />
              )}
              {p.videoOff ? (
                <VideoOff className="w-4 h-4 text-red-400" />
              ) : (
                <Video className="w-4 h-4 text-white/60" />
              )}
              {isHost && id !== mySocketId && (
                <div className="relative group">
                  <button type="button" className="p-1 text-white/60 hover:text-white">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-zinc-800 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                    <button
                      type="button"
                      onClick={() => onMute(id)}
                      className="block w-full text-left px-3 py-1.5 text-sm text-white hover:bg-white/10"
                    >
                      Mute
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(id)}
                      className="block w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-white/10"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {isHost && (
        <footer className="p-3 border-t border-white/10 flex gap-2">
          <button className="flex-1 text-sm py-2 text-white/80 hover:bg-white/10 rounded-lg">
            Invite
          </button>
          <button
            onClick={onMuteAll}
            className="flex-1 text-sm py-2 text-white/80 hover:bg-white/10 rounded-lg"
          >
            Mute all
          </button>
        </footer>
      )}
    </aside>
  );
}
