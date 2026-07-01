/** Responsive gallery grid classes for meeting video tiles (Zoom-style). */
export function getMeetingGridClass(count) {
  if (count <= 1) return 'grid-cols-1 auto-rows-fr';
  if (count === 2) return 'grid-cols-1 md:grid-cols-2 auto-rows-fr';
  if (count <= 4) return 'grid-cols-2 auto-rows-fr';
  if (count <= 6) return 'grid-cols-2 lg:grid-cols-3 auto-rows-fr';
  if (count <= 9) return 'grid-cols-3 auto-rows-fr';
  return 'grid-cols-3 lg:grid-cols-4 auto-rows-fr';
}

export function resolveParticipantStream(peerId, isLocal, localStream, remoteStreams, myPeerId) {
  if (isLocal) return localStream;
  if (!peerId) return null;

  let stream = remoteStreams.get(peerId);
  if (stream) return stream;

  for (const [id, s] of remoteStreams) {
    if (id === peerId) return s;
  }

  // Two-person fallback: single remote stream belongs to the other participant
  if (remoteStreams.size === 1 && peerId !== myPeerId) {
    const [onlyId, onlyStream] = [...remoteStreams.entries()][0];
    if (onlyId !== myPeerId) return onlyStream;
  }

  return null;
}
