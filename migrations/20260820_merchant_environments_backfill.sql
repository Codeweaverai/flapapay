-- Merchant environments phase 1 backfill
-- Date: 2026-08-20
-- Purpose:
--   Populate environment_id after phase 1 columns exist.
--
-- This migration intentionally does not set NOT NULL or replace uniqueness constraints.

BEGIN;

UPDATE charges c
SET environment_id = me.id
FROM merchant_environments me
WHERE c.merchant_id = me.merchant_id
  AND me.kind = CASE WHEN c.livemode THEN 'live' ELSE 'sandbox' END
  AND c.environment_id IS NULL;

UPDATE checkout_sessions cs
SET environment_id = me.id
FROM merchant_environments me
WHERE cs.merchant_id = me.merchant_id
  AND me.kind = CASE WHEN cs.livemode THEN 'live' ELSE 'sandbox' END
  AND cs.environment_id IS NULL;

UPDATE connected_accounts ca
SET environment_id = me.id
FROM merchant_environments me
WHERE ca.platform_merchant_id = me.merchant_id
  AND me.kind = CASE WHEN ca.livemode THEN 'live' ELSE 'sandbox' END
  AND ca.environment_id IS NULL;

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

UPDATE prices p
SET environment_id = pr.environment_id
FROM products pr
WHERE p.product_id = pr.id
  AND p.environment_id IS NULL;

UPDATE subscriptions s
SET environment_id = me.id
FROM merchant_environments me
WHERE s.merchant_id = me.merchant_id
  AND me.kind = CASE WHEN s.livemode THEN 'live' ELSE 'sandbox' END
  AND s.environment_id IS NULL;

UPDATE sub_invoice si
SET environment_id = s.environment_id
FROM subscriptions s
WHERE si.subscription_id = s.id
  AND si.environment_id IS NULL;

UPDATE wallets w
SET environment_id = me.id
FROM merchants m
JOIN merchant_environments me
  ON me.merchant_id = m.id
 AND me.kind = CASE WHEN w.livemode THEN 'live' ELSE 'sandbox' END
WHERE w.user_id = m.user_id
  AND w.environment_id IS NULL;

UPDATE ledger_entries le
SET environment_id = cw.environment_id
FROM wallets cw
WHERE le.credit_wallet_id = cw.id
  AND le.environment_id IS NULL;

UPDATE ledger_entries le
SET environment_id = dw.environment_id
FROM wallets dw
WHERE le.debit_wallet_id = dw.id
  AND le.environment_id IS NULL;

UPDATE wallet_withdrawals ww
SET environment_id = w.environment_id
FROM wallets w
WHERE ww.wallet_id = w.id
  AND ww.environment_id IS NULL;

UPDATE merchant_wallet_settlements mws
SET environment_id = w.environment_id
FROM wallets w
WHERE mws.wallet_id = w.id
  AND mws.environment_id IS NULL;

UPDATE payment_links pl
SET environment_id = w.environment_id
FROM wallets w
WHERE pl.wallet_id = w.id
  AND pl.environment_id IS NULL;

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

UPDATE balances b
SET environment_id = me.id
FROM merchant_environments me
WHERE b.merchant_id = me.merchant_id
  AND me.kind = 'live'
  AND b.environment_id IS NULL;

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

UPDATE billing_meters bm
SET environment_id = me.id
FROM merchant_environments me
WHERE bm.merchant_id = me.merchant_id
  AND me.kind = 'live'
  AND bm.environment_id IS NULL;

UPDATE billing_usage bu
SET environment_id = s.environment_id
FROM subscriptions s
WHERE bu.subscription_id = s.id
  AND bu.environment_id IS NULL;

UPDATE customer_portal_sessions cps
SET environment_id = c.environment_id
FROM customers c
WHERE cps.customer_id = c.id
  AND cps.environment_id IS NULL;

UPDATE coupons c
SET environment_id = me.id
FROM merchant_environments me
WHERE c.merchant_id = me.merchant_id
  AND me.kind = 'live'
  AND c.environment_id IS NULL;

UPDATE risk_rules rr
SET environment_id = me.id
FROM merchant_environments me
WHERE rr.merchant_id = me.merchant_id
  AND me.kind = 'live'
  AND rr.environment_id IS NULL;

UPDATE connect_config cc
SET environment_id = me.id
FROM merchant_environments me
WHERE cc.merchant_id = me.merchant_id
  AND me.kind = 'live'
  AND cc.environment_id IS NULL;

COMMIT;

-- Validation queries
-- Run separately after the transaction above.
--
-- SELECT 'wallets' AS table_name, COUNT(*) FROM wallets WHERE environment_id IS NULL
-- UNION ALL
-- SELECT 'ledger_entries', COUNT(*) FROM ledger_entries WHERE environment_id IS NULL
-- UNION ALL
-- SELECT 'charges', COUNT(*) FROM charges WHERE environment_id IS NULL
-- UNION ALL
-- SELECT 'customers', COUNT(*) FROM customers WHERE environment_id IS NULL
-- UNION ALL
-- SELECT 'products', COUNT(*) FROM products WHERE environment_id IS NULL
-- UNION ALL
-- SELECT 'prices', COUNT(*) FROM prices WHERE environment_id IS NULL
-- UNION ALL
-- SELECT 'subscriptions', COUNT(*) FROM subscriptions WHERE environment_id IS NULL
-- UNION ALL
-- SELECT 'payment_links', COUNT(*) FROM payment_links WHERE environment_id IS NULL
-- UNION ALL
-- SELECT 'api_keys', COUNT(*) FROM api_keys WHERE environment_id IS NULL
-- UNION ALL
-- SELECT 'billing_meters', COUNT(*) FROM billing_meters WHERE environment_id IS NULL
-- UNION ALL
-- SELECT 'billing_usage', COUNT(*) FROM billing_usage WHERE environment_id IS NULL
-- ORDER BY 1;
