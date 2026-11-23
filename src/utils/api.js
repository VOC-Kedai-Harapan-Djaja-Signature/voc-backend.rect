import { VOC_API } from './config';

export async function apiFetch(path, options = {}, { token = null, onUnauthorized = null } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '1',
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || 15000);
  let res;
  try {
    res = await fetch(`${VOC_API}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch {
    throw Object.assign(new Error('network'), { status: 0 });
  } finally {
    clearTimeout(timer);
  }

  const body = await res.json().catch(() => null);
  if (res.status === 401 && token && typeof onUnauthorized === 'function') {
    onUnauthorized('Sesi login berakhir. Silakan masuk lagi.');
  }
  if (!res.ok) {
    throw Object.assign(new Error('http'), { status: res.status, body });
  }
  return body;
}

export async function apiFetchOptional(path, ctx) {
  try {
    return await apiFetch(path, {}, ctx);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}
