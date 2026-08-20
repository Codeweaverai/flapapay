-- FlapaPay P0 validation queries
-- Read-only. Run after the additive migration and backfill on staging first.

SELECT 'merchant_environments' AS check_name,
       COUNT(*) AS total_rows,
       COUNT(*) FILTER (WHERE kind = 'live') AS live_rows,
       COUNT(*) FILTER (WHERE kind = 'sandbox') AS sandbox_rows
FROM merchant_environments;

SELECT merchant_id,
       COUNT(*) FILTER (WHERE kind = 'live') AS live_count,
       COUNT(*) FILTER (WHERE kind = 'sandbox') AS sandbox_count
FROM merchant_environments
GROUP BY merchant_id
HAVING COUNT(*) FILTER (WHERE kind = 'live') <> 1
    OR COUNT(*) FILTER (WHERE kind = 'sandbox') < 1;

SELECT 'merchant_owned_wallets' AS table_name, COUNT(*) AS unresolved
FROM wallets w JOIN merchants m ON m.user_id = w.user_id
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
UNION ALL SELECT 'cross_environment_ledger_review' , COUNT(*)
FROM ledger_entries le
JOIN wallets credit_wallet ON credit_wallet.id = le.credit_wallet_id
JOIN wallets debit_wallet ON debit_wallet.id = le.debit_wallet_id
WHERE le.environment_id IS NULL
  AND credit_wallet.environment_id IS NOT NULL
  AND debit_wallet.environment_id IS NOT NULL
  AND credit_wallet.environment_id <> debit_wallet.environment_id
UNION ALL SELECT 'global_wallets_nullable', COUNT(*) FROM wallets WHERE environment_id IS NULL AND NOT EXISTS (SELECT 1 FROM merchants m WHERE m.user_id = wallets.user_id)
UNION ALL SELECT 'global_only_ledger_entries_nullable', COUNT(*)
FROM ledger_entries le
WHERE le.environment_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM wallets w JOIN merchants m ON m.user_id = w.user_id WHERE w.id = le.credit_wallet_id)
  AND NOT EXISTS (SELECT 1 FROM wallets w JOIN merchants m ON m.user_id = w.user_id WHERE w.id = le.debit_wallet_id)
UNION ALL SELECT 'charges', COUNT(*) FROM charges WHERE environment_id IS NULL
UNION ALL SELECT 'balances', COUNT(*) FROM balances WHERE environment_id IS NULL
UNION ALL SELECT 'api_keys', COUNT(*) FROM api_keys WHERE environment_id IS NULL
UNION ALL SELECT 'webhook_endpoints', COUNT(*) FROM webhook_endpoints WHERE environment_id IS NULL
ORDER BY table_name;

SELECT 'wallets_livemode_mismatch' AS check_name, COUNT(*) AS failures
FROM wallets w
JOIN merchant_environments me ON me.id = w.environment_id
WHERE (w.livemode = TRUE AND me.kind <> 'live')
   OR (w.livemode = FALSE AND me.kind <> 'sandbox');

SELECT 'charges_livemode_mismatch' AS check_name, COUNT(*) AS failures
FROM charges c
JOIN merchant_environments me ON me.id = c.environment_id
WHERE (c.livemode = TRUE AND me.kind <> 'live')
   OR (c.livemode = FALSE AND me.kind <> 'sandbox');

SELECT 'ledger_cross_environment' AS check_name, COUNT(*) AS failures
FROM ledger_entries le
JOIN wallets credit_wallet ON credit_wallet.id = le.credit_wallet_id
JOIN wallets debit_wallet ON debit_wallet.id = le.debit_wallet_id
WHERE credit_wallet.environment_id IS NOT NULL
  AND debit_wallet.environment_id IS NOT NULL
  AND credit_wallet.environment_id <> debit_wallet.environment_id;

SELECT 'merchant_ledger_missing_environment' AS check_name, COUNT(*) AS failures
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
  );

SELECT 'api_key_prefix_mismatch' AS check_name, COUNT(*) AS failures
FROM api_keys k
JOIN merchant_environments me ON me.id = k.environment_id
WHERE (k.key_type LIKE 'live_%' AND me.kind <> 'live')
   OR ((k.key_type LIKE 'test_%' OR k.key_type = 'test') AND me.kind <> 'sandbox');

SELECT 'customer_email_cross_environment' AS check_name, COUNT(*) AS duplicate_groups
FROM (
    SELECT merchant_id, LOWER(email), environment_id
    FROM customers
    GROUP BY merchant_id, LOWER(email), environment_id
    HAVING COUNT(*) > 1
) duplicates;

SELECT 'orphan_environment_refs' AS check_name, COUNT(*) AS failures
FROM (
    SELECT environment_id FROM wallets WHERE environment_id IS NOT NULL
    UNION ALL SELECT environment_id FROM ledger_entries WHERE environment_id IS NOT NULL
    UNION ALL SELECT environment_id FROM charges WHERE environment_id IS NOT NULL
    UNION ALL SELECT environment_id FROM api_keys WHERE environment_id IS NOT NULL
) refs
LEFT JOIN merchant_environments me ON me.id = refs.environment_id
WHERE me.id IS NULL;

-- Later gate: run only after every row is backfilled and all route code is dual-read.
-- SELECT table_name, COUNT(*) AS remaining_nulls ...;
-- ALTER TABLE wallets ALTER COLUMN environment_id SET NOT NULL;
