# Portfolio — React + Node.js

Portfolio de développeur avec effets techniques inspirés des sites primés sur Awwwards :

- **Séquence de démarrage** façon terminal (elle attend vraiment la réponse de l'API)
- **Champ de 8 400 particules en WebGL** (Three.js + shaders GLSL) qui ondule autour de la souris, avec compteur FPS en direct
- **Texte « scramble »** qui se décode à l'arrivée de chaque titre, et effet **glitch** sur le nom
- **Curseur personnalisé** et **boutons magnétiques**
- **Cartes projets en 3D** (inclinaison + reflet lumineux) avec mini-visualisations animées en Canvas
- **Compétences en « moniteur système »** avec barres animées
- **Terminal interactif** : `help`, `whoami`, `skills`, `projects`, `status` (interroge le serveur Node en direct), `sudo hire-me`…
- **Formulaire de contact** branché sur l'API Node : sujet, validation, anti-spam, sauvegarde et envoi par email (optionnel)

**Sections**

| Section | Contenu |
|---|---|
| Profil | présentation, fiche technique, chiffres clés animés |
| Services | 4 offres avec tarifs en FCFA, délais, bouton « Demander un devis » qui pré-remplit le formulaire |
| Ma méthode | les 5 étapes d'un projet, avec une ligne de progression animée |
| Compétences | moniteur système, outils, savoir-être, langues |
| Projets | filtres (Web / API / Mobile) et **étude de cas** en fenêtre : problème, solution, résultats |
| Parcours | onglets Expérience / Formation / Certifications |
| Activité GitHub | **vraies données** via l'API Node : grille de contributions, langages, meilleurs dépôts |
| Avis | carrousel de témoignages |
| Terminal | commandes `help`, `services`, `cv`, `status`… |
| FAQ | questions fréquentes en accordéon |
| Contact | formulaire + email, WhatsApp, GitHub, LinkedIn |
| **CV** | généré automatiquement depuis tes données, exportable en PDF (bouton « Enregistrer en PDF ») |
| **Ctrl + K** | palette de commandes pour naviguer au clavier (bouton « menu » sur mobile) |

## Structure

```
portfolio/
├── client/                 → React + Vite + Three.js
│   └── src/
│       ├── App.jsx
│       ├── styles.css
│       ├── hooks/motion.js
│       └── components/     → Boot, Hero, WaveField, Terminal, Contact…
├── server/                 → Node.js + Express
│   ├── index.js            → routes /api/profile, /api/contact, /api/health
│   ├── data/profile.json   → ⭐ TOUT TON CONTENU EST ICI
│   └── .env.example
└── package.json            → lance les deux en même temps
```

## Démarrer

Il faut **Node.js 18.11 ou plus**.

```bash
cd portfolio
npm run install:all
npm run dev
```

- Site : http://localhost:5173
- API : http://localhost:5000/api/profile

## Personnaliser

Ouvre **`server/data/profile.json`** et remplace : nom, rôles, texte « à propos », compétences (niveau en %), projets, parcours et contacts. Rien à toucher dans le code React : tout le site se construit à partir de ce fichier.

Points utiles :

- `github.username` : ton pseudo GitHub. Tant qu'il est vide, la section affiche des données d'exemple.
- `projects[].category` : crée automatiquement les filtres. `viz` choisit l'animation de la carte (`wave`, `graph` ou `bars`).
- `testimonials[].example` : mets `false` (ou supprime la ligne) quand c'est un vrai avis client.
- `cv.file` : si tu as déjà un CV en PDF, place-le dans `client/public/cv.pdf` et écris `"/cv.pdf"`. Sinon le CV est généré à partir de tes données.
- `contact.whatsapp` : ton numéro au format international sans `+` ni espaces (ex. `2250700000000`).
- `availability` : ton statut (disponible ou en mission) affiché en haut du site.

⚠️ Les projets, avis, entreprises et certifications fournis sont des **exemples** : remplace-les par tes vraies informations avant de publier.

## Recevoir les messages par email (optionnel)

Sans configuration, les messages du formulaire sont enregistrés dans `server/data/messages.json`.
Pour les recevoir aussi par email :

```bash
cp server/.env.example server/.env
```

Puis remplis les lignes `SMTP_…` (avec Gmail : crée un « mot de passe d'application » dans ton compte Google).

## Routes de l'API Node

| Route | Rôle |
|---|---|
| `GET /api/profile` | toutes les données du site |
| `GET /api/github` | dépôts et activité GitHub (cache 1 h) |
| `POST /api/contact` | reçoit les messages (5 max / 15 min par IP) |
| `GET /api/health` | état du serveur (utilisé par la commande `status`) |

## Mettre en ligne

```bash
npm run build     # construit le front dans client/dist
npm start         # Express sert le site ET l'API sur un seul port
```

Hébergeurs adaptés à un serveur Node : **Render**, **Railway** ou un VPS.
Commande de build : `npm run install:all && npm run build` — commande de démarrage : `npm start`.
