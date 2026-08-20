-- FlapaPay P0 environment backfill
-- Run only after 20260820_merchant_environments_p0.sql succeeds,
-- on a verified backup/staging clone first.
-- This migration does not make environment_id NOT NULL.

BEGIN;

-- Rows with an explicit livemode flag map directly to live or the default sandbox.
UPDATE charges c
SET environment_id = me.id
FROM merchant_environments me
WHERE c.merchant_id = me.merchant_id
  AND me.kind = CASE WHEN c.livemode THEN 'live' ELSE 'sandbox' END
  AND c.environment_id IS NULL;

UPDATE checkout_sessions c
SET environment_id = me.id
FROM merchant_environments me
WHERE c.merchant_id = me.merchant_id
  AND me.kind = CASE WHEN c.livemode THEN 'live' ELSE 'sandbox' END
  AND c.environment_id IS NULL;

UPDATE customers c
SET environment_id = me.id
FROM merchant_environments me
WHERE c.merchant_id = me.merchant_id
  AND me.kind = CASE WHEN c.livemode THEN 'live' ELSE 'sandbox' END
  AND c.environment_id IS NULL;

UPDATE products p
SET environment_id = me.id
FROM merchant_environments me
WHERE p.merchant_id = me.merchant_id
  AND me.kind = CASE WHEN p.livemode THEN 'live' ELSE 'sandbox' END
  AND p.environment_id IS NULL;

UPDATE subscriptions s
SET environment_id = me.id
FROM merchant_environments me
WHERE s.merchant_id = me.merchant_id
  AND me.kind = CASE WHEN s.livemode THEN 'live' ELSE 'sandbox' END
  AND s.environment_id IS NULL;

UPDATE connected_accounts ca
SET environment_id = me.id
FROM merchant_environments me
WHERE ca.platform_merchant_id = me.merchant_id
  AND me.kind = CASE WHEN ca.livemode THEN 'live' ELSE 'sandbox' END
  AND ca.environment_id IS NULL;

UPDATE payout_requests p
SET environment_id = me.id
FROM merchant_environments me
WHERE p.platform_merchant_id = me.merchant_id
  AND me.kind = CASE WHEN p.livemode THEN 'live' ELSE 'sandbox' END
  AND p.environment_id IS NULL;

UPDATE refunds r
SET environment_id = me.id
FROM merchant_environments me
WHERE r.merchant_id = me.merchant_id
  AND me.kind = CASE WHEN r.livemode THEN 'live' ELSE 'sandbox' END
  AND r.environment_id IS NULL;

UPDATE disputes d
SET environment_id = me.id
FROM merchant_environments me
WHERE d.merchant_id = me.merchant_id
  AND me.kind = CASE WHEN d.livemode THEN 'live' ELSE 'sandbox' END
  AND d.environment_id IS NULL;

-- Products define the environment of their prices and invoices.
UPDATE prices p
SET environment_id = product.environment_id
FROM products product
WHERE p.product_id = product.id
  AND p.environment_id IS NULL;

UPDATE sub_invoice invoice
SET environment_id = subscription.environment_id
FROM subscriptions subscription
WHERE invoice.subscription_id = subscription.id
  AND invoice.environment_id IS NULL;

UPDATE billing_usage usage
SET environment_id = subscription.environment_id
FROM subscriptions subscription
WHERE usage.subscription_id = subscription.id
  AND usage.environment_id IS NULL;

UPDATE customer_portal_sessions session
SET environment_id = customer.environment_id
FROM customers customer
WHERE session.customer_id = customer.id
  AND session.environment_id IS NULL;

-- Wallets are owned by the merchant's user in the current schema.
UPDATE wallets wallet
SET environment_id = environment.id
FROM merchants merchant
JOIN merchant_environments environment
  ON environment.merchant_id = merchant.id
WHERE wallet.user_id = merchant.user_id
  AND environment.kind = CASE WHEN wallet.livemode THEN 'live' ELSE 'sandbox' END
  AND wallet.environment_id IS NULL;

