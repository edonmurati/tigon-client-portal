# Handoff — Tigon Client Portal
Letzte Session: 2026-04-14 (Gent)

## Was wurde gemacht
- Multi-Tenancy: 4 P0 Leaks + 8 FK-Injection-Stellen gefixt (Helpers in `src/lib/api.ts`), Tag-Endpoint gehaertet
- Dashboard: "Naechste Deadlines" Widget
- Nightly-Export via Cron + Script live (03:00, 14d Retention)
- `/dev push` durchgelaufen → `dev` auf origin bei 20a1779, Coolify Rebuild laeuft

## Was ist offen
- Staging-Rebuild im Browser verifizieren: Multi-Assign-Chip an `/admin/aufgaben/cmnyk5ama0002vqfl2xq9yxwh`
- Seed-Script auf neues Schema umschreiben (Dev-DB hat Live-Daten → destruktiv, deferred)
- Frontend: `workspaceId` propagation bei Admin-Creates
- `/dev done` fuer main-Deploy (Production — nur mit expliziter Freigabe)

## Landminen
- **Staging-DB Port 54329 nicht extern erreichbar** (`is_public: False`). Migration laeuft nur im Container via `docker-entrypoint.sh` → `prisma migrate deploy`. Von aussen `P1001`.
- **Dev-DB hat Live-Daten:** Seed-Rewrite erst machen wenn Staging clean steht.
- **Tenant-Leak-Pattern systematisch:** bei JEDER neuen Admin-Route `workspaceId: user.workspaceId` ins `where`; bei Create/Update `assertClientInWorkspace` / `assertProjectInWorkspace` aufrufen.

## Naechster Schritt
Browser-Test Multi-Assign auf Staging, danach `/dev done`.
