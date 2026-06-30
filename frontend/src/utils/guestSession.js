const GUEST_KEY = 'unimeet_guest';

export function getGuestSession() {
  try {
    const raw = sessionStorage.getItem(GUEST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setGuestSession({ displayName, guestId }) {
  sessionStorage.setItem(
    GUEST_KEY,
    JSON.stringify({
      displayName: displayName.trim(),
      guestId: guestId || crypto.randomUUID(),
    })
  );
}

export function clearGuestSession() {
  sessionStorage.removeItem(GUEST_KEY);
}

export function getMeetingDisplayName(user) {
  if (user?.displayName) return user.displayName;
  return getGuestSession()?.displayName || 'Guest';
}
