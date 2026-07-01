const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.VITE_DESKTOP === 'true'
    ? 'http://localhost:5123/api'
    : import.meta.env.PROD
      ? '/api'
      : 'http://localhost:5000/api');

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

  scheduleMeeting: (body) =>
    request('/meetings/schedule', { method: 'POST', body: JSON.stringify(body) }),

  getScheduledMeetings: (days = 30) =>
    request(`/meetings/scheduled?days=${days}`),

  cancelScheduledMeeting: (id) =>
    request(`/meetings/scheduled/${id}`, { method: 'DELETE' }),

  getMeetingInvite: (id) => request(`/meetings/${id}/invite`),

  getMeetingPublic: (code) => request(`/meetings/join/${encodeURIComponent(code)}`),

  startMeeting: (code) =>
    request(`/meetings/${encodeURIComponent(code)}/start`, { method: 'POST' }),

  getMeeting: (code) => request(`/meetings/${code}`),

  endMeeting: (id) => request(`/meetings/${id}/end`, { method: 'POST' }),

  endMeetingByCode: (code) =>
    request(`/meetings/${encodeURIComponent(code)}/end`, { method: 'POST' }),

  getHistory: () => request('/meetings/history'),
};
