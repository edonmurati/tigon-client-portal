# Handoff — Tigon Client Portal
Letzte Session: 2026-04-14 (Gent)

## Was wurde gemacht
- 4 P0 Multi-Tenancy-Leaks gefixt: `/api/admin/infrastruktur` (+ `[serverId]`), `/api/admin/dokumente`, `/api/admin/notizen`, `/api/admin/impulse` filtern nach `workspaceId`
- Task-PATCH unterstuetzt jetzt `status` (war silent ignored — fehlte in Zod-Schema) inkl. `completedAt`-Auto-Sync
- Credentials POST: Invalid Type → 400 statt 500
- Multi-Assign API verifiziert via curl gegen Demo-Task `cmnyk5ama0002vqfl2xq9yxwh`: beide Assignees persistieren, Board zeigt beide Namen

## Was ist offen
- Staging-Deploy verifizieren (erster `migrate deploy` mit den 2 Migrations vom 2026-04-13 — Baseline evtl. noetig)
- Multi-Assign Chip-Toggle UI final im Browser pruefen (Backend ist gruen)
- Restliches Frontend auf neue Schema-Shape (`workspaceId` ueberall mitgeben bei `create`)
- Seed-Script auf neues Schema umschreiben + in `prisma.config.ts` aktivieren
- Nightly-Export-Script (DB → `~/tigon/_export/`)

## Landminen
- **Tenant-Leak-Pattern war systematisch:** alle Admin-LIST-GETs ohne `workspaceId` haben geleakt. Beim Hinzufuegen neuer Admin-Routes IMMER `workspaceId: user.workspaceId` ins `where`. Bei Models ohne direktes Feld (Impulse, Task) via Relation: `project: { workspaceId }`.
- **Erster `migrate deploy` auf Staging:** `_prisma_migrations` evtl. leer → `npx prisma migrate resolve --applied <name>` fuer beide Migrations.
- **Prisma Import:** immer `@/generated/prisma`, NIE `@prisma/client`.

## Naechster Schritt
Multi-Assign UI im Browser an `/admin/aufgaben/cmnyk5ama0002vqfl2xq9yxwh` togglen + Board-Anzeige verifizieren. Danach Staging-Deploy.
