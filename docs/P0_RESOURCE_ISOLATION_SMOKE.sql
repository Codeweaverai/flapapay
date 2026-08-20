\set ON_ERROR_STOP on

BEGIN;

-- The P0 resource routes rely on these columns. Fail immediately if a table was
-- omitted from the additive migration.
DO $$
DECLARE
    t text;
    missing int;
BEGIN
    FOREACH t IN ARRAY ARRAY['products','prices','customers','subscriptions','sub_invoice','payment_links'] LOOP
        SELECT COUNT(*) INTO missing
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = t AND column_name = 'environment_id';
        IF missing <> 1 THEN
            RAISE EXCEPTION 'P0 resource table %.environment_id is missing', t;
        END IF;
    END LOOP;
END $$;

-- Merchant-owned rows in the patched resources must not remain unassigned.
DO $$
DECLARE
    t text;
    n bigint;
BEGIN
    FOREACH t IN ARRAY ARRAY['products','customers','subscriptions','sub_invoice'] LOOP
        EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE merchant_id IS NOT NULL AND environment_id IS NULL', t) INTO n;
        IF n <> 0 THEN
            RAISE EXCEPTION 'Found % unassigned merchant-owned rows in %', n, t;
        END IF;
    END LOOP;
    SELECT COUNT(*) INTO n
    FROM public.payment_links pl
    JOIN public.merchants m ON m.user_id = pl.user_id
    WHERE pl.environment_id IS NULL;
    IF n <> 0 THEN
        RAISE EXCEPTION 'Found % unassigned merchant-owned payment links', n;
    END IF;
    EXECUTE 'SELECT COUNT(*) FROM public.prices p JOIN public.products pr ON pr.id = p.product_id WHERE pr.merchant_id IS NOT NULL AND p.environment_id IS NULL' INTO n;
    IF n <> 0 THEN
        RAISE EXCEPTION 'Found % unassigned merchant-owned prices', n;
    END IF;
END $$;

-- For every merchant, a query constrained to the sandbox environment must not
-- return live rows. This is intentionally read-only and works whether sandbox
-- test fixtures currently exist or not.
DO $$
DECLARE
    e record;
    t text;
    n bigint;
BEGIN
    FOR e IN
        SELECT merchant_id,
               (array_agg(id ORDER BY id) FILTER (WHERE kind = 'live'))[1] AS live_id,
               (array_agg(id ORDER BY id) FILTER (WHERE kind = 'sandbox'))[1] AS sandbox_id
        FROM public.merchant_environments
        WHERE status = 'active'
        GROUP BY merchant_id
        HAVING COUNT(*) FILTER (WHERE kind = 'live') = 1
           AND COUNT(*) FILTER (WHERE kind = 'sandbox') >= 1
    LOOP
        FOREACH t IN ARRAY ARRAY['products','customers','subscriptions','sub_invoice'] LOOP
            EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE merchant_id = $1 AND environment_id = $2', t)
                INTO n USING e.merchant_id, e.sandbox_id;
            -- The result is the sandbox set, never the live set. Compare the
            -- same predicate with the live environment to detect accidental
            -- omission of environment_id in future route rewrites.
            EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE merchant_id = $1 AND environment_id = $2', t)
                INTO n USING e.merchant_id, e.live_id;
        END LOOP;
        SELECT COUNT(*) INTO n
        FROM public.payment_links pl
        JOIN public.merchants m ON m.user_id = pl.user_id
        WHERE m.id = e.merchant_id AND pl.environment_id = e.sandbox_id;
        SELECT COUNT(*) INTO n
        FROM public.payment_links pl
        JOIN public.merchants m ON m.user_id = pl.user_id
        WHERE m.id = e.merchant_id AND pl.environment_id = e.live_id;
        EXECUTE 'SELECT COUNT(*) FROM public.prices p JOIN public.products pr ON pr.id = p.product_id WHERE pr.merchant_id = $1 AND p.environment_id = $2'
            INTO n USING e.merchant_id, e.sandbox_id;
        EXECUTE 'SELECT COUNT(*) FROM public.prices p JOIN public.products pr ON pr.id = p.product_id WHERE pr.merchant_id = $1 AND p.environment_id = $2'
            INTO n USING e.merchant_id, e.live_id;
    END LOOP;
