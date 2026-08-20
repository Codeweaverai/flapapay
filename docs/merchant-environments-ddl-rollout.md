# Merchant Environments DDL And Rollout Plan

## Date

August 20, 2026

## Purpose

This document turns the architecture in [merchant-environments-migration-spec.md](/var/www/flapapay/docs/merchant-environments-migration-spec.md) into an execution-order database and rollout plan.

This is still a planning artifact. It does not apply schema changes.

## Scope

This plan is specifically for:

- creating first-class merchant environments
- migrating from partial `livemode` handling to `environment_id`
- preserving existing live/test data
- avoiding a parallel `sandbox_*` table universe

## Operational Principles

1. Additive schema changes first.
2. Backfill before tightening constraints.
3. Dual-write before cutover.
4. Query remediation before UI exposure.
5. `balances` and auth are critical-path blockers.

## Known Code Blockers

These parts of the codebase must be changed before final cutover:

- [DeveloperGateway.js](/var/www/flapapay/services/DeveloperGateway.js#L20)
- merchant key reads and rotation in [unified-server.js](/var/www/flapapay/unified-server.js#L22193)
- customer APIs starting at [unified-server.js](/var/www/flapapay/unified-server.js#L22950)
- subscription APIs starting at [unified-server.js](/var/www/flapapay/unified-server.js#L23008)
- billing meter and usage APIs starting at [unified-server.js](/var/www/flapapay/unified-server.js#L23951)

## Phase 0: Preflight Audit

Run these before any DDL:

```sql
SELECT COUNT(*) AS merchants FROM merchants;

SELECT 'wallets' AS table_name, livemode, COUNT(*) FROM wallets GROUP BY livemode
UNION ALL
SELECT 'ledger_entries', livemode, COUNT(*) FROM ledger_entries GROUP BY livemode
UNION ALL
SELECT 'charges', livemode, COUNT(*) FROM charges GROUP BY livemode
UNION ALL
SELECT 'connected_accounts', livemode, COUNT(*) FROM connected_accounts GROUP BY livemode
UNION ALL
SELECT 'customers', livemode, COUNT(*) FROM customers GROUP BY livemode
UNION ALL
SELECT 'products', livemode, COUNT(*) FROM products GROUP BY livemode
UNION ALL
SELECT 'prices', livemode, COUNT(*) FROM prices GROUP BY livemode
UNION ALL
SELECT 'subscriptions', livemode, COUNT(*) FROM subscriptions GROUP BY livemode
UNION ALL
SELECT 'wallet_withdrawals', livemode, COUNT(*) FROM wallet_withdrawals GROUP BY livemode
UNION ALL
SELECT 'merchant_wallet_settlements', livemode, COUNT(*) FROM merchant_wallet_settlements GROUP BY livemode
ORDER BY 1, 2;
```

Check for uniqueness collisions that will matter after environment scoping:

```sql
SELECT merchant_id, email, COUNT(*)
FROM customers
GROUP BY merchant_id, email
HAVING COUNT(*) > 1;

SELECT user_id, currency, livemode, COUNT(*)
FROM wallets
GROUP BY user_id, currency, livemode
HAVING COUNT(*) > 1;

SELECT key_type, COUNT(*)
FROM api_keys
WHERE is_active = true
GROUP BY key_type
ORDER BY key_type;
```

## Phase 1: Create `merchant_environments`

This phase is additive and safe to run first.

```sql
CREATE TABLE IF NOT EXISTS merchant_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(80) NOT NULL,
    kind VARCHAR(20) NOT NULL CHECK (kind IN ('live', 'sandbox')),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    source_environment_id UUID REFERENCES merchant_environments(id) ON DELETE SET NULL,
    copied_from_live_at TIMESTAMPTZ,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (merchant_id, slug)
);
```

Create the single-live invariant:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS ux_merchant_environments_live
ON merchant_environments (merchant_id)
WHERE kind = 'live';
```

Backfill one live and one sandbox environment per merchant:

```sql
INSERT INTO merchant_environments (merchant_id, name, slug, kind)
SELECT m.id, 'Live Account', 'live', 'live'
FROM merchants m
WHERE NOT EXISTS (
    SELECT 1 FROM merchant_environments me
    WHERE me.merchant_id = m.id AND me.kind = 'live'
);

INSERT INTO merchant_environments (merchant_id, name, slug, kind)
SELECT m.id, 'Default Sandbox', 'default-sandbox', 'sandbox'
FROM merchants m
WHERE NOT EXISTS (
    SELECT 1 FROM merchant_environments me
    WHERE me.merchant_id = m.id AND me.kind = 'sandbox'
);
```

Validation:

```sql
SELECT merchant_id, kind, COUNT(*)
FROM merchant_environments
GROUP BY merchant_id, kind
ORDER BY merchant_id, kind;
```

Expected:

- each merchant has exactly one `live`
- each merchant has at least one `sandbox`

## Phase 2: Add Nullable `environment_id` Columns

Add columns only. Do not add `NOT NULL` yet.

### Core Money Tables

```sql
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE charges ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE connected_accounts ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE connect_ledger ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE connect_statements ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE merchant_wallet_settlements ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE wallet_withdrawals ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE wallet_mobile_money_collections ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE platform_notifications ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE platform_earnings_cache ADD COLUMN IF NOT EXISTS environment_id UUID;
```

### Merchant Runtime Resources

```sql
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE webhook_endpoints ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE balances ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE connect_config ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE connect_fee_tiers ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE connect_invites ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE connected_account_fee_overrides ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE connected_account_api_keys ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE connected_account_payout_methods ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE connected_account_kyc ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE onboarding_links ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE submerchant_sessions ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE risk_rules ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE billing_meters ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE billing_usage ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE customer_portal_sessions ADD COLUMN IF NOT EXISTS environment_id UUID;
```

### Commerce Resources

```sql
ALTER TABLE customers ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE prices ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE sub_invoice ADD COLUMN IF NOT EXISTS environment_id UUID;
```

Add foreign keys after columns exist:

```sql
ALTER TABLE wallets ADD CONSTRAINT fk_wallets_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;
```

Repeat the same FK pattern for every `environment_id` column above. These can be split across multiple migrations if lock time is a concern.

## Phase 3: Helper Indexes Before Backfill

These indexes support backfill and later query rewrites.

```sql
CREATE INDEX IF NOT EXISTS idx_merchant_environments_merchant_kind
ON merchant_environments (merchant_id, kind);

CREATE INDEX IF NOT EXISTS idx_wallets_environment
ON wallets (environment_id);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_environment
ON ledger_entries (environment_id);

CREATE INDEX IF NOT EXISTS idx_charges_environment
ON charges (environment_id);

CREATE INDEX IF NOT EXISTS idx_customers_environment
ON customers (environment_id);

CREATE INDEX IF NOT EXISTS idx_products_environment
ON products (environment_id);

CREATE INDEX IF NOT EXISTS idx_prices_environment
ON prices (environment_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_environment
ON subscriptions (environment_id);
```

In production, large indexes should be created with `CONCURRENTLY` in standalone migration steps, not inside a transaction.

## Phase 4: Backfill Tables That Already Have `livemode`

Use merchant `live` environment for `livemode = true`.
Use merchant `default sandbox` for `livemode = false`.

### Merchant-Owned Tables

Example pattern:

```sql
UPDATE charges c
SET environment_id = me.id
FROM merchant_environments me
WHERE c.merchant_id = me.merchant_id
  AND me.kind = CASE WHEN c.livemode THEN 'live' ELSE 'sandbox' END
  AND c.environment_id IS NULL;
```

Apply that pattern to:

- `charges`
- `checkout_sessions`
- `customers`
- `products`
- `subscriptions`
- `sub_invoice`
- `refunds`
- `disputes`
- `platform_notifications`
- `platform_earnings_cache`

### Wallet-Owned Tables

For tables linked to wallets, backfill from wallet first rather than from merchant alone.

```sql
UPDATE ledger_entries le
SET environment_id = COALESCE(cw.environment_id, dw.environment_id)
FROM wallets cw
LEFT JOIN wallets dw ON dw.id = le.debit_wallet_id
WHERE cw.id = le.credit_wallet_id
  AND le.environment_id IS NULL;
```

Then clean up rows with only debit wallets:

```sql
UPDATE ledger_entries le
SET environment_id = dw.environment_id
FROM wallets dw
WHERE le.debit_wallet_id = dw.id
  AND le.environment_id IS NULL;
```

Backfill:

- `ledger_entries`
- `wallet_withdrawals`
- `merchant_wallet_settlements`
- `wallet_mobile_money_collections`
- `payment_links`

Example:

```sql
UPDATE payment_links pl
SET environment_id = w.environment_id
FROM wallets w
WHERE pl.wallet_id = w.id
  AND pl.environment_id IS NULL;
```

### Connect Tables

Backfill from `platform_merchant_id` plus `livemode`:

```sql
UPDATE connected_accounts ca
SET environment_id = me.id
FROM merchant_environments me
WHERE ca.platform_merchant_id = me.merchant_id
  AND me.kind = CASE WHEN ca.livemode THEN 'live' ELSE 'sandbox' END
  AND ca.environment_id IS NULL;
```

Then derive child tables from parent records:

- `connect_ledger` from connected account or platform merchant + `livemode`
- `connect_statements` from connected account + `livemode`
- `connected_account_api_keys` from `connected_accounts.environment_id`
- `connected_account_payout_methods` from `connected_accounts.environment_id`
- `connected_account_kyc` from `connected_accounts.environment_id`
- `connected_account_fee_overrides` from connected account or platform merchant
- `submerchant_sessions` from connected account
- `onboarding_links` from connected account

## Phase 5: Backfill Tables Without `livemode`

These require explicit policy decisions.

### `api_keys`

Map by `key_type`.

```sql
UPDATE api_keys a
SET environment_id = me.id
FROM merchant_environments me
WHERE a.merchant_id = me.merchant_id
  AND (
      (a.key_type LIKE 'live_%' AND me.kind = 'live')
      OR
      ((a.key_type LIKE 'test_%' OR a.key_type = 'test') AND me.kind = 'sandbox')
  )
  AND a.environment_id IS NULL;
```

### `balances`

Current rows should default to live for first backfill, because the existing table behaves like a live-oriented aggregate.

```sql
UPDATE balances b
SET environment_id = me.id
FROM merchant_environments me
WHERE b.merchant_id = me.merchant_id
  AND me.kind = 'live'
  AND b.environment_id IS NULL;
```

Important:

- this is a compatibility step only
- the table shape still needs redesign before final cutover

### `webhooks` and `webhook_endpoints`

Default current rows to live.

```sql
UPDATE webhooks w
SET environment_id = me.id
FROM merchant_environments me
WHERE w.merchant_id = me.merchant_id
  AND me.kind = 'live'
  AND w.environment_id IS NULL;

UPDATE webhook_endpoints we
SET environment_id = me.id
FROM merchant_environments me
WHERE we.merchant_id = me.merchant_id
  AND me.kind = 'live'
  AND we.environment_id IS NULL;
```

### `billing_meters`, `coupons`, `risk_rules`, `connect_config`

Default current rows to live.

```sql
UPDATE billing_meters bm
SET environment_id = me.id
FROM merchant_environments me
WHERE bm.merchant_id = me.merchant_id
  AND me.kind = 'live'
  AND bm.environment_id IS NULL;
```

Repeat the same pattern for:

- `coupons`
- `risk_rules`
- `connect_config`

### `billing_usage`

Backfill from subscription if present.

```sql
UPDATE billing_usage bu
SET environment_id = s.environment_id
FROM subscriptions s
WHERE bu.subscription_id = s.id
  AND bu.environment_id IS NULL;
```

Fallback from meter if needed:

```sql
UPDATE billing_usage bu
SET environment_id = bm.environment_id
FROM billing_meters bm
WHERE bu.meter_id = bm.id
  AND bu.environment_id IS NULL;
```

### `customer_portal_sessions`

Backfill from customer:

```sql
UPDATE customer_portal_sessions cps
SET environment_id = c.environment_id
FROM customers c
WHERE cps.customer_id = c.id
  AND cps.environment_id IS NULL;
```

## Phase 6: Validation Queries After Backfill

No row should remain null in target tables.

```sql
SELECT 'wallets' AS table_name, COUNT(*) FROM wallets WHERE environment_id IS NULL
UNION ALL
SELECT 'ledger_entries', COUNT(*) FROM ledger_entries WHERE environment_id IS NULL
UNION ALL
SELECT 'charges', COUNT(*) FROM charges WHERE environment_id IS NULL
UNION ALL
SELECT 'customers', COUNT(*) FROM customers WHERE environment_id IS NULL
UNION ALL
SELECT 'products', COUNT(*) FROM products WHERE environment_id IS NULL
UNION ALL
SELECT 'prices', COUNT(*) FROM prices WHERE environment_id IS NULL
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM subscriptions WHERE environment_id IS NULL
UNION ALL
SELECT 'payment_links', COUNT(*) FROM payment_links WHERE environment_id IS NULL
UNION ALL
SELECT 'api_keys', COUNT(*) FROM api_keys WHERE environment_id IS NULL
UNION ALL
SELECT 'billing_meters', COUNT(*) FROM billing_meters WHERE environment_id IS NULL
UNION ALL
SELECT 'billing_usage', COUNT(*) FROM billing_usage WHERE environment_id IS NULL
ORDER BY 1;
```

Check consistency between `livemode` and environment kind:

```sql
SELECT COUNT(*)
FROM charges c
JOIN merchant_environments me ON me.id = c.environment_id
WHERE (c.livemode = true  AND me.kind <> 'live')
   OR (c.livemode = false AND me.kind <> 'sandbox');
```

Repeat for:

- `wallets`
- `ledger_entries`
- `customers`
- `products`
- `prices`
- `subscriptions`
- `connected_accounts`
- `wallet_withdrawals`
- `merchant_wallet_settlements`

Check environment uniqueness safety before replacing indexes:

```sql
SELECT merchant_id, email, environment_id, COUNT(*)
FROM customers
GROUP BY merchant_id, email, environment_id
HAVING COUNT(*) > 1;
```

## Phase 7: Dual-Write Application Window

Before constraints tighten, application writes must set:

- `environment_id`
- `livemode`

Compatibility mapping:

- `environment.kind = 'live'` => `livemode = true`
- `environment.kind = 'sandbox'` => `livemode = false`

Critical code changes:

- [DeveloperGateway.js](/var/www/flapapay/services/DeveloperGateway.js#L28): API-key auth must join through `merchant_environments`
- [DeveloperGateway.js](/var/www/flapapay/services/DeveloperGateway.js#L66): JWT sessions cannot default to live
- [unified-server.js](/var/www/flapapay/unified-server.js#L22200): merchant key reads must return environment-aware keys
- [unified-server.js](/var/www/flapapay/unified-server.js#L22950): customer writes must use `(merchant_id, environment_id)`
- [unified-server.js](/var/www/flapapay/unified-server.js#L23036): subscription writes must set `environment_id`
- [unified-server.js](/var/www/flapapay/unified-server.js#L23957): billing meters must be inserted per environment

## Phase 8: Constraint Tightening

Do this only after the application dual-writes correctly.

### Set `NOT NULL`

```sql
ALTER TABLE wallets ALTER COLUMN environment_id SET NOT NULL;
ALTER TABLE ledger_entries ALTER COLUMN environment_id SET NOT NULL;
ALTER TABLE charges ALTER COLUMN environment_id SET NOT NULL;
ALTER TABLE customers ALTER COLUMN environment_id SET NOT NULL;
ALTER TABLE products ALTER COLUMN environment_id SET NOT NULL;
ALTER TABLE prices ALTER COLUMN environment_id SET NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN environment_id SET NOT NULL;
```

Continue for all targeted environment-scoped tables.

### Replace Uniqueness Constraints

`customers`

```sql
DROP INDEX IF EXISTS customers_email_merchant_id_key;
CREATE UNIQUE INDEX ux_customers_email_merchant_environment
ON customers (email, merchant_id, environment_id);
```

`billing_meters`

```sql
DROP INDEX IF EXISTS billing_meters_merchant_id_key_key;
CREATE UNIQUE INDEX ux_billing_meters_merchant_key_environment
ON billing_meters (merchant_id, key, environment_id);
```

`coupons`

```sql
DROP INDEX IF EXISTS coupons_merchant_id_code_key;
CREATE UNIQUE INDEX ux_coupons_merchant_code_environment
ON coupons (merchant_id, code, environment_id);
```

### Add New Environment-Aware Reference Indexes

```sql
CREATE UNIQUE INDEX ux_wallets_user_currency_environment
ON wallets (user_id, currency, environment_id);

CREATE UNIQUE INDEX ux_ledger_entries_reference_environment
ON ledger_entries (transaction_reference, environment_id);

CREATE UNIQUE INDEX ux_wallet_withdrawals_reference_environment
ON wallet_withdrawals (reference, environment_id);

CREATE UNIQUE INDEX ux_settlements_reference_environment
ON merchant_wallet_settlements (transaction_reference, environment_id);
```

## Phase 9: Structural Reshapes

These are not simple additive changes and should be isolated into separate release windows.

### `balances`

Preferred end state:

```sql
CREATE TABLE environment_balances (
    subject_type VARCHAR(30) NOT NULL,
    subject_id UUID NOT NULL,
    environment_id UUID NOT NULL REFERENCES merchant_environments(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL,
    pending_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    available_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (subject_type, subject_id, environment_id, currency)
);
```

Then:

1. backfill from old `balances`
2. swap reads
3. swap writes
4. deprecate old `balances`

### `connect_config`

Current primary key is only `merchant_id`.

Safer rollout:

1. create `connect_config_v2` keyed by `(merchant_id, environment_id)`
2. backfill live defaults
3. move reads/writes
4. retire old table

## Phase 10: Route Remediation Order

Fix in this order.

### Batch 1: Auth And Environment Resolution

- [DeveloperGateway.js](/var/www/flapapay/services/DeveloperGateway.js#L20)
- merchant dashboard active-environment session state
- API-key storage and lookup

### Batch 2: Core Commerce

- customers
- products
- prices
- subscriptions
- invoices
- customer portal

### Batch 3: Money Movement

- wallets
- ledger entries
- payment links
- wallet withdrawals
- merchant settlements
- merchant stats/activity

### Batch 4: Billing And Webhooks

- billing meters
- usage
- coupons
- webhook endpoints
- webhook deliveries

### Batch 5: Connect And Risk

- connected accounts
- connect ledger
- connect config
- connect fee tiers
- risk rules

## Do Not Ship Before

Do not expose a dashboard-wide live/sandbox selector until these are true:

1. API auth resolves an actual `environment_id`.
2. `balances` are environment-aware.
3. customers, products, prices, subscriptions, and payment links are environment-safe.
4. webhook endpoints are environment-safe.
5. analytics no longer aggregate across all merchant rows.

## Final Cutover

After application reads use `environment_id` everywhere:

1. stop inferring mode from `key_type`
2. stop defaulting JWT sessions to live
3. remove route logic that filters only by `merchant_id`
4. optionally keep `livemode` as a derived compatibility column for reporting/export stability
5. only then design and ship the left-nav environment switcher

## Recommended Next Engineering Step

Implement only Phase 1 and Phase 2 in code first:

- add `merchant_environments`
- add nullable `environment_id`
- no UI changes
- no constraint tightening yet

That creates the safest base for the real application remediation work.
