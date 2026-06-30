import { useState } from 'react';
import { X, Copy, Check, Mail, Download, Link2, Share2 } from 'lucide-react';

function formatScheduledTime(iso) {
  return new Date(iso).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ShareScheduledMeetingModal({ open, onClose, scheduleResult }) {
  const [copied, setCopied] = useState('');
  const meeting = scheduleResult?.meeting;
  const joinUrl = scheduleResult?.joinUrl;
  const inviteText = scheduleResult?.inviteText;

  if (!open || !meeting) return null;

  const copy = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const mailtoLink = () => {
    const emails = (meeting.invites || []).map((i) => i.email).join(',');
    const subject = encodeURIComponent(`UniMeet invitation: ${meeting.title}`);
    const body = encodeURIComponent(inviteText || '');
    return `mailto:${emails}?subject=${subject}&body=${body}`;
  };

  const downloadIcs = async () => {
    const token = localStorage.getItem('token');
    const base =
      import.meta.env.VITE_API_URL ||
      (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
    const res = await fetch(`${base}/meetings/${meeting.id}/invite.ics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unimeet-${meeting.meetingCode}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({
        title: meeting.title,
        text: inviteText,
        url: joinUrl,
      });
    } else {
      copy(inviteText, 'share');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Meeting scheduled</h2>
            <p className="text-sm text-gray-500 mt-0.5">{formatScheduledTime(meeting.scheduledAt)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="font-medium text-green-800">{meeting.title}</p>
            <p className="text-sm text-green-700 mt-1">
              Meeting ID: <span className="font-mono font-semibold">{meeting.meetingCode}</span>
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Join link</label>
            <div className="flex gap-2 mt-1">
              <input
                readOnly
                value={joinUrl}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono truncate"
              />
              <button
                type="button"
                onClick={() => copy(joinUrl, 'link')}
                className="px-3 py-2 bg-zoom-blue text-white rounded-lg hover:bg-blue-600 flex items-center gap-1 text-sm shrink-0"
              >
                {copied === 'link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied === 'link' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => copy(inviteText, 'invite')}
              className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
            >
              {copied === 'invite' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              Copy invitation
            </button>
            <a
              href={mailtoLink()}
              className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
            >
              <Mail className="w-4 h-4" />
              Email invite
            </a>
            <button
              type="button"
              onClick={downloadIcs}
              className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
            >
              <Download className="w-4 h-4" />
              Download .ics
            </button>
            <button
              type="button"
              onClick={shareNative}
              className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>

          {(meeting.invites?.length > 0) && (
            <div className="text-sm text-gray-600">
              <Link2 className="w-4 h-4 inline mr-1" />
              Invited: {meeting.invites.map((i) => i.email).join(', ')}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full zoom-btn-primary py-2.5 mt-2"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
