import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Profile() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
