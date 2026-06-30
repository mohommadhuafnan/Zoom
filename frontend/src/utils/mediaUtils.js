export function isScreenShareTrack(track) {
  if (!track || track.kind !== 'video') return false;
  const settings = track.getSettings?.();
  if (settings?.displaySurface) return true;
  return /screen|window|display|monitor|web-contents/i.test(track.label || '');
}

export function streamHasActiveVideo(stream) {
  const track = stream?.getVideoTracks()[0];
  return !!(track?.enabled && track.readyState === 'live');
}

export function streamIsScreenShare(stream) {
  const track = stream?.getVideoTracks()[0];
  return isScreenShareTrack(track);
}

export function dedupeParticipants(list) {
  const byId = new Map();
  for (const p of list || []) {
    const id = p?.peerId || p?.socketId;
    if (!id) continue;
    const prev = byId.get(id);
    byId.set(id, prev ? { ...prev, ...p } : { ...p });
  }
  return Array.from(byId.values());
}

export function mergeSelfParticipant(list, self, selfId) {
  const merged = dedupeParticipants(list);
  if (!selfId) return merged.length ? merged : [self];
  const hasSelf = merged.some((p) => (p.peerId || p.socketId) === selfId);
  if (!hasSelf) return [self, ...merged];
  return merged.map((p) =>
    (p.peerId || p.socketId) === selfId ? { ...p, ...self } : p
  );
}
