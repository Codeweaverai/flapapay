# P0 Environment Middleware Integration

This patch adds an environment identity at the backend trust boundary. It is designed to run in compatibility mode first and become fail-closed after backfill and route remediation.

## 1. Add the module

Copy `environmentContext.js` into:

```text
services/environmentContext.js
```

The module is dependency-injected with the existing `pg` pool and provides:

```js
attachApiKeyEnvironment(req, pool, rawKey)
attachJwtEnvironment(req, pool, { merchantId, actorUserId })
resolveEnvironment(pool, { merchantId, environmentId, kind, slug })
environmentResponse(req)
```

## 2. Configure rollout flags

Add these server-side environment variables. Do not expose them to the browser.

```dotenv
# First deploy: false. Enable only after the additive migration is applied.
ENVIRONMENT_CONTEXT_ENABLED=false

# First deploy: false. Enable after dashboard requests carry the environment header.
ENVIRONMENT_CONTEXT_REQUIRE_EXPLICIT=false
```

The first flag changes API-key resolution to require `api_keys.environment_id` and active `merchant_environments`. The second flag later requires dashboard JWT requests to send the active environment ID explicitly.

## 3. Replace `authenticateApiKey` in `unified-server.js`

Add the import beside the other service imports:

```js
const {
    attachApiKeyEnvironment,
    environmentErrorHandler,
} = require('./services/environmentContext');
```

Replace the current mode inference:

```js
req.merchant = result.rows[0];
req.isTestMode = req.merchant.key_type.startsWith('test_');
next();
```

with:

```js
try {
    await attachApiKeyEnvironment(req, pool, apiKey);
    return next();
} catch (error) {
    if (error?.status) {
        return res.status(error.status).json({
            error: error.message,
            code: error.code,
        });
    }
    console.error('Environment API key resolution error:', error);
    return res.status(500).json({ error: 'Environment resolution failed' });
}
```

For the P0 migration window, the old lookup may remain temporarily for routes not yet migrated, but it must not set `req.isTestMode` from `key_type` once `ENVIRONMENT_CONTEXT_ENABLED=true`.

## 4. Replace the API-key branch of `authenticateMerchant`

In the API-key branch, replace the merchant-only query and mode inference with the same helper:

```js
try {
    await attachApiKeyEnvironment(req, pool, tokenOrKey);
    return next();
} catch (error) {
    if (error?.status) {
        return res.status(error.status).json({
            error: error.message,
            code: error.code,
        });
    }
    console.error('Environment merchant API key resolution error:', error);
    return res.status(500).json({ error: 'Environment resolution failed' });
}
```

The prefix check may remain only as an optimization. It must not determine live versus sandbox access.

## 5. Add environment resolution to the JWT branch

After the existing JWT branch has identified the merchant and set `req.user`, add:

```js
const {
    attachJwtEnvironment,
} = require('./services/environmentContext');

try {
    await attachJwtEnvironment(req, pool, {
        merchantId: req.merchant.id,
        actorUserId: decoded.userId,
    });
} catch (error) {
    if (error?.status) {
        return res.status(error.status).json({
            error: error.message,
            code: error.code,
        });
    }
    console.error('Environment JWT resolution error:', error);
    return res.status(500).json({ error: 'Environment resolution failed' });
}
```

Do not retain the old unconditional behavior:

```js
req.isTestMode = !req.merchant.is_live_enabled;
```

The environment context must set:

```js
req.environmentId
req.environmentKind // 'live' | 'sandbox'
req.environmentSlug
req.isTestMode      // compatibility boolean only
req.environmentSource
```

## 6. Update `DeveloperGateway.js`

The gateway currently queries `api_keys` by key value and returns `keyData.environment || 'test'`, while API-key environment identity is not structurally present in the old query. Replace that behavior with the shared resolver.

At the top of `DeveloperGateway.js`:

```js
const {
    resolveApiKey,
    resolveEnvironment,
    ENVIRONMENT_CONTEXT_ENABLED,
    ENVIRONMENT_CONTEXT_REQUIRE_EXPLICIT,
} = require('./environmentContext');
```

Change the signature so routes can pass the request context:

```js
static async authenticate(authHeader, context = {}) {
```

Replace the API-key lookup block with:

