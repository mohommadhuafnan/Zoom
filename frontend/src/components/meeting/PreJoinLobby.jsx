import { useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import AnimatedJoinBackground from '../join/AnimatedJoinBackground';

export default function PreJoinLobby({
  displayName,
  meetingTitle,
  meetingCode,
  previewStream,
  audioMuted,
  videoOff,
  onToggleAudio,
  onToggleVideo,
  onJoin,
  onCancel,
  joining,
  error,
  isHost,
  meetingStarted,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (previewStream && !videoOff) {
      el.srcObject = previewStream;
    } else {
      el.srcObject = null;
    }
  }, [previewStream, videoOff]);

  const initial = displayName?.charAt(0)?.toUpperCase() || '?';
  const hostStarting = isHost && !meetingStarted;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <AnimatedJoinBackground />

      <div className="w-full max-w-4xl relative z-10 grid md:grid-cols-2 gap-8 items-center">
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/40 border border-white/20 shadow-2xl">
          {!videoOff && previewStream?.getVideoTracks()[0]?.enabled ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900/80">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-zoom-blue to-cyan-500 flex items-center justify-center text-4xl font-bold text-white">
                {initial}
              </div>
            </div>
          )}
          <div className="absolute bottom-3 left-3 bg-black/60 text-white text-sm px-3 py-1 rounded-lg">
            {displayName || 'Guest'}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {hostStarting ? 'Ready to start?' : 'Ready to join?'}
            </h1>
            <p className="text-blue-100/80 mt-1">{meetingTitle || 'UniMeet video call'}</p>
            {hostStarting && (
              <p className="text-amber-200/90 text-sm mt-2">
                Participants can join after you start the meeting.
              </p>
            )}
            {meetingCode && (
              <p className="text-white/50 text-sm mt-1 font-mono tracking-wider">{meetingCode}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/30 text-red-100 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onToggleAudio}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-colors ${
                audioMuted
                  ? 'bg-red-500/20 border-red-400/40 text-red-100'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/15'
              }`}
            >
              {audioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {audioMuted ? 'Mic off' : 'Mic on'}
            </button>
            <button
              type="button"
              onClick={onToggleVideo}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-colors ${
                videoOff
                  ? 'bg-red-500/20 border-red-400/40 text-red-100'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/15'
              }`}
            >
              {videoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              {videoOff ? 'Camera off' : 'Camera on'}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-white/20 text-white/80 hover:bg-white/10"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onJoin}
              disabled={joining || !displayName?.trim()}
              className="flex-[2] py-3 rounded-xl bg-zoom-blue hover:bg-blue-500 text-white font-semibold disabled:opacity-50"
            >
              {joining ? (hostStarting ? 'Starting…' : 'Joining…') : hostStarting ? 'Start meeting' : 'Join now'}
            </button>
          </div>

          <p className="text-white/40 text-xs text-center">
            No account needed. Your mic and camera choices apply when you enter the meeting.
          </p>
        </div>
      </div>

      <style>{`.mirror { transform: scaleX(-1); }`}</style>
    </div>
  );
}
