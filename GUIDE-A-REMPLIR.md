# Guide : ce que tu dois remplir

Tout se passe dans **un seul fichier** : `server/data/profile.json`.
Tu remplaces les valeurs entre guillemets, tu sauvegardes, et le site se met à jour (recharge la page).

> Règle d'or du JSON : garde les guillemets `"…"`, les virgules entre les éléments, et pas de virgule après le dernier élément d'une liste.

---

## ✅ Checklist rapide

- [ ] 1. Identité (nom, pseudo, rôles, phrase d'accroche)
- [ ] 2. Disponibilité
- [ ] 3. À propos + fiche + chiffres clés
- [ ] 4. Services et tarifs
- [ ] 5. Compétences, outils, langues
- [ ] 6. **Projets** (le plus important) + captures d'écran
- [ ] 7. Expérience, formation, certifications
- [ ] 8. Résumé du CV
- [ ] 9. Pseudo GitHub
- [ ] 10. Avis clients (ou supprimer la section)
- [ ] 11. FAQ
- [ ] 12. Contacts
- [ ] 13. Titre de l'onglet dans `client/index.html`

---

## 1. Identité

| Champ | Exemple | À toi |
|---|---|---|
| `name` | `"Kouadio Yao"` | ton nom complet |
| `handle` | `"kouadio-yao"` | ton pseudo, sans espace ni accent (apparaît dans `~/kouadio-yao.dev`) |
| `location` | `"Abidjan, Côte d'Ivoire"` | ta ville |
| `roles` | `["Développeur Full-Stack", "…"]` | 2 à 4 titres qui défilent sous ton nom. **Le premier** sert de titre principal |
| `tagline` | une phrase | ce que tu fais pour les gens, en 1 à 2 phrases |

## 2. Disponibilité

```json
"availability": {
  "available": true,
  "label": "Disponible pour missions dès janvier 2027",
  "types": ["Freelance", "CDI", "Remote"]
}
```
`available: false` affiche « En mission » en orange.

## 3. À propos, fiche et chiffres

- `about` : 2 paragraphes. Le 1er : qui tu es et ce que tu aimes faire. Le 2e : ton parcours, ce que tu cherches.
- `specs` : petites lignes de la fiche (Rôle, Base, Langues…). Ajoute ou retire des lignes librement.
- `stats` : 4 chiffres animés. **Mets uniquement des chiffres vrais.**
  ```json
  { "value": 18, "suffix": "", "label": "projets livrés" }
  ```
  `value` doit être un nombre sans guillemets. `suffix` s'affiche juste après (`"+"`, `" %"`…).

## 4. Services

Pour chaque offre :
```json
{
  "code": "SRV-01",
  "title": "Site vitrine",
  "description": "Une phrase sur ce que le client obtient.",
  "features": ["Point 1", "Point 2", "Point 3"],
  "price": "à partir de 250 000 FCFA",
  "delay": "1 à 2 semaines",
  "featured": true
}
```
`featured: true` met une seule offre en avant (« le plus demandé »). Si tu ne fais pas de freelance, tu peux vider la liste : `"services": []` (pense alors à retirer `<Services />` dans `client/src/App.jsx`).

## 5. Compétences

- `skills` : 3 groupes, chacun avec ses technos et un niveau de 0 à 100. Sois honnête : un recruteur te testera dessus.
- `tools` : tes outils (VS Code, Figma, Postman…).
- `softSkills` : 3 à 5 qualités, formulées concrètement.
- `languages` : `{ "name": "Anglais", "level": "Professionnel (B2)" }`.
- `marquee` : la liste des technos du bandeau défilant.

## 6. Projets ⭐

C'est ce que les recruteurs regardent le plus. Mets **3 à 6 vrais projets**, même des projets d'école ou personnels.
Chaque champ alimente la page de détail qui s'ouvre au clic.

```json
{
  "slug": "mon-projet",
  "title": "Mon Projet",
  "tagline": "Une phrase d'accroche qui dit le bénéfice.",
  "category": "Web",
  "tag": "Fintech",
  "year": "2026",
  "role": "Développeur full-stack",
  "client": "Nom du client, « Projet d'école » ou « Projet personnel »",
  "duration": "3 mois",
  "team": "Seul",
  "status": "En production",
  "description": "2 phrases affichées sur la carte.",
  "problem": "Quel problème existait AVANT ton projet ?",
  "solution": "Qu'as-tu construit, et comment ça règle le problème ?",
  "features": ["Fonctionnalité 1", "Fonctionnalité 2", "Fonctionnalité 3"],
  "architecture": {
    "Front-end": ["React"],
    "Back-end": ["Node.js", "Express"],
    "Base de données": ["MongoDB"],
    "Infra": ["Render"]
  },
  "challenges": [
    { "title": "Le problème technique rencontré", "text": "Comment tu l'as résolu." }
  ],
  "learnings": "Ce que ce projet t'a appris, en une phrase.",
  "results": [
    { "value": "500", "label": "utilisateurs inscrits" },
    { "value": "-40 %", "label": "de temps de chargement" }
  ],
  "stack": ["React", "Node", "MongoDB"],
  "metric": "▲ 500 utilisateurs",
  "viz": "wave",
  "images": [
    { "src": "/projects/mon-projet/1.png", "caption": "Tableau de bord" },
    { "src": "/projects/mon-projet/2.png", "caption": "Version mobile" }
  ],
  "link": "https://github.com/ton-pseudo/mon-projet",
  "demo": "https://mon-projet.onrender.com"
}
```

**Explications :**
- `slug` : identifiant sans espace ni accent. Il crée le lien direct `tonsite.com/#projet-mon-projet` à envoyer à un recruteur.
- `category` : crée automatiquement les filtres (`Web`, `Mobile`, `API`, `Data`…).
- `tag` : le domaine (Fintech, Éducation, Santé…). **Retire le mot « Exemple »** des projets fournis.
- `results` : 2 ou 3 résultats chiffrés. Pas de chiffres ? Mets du concret : `{ "value": "3", "label": "écrans principaux" }`.
- `challenges` : 1 à 3 vrais problèmes techniques. C'est ce qui impressionne le plus un développeur senior.
- `viz` : l'animation de la carte quand il n'y a pas d'image (`wave`, `graph` ou `bars`).
- `link` / `demo` : laisse `""` si le code est privé ou s'il n'y a pas de démo.

### 📸 Captures d'écran
1. Crée un dossier par projet dans `client/public/projects/` : `client/public/projects/mon-projet/`
2. Mets-y tes images : `1.png`, `2.png`… (format paysage, environ 1600 × 1000 px, moins de 500 Ko chacune — compresse-les sur squoosh.app)
3. Référence-les dans `images`. **La première image devient la couverture de la carte.**

## 7. Parcours

- `experience` : emplois, stages, freelance. Du plus récent au plus ancien.
  ```json
  { "when": "2024 — aujourd'hui", "title": "Développeur", "org": "Entreprise · Ville", "text": "Ce que tu as fait, avec des verbes d'action.", "tags": ["React", "Node"] }
  ```
- `education` : diplômes, même structure (sans `tags`).
- `certifications` : `{ "name": "…", "issuer": "…", "year": "2025", "link": "lien de vérification ou vide" }`. Supprime celles que tu n'as pas.

## 8. CV

- `cv.summary` : 2 à 3 phrases, en haut de ton CV.
- `cv.file` : si tu as déjà un CV en PDF, mets-le dans `client/public/cv.pdf` et écris `"/cv.pdf"`. Sinon laisse `""` : le CV est généré automatiquement depuis toutes tes données, et le bouton « Enregistrer en PDF » le transforme en PDF.

## 9. GitHub

```json
"github": { "username": "ton-pseudo-github" }
```
La section affiche alors **ta vraie activité**. Tant que c'est vide, elle montre des données d'exemple.

## 10. Avis clients

Uniquement des **vrais avis**, avec l'accord de la personne :
```json
{ "quote": "Ce qu'il/elle a dit.", "name": "Prénom N.", "role": "Poste, entreprise", "example": false }
```
Tu n'as pas encore d'avis ? Vide la liste (`"testimonials": []`) et retire `<Testimonials … />` dans `client/src/App.jsx`. Un avis de professeur ou de maître de stage marche aussi.

## 11. FAQ

`{ "q": "La question ?", "a": "La réponse." }` — adapte les réponses sur le paiement et la maintenance à ta façon de travailler.

## 12. Contacts

| Champ | Format |
|---|---|
| `email` | `"toi@gmail.com"` |
| `github` | `"https://github.com/ton-pseudo"` |
| `linkedin` | `"https://linkedin.com/in/ton-profil"` |
| `phone` | `"+225 07 12 34 56 78"` (affiché) |
| `whatsapp` | `"2250712345678"` (sans `+` ni espace, pour le lien WhatsApp) |

## 13. Titre et description du site

Dans `client/index.html`, change :
```html
<title>Ton Nom · Développeur Full-Stack</title>
<meta name="description" content="…" />
```
C'est ce qui s'affiche dans Google et quand tu partages ton lien sur WhatsApp ou LinkedIn.

---

## Voir le résultat

```bash
npm run dev
```
Puis ouvre http://localhost:5173. Chaque fois que tu sauvegardes `profile.json`, recharge la page.

**Une erreur après une modification ?** C'est presque toujours une virgule ou un guillemet. Colle ton fichier sur jsonlint.com pour trouver la ligne fautive.
