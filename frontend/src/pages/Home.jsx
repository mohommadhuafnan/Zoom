import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Plus,
  Calendar,
  MonitorUp,
  PenLine,
  Umbrella,
} from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
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

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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

  const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <AppLayout>
      <main className="flex-1 p-8 flex gap-8">
        {/* Action buttons grid */}
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
              badge={now.getDate()}
              onClick={() => alert('Scheduling coming in a later step')}
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

        {/* Schedule widget — Zoom-style right panel */}
        <div className="w-80 shrink-0 hidden lg:block">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#0B5CAB] text-white p-6 text-center">
              <div className="text-4xl font-light mb-1">{timeStr}</div>
              <div className="text-sm opacity-90">{dateStr}</div>
            </div>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium">Today</span>
              <div className="flex gap-1 text-gray-400">
                <button className="p-1 hover:bg-gray-100 rounded">‹</button>
                <button className="p-1 hover:bg-gray-100 rounded">›</button>
              </div>
            </div>
            <div className="p-8 text-center text-gray-500">
              <Umbrella className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No meetings scheduled</p>
              <button
                onClick={handleNewMeeting}
                className="text-zoom-blue text-sm mt-2 hover:underline"
              >
                + Start a meeting
              </button>
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
