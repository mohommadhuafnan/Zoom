const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  health: () => request('/health'),

  register: (body) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  getMe: () => request('/auth/me'),

  updateProfile: (body) =>
    request('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),

  createMeeting: (body) =>
    request('/meetings', { method: 'POST', body: JSON.stringify(body) }),

  getMeeting: (code) => request(`/meetings/${code}`),

  endMeeting: (id) => request(`/meetings/${id}/end`, { method: 'POST' }),

  getHistory: () => request('/meetings/history'),
};
