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
