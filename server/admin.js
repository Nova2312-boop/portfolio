/**
 * Back-office : un seul administrateur, identifié par ADMIN_PASSWORD (.env).
 * Pas de base de données : le contenu reste dans data/profile.json, chaque
 * enregistrement garde une copie de secours dans data/backups/.
 */
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const SESSION_MS = 12 * 60 * 60 * 1000;
const MAX_BACKUPS = 30;
const UPLOAD_TYPES = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const slug = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

export function adminRouter({ DATA, UPLOADS, MESSAGES }) {
  const router = express.Router();
  const PROFILE = path.join(DATA, 'profile.json');
  const BACKUPS = path.join(DATA, 'backups');
  // Sans ADMIN_SECRET, les sessions expirent à chaque redémarrage du serveur
  const secret = process.env.ADMIN_SECRET || crypto.randomBytes(32).toString('hex');
  const password = process.env.ADMIN_PASSWORD || '';

  const sign = (payload) => b64url(crypto.createHmac('sha256', secret).update(payload).digest());
  const makeToken = () => {
    const payload = b64url(JSON.stringify({ exp: Date.now() + SESSION_MS }));
    return `${payload}.${sign(payload)}`;
  };
  const checkToken = (token = '') => {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return false;
    const expected = sign(payload);
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    try {
      return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
    } catch {
      return false;
    }
  };

  // --- Anti force brute : 10 tentatives par IP toutes les 15 minutes ---
  const tries = new Map();
  const loginLimit = (req, res, next) => {
    const now = Date.now();
    const list = (tries.get(req.ip) || []).filter((t) => now - t < 15 * 60 * 1000);
    if (list.length >= 10) return res.status(429).json({ error: 'Trop de tentatives. Réessaie dans 15 minutes.' });
    list.push(now);
    tries.set(req.ip, list);
    next();
  };

  const auth = (req, res, next) => {
    const token = (req.get('authorization') || '').replace(/^Bearer /, '');
    if (!checkToken(token)) return res.status(401).json({ error: 'Session expirée. Reconnecte-toi.' });
    next();
  };

  router.use(express.json({ limit: '15mb' }));

  router.get('/status', (_req, res) => res.json({ enabled: Boolean(password) }));

  router.post('/login', loginLimit, (req, res) => {
    if (!password) return res.status(503).json({ error: 'Back-office désactivé : définis ADMIN_PASSWORD dans server/.env.' });
    const given = Buffer.from(String(req.body?.password || ''));
    const real = Buffer.from(password);
    const ok = given.length === real.length && crypto.timingSafeEqual(given, real);
    if (!ok) return res.status(401).json({ error: 'Mot de passe incorrect.' });
    tries.delete(req.ip);
    res.json({ token: makeToken(), expiresAt: Date.now() + SESSION_MS });
  });

  router.use(auth);

  router.get('/profile', async (_req, res, next) => {
    try {
      res.json(JSON.parse(await fs.readFile(PROFILE, 'utf8')));
    } catch (err) {
      next(err);
    }
  });

  router.put('/profile', async (req, res, next) => {
    try {
      const next_ = req.body;
      if (!next_ || typeof next_ !== 'object' || Array.isArray(next_)) return res.status(400).json({ error: 'Contenu invalide.' });
      if (typeof next_.name !== 'string' || !next_.name.trim()) return res.status(400).json({ error: 'Le nom est obligatoire.' });

      const raw = await fs.readFile(PROFILE, 'utf8');
      const current = JSON.parse(raw);
      // Chaque champ existant doit garder son type (liste, texte, objet…) pour ne pas casser le site
      const kind = (v) => (Array.isArray(v) ? 'liste' : v === null ? 'vide' : typeof v);
      const wrong = Object.keys(current).filter((k) => k in next_ && kind(current[k]) !== kind(next_[k]));
      if (wrong.length) return res.status(400).json({ error: `Type incorrect pour : ${wrong.join(', ')}.` });
      const missing = Object.keys(current).filter((k) => !(k in next_));
      if (missing.length) return res.status(400).json({ error: `Champs manquants : ${missing.join(', ')}.` });

      await fs.mkdir(BACKUPS, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      await fs.writeFile(path.join(BACKUPS, `profile-${stamp}.json`), raw);
      const old = (await fs.readdir(BACKUPS)).filter((f) => f.endsWith('.json')).sort();
      await Promise.all(old.slice(0, Math.max(0, old.length - MAX_BACKUPS)).map((f) => fs.unlink(path.join(BACKUPS, f))));

      // Écriture atomique : on n'abîme jamais profile.json si le serveur s'arrête en plein milieu
      const tmp = `${PROFILE}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(next_, null, 2) + '\n');
      await fs.rename(tmp, PROFILE);
      res.json({ ok: true, savedAt: new Date().toISOString() });
    } catch (err) {
      next(err);
    }
  });

  router.get('/backups', async (_req, res, next) => {
    try {
      await fs.mkdir(BACKUPS, { recursive: true });
      const files = (await fs.readdir(BACKUPS)).filter((f) => /^profile-[\w-]+\.json$/.test(f)).sort().reverse();
      const list = await Promise.all(
        files.map(async (file) => ({ file, size: (await fs.stat(path.join(BACKUPS, file))).size }))
      );
      res.json(list);
    } catch (err) {
      next(err);
    }
  });

  router.get('/backups/:file', async (req, res, next) => {
    try {
      const file = path.basename(req.params.file);
      if (!/^profile-[\w-]+\.json$/.test(file)) return res.status(400).json({ error: 'Fichier invalide.' });
      res.json(JSON.parse(await fs.readFile(path.join(BACKUPS, file), 'utf8')));
    } catch (err) {
      if (err.code === 'ENOENT') return res.status(404).json({ error: 'Sauvegarde introuvable.' });
      next(err);
    }
  });

  router.post('/upload', async (req, res, next) => {
    try {
      const { folder = 'divers', filename = 'fichier', data = '' } = req.body || {};
      const m = /^data:([\w/+.-]+);base64,(.+)$/s.exec(data);
      if (!m || !UPLOAD_TYPES[m[1]]) return res.status(400).json({ error: 'Formats acceptés : PNG, JPG, WEBP, GIF ou PDF.' });
      const buf = Buffer.from(m[2], 'base64');
      if (buf.length > 10 * 1024 * 1024) return res.status(400).json({ error: 'Fichier trop lourd (10 Mo maximum).' });

      const dir = slug(folder) || 'divers';
      const base = slug(path.parse(filename).name) || 'fichier';
      const name = `${Date.now().toString(36)}-${base}${UPLOAD_TYPES[m[1]]}`;
      await fs.mkdir(path.join(UPLOADS, dir), { recursive: true });
      await fs.writeFile(path.join(UPLOADS, dir, name), buf);
      res.status(201).json({ url: `/uploads/${dir}/${name}` });
    } catch (err) {
      next(err);
    }
  });

  router.get('/messages', async (_req, res, next) => {
    try {
      const list = JSON.parse(await fs.readFile(MESSAGES, 'utf8').catch(() => '[]'));
      res.json(list.reverse());
    } catch (err) {
      next(err);
    }
  });

  router.delete('/messages/:id', async (req, res, next) => {
    try {
      const list = JSON.parse(await fs.readFile(MESSAGES, 'utf8').catch(() => '[]'));
      await fs.writeFile(MESSAGES, JSON.stringify(list.filter((m) => m.id !== req.params.id), null, 2));
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
