# Merchant Environments Migration Spec

## Date

August 20, 2026

## Goal

Introduce first-class isolated merchant environments for FlapaPay without splitting the platform into duplicate `live_*` and `sandbox_*` table families.

This spec is based on the current production schema and backend behavior in:

- [unified-server.js](/var/www/flapapay/unified-server.js)
- [DeveloperGateway.js](/var/www/flapapay/services/DeveloperGateway.js)

## Decision

Do not create parallel table families such as `sandbox_wallets`, `sandbox_ledger_entries`, and `sandbox_charges`.

Do not treat the current shared tables as live-only tables.

Instead:

1. Create a first-class `merchant_environments` table.
2. Add `environment_id` to environment-scoped resources.
3. Backfill current `livemode = true` rows into the merchant's `live` environment.
4. Backfill current `livemode = false` rows into the merchant's default sandbox environment.
5. Keep `livemode` temporarily for compatibility during rollout.
6. Move all reads and writes to `environment_id`.

## Why This Direction

The current platform already stores mixed test/live data in shared tables:

- `wallets`
- `ledger_entries`
- `charges`
- `connected_accounts`
- `wallet_withdrawals`
- `merchant_wallet_settlements`
- `products`
- `prices`
- `customers`
- `subscriptions`
- `checkout_sessions`

That means a clean physical split would require a large data migration before it could even be considered the source of truth.

The current platform also has incomplete isolation:

- `balances` has no environment identity.
- `payment_links` has no environment identity.
- `webhooks` and `webhook_endpoints` are merchant-global.
- `customers` is unique only on `(email, merchant_id)`.
- several `/v1/*` routes query by `merchant_id` and ignore environment.
- [DeveloperGateway.js](/var/www/flapapay/services/DeveloperGateway.js) expects API-key environment context that does not exist structurally in `api_keys`.

## Target Model

### Merchant Environment

Each merchant gets:

- exactly one `live` environment
- one or more `sandbox` environments

Suggested table:

```sql
CREATE TABLE merchant_environments (
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

CREATE UNIQUE INDEX ux_merchant_environments_live
ON merchant_environments (merchant_id)
WHERE kind = 'live';
```

Recommended initial rows per merchant:

- `kind = 'live'`, `slug = 'live'`, `name = 'Live Account'`
- `kind = 'sandbox'`, `slug = 'default-sandbox'`, `name = 'Default Sandbox'`

## Table Classification

### Environment-Scoped

These tables should gain `environment_id` and all runtime reads/writes should be environment-filtered.

- `wallets`
- `ledger_entries`
- `charges`
- `checkout_sessions`
- `connected_accounts`
- `connect_ledger`
- `connect_statements`
- `merchant_wallet_settlements`
- `wallet_withdrawals`
- `wallet_mobile_money_collections`
- `products`
- `prices`
- `customers`
- `subscriptions`
- `sub_invoice`
- `refunds`
- `disputes`
- `platform_notifications`
- `platform_earnings_cache`
- `payout_requests`
- `payment_links`
- `api_keys`
- `webhooks`
- `webhook_endpoints`
- `billing_meters`
- `billing_usage`
- `coupons`
- `customer_portal_sessions`
- `risk_rules`
- `connect_config`
- `connect_fee_tiers`
- `connect_invites`
- `connected_account_fee_overrides`
- `connected_account_api_keys`
- `connected_account_payout_methods`
- `connected_account_kyc`
- `submerchant_sessions`
- `onboarding_links`

### Merchant-Global

These should remain parent-merchant resources and not be sandbox-isolated.

- `merchants`
- `merchant_team_members`
- `merchant_team_invites`
- `merchant_role_audit_log`
- `merchant_documents` for legal KYC artifacts
- `merchant_bank_accounts` if they represent real payout destinations
- merchant legal identity
- merchant compliance status
- merchant live enablement
- core business profile

### Ambiguous But Prefer Environment-Scoped

These should be isolated if merchants are meant to test them safely.

- `payment_links`
- `webhook_endpoints`
- `webhooks`
- `billing_meters`
- `billing_usage`
- `coupons`
- `risk_rules`
- `connect_config`

Reason:

- a merchant must be able to test billing, webhook payloads, links, rules, and Connect behavior without changing live merchant behavior.

## Required Constraint Changes

### Core Financial Tables

`wallets`

```sql
ALTER TABLE wallets ADD COLUMN environment_id UUID REFERENCES merchant_environments(id);
CREATE UNIQUE INDEX ux_wallets_user_currency_environment
ON wallets (user_id, currency, environment_id);
```

