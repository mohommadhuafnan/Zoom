import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function JoinMeeting() {
  const { code: urlCode } = useParams();
  const [code, setCode] = useState(urlCode?.toUpperCase() || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const autoJoinAttempted = useRef(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const joinMeeting = useCallback(
    async (meetingCode) => {
      const trimmed = meetingCode.trim().toUpperCase();
      if (!trimmed) return;

      if (!user) {
        navigate('/login', { state: { from: { pathname: `/join/${trimmed}` } } });
        return;
      }

      setLoading(true);
      setError('');
      try {
        const { meeting } = await api.getMeeting(trimmed);
        if (!meeting.isActive) {
          setError('This meeting has ended');
          return;
        }
        navigate(`/meeting/${meeting.meetingCode}`);
      } catch (err) {
        setError(err.message || 'Meeting not found');
      } finally {
        setLoading(false);
      }
    },
    [user, navigate]
  );

  useEffect(() => {
    if (urlCode) setCode(urlCode.toUpperCase());
  }, [urlCode]);

  useEffect(() => {
    const trimmed = urlCode?.trim().toUpperCase();
    if (!trimmed) return;
    api
      .getMeetingPublic(trimmed)
      .then(({ meeting }) => setPreview(meeting))
      .catch(() => setPreview(null));
  }, [urlCode]);

  useEffect(() => {
    if (authLoading || !user || !urlCode || autoJoinAttempted.current) return;
    autoJoinAttempted.current = true;
    joinMeeting(urlCode);
  }, [authLoading, user, urlCode, joinMeeting]);

  const handleJoin = (e) => {
    e?.preventDefault();
    joinMeeting(code);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-zoom-blue rounded-2xl mb-4">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join UniMeet</h1>
          <p className="text-gray-500 mt-1">
            {preview?.title ? `You're joining: ${preview.title}` : 'Enter the meeting ID from your invite link'}
          </p>
        </div>

        <form onSubmit={handleJoin} className="bg-white rounded-2xl shadow-lg p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}
          {!user && !authLoading && (
            <div className="bg-blue-50 text-blue-800 text-sm px-4 py-3 rounded-lg">
              Sign in or create an account to join this meeting.
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting ID</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC123XYZ"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg tracking-wider focus:ring-2 focus:ring-zoom-blue focus:border-transparent outline-none uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading || authLoading || !code.trim()}
            className="w-full zoom-btn-primary py-3 disabled:opacity-50"
          >
            {loading ? 'Joining…' : user ? 'Join meeting' : 'Sign in to join'}
          </button>
          {!user && (
            <p className="text-center text-sm text-gray-500">
              No account?{' '}
              <Link
                to="/register"
                state={{ from: { pathname: urlCode ? `/join/${urlCode.toUpperCase()}` : '/join' } }}
                className="text-zoom-blue hover:underline font-medium"
              >
                Sign up free
              </Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