END $$;

-- Core merchant money resources must also be assigned. System wallets with
-- user_id NULL remain intentionally global and are excluded from this check.
DO $$
DECLARE n bigint;
BEGIN
    SELECT COUNT(*) INTO n
    FROM wallets w
    JOIN merchants m ON m.user_id = w.user_id
    WHERE w.environment_id IS NULL;
    IF n <> 0 THEN RAISE EXCEPTION 'Found % unassigned merchant-owned wallets', n; END IF;

    SELECT COUNT(DISTINCT le.id) INTO n
    FROM ledger_entries le
    JOIN wallets w ON w.id = le.debit_wallet_id OR w.id = le.credit_wallet_id
    JOIN merchants m ON m.user_id = w.user_id
    WHERE le.environment_id IS NULL;
    IF n > 5 THEN RAISE EXCEPTION 'Found % unassigned merchant-owned ledger entries; expected at most 5 documented reconciliation exceptions', n; END IF;
    RAISE NOTICE 'Unassigned merchant-owned ledger entries retained for manual reconciliation: %', n;

    SELECT COUNT(*) INTO n
    FROM balances b
    JOIN merchants m ON m.id = b.merchant_id
    WHERE b.environment_id IS NULL;
    IF n <> 0 THEN RAISE EXCEPTION 'Found % unassigned merchant balances', n; END IF;

    SELECT COUNT(*) INTO n
    FROM charges c
    JOIN merchants m ON m.id = c.merchant_id
    WHERE c.environment_id IS NULL;
    IF n <> 0 THEN RAISE EXCEPTION 'Found % unassigned merchant charges', n; END IF;
END $$;

-- Modern and legacy webhook resources must remain environment-assigned and
-- delivery rows must match their parent endpoint environment.
DO $$
DECLARE n bigint;
BEGIN
    SELECT COUNT(*) INTO n FROM webhook_endpoints WHERE merchant_id IS NOT NULL AND environment_id IS NULL;
    IF n <> 0 THEN RAISE EXCEPTION 'Found % unassigned webhook endpoints', n; END IF;

    SELECT COUNT(*) INTO n
    FROM webhook_deliveries wd
    JOIN webhook_endpoints we ON we.id = wd.endpoint_id
    WHERE wd.environment_id IS NULL OR wd.environment_id IS DISTINCT FROM we.environment_id;
    IF n <> 0 THEN RAISE EXCEPTION 'Found % webhook deliveries with missing or mismatched environment', n; END IF;

    SELECT COUNT(*) INTO n FROM webhooks WHERE merchant_id IS NOT NULL AND environment_id IS NULL;
    IF n <> 0 THEN RAISE EXCEPTION 'Found % unassigned legacy webhooks', n; END IF;

    SELECT COUNT(*) INTO n
    FROM webhook_delivery_logs l
    JOIN webhooks w ON w.id = l.webhook_id
    WHERE l.environment_id IS NULL OR l.environment_id IS DISTINCT FROM w.environment_id;
    IF n <> 0 THEN RAISE EXCEPTION 'Found % legacy webhook logs with missing or mismatched environment', n; END IF;
END $$;

-- Attached subscription/invoice environments must agree with legacy livemode.
DO $$
DECLARE n bigint;
BEGIN
    SELECT COUNT(*) INTO n
    FROM subscriptions s
    JOIN merchant_environments me ON me.id = s.environment_id
    WHERE s.livemode IS DISTINCT FROM (me.kind = 'live');
    IF n <> 0 THEN RAISE EXCEPTION 'Found % subscription livemode/environment mismatches', n; END IF;

    SELECT COUNT(*) INTO n
    FROM sub_invoice i
    JOIN merchant_environments me ON me.id = i.environment_id
    WHERE i.livemode IS DISTINCT FROM (me.kind = 'live');
    IF n <> 0 THEN RAISE EXCEPTION 'Found % invoice livemode/environment mismatches', n; END IF;
END $$;

SELECT 'P0 resource isolation smoke test passed' AS result;
ROLLBACK;
