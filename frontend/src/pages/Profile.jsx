import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Profile() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const isDesktop =
    import.meta.env.VITE_DESKTOP === 'true' ||
    (typeof window !== 'undefined' && window.unimeetDesktop?.isDesktop);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const { user: updated } = await api.updateProfile({ displayName });
      setUser(updated);
      setMessage('Profile updated');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCheckUpdate = async () => {
    if (!window.unimeetDesktop?.checkForUpdates) return;
    setCheckingUpdate(true);
    setUpdateMessage('');
    const result = await window.unimeetDesktop.checkForUpdates();
    setCheckingUpdate(false);
    if (!result?.ok) {
      setUpdateMessage(result?.message || 'Could not check for updates');
      return;
    }
    if (result.updateInfo?.version) {
      setUpdateMessage(`Update v${result.updateInfo.version} is available — see the popup.`);
    } else {
      setUpdateMessage('You are on the latest version.');
    }
  };

  return (
    <AppLayout>
      <main className="flex-1 p-8 max-w-lg">
        <h2 className="text-2xl font-semibold mb-6">Profile & Settings</h2>

        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zoom-blue outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
          {message && (
            <p className={`text-sm ${message.includes('updated') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
          <button type="submit" disabled={saving} className="zoom-btn-primary disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        {isDesktop && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-1">App updates</h3>
            <p className="text-sm text-gray-500 mb-4">
              UniMeet checks for updates when you open the app.
            </p>
            <button
              type="button"
              onClick={handleCheckUpdate}
              disabled={checkingUpdate}
              className="inline-flex items-center gap-2 text-sm font-medium text-zoom-blue hover:text-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${checkingUpdate ? 'animate-spin' : ''}`} />
              {checkingUpdate ? 'Checking…' : 'Check for updates'}
            </button>
            {updateMessage && (
              <p className="text-sm text-gray-600 mt-3">{updateMessage}</p>
            )}
          </div>
        )}

        <button
          onClick={handleLogout}
          className="mt-6 text-red-600 hover:text-red-700 text-sm font-medium"
        >
          Sign out
        </button>
      </main>
    </AppLayout>
  );
}
