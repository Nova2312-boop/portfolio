import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import { copyFileSync, cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { adminRouter } from './admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;
// En production, DATA_DIR / UPLOADS_DIR pointent vers des volumes persistants (Coolify, Docker…)
const BUNDLED_DATA = path.join(__dirname, 'data');
const DATA = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : BUNDLED_DATA;
const MESSAGES = path.join(DATA, 'messages.json');
const BUNDLED_UPLOADS = path.join(__dirname, 'uploads');
const UPLOADS = process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : BUNDLED_UPLOADS;

// Démarrage sur un dossier vide (volume neuf, hébergeur gratuit sans disque) :
// on y copie le contenu et les images livrés avec le code, sans écraser l'existant
mkdirSync(DATA, { recursive: true });
mkdirSync(UPLOADS, { recursive: true });
if (!existsSync(path.join(DATA, 'profile.json'))) copyFileSync(path.join(BUNDLED_DATA, 'profile.json'), path.join(DATA, 'profile.json'));
if (UPLOADS !== BUNDLED_UPLOADS && existsSync(BUNDLED_UPLOADS)) cpSync(BUNDLED_UPLOADS, UPLOADS, { recursive: true, force: false });

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
// Le back-office a sa propre limite (images envoyées en base64) ; le reste du site reste à 20 ko
app.use('/api/admin', adminRouter({ DATA, UPLOADS, MESSAGES }));
app.use(express.json({ limit: '20kb' }));
// Fichiers envoyés depuis le back-office (captures, CV…)
app.use('/uploads', express.static(UPLOADS, { maxAge: '7d', immutable: true }));

// --- Anti-spam : 5 messages max par IP toutes les 15 minutes ---
const hits = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 15 * 60 * 1000);
  if (list.length >= 5) {
    return res.status(429).json({ error: 'Trop de messages envoyés. Réessaie dans 15 minutes.' });
  }
  list.push(now);
  hits.set(ip, list);
  next();
}

// --- Email optionnel (si les variables SMTP sont définies dans .env) ---
const mailer = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()), time: new Date().toISOString() });
});

app.get('/api/profile', async (_req, res, next) => {
  try {
    const raw = await fs.readFile(path.join(DATA, 'profile.json'), 'utf8');
    res.json(JSON.parse(raw));
  } catch (err) {
    next(err);
  }
});

// --- GitHub : dépôts publics + activité des 120 derniers jours (cache 1 h) ---
let ghCache = { at: 0, user: '', data: null };

app.get('/api/github', async (_req, res, next) => {
  try {
    const profile = JSON.parse(await fs.readFile(path.join(DATA, 'profile.json'), 'utf8'));
    const user = profile.github?.username;
    if (!user) return res.status(404).json({ error: 'Aucun pseudo GitHub dans profile.json.' });
    if (ghCache.user === user && Date.now() - ghCache.at < 60 * 60 * 1000) return res.json(ghCache.data);

    const headers = { 'User-Agent': 'portfolio-server', Accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const gh = (p) => fetch(`https://api.github.com${p}`, { headers }).then((r) => {
      if (!r.ok) throw new Error(`GitHub ${r.status}`);
      return r.json();
    });

    const [account, repos, events] = await Promise.all([
      gh(`/users/${user}`),
      gh(`/users/${user}/repos?per_page=100&sort=pushed`),
      gh(`/users/${user}/events/public?per_page=100`).catch(() => []),
    ]);

    const activity = {};
    for (const e of events) {
      const day = e.created_at.slice(0, 10);
      const n = e.type === 'PushEvent' ? e.payload?.size || 1 : 1;
      activity[day] = (activity[day] || 0) + n;
    }

    const own = repos.filter((r) => !r.fork);
    const languages = {};
    own.forEach((r) => r.language && (languages[r.language] = (languages[r.language] || 0) + 1));

    const data = {
      user,
      url: account.html_url,
      publicRepos: account.public_repos,
      followers: account.followers,
      stars: own.reduce((s, r) => s + r.stargazers_count, 0),
      languages,
      activity,
      repos: own
        .sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at))
        .slice(0, 6)
        .map((r) => ({
          name: r.name,
          description: r.description,
          language: r.language,
          stars: r.stargazers_count,
          forks: r.forks_count,
          url: r.html_url,
          pushedAt: r.pushed_at,
        })),
    };
    ghCache = { at: Date.now(), user, data };
    res.json(data);
  } catch (err) {
    if (String(err.message).startsWith('GitHub')) return res.status(502).json({ error: `Impossible de joindre GitHub (${err.message}).` });
    next(err);
  }
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

app.post('/api/contact', rateLimit, async (req, res, next) => {
  try {
    const { name = '', email = '', message = '', website = '' } = req.body || {};
    // Champ piège invisible : un robot le remplit, un humain non
    if (website) return res.json({ ok: true });

    const errors = {};
    if (name.trim().length < 2) errors.name = 'Indique ton nom (2 caractères minimum).';
    if (!EMAIL_RE.test(email.trim())) errors.email = "Cette adresse email n'est pas valide.";
    if (message.trim().length < 10) errors.message = 'Le message doit faire au moins 10 caractères.';
    if (message.length > 3000) errors.message = 'Le message dépasse 3 000 caractères.';
    if (Object.keys(errors).length) return res.status(400).json({ errors });

    const entry = {
      id: Date.now().toString(36),
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      date: new Date().toISOString(),
    };

    let list = [];
    try {
      list = JSON.parse(await fs.readFile(MESSAGES, 'utf8'));
    } catch {}
    list.push(entry);
    await fs.writeFile(MESSAGES, JSON.stringify(list, null, 2));

    if (mailer) {
      await mailer.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.CONTACT_TO || process.env.SMTP_USER,
        replyTo: entry.email,
        subject: `Portfolio · message de ${entry.name}`,
        text: `${entry.message}\n\n— ${entry.name} <${entry.email}>`,
      });
    }

    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// --- En production : Express sert aussi le build React ---
const dist = path.join(__dirname, '..', 'client', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
});

app.listen(PORT, () => console.log(`▶ API portfolio sur http://localhost:${PORT}`));