-- Merchant-owned wallets resolve to an environment. Non-merchant/system wallets
-- remain global and nullable. For a system-wallet-to-merchant-wallet entry,
-- the merchant-owned side supplies the ledger environment; system-to-system
-- entries remain global until a separate platform-wallet model is introduced.
UPDATE ledger_entries entry
SET environment_id = credit_wallet.environment_id
FROM wallets credit_wallet
WHERE entry.credit_wallet_id = credit_wallet.id
  AND entry.environment_id IS NULL
  AND credit_wallet.environment_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM wallets debit_wallet
      WHERE debit_wallet.id = entry.debit_wallet_id
        AND debit_wallet.environment_id IS NOT NULL
        AND debit_wallet.environment_id <> credit_wallet.environment_id
  );

UPDATE ledger_entries entry
SET environment_id = debit_wallet.environment_id
FROM wallets debit_wallet
WHERE entry.debit_wallet_id = debit_wallet.id
  AND entry.environment_id IS NULL
  AND debit_wallet.environment_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM wallets credit_wallet
      WHERE credit_wallet.id = entry.credit_wallet_id
        AND credit_wallet.environment_id IS NOT NULL
        AND credit_wallet.environment_id <> debit_wallet.environment_id
  );

UPDATE wallet_withdrawals withdrawal
SET environment_id = wallet.environment_id
FROM wallets wallet
WHERE withdrawal.wallet_id = wallet.id
  AND withdrawal.environment_id IS NULL;

UPDATE merchant_wallet_settlements settlement
SET environment_id = wallet.environment_id
FROM wallets wallet
WHERE settlement.wallet_id = wallet.id
  AND settlement.environment_id IS NULL;

UPDATE payment_links link
SET environment_id = wallet.environment_id
FROM wallets wallet
WHERE link.wallet_id = wallet.id
  AND link.environment_id IS NULL;

-- Keys are mapped from the current key_type convention. Unknown types are
-- intentionally left unresolved and fail the validation below rather than
-- being guessed into live or sandbox.
UPDATE api_keys key
SET environment_id = environment.id,
    mode = CASE WHEN key.key_type LIKE 'live_%' THEN 'live' ELSE 'sandbox' END
FROM merchant_environments environment
WHERE key.merchant_id = environment.merchant_id
  AND environment.kind = CASE WHEN key.key_type LIKE 'live_%' THEN 'live' ELSE 'sandbox' END
  AND key.environment_id IS NULL;

-- These resources have no reliable legacy environment signal in the current
-- model. Existing records are conservatively mapped to live, matching the
-- project migration specification. New sandbox records must not use this
-- fallback once runtime enforcement is enabled.
UPDATE balances b
SET environment_id = environment.id
FROM merchant_environments environment
WHERE b.merchant_id = environment.merchant_id
  AND environment.kind = 'live'
  AND b.environment_id IS NULL;

-- Connected-account balances use connected_accounts.id in the legacy schema,
-- not the parent merchant ID. Their environment was backfilled above.
UPDATE balances b
SET environment_id = connected_account.environment_id
FROM connected_accounts connected_account
WHERE b.merchant_id = connected_account.id
  AND connected_account.environment_id IS NOT NULL
  AND b.environment_id IS NULL;

UPDATE webhooks webhook
SET environment_id = environment.id
FROM merchant_environments environment
WHERE webhook.merchant_id = environment.merchant_id
  AND environment.kind = 'live'
  AND webhook.environment_id IS NULL;

UPDATE webhook_endpoints endpoint
SET environment_id = environment.id
FROM merchant_environments environment
WHERE endpoint.merchant_id = environment.merchant_id
  AND environment.kind = 'live'
  AND endpoint.environment_id IS NULL;

UPDATE webhook_deliveries delivery
SET environment_id = endpoint.environment_id
FROM webhook_endpoints endpoint
WHERE delivery.endpoint_id = endpoint.id
  AND delivery.environment_id IS NULL;

