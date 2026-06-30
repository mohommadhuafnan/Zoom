import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { api } from '../services/api';

export default function JoinMeeting() {
  const { code: urlCode } = useParams();
  const [code, setCode] = useState(urlCode || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e?.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

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
  };

  return (
    <AppLayout>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-2">Join a meeting</h2>
          <p className="text-gray-500 text-sm mb-6">Enter the meeting ID or paste a link code</p>

          <form onSubmit={handleJoin} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
            )}
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Meeting ID (e.g. ABC123XYZ)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg tracking-wider focus:ring-2 focus:ring-zoom-blue focus:border-transparent outline-none uppercase"
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full zoom-btn-primary py-3 disabled:opacity-50"
            >
              {loading ? 'Joining…' : 'Join'}
            </button>
          </form>
        </div>
      </main>
    </AppLayout>
  );
}
