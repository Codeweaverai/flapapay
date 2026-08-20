-- FlapaPay P0 environment isolation foundation
-- Date: 2026-08-20
-- Scope: additive schema only; safe to deploy before runtime enforcement.
-- Apply only after a verified database backup and on a staging clone first.
-- Runtime rollout is controlled separately with ENVIRONMENT_CONTEXT_ENABLED=false.
-- This migration intentionally does not drop old columns, replace uniqueness,
-- or make environment_id NOT NULL. Those are later gates after backfill validation.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

CREATE UNIQUE INDEX IF NOT EXISTS ux_merchant_environments_live
    ON merchant_environments (merchant_id)
    WHERE kind = 'live';

CREATE INDEX IF NOT EXISTS idx_merchant_environments_merchant_kind
    ON merchant_environments (merchant_id, kind);

-- Every merchant gets one live environment and one default sandbox.
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

-- Core financial and developer resources.
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE charges ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE merchant_wallet_settlements ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE wallet_withdrawals ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE wallet_mobile_money_collections ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE balances ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS mode VARCHAR(20);

-- Merchant resource graph.
ALTER TABLE customers ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE prices ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE sub_invoice ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE billing_meters ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE billing_usage ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE customer_portal_sessions ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE risk_rules ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE connect_config ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE connected_accounts ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE connect_ledger ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE connect_statements ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE connect_fee_tiers ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE connect_invites ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE connected_account_fee_overrides ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE connected_account_api_keys ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE connected_account_payout_methods ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE connected_account_kyc ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE onboarding_links ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE submerchant_sessions ADD COLUMN IF NOT EXISTS environment_id UUID;

-- Webhook isolation is part of the trust boundary, even before delivery code changes.
ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE webhook_endpoints ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE webhook_deliveries ADD COLUMN IF NOT EXISTS environment_id UUID;

-- Immutable-enough audit append log for environment-sensitive actions.
CREATE TABLE IF NOT EXISTS environment_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
    environment_id UUID NOT NULL REFERENCES merchant_environments(id) ON DELETE RESTRICT,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    request_id VARCHAR(120),
    action VARCHAR(160) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(160),
    outcome VARCHAR(40) NOT NULL CHECK (outcome IN ('allowed', 'denied', 'failed')),
    reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_environment_audit_log_lookup
    ON environment_audit_log (merchant_id, environment_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_environment_audit_log_request
    ON environment_audit_log (request_id);

-- Helper indexes. Do not add environment-aware UNIQUE constraints until validation
-- proves that legacy rows do not collide after backfill.
CREATE INDEX IF NOT EXISTS idx_wallets_merchant_environment
    ON wallets (user_id, environment_id, currency);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_environment_created
    ON ledger_entries (environment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_charges_merchant_environment_created
    ON charges (merchant_id, environment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_balances_merchant_environment
    ON balances (merchant_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_merchant_environment_active
    ON api_keys (merchant_id, environment_id, is_active);
CREATE INDEX IF NOT EXISTS idx_customers_merchant_environment
    ON customers (merchant_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_products_merchant_environment
    ON products (merchant_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_prices_environment_product
    ON prices (environment_id, product_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_merchant_environment
    ON subscriptions (merchant_id, environment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_links_user_environment
    ON payment_links (user_id, environment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhooks_merchant_environment
    ON webhooks (merchant_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_merchant_environment
    ON webhook_endpoints (merchant_id, environment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_environment
    ON webhook_deliveries (environment_id, created_at DESC);

-- NOT VALID allows the additive migration to complete while legacy NULLs exist;
-- new non-NULL values are still checked by PostgreSQL. Validate after backfill.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_wallets_environment') THEN
        ALTER TABLE wallets ADD CONSTRAINT fk_wallets_environment
            FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ledger_entries_environment') THEN
        ALTER TABLE ledger_entries ADD CONSTRAINT fk_ledger_entries_environment
            FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_charges_environment') THEN
        ALTER TABLE charges ADD CONSTRAINT fk_charges_environment
            FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_balances_environment') THEN
        ALTER TABLE balances ADD CONSTRAINT fk_balances_environment
            FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_api_keys_environment') THEN
        ALTER TABLE api_keys ADD CONSTRAINT fk_api_keys_environment
            FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_webhook_endpoints_environment') THEN
        ALTER TABLE webhook_endpoints ADD CONSTRAINT fk_webhook_endpoints_environment
            FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT NOT VALID;
    END IF;
END $$;

COMMIT;

-- Rollback policy:
-- Do not drop environment_id, audit, or merchant_environments after backfill.
-- Roll back runtime by setting ENVIRONMENT_CONTEXT_ENABLED=false and redeploying.
-- Destructive schema rollback requires a separately reviewed maintenance migration.
