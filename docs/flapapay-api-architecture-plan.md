# FlapaPay API Architecture Plan

## Date

July 30, 2026

## Goal

Expose a merchant-facing FlapaPay API for collections, transfers, bank resolution, mobile money resolution, recipients, and settlements while using provider infrastructure under the hood without exposing provider branding in the public API contract.

The public API should present FlapaPay resources, FlapaPay references, FlapaPay authentication, and FlapaPay lifecycle semantics. Provider-specific details should remain internal implementation concerns.

## Implementation Status

Implemented as of July 30, 2026:

- `GET /v1/banks`
- `POST /v1/resolve/bank-account`
- `POST /v1/resolve/mobile-money`
- `GET /v1/transfer-recipients`
- `POST /v1/transfer-recipients`
- `GET /v1/transfer-recipients/:id`
- `DELETE /v1/transfer-recipients/:id`
- `POST /v1/transfers/bank-account`
- `POST /v1/transfers/mobile-money`
- `GET /v1/transfers`
- `GET /v1/transfers/:reference`
- `POST /v1/collections/mobile-money`
- `POST /v1/collections/card`
- `GET /v1/collections`
- `GET /v1/collections/:reference`
- `GET /v1/settlements`
- `GET /v1/settlements/:reference`

Still pending:

## Design Principles

1. FlapaPay owns the public contract.
2. Merchant authentication uses FlapaPay API keys generated from Merchant Hub.
3. Wallets and `ledger_entries` are the source of truth for settlement.
4. Provider responses are normalized into FlapaPay response shapes.
5. Provider names should not appear in merchant-facing documentation unless explicitly required for compliance or operational transparency.
6. Hosted checkout remains a first-class FlapaPay product and should continue to work alongside direct API collections.

## Current Internal Inventory

### Authentication

- `authenticateApiKey` already exists in `unified-server.js`.
- Merchant API keys are already stored in `api_keys`.

### Existing Provider-Backed Plumbing

- Bank list exists internally:
  - `GET /merchants/lenco/banks`
  - `GET /v1/connect/banks`
- Bank account resolve exists internally:
  - `POST /merchants/lenco/resolve`
- Mobile money resolve exists publicly already:
  - `POST /resolve/mobile-money`
- Mobile money collection exists internally:
  - `POST /lenco/mobile-money/collections`
- Bank-account transfer exists internally in payout flows:
  - outbound bank transfer via provider `/transfers/bank-account`
- Mobile-money transfer exists internally in wallet withdrawal flows.

### Settlement and Ledger

- Hosted checkout credits merchant wallets and writes `ledger_entries`.
- Direct `/v1/charges` credits merchant wallets and writes `ledger_entries`.
- Wallet withdrawals use `wallet_withdrawals` plus `ledger_entries`.

### Legacy Areas To Avoid Extending

- `/v1/transfers` is legacy Connect-style behavior and should be replaced rather than expanded.
- `/v1/connect/*` should not be used as the foundation for the new merchant API.

## Target FlapaPay Public API Surface

### Getting Started

- `POST /v1/api-keys` or dashboard-managed keys only
- `Authorization: Bearer sk_live_flp_...`

### Accounts

- `GET /v1/accounts`
- `GET /v1/accounts/:id`

This is optional for the first phase if account abstraction remains internal.

### Banks

- `GET /v1/banks?country=zm`

Purpose:
- Retrieve banks and financial institutions supported by FlapaPay.

Internal provider mapping:
- current provider-backed bank list endpoint

### Resolve Account

- `POST /v1/resolve/bank-account`
- `POST /v1/resolve/mobile-money`

Purpose:
- Validate account ownership details before transfer or recipient creation.

Internal provider mapping:
- current provider-backed bank account resolve
- current provider-backed mobile money resolve

### Transfer Recipients

- `GET /v1/transfer-recipients`
- `POST /v1/transfer-recipients`
- `GET /v1/transfer-recipients/:id`
- `DELETE /v1/transfer-recipients/:id`

Recipient types:
- `bank_account`
- `mobile_money`

Purpose:
- Persist reusable destination identities under the merchant account.

### Transfers

- `POST /v1/transfers/bank-account`
- `POST /v1/transfers/mobile-money`
- `GET /v1/transfers`
- `GET /v1/transfers/:reference`

Purpose:
- Initiate and track outbound payouts.

