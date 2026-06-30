import { Video } from 'lucide-react';
import AnimatedJoinBackground from '../join/AnimatedJoinBackground';

export default function WaitingForHostScreen({ meetingTitle, hostName, displayName }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <AnimatedJoinBackground />

      <div className="w-full max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur rounded-full mb-6 ring-4 ring-white/20">
          <div className="relative">
            <Video className="w-10 h-10 text-white/90" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zoom-blue opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-zoom-blue" />
            </span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Waiting for the host to start</h1>
        <p className="text-blue-100/80 text-sm mb-1">{meetingTitle || 'UniMeet video call'}</p>
        {hostName && (
          <p className="text-white/50 text-sm mb-8">
            Host: <span className="text-white/80">{hostName}</span>
          </p>
        )}

        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-zoom-blue animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <p className="text-white/90 text-sm">
            Hi <span className="font-semibold">{displayName}</span>, you&apos;ll join automatically when{' '}
            {hostName || 'the host'} starts the meeting.
          </p>
          <p className="text-white/40 text-xs mt-3">Please keep this page open</p>
        </div>
      </div>
    </div>
  );
}
