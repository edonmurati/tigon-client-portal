# Handoff — Tigon Client Portal
Letzte Session: 2026-04-13 (Gent)

## Was wurde gemacht
- 3 alte PRs gemerged (#1 direkt, #2+#3 als #4+#5 re-PR-ed nach Rebase)
- Task-Detail/Edit-Page unter `/admin/aufgaben/[taskId]` fertig (GET-Endpoint, Server+Client Component, Delete)
- Dev-Workflow eingerichtet: `.env.local`/`.env.staging`/`.env.example`, Coolify Staging trackt jetzt `dev`, docker-entrypoint auf `migrate deploy`
- Eslint `src/generated/**` ignoriert, tag-input setState-Anti-Pattern gefixt
- `scripts/staging-db-backup.sh` fuer on-demand Staging-DB-Backups via Coolify-API

## Was ist offen
- Staging-Deploy verifizieren (erster `migrate deploy` Lauf — Baseline evtl. noetig)
- Task-Detail-Page im Browser testen auf Staging
- Quick-Create-Modal, DnD-Sort, Client-seitiges Dashboard

## Landminen
- **Erster `migrate deploy` auf Staging:** Staging-DB war bisher `db push`-synced. Wenn `_prisma_migrations` Tabelle leer ist, failed der naechste Container-Start. Fix: im Container `npx prisma migrate resolve --applied 20260412190711_full_schema_redesign`.
- **Hetzner-Firewall blockt DB-Ports:** Coolify `is_public: true` allein reicht nicht — Hetzner-Cloud-Firewall muss fuer den Port geoeffnet werden. Backup via Coolify-API + Web-UI-Download ist der Workaround.
- **Prisma Import:** immer `@/generated/prisma`, NIE `@prisma/client`.

## Naechster Schritt
Staging-Deploy-Log in Coolify checken. Wenn migrate deploy failed → baselining. Wenn gruen → Task-Detail im Browser testen.
