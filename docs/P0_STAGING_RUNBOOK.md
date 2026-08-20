# FlapaPay P0 staging runbook

## Safety boundary

Run the P0 migration only against a **restored staging database copy**. Do not use the production `.env` values or the production `DATABASE_URL`. The runner requires an explicit confirmation string and rejects database names that do not look like staging, sandbox, test, or stage.

The current Hostinger deployment exposes production DB settings in `/var/www/flapapay/.env`, while `docker-compose.yml` describes a development Postgres service. No separate staging database was found on the server during inspection. Therefore, the next command requires a staging connection string or a newly created staging database.

## Recommended staging setup

Create a database copy from a verified production backup using your database provider’s managed clone/restore feature, or restore a `pg_dump` file into a separate database such as `flapapay_staging`. Use a separate database role with only the permissions required for the migration and validation.

A staging target should have a name such as:

```text
flapapay_staging
```

## Exact command

From `/var/www/flapapay` on the server, set the staging connection string only in the current shell. Do not write it to Git or `.env`:

```bash
cd /var/www/flapapay
export STAGING_DATABASE_URL='postgresql://staging_user:REDACTED@staging-host:5432/flapapay_staging'
export STAGING_CONFIRM=I_UNDERSTAND_STAGING_ONLY
bash scripts/run-p0-staging.sh
```

The command performs four stages:

| Stage | Action | Safety behavior |
|---|---|---|
| 1 | `pg_dump` the staging database | Creates a custom-format backup before any DDL or backfill |
| 2 | Read-only preflight | Reports target DB and whether `merchant_environments` already exists |
| 3 | Apply additive migration and backfill | Stops on the first SQL error with `ON_ERROR_STOP=1` |
| 4 | Read-only validation | Checks environment counts, nulls, `livemode` consistency, ledger separation, key prefixes, duplicates, and orphan references |

## Expected successful checks

The validation output should show exactly one live environment and at least one sandbox per merchant. Core rows should have zero unresolved `environment_id` values. Ledger entries must not connect wallets from different environments. API key prefixes must match environment kind. The orphan reference and mismatch counts must be zero.

Do not proceed to runtime middleware enablement if any of these checks fail.

## Rollback for the staging rehearsal

The P0 migration is additive and the runner preserves a custom-format dump. For the staging rehearsal, the safest rollback is to restore the pre-migration dump into a fresh database:

```bash
createdb flapapay_staging_rollback
pg_restore --clean --if-exists --no-owner --no-privileges \
  --dbname=flapapay_staging_rollback \
  .staging-backups/flapapay-staging-before-p0-<timestamp>.dump
```

Do not drop columns or `merchant_environments` in place as an ad hoc rollback after backfill. A destructive down migration requires a separately reviewed maintenance window.

## What happens after staging passes

The next step is to deploy `services/environmentContext.js` in compatibility mode with:

```dotenv
ENVIRONMENT_CONTEXT_ENABLED=false
ENVIRONMENT_CONTEXT_REQUIRE_EXPLICIT=false
```

Then migrate the API-key and JWT auth paths, run the cross-environment leak tests, and enable the first flag only after the environment columns are populated and core routes are environment-filtered. The dashboard Live/Sandbox selector remains hidden until the P0 release gates pass.
