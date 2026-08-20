#!/usr/bin/env bash
set -Eeuo pipefail

# FlapaPay P0 staging runner.
# Required: STAGING_DATABASE_URL and STAGING_CONFIRM=I_UNDERSTAND_STAGING_ONLY
# Optional: STAGING_DB_NAME, STAGING_BACKUP_DIR
#
# Safety properties:
# - refuses empty URLs
# - refuses URLs that look like the production URL
# - requires a staging-like database name unless explicitly overridden
# - takes a pg_dump before migration
# - runs SQL with ON_ERROR_STOP
# - never uses the production .env implicitly

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATION="$ROOT_DIR/migrations/20260820_merchant_environments_p0.sql"
BACKFILL="$ROOT_DIR/migrations/20260820_merchant_environments_p0_backfill.sql"
VALIDATE="$ROOT_DIR/migrations/20260820_merchant_environments_p0_validate.sql"

: "${STAGING_DATABASE_URL:?Set STAGING_DATABASE_URL to the staging database connection string}"
: "${STAGING_CONFIRM:?Set STAGING_CONFIRM=I_UNDERSTAND_STAGING_ONLY to continue}"

if [[ "$STAGING_CONFIRM" != "I_UNDERSTAND_STAGING_ONLY" ]]; then
  echo "Refusing to run: STAGING_CONFIRM must equal I_UNDERSTAND_STAGING_ONLY" >&2
  exit 2
fi

if [[ -n "${DATABASE_URL:-}" && "$STAGING_DATABASE_URL" == "$DATABASE_URL" ]]; then
  echo "Refusing to run: staging URL matches DATABASE_URL" >&2
  exit 2
fi

# The runner should be pointed at a database whose name clearly identifies it as
# non-production. Set STAGING_ALLOW_NONSTANDARD_DB_NAME=true only after manual
# review when the staging database uses a different naming convention.
staging_db_name="${STAGING_DB_NAME:-}"
if [[ -z "$staging_db_name" ]]; then
  staging_db_name="$(python3 - "$STAGING_DATABASE_URL" <<'PY'
import sys
from urllib.parse import urlparse
url = urlparse(sys.argv[1])
print((url.path or '').lstrip('/'))
PY
)"
fi

if [[ "${STAGING_ALLOW_NONSTANDARD_DB_NAME:-false}" != "true" && ! "$staging_db_name" =~ (stage|staging|sandbox|test) ]]; then
  echo "Refusing to run: database name '$staging_db_name' does not look like staging" >&2
  echo "Set STAGING_ALLOW_NONSTANDARD_DB_NAME=true only after manual review." >&2
  exit 2
fi

for file in "$MIGRATION" "$BACKFILL" "$VALIDATE"; do
  [[ -f "$file" ]] || { echo "Missing migration file: $file" >&2; exit 2; }
done

backup_dir="${STAGING_BACKUP_DIR:-$ROOT_DIR/.staging-backups}"
mkdir -p "$backup_dir"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="$backup_dir/flapapay-staging-before-p0-$timestamp.dump"

# Identify the target without exposing credentials.
echo "Target database: ${staging_db_name:-<unknown>}"
echo "Backup file: $backup_file"
echo "Step 1/4: taking staging backup"
pg_dump --format=custom --no-owner --no-privileges --file="$backup_file" "$STAGING_DATABASE_URL"

# Read-only preflight. This shows whether the migration has already been applied.
echo "Step 2/4: running read-only preflight"
psql "$STAGING_DATABASE_URL" --set=ON_ERROR_STOP=1 --quiet <<'SQL'
SELECT current_database() AS staging_database,
       current_user AS staging_user,
       now() AS checked_at;
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'merchant_environments'
) AS merchant_environments_exists;
SQL

echo "Step 3/4: applying additive migration and backfill"
psql "$STAGING_DATABASE_URL" --set=ON_ERROR_STOP=1 --file="$MIGRATION"
psql "$STAGING_DATABASE_URL" --set=ON_ERROR_STOP=1 --file="$BACKFILL"

echo "Step 4/4: running read-only validation"
psql "$STAGING_DATABASE_URL" --set=ON_ERROR_STOP=1 --file="$VALIDATE"

echo "P0 staging migration, backfill, and validation completed."
echo "Keep the backup until the staging application tests and rollback rehearsal are complete: $backup_file"
