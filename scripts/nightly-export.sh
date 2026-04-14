#!/usr/bin/env bash
# Nightly-Export der lokalen Dev-DB nach ~/tigon/_export/.
# Zweck: Safety-Snapshot ausserhalb des Docker-Volumes, ausserhalb des Repos.
# Behaelt die letzten 14 Dumps.
#
# Cron-Installation (einmalig):
#   crontab -e
#   0 3 * * *  /home/habit/projects/tigon-client-portal/scripts/nightly-export.sh >> /home/habit/.tigon-portal-export.log 2>&1

set -euo pipefail

CONTAINER="tigon-portal-postgres"
DB_USER="tigon"
DB_NAME="tigon_portal"
EXPORT_DIR="${HOME}/tigon/_export/tigon-portal"
RETENTION=14

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "[$(date -Iseconds)] FEHLER: Container ${CONTAINER} laeuft nicht." >&2
  exit 1
fi

mkdir -p "$EXPORT_DIR"

TS=$(date +%Y-%m-%d_%H%M)
OUT="${EXPORT_DIR}/${DB_NAME}_${TS}.sql.gz"

echo "[$(date -Iseconds)] Dump -> ${OUT}"
docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl \
  | gzip -9 > "$OUT"

SIZE=$(du -h "$OUT" | cut -f1)
echo "[$(date -Iseconds)] OK (${SIZE})"

# Retention: aelteste Dumps loeschen
ls -1t "${EXPORT_DIR}"/${DB_NAME}_*.sql.gz 2>/dev/null | tail -n +$((RETENTION + 1)) | while read -r old; do
  echo "[$(date -Iseconds)] Retention: rm ${old}"
  rm -f "$old"
done
