# Handoff — Tigon Client Portal
Letzte Session: 2026-04-13 (Gent)

## Was wurde gemacht
- Phase 1-2 Commit `39c196b` auf `gent/portal-phase-1-2` gepusht + PR #1 erstellt
- `npm run dev` binded nun auf `0.0.0.0` (dev auf Server funktioniert via `http://habit:3000`)
- Phase 3 begonnen: Sidebar um Dashboard/Aufgaben/Wissen erweitert, Dashboard-Page, Aufgaben-System (API + UI), Wissen-Page

## Was ist offen
- PR #1 (Phase 1-2) reviewen + mergen
- Phase 3 Polishing: Task-Detail/Edit, Quick-Create-Modal, Drag-and-Drop Sort
- Client-seitiges Dashboard
- KB-Editor Quality-of-Life (Markdown-Preview, Tag-Autocomplete)

## Landminen
- **Prisma Import:** immer `@/generated/prisma`, NIE `@prisma/client`.
- **Migration vs db:push:** Phase 1-2 ist noch `db:push`-basiert (keine Migration-Files). Vor Production-Deploy `prisma migrate dev --name schema_shift_phase12` erstellen.
- **Task-assigneeId:** CUID-Validation greift nur für User die existieren. Bei Seed/Import aufpassen.

## Nächster Schritt
PR #1 mergen, dann Feedback-Zyklus zu Dashboard + Aufgaben mit Edon.