`ledger_entries`

```sql
ALTER TABLE ledger_entries ADD COLUMN environment_id UUID REFERENCES merchant_environments(id);
CREATE UNIQUE INDEX ux_ledger_entries_reference_environment
ON ledger_entries (transaction_reference, environment_id);
```

`charges`

```sql
ALTER TABLE charges ADD COLUMN environment_id UUID REFERENCES merchant_environments(id);
CREATE INDEX idx_charges_merchant_environment_created
ON charges (merchant_id, environment_id, created_at DESC);
```

`merchant_wallet_settlements`

```sql
ALTER TABLE merchant_wallet_settlements ADD COLUMN environment_id UUID REFERENCES merchant_environments(id);
CREATE UNIQUE INDEX ux_settlements_reference_environment
ON merchant_wallet_settlements (transaction_reference, environment_id);
```

`wallet_withdrawals`

```sql
ALTER TABLE wallet_withdrawals ADD COLUMN environment_id UUID REFERENCES merchant_environments(id);
CREATE UNIQUE INDEX ux_wallet_withdrawals_reference_environment
ON wallet_withdrawals (reference, environment_id);
```

### Merchant Runtime Resources

`api_keys`

```sql
ALTER TABLE api_keys ADD COLUMN environment_id UUID REFERENCES merchant_environments(id);
ALTER TABLE api_keys ADD COLUMN mode VARCHAR(20) CHECK (mode IN ('public', 'secret', 'restricted'));
CREATE INDEX idx_api_keys_merchant_environment_active
ON api_keys (merchant_id, environment_id, is_active);
```

Notes:

- `key_type` should remain temporarily for backward compatibility.
- long term, derive test/live from `environment_id` instead of from `key_type` prefixes alone.

`balances`

Current schema is structurally incompatible with multiple environments because `merchant_id` is the primary key.

Recommended reshape:

```sql
ALTER TABLE balances ADD COLUMN environment_id UUID REFERENCES merchant_environments(id);
ALTER TABLE balances DROP CONSTRAINT balances_pkey;
ALTER TABLE balances ADD PRIMARY KEY (merchant_id, environment_id);
```

Better long-term shape:

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

This is preferable because the current `balances` table is also used for connected-account balance-like records under a single `merchant_id` field.

`payment_links`

```sql
ALTER TABLE payment_links ADD COLUMN environment_id UUID REFERENCES merchant_environments(id);
CREATE INDEX idx_payment_links_user_environment_created
ON payment_links (user_id, environment_id, created_at DESC);
```

`webhooks`

```sql
ALTER TABLE webhooks ADD COLUMN environment_id UUID REFERENCES merchant_environments(id);
CREATE INDEX idx_webhooks_merchant_environment
ON webhooks (merchant_id, environment_id);
```

`webhook_endpoints`

```sql
ALTER TABLE webhook_endpoints ADD COLUMN environment_id UUID REFERENCES merchant_environments(id);
CREATE INDEX idx_webhook_endpoints_merchant_environment
ON webhook_endpoints (merchant_id, environment_id, created_at DESC);
```

`customers`

```sql
ALTER TABLE customers ADD COLUMN environment_id UUID REFERENCES merchant_environments(id);
DROP INDEX IF EXISTS customers_email_merchant_id_key;
CREATE UNIQUE INDEX ux_customers_email_merchant_environment
ON customers (email, merchant_id, environment_id);
```

`products`

```sql
ALTER TABLE products ADD COLUMN environment_id UUID REFERENCES merchant_environments(id);
CREATE INDEX idx_products_merchant_environment_created
ON products (merchant_id, environment_id, created_at DESC);
```

`prices`

```sql
ALTER TABLE prices ADD COLUMN environment_id UUID REFERENCES merchant_environments(id);
CREATE INDEX idx_prices_environment_product
ON prices (environment_id, product_id);
```

`subscriptions`

```sql
ALTER TABLE subscriptions ADD COLUMN environment_id UUID REFERENCES merchant_environments(id);
CREATE INDEX idx_subscriptions_merchant_environment_created
ON subscriptions (merchant_id, environment_id, created_at DESC);
```

`sub_invoice`

```sql
ALTER TABLE sub_invoice ADD COLUMN environment_id UUID REFERENCES merchant_environments(id);
CREATE INDEX idx_sub_invoice_merchant_environment_created
ON sub_invoice (merchant_id, environment_id, created_at DESC);
```