```js
const keyData = await resolveApiKey(pool, tokenOrKey);
const environment = ENVIRONMENT_CONTEXT_ENABLED
    ? await resolveEnvironment(pool, {
        merchantId: keyData.merchant_id,
        environmentId: keyData.environment_id,
    })
    : null;

return {
    merchantId: keyData.merchant_id,
    merchantName: keyData.merchant_name,
    ownerId: keyData.owner_id,
    apiKeyId: keyData.api_key_id,
    environmentId: environment?.id || null,
    environmentSlug: environment?.slug || null,
    environment: environment?.kind || (keyData.key_type?.startsWith('test_') ? 'sandbox' : 'live'),
    permissions: keyData.permissions || [],
};
```

Replace the JWT return block with:

```js
const requestedEnvironmentId = context.environmentId || null;
if (ENVIRONMENT_CONTEXT_ENABLED && ENVIRONMENT_CONTEXT_REQUIRE_EXPLICIT && !requestedEnvironmentId) {
    throw new Error('Environment context is required for dashboard API access');
}

const environment = await resolveEnvironment(pool, {
    merchantId: merchant.merchant_id,
    environmentId: requestedEnvironmentId,
});

return {
    merchantId: merchant.merchant_id,
    merchantName: merchant.merchant_name,
    ownerId: merchant.owner_id,
    apiKeyId: null,
    environmentId: environment.id,
    environmentSlug: environment.slug,
    environment: environment.kind,
    permissions: ['all'],
};
```

## 7. Pass the request environment to DeveloperGateway

For each existing route that calls `DeveloperGateway.authenticate`, change:

```js
const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
```

to:

```js
const merchant = await DeveloperGateway.authenticate(
    req.headers.authorization,
    {
        environmentId: req.headers['x-flapapay-environment-id'] || null,
        actorUserId: req.user?.id || null,
    },
);
```

During the compatibility window, the API-key path is already authoritative because the key itself carries `environment_id`. The JWT path becomes explicit after the dashboard toggle and the second rollout flag are enabled.

## 8. Enforce same-environment resource ownership

Every migrated route must obtain the environment from `req.environmentId` or the returned gateway object and include it in reads and writes:

```js
const environmentId = req.environmentId || merchant.environmentId;

const result = await pool.query(
    `SELECT *
       FROM customers
      WHERE id = $1
        AND merchant_id = $2
        AND environment_id = $3`,
    [customerId, merchantId, environmentId],
);
```

For object graphs, validate both parent and child:

```sql
SELECT 1
FROM prices price
JOIN products product ON product.id = price.product_id
WHERE price.id = $1
  AND price.environment_id = $2
  AND product.environment_id = $2;
```

Never accept a client-provided `livemode` boolean as the authority. Keep it only as a compatibility field during dual-write rollout.

## 9. Add an explicit environment endpoint

Before the dashboard toggle is shown, add these authenticated routes:

```js
app.get('/merchant/environments', authenticateToken, requireMerchantWorkspace, async (req, res) => {
    const result = await pool.query(
        `SELECT id, name, slug, kind, status, created_at, updated_at
           FROM merchant_environments
          WHERE merchant_id = $1
          ORDER BY kind = 'live' DESC, created_at ASC`,
        [req.currentMerchant.id],
    );
    res.json({ environments: result.rows });
});

app.post('/merchant/environments/:id/select', authenticateToken, requireMerchantWorkspace, async (req, res) => {
    const result = await pool.query(
        `SELECT id, name, slug, kind, status
           FROM merchant_environments
          WHERE id = $1 AND merchant_id = $2 AND status = 'active'`,
        [req.params.id, req.currentMerchant.id],
    );
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Environment not found' });
    }
    res.json({ environment: result.rows[0] });
});
```

The frontend should use the returned `environment.id` as the source for `x-flapapay-environment-id` on subsequent authenticated requests. This is an additive API contract and does not require a visual redesign.

## 10. Required route migration order

Do not enable the visible dashboard selector yet. Migrate in this order:

1. API-key and JWT context resolution.
2. Wallets, balances, ledger entries, charges, withdrawals, refunds, disputes, and settlements.
3. Customers, products, prices, subscriptions, invoices, meters, usage, and payment links.
4. Webhook endpoints, events, deliveries, retries, and replay.
5. Connect, risk, portal, coupons, analytics, and notifications.

## 11. Runtime safety rule

The provider adapter must receive the environment context explicitly:

```js
await providerAdapter.createTransfer({
    ...payload,
    environmentId: req.environmentId,
    environmentKind: req.environmentKind,
});
```

The adapter must reject a sandbox request if the selected credential or destination is live, and reject a live request if the live enablement/compliance gate is not satisfied. This check must happen immediately before provider I/O, not only in the controller.
