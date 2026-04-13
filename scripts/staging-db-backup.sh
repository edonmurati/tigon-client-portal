#!/usr/bin/env bash
# Triggert einen on-demand Backup der Staging-DB via Coolify API.
# Die Datei landet auf dem Coolify-VPS unter /data/coolify/backups/...
# Download via Coolify Web-UI (Project: Client-Portal -> portal-staging-db -> Backups).
set -euo pipefail

COOLIFY_TOKEN="${COOLIFY_TOKEN:?COOLIFY_TOKEN env muss gesetzt sein}"
COOLIFY_URL="${COOLIFY_URL:-https://coolify.surfingtigon.com}"
DB_UUID="k0sww0wo0k4c8gog40ckw8og"

echo "Triggere Backup fuer portal-staging-db..."
RESP=$(curl -fsS -X POST \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"frequency":"daily","enabled":false,"backup_now":true,"databases_to_backup":"tigon_portal_staging"}' \
  "$COOLIFY_URL/api/v1/databases/$DB_UUID/backups")

BACKUP_UUID=$(echo "$RESP" | python3 -c "import sys,json;print(json.load(sys.stdin).get('uuid',''))")
echo "Backup-UUID: $BACKUP_UUID"
echo
echo "Status:"
sleep 3
curl -fsS -H "Authorization: Bearer $COOLIFY_TOKEN" \
  "$COOLIFY_URL/api/v1/databases/$DB_UUID/backups/$BACKUP_UUID/executions" | python3 -m json.tool

echo
echo "Download via:"
echo "  $COOLIFY_URL -> Project: Client-Portal -> portal-staging-db -> Backups -> Download"
echo
echo "Cleanup (optional):"
echo "  curl -X DELETE -H \"Authorization: Bearer \$COOLIFY_TOKEN\" $COOLIFY_URL/api/v1/databases/$DB_UUID/backups/$BACKUP_UUID"
