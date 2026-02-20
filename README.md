# Groupement d'Achat en Circuit Court

Plateforme web pour gérer les commandes groupées auprès de producteurs locaux.

## Stack technique

- **Frontend/Backend** : Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Base de données** : PostgreSQL + Prisma v7 (adaptateur `@prisma/adapter-pg`)
- **Authentification** : NextAuth.js v5 — credentials (coordinateurs) + magic link (membres)
- **Exports** : jsPDF + ExcelJS
- **Emails** : Resend

## Installation

### Prérequis
- Node.js 20+
- PostgreSQL (local ou Neon/Supabase en production)

### Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer .env.local (voir section ci-dessous)

# 3. Générer le client Prisma et migrer la base de données
npx prisma generate
npx prisma migrate dev --name init

# 4. Créer le premier coordinateur
npm run db:seed

# 5. Démarrer le serveur
npm run dev
```

Application accessible sur http://localhost:3000

## Variables d'environnement (`.env.local`)

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
AUTH_SECRET="générer avec : openssl rand -base64 32"
AUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@votre-domaine.fr"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SEED_COORDINATOR_EMAIL="coordinateur@exemple.fr"
SEED_COORDINATOR_PASSWORD="MotDePasseSecurise!123"
```

## Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| **Coordinateur** | Gestion producteurs, commandes groupées, membres, paiements, exports |
| **Membre** | Catalogue, passer commande, historique, calendrier |
| **Producteur** | Consultation de ses commandes, téléchargement PDF/Excel |

## Commandes utiles

```bash
npm run dev           # Serveur de développement
npm run build         # Build production
npm test              # Tests unitaires (Vitest)
npm run db:seed       # Créer le coordinateur initial
npm run db:studio     # Interface Prisma Studio
npx prisma migrate dev --name nom  # Nouvelle migration
```

## Déploiement (Vercel + Neon)

1. Créer une base PostgreSQL sur [Neon](https://neon.tech) (intégration Vercel native)
2. Configurer toutes les variables d'environnement dans Vercel
3. Le `vercel.json` gère la migration et le build automatiquement

## Structure

```
src/
├── app/
│   ├── (auth)/login, register
│   ├── (coordinator)/dashboard, producteurs, commandes-groupees, paiements, membres, points-livraison
│   ├── (member)/catalogue, commandes, calendrier, historique
│   ├── (producer)/mes-commandes
│   └── api/                   ← Routes API Next.js
├── lib/
│   ├── auth.ts                ← Config NextAuth v5
│   ├── prisma.ts              ← Client Prisma singleton (adaptateur pg)
│   ├── export-utils.ts        ← Génération PDF + Excel
│   ├── price-utils.ts         ← Calculs avec snapshot des prix
│   └── calendar-utils.ts      ← Couleurs et mapping calendrier
├── middleware.ts               ← Protection des routes par rôle
└── types/next-auth.d.ts       ← Types session étendus
```
