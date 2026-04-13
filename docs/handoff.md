# Handoff — Tigon Client Portal
Letzte Session: 2026-04-13 (Gent)

## Was wurde gemacht
- Schema-Migration: ClientStatus→ClientStage (6 Werte), Note→KnowledgeEntry (13 Kategorien), Project.clientId nullable
- 5 Files angepasst: badge.tsx, note-editor/list, 2 Notizen-API-Routes, kunden-API
- 3 TypeScript-Fehler durch nullable Client-Relation gefixt (project detail/edit pages, impulse comments)
- Neue Helper-Libs erstellt (api.ts, constants.ts, format.ts, validations/)
- Build grün

## Was ist offen
- Alles uncommitted auf `main` — NICHT gepusht
- Phase 3: Sidebar-Nav (Dashboard, Aufgaben, Wissen), Dashboard-Page, Projekte-Liste, Aufgaben-System, Wissen/KB
- Dev-Server-Skript in package.json hat kein `-H 0.0.0.0` (manuell via `npx next dev -H 0.0.0.0`)

## Landminen
- **Branch-Status:** Änderungen liegen auf `main` statt Feature-Branch. Vor Push zwingend auf `gent/portal-phase-1-2` umziehen (Feedback-Memory: never push main).
- **Prisma Import:** `@/generated/prisma` nicht `@prisma/client`.
- **Migration:** `prisma/migrations/` ist untracked — noch keine SQL-Migration, nur `db:push`. Staging-DB braucht `prisma migrate deploy` wenn migration erstellt wird.

## Nächster Schritt
Branch `gent/portal-phase-1-2` erstellen, Änderungen committen, dann `/dev push` ausführen.