Settlement behavior:
- debit merchant wallet immediately
- write `ledger_entries`
- create a `wallet_withdrawals`-style provider tracking record
- normalize provider status into FlapaPay status

### Collections

- `POST /v1/collections/mobile-money`
- `GET /v1/collections`
- `GET /v1/collections/:reference`

Card collections can remain under:
- hosted checkout
- `/v1/charges`

Optional future addition:
- `POST /v1/collections/card`

### Settlements

- `GET /v1/settlements`
- `GET /v1/settlements/:reference`

Purpose:
- expose collection settlement lifecycle as a reporting resource

Note:
- settlement read models should come from FlapaPay database records, not raw provider settlement payloads

## Public Response Shape

FlapaPay should normalize all provider-backed responses to:

```json
{
  "status": true,
  "message": "",
  "data": {},
  "reference": "flp_xxx",
  "status_code": "pending | processing | successful | failed"
}
```

Recommended resource fields:

- `id`
- `reference`
- `amount`
- `fee`
- `currency`
- `status`
- `reason_for_failure`
- `created_at`
- `completed_at`
- `recipient`
- `settlement_status`

Provider-specific fields like `lencoReference` should stay internal or be exposed only as:

- `provider_reference`

and omitted from standard docs unless needed.

## Settlement Model

### Inbound Collections

When a collection succeeds:

1. credit merchant wallet
2. insert `ledger_entries` credit row
3. optionally insert fee row
4. mark collection as settled or pending settlement depending on the flow

### Outbound Transfers

When a transfer is initiated:

1. debit merchant wallet
2. insert `ledger_entries` debit row
3. insert fee row if applicable
4. insert provider-tracking record
5. update status asynchronously on callback or poll

### Source of Truth

The source of truth for balances must remain:

- `wallets`
- `ledger_entries`

Provider records are operational metadata, not financial truth.

## Documentation Model

Documentation and developer content should present FlapaPay resources in this order:

1. FlapaPay API
2. Getting Started
3. Accept Payments
4. Accounts
5. Banks
6. Resolve Account
7. Transfer Recipients
8. Transfers
9. Collections
10. Settlements

Provider branding should not appear in the main API docs.

## Rollout Phases

### Phase 1

Expose the basic lookup and resolve resources:

- `GET /v1/banks`
- `POST /v1/resolve/bank-account`
- `POST /v1/resolve/mobile-money`

Documentation:
- add FlapaPay API overview to Documentation and Developers pages

### Phase 2

Add recipient abstraction:

- `GET /v1/transfer-recipients`
- `POST /v1/transfer-recipients`
- `GET /v1/transfer-recipients/:id`
- `DELETE /v1/transfer-recipients/:id`

Status:
- implemented

### Phase 3

Add outbound merchant payout resources:

- `POST /v1/transfers/bank-account`
- `POST /v1/transfers/mobile-money`
- `GET /v1/transfers`
- `GET /v1/transfers/:reference`

This phase should reuse current withdrawal logic and ledger handling rather than legacy Connect balances.

Status:
- implemented

### Phase 4

Add direct mobile money collection resources:

- `POST /v1/collections/mobile-money`
- `GET /v1/collections`
- `GET /v1/collections/:reference`

Status:
- implemented

### Phase 5

Add settlement reporting resources:

- `GET /v1/settlements`
- `GET /v1/settlements/:reference`

Status:
- implemented

### Phase 6

Rewrite public documentation and developer onboarding around the FlapaPay API resource model.

## Implementation Notes

### Card Collections

FlapaPay should not force provider-specific card semantics into the public API if the current card rail differs internally.

Recommended approach:

- keep hosted checkout as the primary card-collection product
- keep `/v1/charges` for direct card collection
- expose `/v1/collections/card` as the provider-neutral collections resource for direct secure card capture

### Providers Under The Hood

FlapaPay may use one or more providers for:

- mobile money collections
- bank account transfers
- recipient resolution

This should remain opaque behind FlapaPay API resources so providers can be swapped later without breaking merchants.

## Immediate Next Step

Complete the remaining read and parity resources:

1. decide whether to expose `GET /v1/accounts` as a merchant operating account resource
2. add a merchant-facing secure card setup/context flow for API-driven browser integrations if needed
3. keep checkout and direct collections documentation aligned as the card API matures
