# Handoff — Tigon Client Portal
Letzte Session: 2026-04-16 (Gent)

## Was wurde gemacht
- Phase 1-3 Data Migration abgeschlossen: Schema erweitert + Seed mit ALLEN Business-Daten aus ~/tigon/ und ~/projects/*/docs/
- Admin-Login gefixt: Emails auf gent.cungu@/edon.murati@tigonautomation.de, Passwort tigon2026
- Alle Seed-Scripts + CLAUDE.md auf neue Emails konsistent gemacht

## Was ist offen
- Browser-Test: Portal durchklicken, pruefen ob alle 72 Decisions, 51 Journals, 49+ Knowledge Entries korrekt angezeigt werden
- `/dev push` + `/dev done` stehen noch aus
- Staging-DB hat die neuen Schema-Felder noch nicht (Migration muss auf Staging laufen)

## Landminen
- **Seed braucht existierende User:** `seed-data.ts` macht `findFirstOrThrow` auf `gent.cungu@tigonautomation.de` — wenn die DB frisch ist, muss zuerst `seed-admin.ts` laufen (erstellt Workspace + Gent-User)
- **seed-admin.ts erstellt nur Gent**, `seed-fixture.ts` erstellt Edon — beide muessen vor `seed-data.ts` laufen
- **bcryptjs Hash-Timing:** Seed setzt Hash via `update`, aber wenn der Seed abbricht bevor der Hash-Block laeuft, bleibt der alte Hash. Bei Login-Problemen: Hash manuell verifizieren

## Naechster Schritt
Browser-Test auf http://habit:3002 — alle Admin-Bereiche durchklicken, dann `/dev push`.
