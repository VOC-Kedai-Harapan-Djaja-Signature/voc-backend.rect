export const TOKEN_KEY = 'voc_token';

export const ROLE_LABEL = {
  admin: 'Admin',
  kepala_cabang: 'Kepala Cabang',
  staf: 'Staf',
  staff: 'Staf',
};

export function readStoredToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export function decodeToken(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(part), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export function parseValidSession(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp || payload.exp * 1000 <= Date.now()) {
    return null;
  }
  return {
    token,
    name: String(payload.name || 'Pengguna').slice(0, 100),
    role: String(payload.role || ''),
    exp: payload.exp * 1000,
  };
}
