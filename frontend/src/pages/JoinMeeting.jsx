import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Video, User } from 'lucide-react';
import { api } from '../services/api';
import { setGuestSession } from '../utils/guestSession';
import { useAuth } from '../context/AuthContext';
import AnimatedJoinBackground from '../components/join/AnimatedJoinBackground';

export default function JoinMeeting() {
  const { code: urlCode } = useParams();
  const [code, setCode] = useState(urlCode?.toUpperCase() || '');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (urlCode) setCode(urlCode.toUpperCase());
  }, [urlCode]);

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user]);

  useEffect(() => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    api
      .getMeetingPublic(trimmed)
      .then(({ meeting }) => setPreview(meeting))
      .catch(() => setPreview(null));
  }, [code]);

  const handleJoin = async (e) => {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    const name = displayName.trim();

    if (!trimmedCode) {
      setError('Enter a meeting ID');
      return;
    }
    if (name.length < 2) {
      setError('Enter your display name (at least 2 characters)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { meeting } = await api.getMeetingPublic(trimmedCode);
      if (meeting.ended && user?.id !== meeting.hostId) {
        setError('This meeting has ended');
        return;
      }

      const guestId = crypto.randomUUID();
      if (!user?.id || user.id !== meeting.hostId) {
        setGuestSession({ displayName: name, guestId });
      }

      navigate(`/meeting/${meeting.meetingCode}`, {
        state: { displayName: name },
      });
    } catch (err) {
      setError(err.message || 'Meeting not found');
    } finally {
      setLoading(false);
    }
  };

  const initial = displayName.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <AnimatedJoinBackground />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-zoom-blue/90 backdrop-blur rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Join meeting</h1>
          <p className="text-blue-100/80 mt-2 text-sm">
            {preview?.title
              ? preview.title
              : preview && !preview.hostStarted && !preview.ended
                ? 'The host will start the meeting soon'
                : 'No sign-in required — enter your name to join'}
          </p>
        </div>

        <form
          onSubmit={handleJoin}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 space-y-5"
        >
          {error && (
            <div className="bg-red-500/20 border border-red-400/30 text-red-100 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center py-2">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-zoom-blue to-cyan-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-2 ring-4 ring-white/20">
              {initial}
            </div>
            <p className="text-white/60 text-xs">Your preview</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">Your name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
                maxLength={40}
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:ring-2 focus:ring-zoom-blue focus:border-transparent outline-none"
              />
            </div>
          </div>

          {!urlCode && (
            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">Meeting ID</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123XYZ"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 tracking-wider uppercase focus:ring-2 focus:ring-zoom-blue outline-none"
              />
            </div>
          )}

          {urlCode && (
            <p className="text-center text-white/50 text-sm">
              Meeting ID: <span className="text-white font-mono tracking-wider">{code}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !displayName.trim() || !code.trim()}
            className="w-full bg-zoom-blue hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining…' : 'Join meeting'}
          </button>

          <p className="text-center text-white/40 text-xs">
            By joining, you agree to be seen and heard in this meeting.
          </p>
        </form>
      </div>
    </div>
  );
}
