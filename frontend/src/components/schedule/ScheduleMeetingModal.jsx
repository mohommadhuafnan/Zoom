import { useState } from 'react';
import { X, Calendar, Clock, Users, Shield } from 'lucide-react';
import { api } from '../../services/api';

function toLocalDatetimeValue(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function ScheduleMeetingModal({ open, onClose, onScheduled, defaultTitle = '' }) {
  const defaultWhen = new Date(Date.now() + 60 * 60 * 1000);

  const [title, setTitle] = useState(defaultTitle);
  const [scheduledAt, setScheduledAt] = useState(toLocalDatetimeValue(defaultWhen));
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [description, setDescription] = useState('');
  const [inviteEmails, setInviteEmails] = useState('');
  const [waitingRoom, setWaitingRoom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const emails = inviteEmails
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const result = await api.scheduleMeeting({
        title: title.trim() || 'Scheduled Meeting',
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: Number(durationMinutes),
        description: description.trim(),
        waitingRoom,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        inviteEmails: emails,
      });

      onScheduled(result);
      onClose();
    } catch (err) {
      const msg = err.message || 'Failed to schedule meeting';
      if (msg.includes('scheduled_at') || msg.includes('meeting_invites')) {
        setError(
          'Database needs a one-time update. Open Supabase → SQL Editor, run backend/prisma/supabase-scheduling.sql, then try again.'
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Schedule a meeting</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Study group — Database Systems"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zoom-blue outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date & time
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={toLocalDatetimeValue(new Date())}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zoom-blue outline-none text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zoom-blue outline-none text-sm"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Agenda, notes for participants…"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zoom-blue outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="w-4 h-4 inline mr-1" />
              Invite participants (emails)
            </label>
            <textarea
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              rows={2}
              placeholder="friend@university.edu, classmate@university.edu"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zoom-blue outline-none resize-none text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Separate emails with commas. You can share the link after scheduling.</p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={waitingRoom}
              onChange={(e) => setWaitingRoom(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-zoom-blue focus:ring-zoom-blue"
            />
            <span className="text-sm text-gray-700 flex items-center gap-1">
              <Shield className="w-4 h-4" />
              Enable waiting room
            </span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 zoom-btn-primary py-2.5 disabled:opacity-50"
            >
              {loading ? 'Scheduling…' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
