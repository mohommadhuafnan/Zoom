import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  MessageSquare,
  MonitorUp,
  Heart,
  Shield,
  MoreHorizontal,
  PhoneOff,
  ChevronUp,
  Circle,
} from 'lucide-react';

function ControlBtn({ icon: Icon, label, active, danger, badge, onClick, children, ...rest }) {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`zoom-control-btn ${active ? 'active' : ''} ${danger ? 'danger' : ''}`}
        {...rest}
      >
        <div className="relative">
          <Icon className="w-5 h-5" />
          {badge != null && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {badge}
            </span>
          )}
        </div>
        <span className="text-[11px]">{label}</span>
        {!danger && <ChevronUp className="w-3 h-3 opacity-50 absolute top-1 right-1" />}
      </button>
      {children}
    </div>
  );
}

export default function ControlBar({
  audioMuted,
  videoOff,
  screenSharing,
  participantCount,
  activePanel,
  isHost,
  isRecording,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onTogglePanel,
  onEnd,
  onEndMeeting,
  onToggleRecording,
  onToggleReactions,
  showReactions,
}) {
  return (
    <footer className="h-[72px] bg-zoom-bar border-t border-white/5 flex items-center justify-center px-4 shrink-0 relative">
      <div className="flex items-center gap-1">
        <ControlBtn
          icon={audioMuted ? MicOff : Mic}
          label="Audio"
          active={audioMuted}
          onClick={onToggleAudio}
        />
        <ControlBtn
          icon={videoOff ? VideoOff : Video}
          label="Video"
          active={videoOff}
          onClick={onToggleVideo}
        />
        <ControlBtn
          icon={Users}
          label="Participants"
          badge={participantCount}
          active={activePanel === 'participants'}
          onClick={() => onTogglePanel('participants')}
        />
        <ControlBtn
          icon={MessageSquare}
          label="Chat"
          active={activePanel === 'chat'}
          onClick={() => onTogglePanel('chat')}
        />
        <ControlBtn
          icon={MonitorUp}
          label="Share"
          active={screenSharing}
          onClick={onToggleScreenShare}
        />
        <ControlBtn
          icon={Heart}
          label="React"
          active={showReactions}
          onClick={onToggleReactions}
          data-reactions-trigger
        />
        {isHost && (
          <ControlBtn
            icon={Shield}
            label="Host tools"
            active={activePanel === 'host'}
            onClick={() => onTogglePanel('host')}
          />
        )}
        <ControlBtn
          icon={MoreHorizontal}
          label="More"
          active={activePanel === 'more'}
          onClick={() => onTogglePanel('more')}
        />
      </div>

      <div className="absolute right-6">
        <ControlBtn icon={PhoneOff} label="End" danger onClick={onEnd} />
      </div>

      {activePanel === 'more' && (
        <div className="absolute bottom-20 right-1/2 translate-x-1/2 bg-zinc-800 rounded-xl p-4 shadow-xl border border-white/10 grid grid-cols-4 gap-3 min-w-[320px]">
          <button
            onClick={onToggleRecording}
            className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-white/10 text-white text-xs"
          >
            <Circle className={`w-5 h-5 ${isRecording ? 'text-red-500 fill-red-500' : ''}`} />
            {isRecording ? 'Stop' : 'Record'}
          </button>
        </div>
      )}
    </footer>
  );
}
