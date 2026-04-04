const BASE = '';

/**
 * POST /api/chat — prefers `reply` in JSON body even when status is not OK (avoids false "unavailable").
 */
export async function postChat(body) {
  let res;
  let text;
  try {
    res = await fetch(BASE + '/api/chat', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    text = await res.text();
  } catch (e) {
    const m = e && e.message ? String(e.message) : String(e);
    if (
      /failed to fetch|networkerror|network request failed|load failed|econnrefused|connection refused|internet connection/i.test(
        m
      )
    ) {
      throw new Error('__CHAT_NETWORK__');
    }
    throw e instanceof Error ? e : new Error(m);
  }
  const looksHtml = typeof text === 'string' && /^\s*</.test(text);
  if (looksHtml) {
    throw new Error('__CHAT_HTML__');
  }
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (data && typeof data.reply === 'string' && data.reply.length > 0) {
    return data.reply;
  }
  const err =
    (data && typeof data === 'object' && (data.error || data.message)) ||
    (typeof text === 'string' && text.length > 0 && text.length < 400 ? text : null) ||
    (!res.ok ? `${res.status} ${res.statusText || ''}`.trim() : null) ||
    'Request failed';
  throw new Error(typeof err === 'string' ? err : String(err));
}

export async function api(path, options = {}) {
  const res = await fetch(BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body !== undefined ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
  });
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!res.ok) throw new Error(data?.error || data?.message || res.statusText || 'Request failed');
  return data;
}

export default { api };