`billing_meters`

```sql
ALTER TABLE billing_meters ADD COLUMN environment_id UUID REFERENCES merchant_environments(id);
DROP INDEX IF EXISTS billing_meters_merchant_id_key_key;
CREATE UNIQUE INDEX ux_billing_meters_merchant_key_environment
ON billing_meters (merchant_id, key, environment_id);
```

`coupons`

```sql
ALTER TABLE coupons ADD COLUMN environment_id UUID REFERENCES merchant_environments(id);
DROP INDEX IF EXISTS coupons_merchant_id_code_key;
CREATE UNIQUE INDEX ux_coupons_merchant_code_environment
ON coupons (merchant_id, code, environment_id);
```

`customer_portal_sessions`

```sql
ALTER TABLE customer_portal_sessions ADD COLUMN environment_id UUID REFERENCES merchant_environments(id);
CREATE INDEX idx_customer_portal_sessions_environment
ON customer_portal_sessions (merchant_id, customer_id, environment_id);
```

`risk_rules`

```sql
ALTER TABLE risk_rules ADD COLUMN environment_id UUID REFERENCES merchant_environments(id);
CREATE INDEX idx_risk_rules_merchant_environment
ON risk_rules (merchant_id, environment_id, enabled);
```

`connect_config`

Current schema is keyed only by `merchant_id`. For isolated Connect testing, it must become environment-scoped.

```sql
ALTER TABLE connect_config ADD COLUMN environment_id UUID REFERENCES merchant_environments(id);
ALTER TABLE connect_config DROP CONSTRAINT connect_config_pkey;
ALTER TABLE connect_config ADD PRIMARY KEY (merchant_id, environment_id);
```

## Backfill Strategy

### Phase 1: Create Environments

For every existing merchant:

1. insert one `live` environment
2. insert one `default sandbox`

### Phase 2: Backfill Existing `livemode` Tables

Rule:

- `livemode = true` -> merchant `live` environment
- `livemode = false` -> merchant default sandbox environment

Tables:

- `wallets`
- `ledger_entries`
- `charges`
- `checkout_sessions`
- `connected_accounts`
- `connect_ledger`
- `connect_statements`
- `merchant_wallet_settlements`
- `wallet_withdrawals`
- `wallet_mobile_money_collections`
- `products`
- `prices`
- `customers`
- `subscriptions`
- `sub_invoice`
- `refunds`
- `disputes`
- `platform_notifications`
- `platform_earnings_cache`
- `payout_requests`

### Phase 3: Backfill Tables Without `livemode`

Map these into `live` initially unless application semantics say otherwise.

- `balances`
- `payment_links`
- `webhooks`
- `webhook_endpoints`
- `billing_meters`
- `billing_usage`
- `coupons`
- `customer_portal_sessions`
- `risk_rules`
- `connect_config`

Special handling:

- `api_keys`
  - `live_%` -> live environment
  - `test_%` or legacy `test` -> default sandbox
- `payment_links`
  - derive environment from linked wallet where possible
  - current inventory shows all existing links point to live wallets
- `billing_usage`
  - derive `environment_id` from `subscription_id` or `meter_id`
- `customer_portal_sessions`
  - derive from referenced customer

### Phase 4: Dual-Write Window

During rollout:

- write `environment_id`
- continue writing `livemode`
- assert `livemode` matches environment kind

Suggested application rule:

- `environment.kind = 'live'` -> `livemode = true`
- `environment.kind = 'sandbox'` -> `livemode = false`

## Route and Service Remediation

### Highest Risk

These routes currently rely on `merchant_id` without environment isolation or only partially enforce it.

#### Developer Gateway

[DeveloperGateway.js](/var/www/flapapay/services/DeveloperGateway.js)

Problems:

- expects `keyData.environment`, but `api_keys` does not have that column
- user JWT sessions are hard-coded to `environment: 'live'`

Required changes:

- API-key auth must join through `merchant_environments`
- dashboard sessions must carry active `environment_id`
- remove implicit “JWT session = live” behavior

#### Customer APIs

Routes around:

- `/v1/customers`
- `/v1/customers/:id`

Problems:

- reads and updates filter by `merchant_id` only
- inserts use `ON CONFLICT (email, merchant_id)` and ignore environment

Required changes:

- all queries must include `environment_id`
- uniqueness must become `(email, merchant_id, environment_id)`

#### Product and Price APIs

Routes around:

- `/v1/products`
- `/v1/prices`

Problems:

