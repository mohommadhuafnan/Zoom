import { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { api } from '../services/api';

function formatDuration(start, end) {
  if (!start) return '—';
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const mins = Math.floor((e - s) / 60000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function History() {
  const [history, setHistory] = useState({ hosted: [], joined: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHistory()
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <main className="flex-1 p-8 max-w-4xl">
        <h2 className="text-2xl font-semibold mb-6">Meeting History</h2>

        {loading ? (
          <div className="animate-spin w-8 h-8 border-4 border-zoom-blue border-t-transparent rounded-full" />
        ) : (
          <>
            <section className="mb-10">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Meetings you hosted</h3>
              {history.hosted.length === 0 ? (
                <p className="text-gray-500 text-sm">No hosted meetings yet</p>
              ) : (
                <div className="space-y-3">
                  {history.hosted.map((m) => (
                    <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{m.title}</p>
                          <p className="text-sm text-gray-500">
                            ID: {m.meetingCode} · {new Date(m.startedAt).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-400">
                            Duration: {formatDuration(m.startedAt, m.endedAt)}
                            {!m.isActive && ' · Ended'}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${m.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {m.isActive ? 'Active' : 'Ended'}
                        </span>
                      </div>
                      {m.participations?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-2">Participants:</p>
                          <div className="flex flex-wrap gap-2">
                            {m.participations.map((p) => (
                              <span key={p.id} className="text-xs bg-gray-50 px-2 py-1 rounded">
                                {p.user.displayName} ({p.role})
                                {p.leftAt ? ` · left ${new Date(p.leftAt).toLocaleTimeString()}` : ' · in meeting'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Meetings you joined</h3>
              {history.joined.length === 0 ? (
                <p className="text-gray-500 text-sm">No joined meetings yet</p>
              ) : (
                <div className="space-y-3">
                  {history.joined.map((p) => (
                    <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <p className="font-medium">{p.meeting.title}</p>
                      <p className="text-sm text-gray-500">
                        Host: {p.meeting.host.displayName} · Joined {new Date(p.joinedAt).toLocaleString()}
                      </p>
                      {p.leftAt && (
                        <p className="text-sm text-gray-400">Left {new Date(p.leftAt).toLocaleString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </AppLayout>
  );
}
