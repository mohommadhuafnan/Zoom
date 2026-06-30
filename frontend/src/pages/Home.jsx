import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Plus,
  Calendar,
  MonitorUp,
  PenLine,
  Umbrella,
  Clock,
  Copy,
  Trash2,
  Share2,
} from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import ScheduleMeetingModal from '../components/schedule/ScheduleMeetingModal';
import ShareScheduledMeetingModal from '../components/schedule/ShareScheduledMeetingModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function ActionButton({ icon: Icon, label, color, onClick, badge }) {
  const bg = color === 'orange' ? 'bg-zoom-orange hover:bg-orange-600' : 'bg-zoom-blue hover:bg-blue-600';
  return (
    <button
      onClick={onClick}
      className={`${bg} text-white rounded-2xl p-6 flex flex-col items-center justify-center gap-3 aspect-square w-full max-w-[180px] transition-transform hover:scale-[1.02] shadow-sm`}
    >
      <div className="relative">
        <Icon className="w-10 h-10" />
        {badge && (
          <span className="absolute -top-1 -right-2 bg-white text-zoom-blue text-xs font-bold rounded px-1">
            {badge}
          </span>
        )}
      </div>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDay(iso) {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [now, setNow] = useState(new Date());
  const [showSchedule, setShowSchedule] = useState(false);
  const [shareResult, setShareResult] = useState(null);
  const [scheduled, setScheduled] = useState([]);
  const [loadingScheduled, setLoadingScheduled] = useState(true);

  const loadScheduled = useCallback(async () => {
    try {
      const { meetings } = await api.getScheduledMeetings(30);
      setScheduled(meetings);
    } catch {
      setScheduled([]);
    } finally {
      setLoadingScheduled(false);
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    loadScheduled();
  }, [loadScheduled]);

  const handleNewMeeting = async () => {
    setCreating(true);
    try {
      const { meeting } = await api.createMeeting({
        title: `${user.displayName}'s Meeting`,
      });
      navigate(`/meeting/${meeting.meetingCode}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleScheduled = (result) => {
    setShareResult(result);
    loadScheduled();
  };

  const copyLink = async (url) => {
    await navigator.clipboard.writeText(url);
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this scheduled meeting?')) return;
    try {
      await api.cancelScheduledMeeting(id);
      loadScheduled();
    } catch (err) {
      alert(err.message);
    }
  };

  const openShare = async (meeting) => {
    try {
      const details = await api.getMeetingInvite(meeting.id);
      setShareResult(details);
    } catch (err) {
      alert(err.message);
    }
  };

  const todayMeetings = scheduled.filter((m) => {
    const d = new Date(m.scheduledAt);
    const t = new Date();
    return d.toDateString() === t.toDateString();
  });

  const canStartMeeting = (m) => {
    const scheduled = new Date(m.scheduledAt);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return scheduled >= startOfToday;
  };

  const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <AppLayout>
      <ScheduleMeetingModal
        open={showSchedule}
        onClose={() => setShowSchedule(false)}
        onScheduled={handleScheduled}
        defaultTitle={`${user?.displayName}'s Meeting`}
      />
      <ShareScheduledMeetingModal
        open={!!shareResult}
        onClose={() => setShareResult(null)}
        scheduleResult={shareResult}
      />

      <main className="flex-1 p-8 flex gap-8">
        <div className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl">
            <ActionButton
              icon={Video}
              label={creating ? 'Starting…' : 'New Meeting'}
              color="orange"
              onClick={handleNewMeeting}
            />
            <ActionButton
              icon={Plus}
              label="Join"
              color="blue"
              onClick={() => navigate('/join')}
            />
            <ActionButton
              icon={Calendar}
              label="Schedule"
              color="blue"
              badge={scheduled.length || now.getDate()}
              onClick={() => setShowSchedule(true)}
            />
            <ActionButton
              icon={MonitorUp}
              label="Share Screen"
              color="blue"
              onClick={handleNewMeeting}
            />
            <ActionButton
              icon={PenLine}
              label="My Notes"
              color="blue"
              onClick={() => alert('Notes coming soon')}
            />
          </div>
        </div>

        <div className="w-80 shrink-0 hidden lg:block">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#0B5CAB] text-white p-6 text-center">
              <div className="text-4xl font-light mb-1">{timeStr}</div>
              <div className="text-sm opacity-90">{dateStr}</div>
            </div>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium">Upcoming</span>
              <button
                onClick={() => setShowSchedule(true)}
                className="text-xs text-zoom-blue hover:underline"
              >
                + Schedule
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {loadingScheduled ? (
                <div className="p-6 flex justify-center">
                  <div className="w-6 h-6 border-2 border-zoom-blue border-t-transparent rounded-full animate-spin" />
                </div>
              ) : scheduled.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Umbrella className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No meetings scheduled</p>
                  <button
                    onClick={() => setShowSchedule(true)}
                    className="text-zoom-blue text-sm mt-2 hover:underline"
                  >
                    + Schedule a meeting
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {scheduled.map((m) => (
                    <li key={m.id} className="p-3 hover:bg-gray-50 group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatDay(m.scheduledAt)} · {formatTime(m.scheduledAt)}
                          </p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{m.meetingCode}</p>
                          {!m.isActive && (
                            <p className="text-xs text-amber-600 mt-1">Waiting for host to start</p>
                          )}
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => copyLink(m.joinUrl)}
                            title="Copy link"
                            className="p-1.5 text-gray-400 hover:text-zoom-blue rounded"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openShare(m)}
                            title="Share"
                            className="p-1.5 text-gray-400 hover:text-zoom-blue rounded"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCancel(m.id)}
                            title="Cancel"
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {canStartMeeting(m) && (
                        <button
                          onClick={() => navigate(`/meeting/${m.meetingCode}`)}
                          className="mt-2 text-xs text-zoom-blue hover:underline font-medium"
                        >
                          {todayMeetings.some((t) => t.id === m.id) ? 'Start now →' : 'Start meeting →'}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => navigate('/history')}
                className="text-sm text-zoom-blue hover:underline"
              >
                View meeting history →
              </button>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
