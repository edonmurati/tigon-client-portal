# Changelog — Tigon Client Portal

### 2026-04-13 (Gent)
- Schema: `ClientStatus` (3 Werte) → `ClientStage` (6: COLD/WARM/ACTIVE/PRO_BONO/PAUSED/ENDED)
- Schema: `Note` Model entfernt → `KnowledgeEntry` mit `category: EntryCategory` (13 Kategorien inkl. CHANGELOG, DECISION, MEETING_NOTE etc.)
- Schema: `Project.clientId` jetzt nullable — erlaubt PRODUCT + INTERNAL Projekte ohne Kunden-Zuordnung
- Admin API `/api/admin/notizen` migriert auf `knowledgeEntry` (Body: `category` statt `type`, Response: `entries`/`entry`)
- Admin API `/api/admin/kunden/[clientId]` akzeptiert jetzt `stage` (6 Werte) statt `status` (3 Werte)
- UI Badge: `NoteTypeBadge` → `EntryCategoryBadge` mit 13 Kategorien-Labels + Farben
- Bugfix: Projekt-Detail/Edit-Pages rendern jetzt ohne Kunden (nullable handling)
- Neue Libs: `src/lib/api.ts`, `src/lib/constants.ts`, `src/lib/format.ts`, `src/lib/validations/`
