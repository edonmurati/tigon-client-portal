# Decisions — Tigon Client Portal

## 2026-04-13: Schema-Shift zu Stage-Model + Knowledge Entries
**Warum:** Portal war zu CRM-lastig (Status) und hatte nur generische "Notes". Gent will Ordner-CRM-Logik (cold→warm→active→pro_bono→paused→ended) abbilden und Wissens-Einträge kategorisiert speichern (Changelog, Decision, Meeting Note, etc.). `Note` war zu flach für die tatsächliche Nutzung.
**Alternativen:** (1) `Note` behalten + Tags statt Kategorien — verworfen, zu lose. (2) Separate Models pro Typ (Meeting, Decision...) — verworfen, Explosion der Tabellen. (3) Status auf 3 Werte lassen — verworfen, matcht nicht die Realität der Kunden-Pipeline.

## 2026-04-13: `Project.clientId` nullable
**Warum:** Portal muss auch PRODUCT- und INTERNAL-Projekte tragen (eigene Tigon-Produkte, interne Tools) — die haben keinen Kunden.
**Alternativen:** Dummy-"Tigon"-Client anlegen — verworfen, verschmutzt Kundenliste.
