# Handoff — Tigon Client Portal
Letzte Session: 2026-04-17 (Gent)

## Was wurde gemacht
- Komplette ~/tigon/ Migration: 372 Files → 420 DB Records (251 KnowledgeEntry + 10 Credential + 159 Document)
- 5 DSGVO-kritische compliance-Files nachtraeglich migriert (waren vom Python-Script geskippt)
- Binaries/Scripts ins Document-Model inkl. lokalem Storage (uploads/migrated/, 129 MB)
- 198 authorId=null Entries auf Admin gebackfillt
- HABIT Server aus Server-Model geloescht
- Schema-Integritaet verifiziert: 0 Orphans, 10/10 Creds entschluesselbar, alle Files auf Disk

## Was ist offen
- Staging-DB syncen — lokal hat jetzt 420 Records, Staging ist alter Stand
- ~/tigon/ physisch loeschen: Syncthing-Folder pausieren → `mv ~/tigon ~/tigon.archived` → 1 Woche Observation
- Coolify Production-Deploy steht immer noch aus

## Landminen
- **uploads/migrated/ ist NICHT in Git** (.gitignore'd per Default) — bei Server-Rebuild muss der Ordner aus Backup wiederhergestellt werden, sonst sind 159 Documents tot
- **Staging-DB kennt diese 420 Records nicht** — beim naechsten Staging-Test wirken viele Bereiche leer, das ist kein Bug sondern Sync-Gap
- **MAX_UPLOAD_SIZE_MB=50** default im Code — die .accdb (79MB) wurde nur durch Bypass-Script reingekriegt, normaler Upload-Flow wuerde sie abweisen

## Naechster Schritt
Staging-DB syncen (pg_dump lokal → psql staging), damit Staging den vollstaendigen Datenbestand hat.
