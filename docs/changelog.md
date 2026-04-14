# Changelog — Tigon Client Portal

### 2026-04-14 (Gent)
- Multi-Tenancy Hardening: 4 P0 Tenant-Leaks in Admin-List-GETs geschlossen — `/api/admin/infrastruktur` (+ `[serverId]`), `/api/admin/dokumente`, `/api/admin/notizen`, `/api/admin/impulse` filtern jetzt nach `workspaceId` (Impulse via `project.workspaceId`-Relation, kein direktes Feld)
- Task-Status PATCH: `status` zu `updateTaskSchema` hinzugefuegt + Handler in `/api/admin/aufgaben/[taskId]` mit `completedAt`-Auto-Sync (DONE setzt completedAt, Reopen nullt es)
- Credentials POST: Invalid `type` gibt jetzt 400 zurueck statt 500 (Pre-Validation gegen `CredentialType` Enum bevor Prisma erreicht wird)
- Multi-Assign API verifiziert: `assigneeIds`-Array auf Task-PATCH persistiert beide User, Board-Endpoint liefert "Gent Cungu, Edon Muratovic"
- FK-Injection-Guards: Neue Helpers `assertClientInWorkspace` / `assertProjectInWorkspace` in `src/lib/api.ts`; eingebaut in 8 Create/Update-Routen (aufgaben POST+PATCH, dokumente POST, infrastruktur POST+PATCH, zugangsdaten POST+PATCH, notizen POST+PATCH) — verhindert dass cross-workspace clientId/projectId referenziert werden koennen
- Notizen Tag-Liste: `/api/admin/notizen/tags` filtert jetzt nach `workspaceId` + `deletedAt: null` (war vorher global ueber alle Workspaces)
- Dashboard "Naechste Deadlines" Widget statt "Meine Aufgaben" (filtert nach `dueDate: { not: null }`, sortiert aufsteigend, Overdue-Styling)
- Nightly-Export Script (`scripts/nightly-export.sh`) + Cron (03:00 Uhr) → `~/tigon/_export/tigon-portal/*.sql.gz`, 14-Tage-Retention

### 2026-04-13 (Gent)
- Schema: `ClientStatus` (3 Werte) → `ClientStage` (6: COLD/WARM/ACTIVE/PRO_BONO/PAUSED/ENDED)
- Schema: `Note` Model entfernt → `KnowledgeEntry` mit `category: EntryCategory` (13 Kategorien inkl. CHANGELOG, DECISION, MEETING_NOTE etc.)
- Schema: `Project.clientId` jetzt nullable — erlaubt PRODUCT + INTERNAL Projekte ohne Kunden-Zuordnung
- Admin API `/api/admin/notizen` migriert auf `knowledgeEntry` (Body: `category` statt `type`, Response: `entries`/`entry`)
- Admin API `/api/admin/kunden/[clientId]` akzeptiert jetzt `stage` (6 Werte) statt `status` (3 Werte)
- UI Badge: `NoteTypeBadge` → `EntryCategoryBadge` mit 13 Kategorien-Labels + Farben
- Bugfix: Projekt-Detail/Edit-Pages rendern jetzt ohne Kunden (nullable handling)
- Neue Libs: `src/lib/api.ts`, `src/lib/constants.ts`, `src/lib/format.ts`, `src/lib/validations/`
- Phase 3: Sidebar erweitert (Dashboard/Aufgaben/Wissen), Server-side Admin-Dashboard mit Stats, Aufgaben-System (Task-API + Board mit Filter/Inline-Create/optimistic Toggle), Wissen-Page (Filter, Suche, Inline-CRUD)
- Wissen-Polish: Markdown-Rendering (react-markdown + GFM), Tag-Chips mit Autocomplete + URL-Filter, Pin-Toggle/Quick-Action + Sort pinned-first, Write/Preview-Tabs im Editor, neuer Endpoint `/api/admin/notizen/tags`, Notizen-API über Zod-Schemas validiert
- Task-Detail/Edit-Page unter `/admin/aufgaben/[taskId]`: GET-Endpoint für einzelne Task, Server-Component lädt Task/Clients/Projekte/Admins parallel, Client-Form mit Priority/Assignee/Client→Project-Filter/Due/Completed + Delete
- Aufgaben-Board Titel linkt jetzt zur Detail-Page
- Lint-Fix `tag-input.tsx`: setState-in-effect Anti-Pattern durch Render-time state replacement ersetzt
- Eslint-Config: `src/generated/**` ignoriert (Prisma 7 Generated Code Noise)
- next.config: `allowedDevOrigins: ["habit"]` für Server-Remote-Dev via Tailscale
- docker-entrypoint: `prisma db push` → `prisma migrate deploy`
- Prisma schema: explizit `url = env("DATABASE_URL")` in datasource
