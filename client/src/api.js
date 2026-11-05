/**
 * Accès à l'API Node.
 * En mode démo (build d'aperçu, `npm run build:demo`), les données viennent
 * directement de server/data/profile.json et rien n'est envoyé.
 */
export const isDemo = import.meta.env.VITE_DEMO === '1';

// En dev, on appelle l'API directement (CORS autorisé côté serveur) : le proxy
// de Vite 5 tronque les grosses réponses sous Node 24. En prod, même origine.
const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '');

async function json(url, opts) {
  const r = await fetch(API_BASE + url, opts);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data.error || `Erreur ${r.status}`);
    err.status = r.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function getProfile() {
  if (isDemo) return (await import('../../server/data/profile.json')).default;
  return json('/api/profile');
}

export async function getHealth() {
  if (isDemo) return { status: 'ok (aperçu)', uptime: Math.round(performance.now() / 1000) };
  return json('/api/health');
}

export async function sendContact(form) {
  if (isDemo) {
    await new Promise((r) => setTimeout(r, 700));
    return { ok: true, demo: true };
  }
  return json('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
}

/** Activité publique GitHub réelle, ou null si aucun pseudo n'est renseigné. */
export async function getGithub(username) {
  if (isDemo || !username) return null;
  return json('/api/github');
}

/** Les fichiers envoyés depuis le back-office sont servis par l'API (/uploads/…). */
export const assetUrl = (src) => (typeof src === 'string' && src.startsWith('/uploads/') ? API_BASE + src : src);

// --- Back-office ---
const TOKEN_KEY = 'portfolio-admin-token';
export const adminToken = {
  get: () => {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  },
  set: (t) => {
    try {
      t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY);
    } catch {}
  },
};

function adminJson(url, { body, method = body === undefined ? 'GET' : 'POST' } = {}) {
  return json(`/api/admin${url}`, {
    method,
    headers: { Authorization: `Bearer ${adminToken.get()}`, ...(body !== undefined && { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export const admin = {
  status: () => json('/api/admin/status'),
  login: (password) => adminJson('/login', { body: { password } }),
  profile: () => adminJson('/profile'),
  save: (profile) => adminJson('/profile', { method: 'PUT', body: profile }),
  backups: () => adminJson('/backups'),
  backup: (file) => adminJson(`/backups/${encodeURIComponent(file)}`),
  upload: (folder, file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
      reader.onload = () => adminJson('/upload', { body: { folder, filename: file.name, data: reader.result } }).then(resolve, reject);
      reader.readAsDataURL(file);
    }),
  messages: () => adminJson('/messages'),
  deleteMessage: (id) => adminJson(`/messages/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