- read/write filtering is merchant-scoped only
- price queries validate product ownership but not environment ownership

Required changes:

- require `environment_id`
- validate price and product within the same environment

#### Subscription APIs

Routes around:

- `/v1/subscriptions`
- `/v1/subscriptions/invoices`
- `/v1/analytics/subscriptions`
- `/v1/analytics/churn-cohorts`

Problems:

- many queries filter only by `merchant_id`
- some paths insert with `livemode`
- many reads do not filter `livemode` or future `environment_id`

Required changes:

- all subscription read/write flows must include `environment_id`
- invoice reads must scope to subscription environment
- analytics must aggregate per environment, not per merchant globally

#### Payment Links

Routes around:

- dashboard payment-link CRUD
- public `/pay/:id` and QR flows

Problems:

- links are keyed by `wallet_id` and user only
- no first-class environment identity

Required changes:

- add `environment_id`
- resolve link environment from the active environment at creation time
- keep public execution bound to the link's environment

#### Balances and Settlement

Routes around:

- `/merchants/stats`
- `/merchants/activity`
- merchant settlement and payout flows
- Connect pending/available balance updates

Problems:

- `balances` is structurally single-environment
- some test balance logic is computed from charges instead of balance rows
- connected-account balances are overloaded into the same table shape

Required changes:

- move to environment-aware balance records
- isolate merchant live and sandbox settlement state
- make connected-account balance model explicit

#### Webhooks

Routes around:

- `/v1/webhooks`
- `/v1/webhooks/endpoints`
- merchant webhook helpers

Problems:

- endpoints are merchant-global
- live and sandbox deliveries cannot be isolated cleanly

Required changes:

- webhook endpoints must belong to an environment
- delivery jobs must dispatch using endpoint environment
- webhook secret rotation must be per environment

#### Billing Meters and Usage

Routes around:

- `/v1/meters`
- `/v1/usage`

Problems:

- meters are unique by merchant only
- usage derives safety from subscription relation, not from explicit environment scope

Required changes:

- meter uniqueness must be merchant + environment
- usage lookups must validate subscription and meter are in the same environment

### Medium Risk

- `connect_config`
- `connect_fee_tiers`
- `connect_invites`
- `risk_rules`
- `customer_portal_sessions`
- `coupons`
- `submerchant_sessions`

These should be moved after core money flows but before UI environment switching is exposed broadly.

## Rollout Sequence

### Step 0: Preparation

- add feature flag for environment-aware routing
- add environment context to merchant dashboard sessions
- add compatibility helpers to translate `environment_id` <-> `livemode`

### Step 1: Schema Additions

- create `merchant_environments`
- add nullable `environment_id` to target tables
- add non-unique helper indexes for backfill speed

### Step 2: Backfill

- populate per-merchant live and default sandbox
- backfill `environment_id`
- verify row counts by table and by environment

### Step 3: Dual Read/Write

- all new writes set both `environment_id` and `livemode`
- reads prefer `environment_id`
- fallback to `livemode` only where backfill is incomplete

### Step 4: Constraint Tightening

- convert nullable `environment_id` to `NOT NULL`
- replace old uniqueness constraints with environment-aware ones
- change primary keys where required, especially `balances` and `connect_config`

### Step 5: UI Exposure

- only after route remediation is complete
- merchant dashboard can expose:
  - `Live Account`
  - `Sandboxes`
  - `Create Sandbox`

### Step 6: Compatibility Cleanup

- remove code paths that infer mode from `key_type`
- remove implicit `JWT session = live`
- eventually demote `livemode` to derived compatibility field or remove it

## Validation Checklist

- every merchant-scoped write path accepts or resolves `environment_id`
- every merchant-scoped read path filters by `environment_id`
- public payment-link execution resolves the correct environment
- live and sandbox API keys cannot access each other's resources
- live and sandbox webhook endpoints are isolated
- the same customer email can exist once in live and once in one or more sandboxes
- balances are independent per environment
- analytics and reports do not aggregate across environments

## Immediate Next Engineering Tasks

1. Implement `merchant_environments` and backfill scripts.
2. Convert `api_keys` and `DeveloperGateway` to first-class environment-aware auth.
3. Convert `balances` to an environment-aware shape before shipping dashboard environment switching.
4. Remediate `/v1/customers`, `/v1/products`, `/v1/prices`, `/v1/subscriptions`, `/v1/meters`, `/v1/webhooks`, and payment-link flows.
5. Only then introduce the merchant left-nav environment selector.