UPDATE billing_meters meter
SET environment_id = environment.id
FROM merchant_environments environment
WHERE meter.merchant_id = environment.merchant_id
  AND environment.kind = 'live'
  AND meter.environment_id IS NULL;

UPDATE coupons coupon
SET environment_id = environment.id
FROM merchant_environments environment
WHERE coupon.merchant_id = environment.merchant_id
  AND environment.kind = 'live'
  AND coupon.environment_id IS NULL;

UPDATE risk_rules rule
SET environment_id = environment.id
FROM merchant_environments environment
WHERE rule.merchant_id = environment.merchant_id
  AND environment.kind = 'live'
  AND rule.environment_id IS NULL;

UPDATE connect_config config
SET environment_id = environment.id
FROM merchant_environments environment
WHERE config.merchant_id = environment.merchant_id
  AND environment.kind = 'live'
  AND config.environment_id IS NULL;

-- Fail closed for merchant-owned P0 rows. Global/system wallets and ledger
-- entries that involve only global wallets are intentionally excluded from the
-- environment-scoped count and remain nullable by design.
DO $$
DECLARE
    unresolved TEXT;
BEGIN
    SELECT string_agg(table_name || '=' || missing_count::TEXT, ', ' ORDER BY table_name)
    INTO unresolved
    FROM (
        SELECT 'merchant_owned_wallets' AS table_name, COUNT(*) AS missing_count
        FROM wallets w
        JOIN merchants m ON m.user_id = w.user_id
        WHERE w.environment_id IS NULL
        UNION ALL SELECT 'merchant_owned_ledger_entries', COUNT(*)
        FROM ledger_entries le
        WHERE le.environment_id IS NULL
          AND (EXISTS (SELECT 1 FROM wallets w JOIN merchants m ON m.user_id = w.user_id WHERE w.id = le.credit_wallet_id)
            OR EXISTS (SELECT 1 FROM wallets w JOIN merchants m ON m.user_id = w.user_id WHERE w.id = le.debit_wallet_id))
          AND NOT EXISTS (
              SELECT 1
              FROM wallets credit_wallet
              JOIN wallets debit_wallet ON debit_wallet.id = le.debit_wallet_id
              WHERE credit_wallet.id = le.credit_wallet_id
                AND credit_wallet.environment_id IS NOT NULL
                AND debit_wallet.environment_id IS NOT NULL
                AND credit_wallet.environment_id <> debit_wallet.environment_id
          )
        UNION ALL SELECT 'charges', COUNT(*) FROM charges WHERE environment_id IS NULL
        UNION ALL SELECT 'balances', COUNT(*) FROM balances WHERE environment_id IS NULL
        UNION ALL SELECT 'api_keys', COUNT(*) FROM api_keys WHERE environment_id IS NULL
        UNION ALL SELECT 'webhook_endpoints', COUNT(*) FROM webhook_endpoints WHERE environment_id IS NULL
    ) counts
    WHERE missing_count > 0;

    IF unresolved IS NOT NULL THEN
        RAISE EXCEPTION 'P0 environment backfill incomplete: %', unresolved;
    END IF;

    RAISE NOTICE 'Legacy cross-environment ledger rows remain NULL for manual reconciliation: %', (
        SELECT COUNT(*)
        FROM ledger_entries le
        JOIN wallets credit_wallet ON credit_wallet.id = le.credit_wallet_id
        JOIN wallets debit_wallet ON debit_wallet.id = le.debit_wallet_id
        WHERE le.environment_id IS NULL
          AND credit_wallet.environment_id IS NOT NULL
          AND debit_wallet.environment_id IS NOT NULL
          AND credit_wallet.environment_id <> debit_wallet.environment_id
    );

    -- Legacy cross-environment ledger entries are deliberately left NULL for
    -- manual reconciliation. They must not be assigned to either environment.
    -- New runtime writes must reject this condition before inserting a ledger row.
END $$;

COMMIT;
