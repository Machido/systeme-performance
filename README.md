# ⚡ Système Performance

App de suivi de performance personnelle — projets, tâches, journal, objectifs & KPIs.

## 🚀 Déploiement en 4 étapes

### Étape 1 — Créer la base de données Supabase (2 min)

1. Va sur [supabase.com](https://supabase.com) → **Start your project** (gratuit)
2. Crée un nouveau projet (nom : `systeme-performance`, mot de passe : ce que tu veux)
3. Attends ~1 minute que le projet soit prêt
4. Va dans **SQL Editor** (menu de gauche)
5. Copie-colle tout le contenu du fichier `supabase-schema.sql` → clique **Run**
6. Va dans **Settings** → **API** et note :
   - **Project URL** (ex: `https://abc123.supabase.co`)
   - **anon public key** (la clé qui commence par `eyJ...`)

### Étape 2 — Push sur GitHub (2 min)

1. Va sur [github.com](https://github.com) → **New repository**
2. Nom : `systeme-performance` — laisse-le **public** ou **private**, peu importe
3. **Ne coche rien** (pas de README, pas de .gitignore)
4. Dans ton terminal :

```bash
cd systeme-performance
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/systeme-performance.git
git push -u origin main
```

### Étape 3 — Déployer sur Vercel (2 min)

1. Va sur [vercel.com](https://vercel.com) → **Sign up with GitHub**
2. Clique **Add New** → **Project**
3. Importe ton repo `systeme-performance`
4. Dans **Environment Variables**, ajoute :
   - `VITE_SUPABASE_URL` = ton Project URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = ta clé anon Supabase
5. Clique **Deploy** — c'est tout !

### Étape 4 — Ajouter sur téléphone (1 min)

1. Ouvre l'URL Vercel sur ton téléphone (Safari sur iOS, Chrome sur Android)
2. **iOS** : bouton Partager → "Sur l'écran d'accueil"
3. **Android** : menu ⋮ → "Ajouter à l'écran d'accueil"

Tu as maintenant une app qui ressemble à une app native ! 📱

---

## 🔧 Développement local

```bash
npm install
cp .env.example .env
# Remplis .env avec tes clés Supabase
npm run dev
```

L'app tourne sur `http://localhost:5173`

---

## 📁 Structure

```
systeme-performance/
├── index.html              # Point d'entrée HTML + PWA meta tags
├── package.json            # Dépendances (React, Recharts, Supabase)
├── vite.config.js          # Config Vite
├── supabase-schema.sql     # Script SQL à exécuter une fois dans Supabase
├── .env.example            # Template pour les variables d'environnement
├── public/
│   └── manifest.json       # PWA manifest pour Add to Home Screen
└── src/
    ├── main.jsx            # Point d'entrée React
    ├── supabase.js         # Client Supabase
    └── App.jsx             # L'app complète
```

## 🔄 Mises à jour futures

Pour mettre à jour l'app après des changements dans Claude :
1. Remplace `src/App.jsx` avec la nouvelle version
2. `git add . && git commit -m "update" && git push`
3. Vercel redéploie automatiquement en ~30 secondes
