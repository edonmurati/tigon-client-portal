# Decisions — Tigon Client Portal

## 2026-04-16: Admin-User Emails auf volle Domain-Adressen
**Warum:** Login mit `gent@tigonautomation.de` war inkonsistent mit der realen Email `gent.cungu@tigonautomation.de`. Operator konnte sich nicht einloggen. Alle Seed-Scripts, CLAUDE.md und DB auf `gent.cungu@` / `edon.murati@` umgestellt.
**Alternativen:** Kurzform behalten und im Login-Flow aliasing machen — verworfen, unnoetige Komplexitaet.

## 2026-04-16: Playbooks bleiben als Files, nicht in DB
**Warum:** Playbooks/SOPs sind HOW-TOs fuer Claude (Verhaltensregeln) — kein operatives Business-Wissen. Sie gehoeren in den HABIT-Layer (Files), nicht in die DB. Urspruenglicher Plan sah ein `Playbook` Model vor, wurde gestrichen.
**Alternativen:** Playbook-Model in Prisma — verworfen, weil Playbooks von Claude gelesen werden und File-basiert besser integrieren.

## 2026-04-13: Schema-Shift zu Stage-Model + Knowledge Entries
**Warum:** Portal war zu CRM-lastig (Status) und hatte nur generische "Notes". Gent will Ordner-CRM-Logik (cold→warm→active→pro_bono→paused→ended) abbilden und Wissens-Einträge kategorisiert speichern (Changelog, Decision, Meeting Note, etc.). `Note` war zu flach für die tatsächliche Nutzung.
**Alternativen:** (1) `Note` behalten + Tags statt Kategorien — verworfen, zu lose. (2) Separate Models pro Typ (Meeting, Decision...) — verworfen, Explosion der Tabellen. (3) Status auf 3 Werte lassen — verworfen, matcht nicht die Realität der Kunden-Pipeline.

## 2026-04-13: `Project.clientId` nullable
**Warum:** Portal muss auch PRODUCT- und INTERNAL-Projekte tragen (eigene Tigon-Produkte, interne Tools) — die haben keinen Kunden.
**Alternativen:** Dummy-"Tigon"-Client anlegen — verworfen, verschmutzt Kundenliste.

## 2026-04-13: Migrations statt db:push, auch im Container
**Warum:** Vor Production muss der Schema-Pfad deterministisch sein. `db push` kann Daten verlieren bei Non-Additive Changes und hat keine History. `migrate deploy` mit commited Migration-Files ist reproduzierbar und rollback-faehig.
**Alternativen:** `db push` beibehalten bis vor Production — verworfen, weil Staging dann strukturell anders als Production setup ist und wir Migration-Kompatibilitaet nicht testen.

## 2026-04-13: Komplett-Redesign — Portal als operatives OS fuer Tigon
**Warum:** Das Portal soll Source-of-Truth fuer alle operativen Business-Daten werden (Kunden, Projekte, Tasks, Impulse, Finanzen, Outreach, Aktivitaeten). `~/tigon/` Markdown-Dateien werden (wo strukturiert sinnvoll) in die DB migriert. HABIT-Layer-Content (Playbooks, Research, Skills, Shared-Insights, Meeting-Markdowns) bleibt File-basiert — das ist Jarvis-Wissen, keine operative Daten.
**Modell:** Source-of-Truth Mode B — DB ist primaer, naechtlicher Read-Only-Export nach `~/tigon/_export/` fuer Grep-Zugriff.
**Scope:** Workspace → Client/Lead/Project → Task/Impulse/Milestone/Deployment/Journal/Entry/Decision. Activity als unified Touchpoint- + Audit-Log. Financials: Invoice/LineItem/Payment/Expense/PipelineEstimate (MRR wird berechnet, nicht gespeichert).
**Soft-Delete:** `deletedAt` auf allen Operativ-Models, `Activity` bleibt append-only, `Invoice`/`Payment` nie hard-deleten (Buchfuehrungspflicht). Unique-Constraints via Partial Index (`WHERE deletedAt IS NULL`).

## 2026-04-13: Prisma 7 — `datasource.url` in `prisma.config.ts`
**Warum:** Prisma 7 hat `url = env("DATABASE_URL")` aus der schema.prisma `datasource` entfernt. Migrate/Generate lesen die Connection-URL jetzt aus `prisma.config.ts` (`datasource.url`). Unsere fruehere Entscheidung vom selben Tag (explizit in schema.prisma) ist damit obsolet — das `prisma validate` bricht sonst.
**Alternativen:** Bei Prisma 6 bleiben — verworfen, weil wir eh frisch aufsetzen.

## 2026-04-13: Env-File-Struktur via `.env.local` + Symlink
**Warum:** Der `/dev` Skill erwartet `.env.local`/`.env.staging`/`.env.production` Naming. Prisma CLI liest `.env` standardmaessig — Symlink `.env -> .env.local` sorgt dafuer dass CLI und Next.js aus derselben Quelle lesen.
**Alternativen:** dotenv-cli als Wrapper — verworfen, ist nicht ueberall installiert (siehe /dev Guardrail 8).
