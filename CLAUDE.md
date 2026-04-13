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
npm run dev         # dev server
npm run db:push     # push schema (no migration file)
npm run db:migrate  # create + apply migration
npm run db:seed     # seed test data
npm run db:generate # regenerate Prisma client
npm run db:studio   # Prisma Studio
```

## First-Time DB Setup
```bash
createdb tigon_portal
npm run db:push
npm run db:generate
npm run db:seed
```

## Deployment (Coolify)
- Env: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
- Build: `npm run build`
- Start: `node .next/standalone/server.js`
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
- **Last Session:** 2026-04-13 (Gent)
- **Last Author:** Gent
- **Phase:** Phase 3 (Admin Dashboard — Sidebar + Dashboard + Aufgaben + Wissen + KB-Polish fertig)
- **Next Action:** PR #1 (Phase 1-2) mergen, dann PR #2 + #3 stacked reviewen mit Edon
