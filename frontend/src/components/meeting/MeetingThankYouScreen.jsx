import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import AnimatedJoinBackground from '../join/AnimatedJoinBackground';

export default function MeetingThankYouScreen({ meetingTitle, displayName, hostEnded = true }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <AnimatedJoinBackground />

      <div className="w-full max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 backdrop-blur rounded-full mb-6 ring-4 ring-green-400/30">
          <CheckCircle className="w-12 h-12 text-green-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Thank you for participating!</h1>
        <p className="text-blue-100/90 text-sm mb-1">
          {hostEnded
            ? 'The host has ended the meeting.'
            : 'You have left the meeting.'}
        </p>
        {meetingTitle && (
          <p className="text-white/60 text-sm mb-6">{meetingTitle}</p>
        )}
        {displayName && (
          <p className="text-white/50 text-sm mb-8">
            Goodbye, <span className="text-white/80 font-medium">{displayName}</span>
          </p>
        )}

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 space-y-3">
          <p className="text-white/90 text-sm">
            We hope you had a great session on UniMeet.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl bg-zoom-blue hover:bg-blue-500 text-white font-semibold transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}
