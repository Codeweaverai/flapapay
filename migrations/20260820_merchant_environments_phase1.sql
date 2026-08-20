-- Merchant environments phase 1
-- Date: 2026-08-20
-- Purpose:
--   1. Create first-class merchant environments
--   2. Add nullable environment_id columns
--   3. Add helper indexes only
--
-- This migration is intentionally additive.
-- It does not backfill data and does not tighten constraints.

BEGIN;

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

INSERT INTO merchant_environments (merchant_id, name, slug, kind)
SELECT m.id, 'Live Account', 'live', 'live'
FROM merchants m
WHERE NOT EXISTS (
    SELECT 1
    FROM merchant_environments me
    WHERE me.merchant_id = m.id
      AND me.kind = 'live'
);

INSERT INTO merchant_environments (merchant_id, name, slug, kind)
SELECT m.id, 'Default Sandbox', 'default-sandbox', 'sandbox'
FROM merchants m
WHERE NOT EXISTS (
    SELECT 1
    FROM merchant_environments me
    WHERE me.merchant_id = m.id
      AND me.kind = 'sandbox'
);

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

ALTER TABLE customers ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE prices ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE sub_invoice ADD COLUMN IF NOT EXISTS environment_id UUID;

ALTER TABLE wallets
    ADD CONSTRAINT fk_wallets_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;
ALTER TABLE ledger_entries
    ADD CONSTRAINT fk_ledger_entries_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;
ALTER TABLE charges
    ADD CONSTRAINT fk_charges_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;
ALTER TABLE checkout_sessions
    ADD CONSTRAINT fk_checkout_sessions_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;
ALTER TABLE connected_accounts
    ADD CONSTRAINT fk_connected_accounts_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;
ALTER TABLE merchant_wallet_settlements
    ADD CONSTRAINT fk_merchant_wallet_settlements_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;
ALTER TABLE wallet_withdrawals
    ADD CONSTRAINT fk_wallet_withdrawals_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;
ALTER TABLE api_keys
    ADD CONSTRAINT fk_api_keys_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;
ALTER TABLE payment_links
    ADD CONSTRAINT fk_payment_links_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;
ALTER TABLE webhooks
    ADD CONSTRAINT fk_webhooks_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;
ALTER TABLE webhook_endpoints
    ADD CONSTRAINT fk_webhook_endpoints_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;
ALTER TABLE balances
    ADD CONSTRAINT fk_balances_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;
ALTER TABLE customers
    ADD CONSTRAINT fk_customers_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;
ALTER TABLE products
    ADD CONSTRAINT fk_products_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;
ALTER TABLE prices
    ADD CONSTRAINT fk_prices_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;
ALTER TABLE subscriptions
    ADD CONSTRAINT fk_subscriptions_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;
ALTER TABLE sub_invoice
    ADD CONSTRAINT fk_sub_invoice_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;
ALTER TABLE billing_meters
    ADD CONSTRAINT fk_billing_meters_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;
ALTER TABLE billing_usage
    ADD CONSTRAINT fk_billing_usage_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;
ALTER TABLE customer_portal_sessions
    ADD CONSTRAINT fk_customer_portal_sessions_environment
    FOREIGN KEY (environment_id) REFERENCES merchant_environments(id) ON DELETE RESTRICT;

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
CREATE INDEX IF NOT EXISTS idx_payment_links_environment
ON payment_links (environment_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_environment
ON api_keys (environment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_environment
ON webhook_endpoints (environment_id);
CREATE INDEX IF NOT EXISTS idx_billing_meters_environment
ON billing_meters (environment_id);

COMMIT;
