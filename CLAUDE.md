# Portfolio — React + Node.js

Portfolio de développeur full-stack (Abidjan). Interface et contenu en **français**.

## Stack
- `client/` : React 18 + Vite 5 + Three.js (JavaScript, pas de TypeScript, CSS pur sans framework)
- `server/` : Node.js + Express (ES modules), aucune base de données
- Racine : `concurrently` lance les deux en dev

## Commandes
- `npm run install:all` — installe racine, server et client
- `npm run dev` — API sur :5000, site sur :5173 (Vite proxifie `/api` vers :5000)
- `npm run build` puis `npm start` — Express sert `client/dist` + l'API sur un seul port
- Production : `Dockerfile` (Coolify). `DATA_DIR` / `UPLOADS_DIR` = volumes persistants ; au premier démarrage `profile.json` y est copié depuis `server/data/`
- `npm run build:demo --prefix client` — build autonome sans serveur (`VITE_DEMO=1`, données lues directement depuis `server/data/profile.json`)

## Règle principale : le contenu est dans les données
**Tout le contenu du site** vient de `server/data/profile.json`, servi par `GET /api/profile`.
Pour changer un texte, un projet, une compétence… modifie ce fichier, **pas les composants**.
Le schéma complet de chaque champ est documenté dans `GUIDE-A-REMPLIR.md`.

## API (`server/index.js`)
- `GET /api/profile` — contenu du site
- `GET /api/github` — dépôts + activité publique GitHub de `github.username` (cache 1 h, `GITHUB_TOKEN` optionnel)
- `POST /api/contact` — validation, champ piège anti-robot `website`, 5 envois / 15 min par IP, sauvegarde dans `server/data/messages.json`, email via SMTP si configuré dans `.env`
- `GET /api/health`
- `/api/admin/*` (`server/admin.js`) — back-office : connexion par `ADMIN_PASSWORD` (`.env`), jeton signé `ADMIN_SECRET` (12 h), `PUT /profile` (vérifie les types, copie de secours dans `data/backups/`, écriture atomique), `POST /upload` (base64, PNG/JPG/WEBP/GIF/PDF, 10 Mo → `server/uploads/`, servi sur `/uploads`), messages, sauvegardes

## Front (`client/src/`)
- `api.js` — tous les appels réseau passent par ici (gère le mode démo, `assetUrl()` pour les fichiers `/uploads`, client `admin`)
- `/admin` — back-office (`components/admin/Admin.jsx` + `Fields.jsx`, chargé à la demande depuis `main.jsx`). L'éditeur se construit à partir de la forme des données : un nouveau champ de `profile.json` y apparaît tout seul ; libellés et modèles de listes vides dans `Fields.jsx`
- `App.jsx` — ordre des sections, palette Ctrl+K, état des modales (CV)
- `hooks/motion.js` — `useInView`, `useCountUp`, `reducedMotion`
- `components/` : `Boot`, `Cursor`, `Nav`, `Hero` + `WaveField` (shader GLSL Three.js) + `HoloRobot` (scène hologramme Three.js : robot qui salue et « prononce » le nom : le h1 se réécrit lettre par lettre via `Scramble speak`, drones, mini-robot analyste), `Marquee`, `About`, `Services` + `CardBot` (robots SVG/CSS sur les cartes), `Process` + `ProcessBot` (robot SVG qui explique chaque étape avec des gestes, poses pose-0…4), `Skills`, `Projects` + `HoloShowcase` (robot androïde hologramme en points qui présente les projets dans des panneaux cliquables) + `ProjectDetail` (page plein écran, lien `#projet-<slug>`, flèches ← →), `MiniViz` (canvas 2D), `Journey` + `JourneyBots` (un robot SVG devant chaque expérience selon le rôle : développeur au clavier / stagiaire ; drone qui synchronise les formations), `GitHub`, `Testimonials`, `Terminal` + `TermBot` (robot qui tient le terminal, réagit à la frappe), `Faq` (voix de robot au survol via `hooks/voice.js`, synthèse vocale du navigateur, bouton on/off), `Contact`, `CV` (imprimable), `CommandPalette`, `Modal`, `Reveal`, `Scramble`, `Magnetic`, `SectionHead`
- `styles.css` — un seul fichier. Couleurs et polices en variables sur `:root` (`--bg`, `--panel`, `--line`, `--fg`, `--muted`, `--accent`, `--signal`, `--ok`, `--f-display`, `--f-body`, `--f-mono`). Toujours réutiliser ces variables.

## Conventions
- Thème sombre « console système » : polices Chakra Petch (titres), IBM Plex Sans (texte), JetBrains Mono (labels techniques)
- Chaque section a une adresse hexadécimale (`0x01`, `0x02`…) via `<SectionHead addr title />`
- Toute animation doit respecter `prefers-reduced-motion` (voir `reducedMotion()`)
- Le contenu reste visible même si une animation ne se déclenche pas
- Responsive obligatoire jusqu'à 390 px de large
- Captures de projets dans `client/public/projects/<slug>/`
