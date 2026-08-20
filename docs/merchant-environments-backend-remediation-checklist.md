# Merchant Environments Backend Remediation Checklist

## Date

August 20, 2026

## Purpose

This checklist maps the backend code that must change before a dashboard-wide live/sandbox selector can be shipped safely.

Use this alongside:

- [merchant-environments-migration-spec.md](/var/www/flapapay/docs/merchant-environments-migration-spec.md)
- [merchant-environments-ddl-rollout.md](/var/www/flapapay/docs/merchant-environments-ddl-rollout.md)

## Critical Path

### 1. Merchant Auth And Environment Resolution

Files:

- [DeveloperGateway.js](/var/www/flapapay/services/DeveloperGateway.js#L20)
- [unified-server.js](/var/www/flapapay/unified-server.js#L10116)
- [unified-server.js](/var/www/flapapay/unified-server.js#L10145)

Problems:

- API-key auth returns `environment: keyData.environment || 'test'`, but `api_keys` does not store an environment relation.
- JWT merchant sessions default to live semantics in [DeveloperGateway.js](/var/www/flapapay/services/DeveloperGateway.js#L66).
- `authenticateApiKey` and `authenticateMerchant` infer mode from `key_type` and `x-flapapay-test-mode`, not from a real `environment_id`.

Required changes:

- join API keys to `merchant_environments`
- resolve `req.environmentId`
- resolve `req.environmentKind`
- stop using `key_type` prefix as the primary mode source
- stop treating JWT sessions as implicitly live

### 2. Merchant Provisioning

Files:

- [unified-server.js](/var/www/flapapay/unified-server.js#L10080)
- [unified-server.js](/var/www/flapapay/unified-server.js#L10088)
- [unified-server.js](/var/www/flapapay/unified-server.js#L10097)

Problems:

- merchant creation writes one balance row only
- key creation writes test keys without environment records

Required changes:

- create `live` and `default sandbox` merchant environments at merchant provisioning time
- create environment-aware initial API keys
- defer environment-aware balances until the balance model is updated

### 3. Merchant Key Management

Files:

- [unified-server.js](/var/www/flapapay/unified-server.js#L22193)
- [unified-server.js](/var/www/flapapay/unified-server.js#L22232)

Problems:

- keys are fetched by `merchant_id` only
- key rotation updates by `key_type`
- no environment ownership exists

Required changes:

- fetch keys by `merchant_id + environment_id`
- rotate keys within the target environment
- support one live environment and multiple sandbox environments

## Commerce APIs

### 4. Customers

Files:

- [unified-server.js](/var/www/flapapay/unified-server.js#L22950)
- [unified-server.js](/var/www/flapapay/unified-server.js#L22969)
- [unified-server.js](/var/www/flapapay/unified-server.js#L22979)
- [unified-server.js](/var/www/flapapay/unified-server.js#L22992)

Problems:

- writes use `ON CONFLICT (email, merchant_id)`
- reads and updates filter only by `merchant_id`

Required changes:

- use `environment_id` on insert
- switch uniqueness to `(email, merchant_id, environment_id)`
- scope all reads to merchant + environment

### 5. Products And Prices

Files:

- [unified-server.js](/var/www/flapapay/unified-server.js#L22828)
- [unified-server.js](/var/www/flapapay/unified-server.js#L22841)
- [unified-server.js](/var/www/flapapay/unified-server.js#L22896)
- [unified-server.js](/var/www/flapapay/unified-server.js#L22909)
- [unified-server.js](/var/www/flapapay/unified-server.js#L22927)

Problems:

- merchant ownership is checked
- environment ownership is not checked

Required changes:

- set `environment_id` on create
- filter reads by `merchant_id + environment_id`
- validate that `price.environment_id = product.environment_id`

### 6. Subscriptions And Invoices

Files:

- [unified-server.js](/var/www/flapapay/unified-server.js#L23008)
- [unified-server.js](/var/www/flapapay/unified-server.js#L23063)
- [unified-server.js](/var/www/flapapay/unified-server.js#L23085)
- [unified-server.js](/var/www/flapapay/unified-server.js#L23133)
- [unified-server.js](/var/www/flapapay/unified-server.js#L23144)

Problems:

- writes set `livemode` but not `environment_id`
- many reads filter only by merchant
- analytics aggregate across all merchant subscriptions

Required changes:

- set `environment_id` on insert and update
- require customer and price to belong to the same environment
- scope invoice and subscription reads by environment
- scope all analytics by environment

### 7. Billing Meters And Usage

Files:

- [unified-server.js](/var/www/flapapay/unified-server.js#L23951)
- [unified-server.js](/var/www/flapapay/unified-server.js#L23969)
- [unified-server.js](/var/www/flapapay/unified-server.js#L23983)
- [unified-server.js](/var/www/flapapay/unified-server.js#L24016)

Problems:

- meters are keyed by merchant only
- usage inserts do not set `environment_id`
- current joins trust merchant ownership rather than environment consistency

Required changes:

- add `environment_id` to meters and usage
- scope meter uniqueness to merchant + environment
- validate subscription and meter are in the same environment

### 8. Customer Portal

Files:

- [unified-server.js](/var/www/flapapay/unified-server.js#L24061)
- [unified-server.js](/var/www/flapapay/unified-server.js#L24094)

Problems:

- customer portal sessions are merchant-global
- portal token payload does not carry environment identity

Required changes:

- include `environment_id` in session creation
- include `environment_id` in token claims
- scope public portal reads to customer + environment

## Money Movement

### 9. Payment Links

Files:

- [unified-server.js](/var/www/flapapay/unified-server.js#L8344)
- [unified-server.js](/var/www/flapapay/unified-server.js#L8362)
- [unified-server.js](/var/www/flapapay/unified-server.js#L8391)
- [unified-server.js](/var/www/flapapay/unified-server.js#L8429)

Problems:

- links are created by `user_id` and `wallet_id` only
- list and public execution are not environment-aware

Required changes:

- write `environment_id` from wallet or active environment
- list links by environment
- bind public execution to the link's environment

### 10. Balances And Settlement

Files:

- [unified-server.js](/var/www/flapapay/unified-server.js#L10088)
- [unified-server.js](/var/www/flapapay/unified-server.js#L10534)
- [unified-server.js](/var/www/flapapay/unified-server.js#L10564)

Problems:

- current `balances` schema is one row per merchant
- settlement logic locks and updates by `merchant_id` only
- live/test isolation cannot be guaranteed through this table

Required changes:

- replace or reshape balances into an environment-aware model
- scope settlement reads and writes by environment
- ensure test settlement and live settlement cannot share the same balance row

### 11. Unified Charges

Files:

- [unified-server.js](/var/www/flapapay/unified-server.js#L10242)

Problems:

- route uses `req.isTestMode`
- risk and charge creation paths still treat mode as a boolean rather than an environment identity

Required changes:

- set `environment_id` across the full charge pipeline
- preserve `livemode` only as compatibility metadata

## Webhooks

### 12. Merchant Webhook Endpoints

Files:

- [unified-server.js](/var/www/flapapay/unified-server.js#L14423)
- [unified-server.js](/var/www/flapapay/unified-server.js#L14436)
- [unified-server.js](/var/www/flapapay/unified-server.js#L14463)
- [unified-server.js](/var/www/flapapay/unified-server.js#L14476)
- [unified-server.js](/var/www/flapapay/unified-server.js#L14492)

Problems:

- endpoints are merchant-global
- test-fire behavior is not environment-aware

Required changes:

- attach endpoints to `environment_id`
- list/delete/test within environment scope
- make delivery logs environment-aware

### 13. Legacy Merchant Webhooks

Files:

- [unified-server.js](/var/www/flapapay/unified-server.js#L18418)
- [unified-server.js](/var/www/flapapay/unified-server.js#L18438)

Problems:

- legacy webhook endpoints are also merchant-global

Required changes:

- either migrate to the environment-aware endpoint model
- or formally deprecate and freeze this path

## Recommended Implementation Order

1. Merchant environment creation and lookup helpers
2. API key and JWT environment resolution
3. Customer, product, price, and subscription environment safety
4. Payment links and balances
5. Billing meters, usage, and customer portal
6. Webhooks
7. Connect and risk rules

## Exit Criteria Before UI Toggle

- every merchant-scoped write path sets `environment_id`
- every merchant-scoped read path filters by `environment_id`
- balances are environment-safe
- API auth returns a real environment identity
- payment links and webhooks are isolated
- analytics do not aggregate across all merchant rows
