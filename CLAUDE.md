# CLAUDE.md — Tigon Client Portal

## Project
Self-hosted client portal for Tigon Automation. Clients submit impulses (feedback, change requests, questions, ideas) and track project milestones. Admins manage all clients and projects.

## Stack
- Next.js 16 (App Router, src dir, TypeScript)
- Tailwind CSS v4 (CSS-based config in globals.css, no tailwind.config.ts)
- Prisma 7 + PostgreSQL (self-hosted, NOT Supabase)
- Native auth: bcryptjs + jose, HttpOnly cookies, JWT access/refresh
- Zustand 5 (auth store, persist to localStorage)
- framer-motion 12, lucide-react, clsx + tailwind-merge
- Deployment: Coolify (standalone output) — NOT Vercel

## Design System (Tigon)
- Dark bg: `#08090E`
- Card bg: `#0F1218`
- Border: `#1E2330`
- Accent/gold: `#C8964A`
- Text primary: `#FAFAF8`
- Text muted: `#9CA3AF`
- Font serif: Instrument Serif (headings/display, variable: --font-instrument-serif)
- Font sans: Inter (body, variable: --font-inter)

## Auth
- Access token: 1h, `access_token` cookie (HttpOnly, sameSite: lax)
- Refresh token: 7d, `refresh_token` cookie (path=/api/auth/refresh)
- Roles: ADMIN (Edon/Gent) | CLIENT (project contacts)
- ADMIN routes: /admin/* | CLIENT routes: /dashboard/*
- Middleware: src/middleware.ts enforces role-based access

## Key Files
- `src/lib/auth.ts` — auth helpers (hash, sign, verify, cookies, getAuthUser)
- `src/lib/prisma.ts` — Prisma singleton
- `src/stores/auth-store.ts` — Zustand auth store
- `src/components/auth/auth-provider.tsx` — AuthProvider + ProtectedRoute
- `src/middleware.ts` — route protection
- `prisma/schema.prisma` — data model
- `prisma/seed.ts` — test data

## CRITICAL: Prisma Import Path
Import from `@/generated/prisma` (NOT `@prisma/client`):
```typescript
import { PrismaClient, type Role } from "@/generated/prisma";
```

## Dev Commands
```bash
npm run dev         # dev server (bind 0.0.0.0, erreichbar via http://habit:3001)
npm run db:migrate  # create + apply migration (lokal)
npm run db:seed     # seed test data
npm run db:generate # regenerate Prisma client
npm run db:studio   # Prisma Studio
```

NIE `db:push` benutzen — wir tracken Migrations explizit. Schema-Aenderung => `db:migrate`.

## Env Files
- `.env.local` — Source of Truth fuer lokale Entwicklung (Symlink: `.env -> .env.local`)
- `.env.staging` — Staging-Secrets (DB-URL nur intern erreichbar, siehe Datei-Header)
- `.env.example` — committed Template fuer neue Devs
- `.env.production` — gibt's nicht im Repo, lebt nur in Coolify Web-UI

## First-Time DB Setup
```bash
docker run -d --name tigon-portal-postgres \
  -e POSTGRES_USER=tigon -e POSTGRES_PASSWORD=tigon_dev_2026 -e POSTGRES_DB=tigon_portal \
  -p 54323:5432 postgres:16-alpine
cp .env.example .env.local
ln -sf .env.local .env
npm install
npm run db:migrate
npm run db:seed
```

## Dev Workflow (siehe /dev Skill)
```
arbeits-branch (lokal) ──/dev push──→ dev (Coolify Staging) ──/dev done──→ main (Coolify Production)
```
- Coolify Staging trackt `dev` (geaendert 2026-04-13).
- Coolify Production trackt `main` (TBD — noch nicht gesetzt).
- Staging-Container laeuft `prisma migrate deploy` beim Start (docker-entrypoint.sh).

## Deployment (Coolify)
- App UUIDs siehe `~/tigon/intern/coolify-credentials.md`
- Env-Vars in Coolify Web-UI gepflegt (NICHT im Repo)
- Build: `npm run build`
- Start: `sh docker-entrypoint.sh` (macht migrate + optional seed + start)
- Port: 3000

## Test Credentials
- Admin: edon@tigonautomation.de / admin123
- Admin: gent@tigonautomation.de / admin123
- Client: ap@fachwelt-verlag.de / client123
- Client: marlon@horbach.de / client123

## Architecture Decisions
- No Supabase — PostgreSQL on Hetzner VPS via Prisma
- No Vercel — Coolify only (standalone output)
- No NextAuth — native auth for full control
- Impulses = core UX primitive (Feedback/Change Request/Question/Idea)
- Flat role model: ADMIN | CLIENT

## Collab Status
- **Last Session:** 2026-04-14 (Gent)
- **Last Author:** Gent
- **Phase:** Multi-Tenancy gehaertet (4 P0-Leaks geschlossen), Task-Status-PATCH funktional, Multi-Assign Backend verifiziert
- **Next Action:** Staging-Deploy verifizieren (erster migrate-deploy mit den 2 Migrations) + Multi-Assign UI im Browser final pruefen
