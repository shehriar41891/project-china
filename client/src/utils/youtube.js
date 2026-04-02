/** Extract YouTube video id from watch or youtu.be URL. */
export function youtubeIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const s = url.trim();
  try {
    if (s.includes('youtu.be/')) {
      const part = s.split('youtu.be/')[1] || '';
      return part.split(/[?#]/)[0] || null;
    }
    const u = new URL(s);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const m = u.pathname.match(/\/embed\/([^/?]+)/);
      if (m) return m[1];
    }
  } catch (_) {}
  return null;
}

export function youtubeThumbUrl(videoId, quality = 'hqdefault') {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}
