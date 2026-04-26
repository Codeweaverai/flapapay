import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Copy, Check, ChevronRight, ChevronLeft, Play, Loader2,
    Users, CreditCard, DollarSign, ShieldCheck, AlertTriangle,
    BookOpen, Activity, BarChart2, Settings, Link2, Key,
    Lock, Zap, Code, Globe, Terminal, Landmark, Layers
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Param {
    name: string;
    type: string;
    required?: boolean;
    description: string;
    example?: string;
}

interface CodeExample {
    curl: string;
    node: string;
    python: string;
}

interface Endpoint {
    id: string;
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    path: string;
    summary: string;
    description: string;
    params?: Param[];
    bodyParams?: Param[];
    response: string;
    code: CodeExample;
    tryIt?: { body?: string; query?: string };
}

interface Section {
    id: string;
    label: string;
    icon: React.FC<any>;
    color: string;
    endpoints: Endpoint[];
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

const METHOD_COLOR: Record<string, string> = {
    GET:    'bg-emerald-100 text-emerald-700 border-emerald-200',
    POST:   'bg-orange-100 text-orange-700 border-orange-200',
    PATCH:  'bg-blue-100 text-blue-700 border-blue-200',
    PUT:    'bg-violet-100 text-violet-700 border-violet-200',
    DELETE: 'bg-red-100 text-red-600 border-red-200',
};

// ─── Sections & Endpoints ─────────────────────────────────────────────────────

const SECTIONS: Section[] = [
    {
        id: 'authentication',
        label: 'Authentication',
        icon: Lock,
        color: 'text-slate-600 bg-slate-100',
        endpoints: [
            {
                id: 'auth-overview',
                method: 'GET',
                path: '/v1/connect/stats',
                summary: 'Verify your API key',
                description: 'All API requests must include your secret key in the Authorization header. Use test keys (sk_test_...) during development — they will never move real money. Switch to live keys (sk_live_...) in production.\n\nPass `x-flapapay-test-mode: true` to force test mode even with a live key.',
                params: [],
                response: `{
  "total_sellers": 42,
  "marketplace_gmv": 1250000,
  "platform_revenue": 31250,
  "currency": "ZMW"
}`,
                code: {
                    curl: `curl https://api.flapapay.com/v1/connect/stats \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx" \\
  -H "x-flapapay-test-mode: true"`,
                    node: `import { FlapaPayConnect } from '@flapapay/connect';

const connect = new FlapaPayConnect({
  apiKey: 'sk_test_flp_xxxxxxxxxxxx',
});

const stats = await connect.analytics.stats();
console.log(stats);`,
                    python: `import requests

headers = {
    "Authorization": "Bearer sk_test_flp_xxxxxxxxxxxx",
    "x-flapapay-test-mode": "true"
}
r = requests.get("http://localhost:3005/v1/connect/stats", headers=headers)
print(r.json())`
                },
                tryIt: {}
            }
        ]
    },
    {
        id: 'accounts',
        label: 'Connected Accounts',
        icon: Users,
        color: 'text-indigo-600 bg-indigo-50',
        endpoints: [
            {
                id: 'accounts-create',
                method: 'POST',
                path: '/v1/connect/accounts',
                summary: 'Create a connected account',
                description: 'Creates a new sub-merchant account record under your platform. The account starts with `kyc_status: unverified` and `status: PENDING`.\n\nAfter creating an account, generate a **Hosted Onboarding Link** (`POST /v1/connect/onboarding_links`) and send it to the sub-merchant. They visit that URL and complete their own identity verification, KYC document upload, and payout method setup — independently, on their own device, at their own pace.',
                bodyParams: [
                    { name: 'business_name', type: 'string', required: true, description: 'Legal business name of the sub-merchant' },
                    { name: 'email', type: 'string', required: true, description: 'Contact email for the sub-merchant' },
                    { name: 'type', type: 'string', description: 'Account type. Default: individual' },
                    { name: 'contact_name', type: 'string', description: 'Name of the primary contact person' },
                    { name: 'phone', type: 'string', description: 'Business phone number' },
                ],
                response: `{
  "id": "ca_01j9x2q3r4s5t6u7v8w9x0y1z",
  "business_name": "Lusaka Crafts Ltd",
  "email": "admin@lusakacrafts.zm",
  "type": "individual",
  "status": "PENDING",
  "kyc_status": "unverified",
  "platform_merchant_id": "m_abc123",
  "livemode": false,
  "created_at": "2026-04-03T08:00:00.000Z"
}`,
                code: {
                    curl: `curl -X POST https://api.flapapay.com/v1/connect/accounts \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "business_name": "Lusaka Crafts Ltd",
    "email": "admin@lusakacrafts.zm",
    "contact_name": "Chanda Mutale"
  }'`,
                    node: `const account = await connect.accounts.create({
  business_name: 'Lusaka Crafts Ltd',
  email: 'admin@lusakacrafts.zm',
  contact_name: 'Chanda Mutale',
});
console.log(account.id); // ca_01j9x2q3r4s5t6u7v8w9x0y1z`,
                    python: `import requests, json

r = requests.post(
    "http://localhost:3005/v1/connect/accounts",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"},
    json={"business_name": "Lusaka Crafts Ltd", "email": "admin@lusakacrafts.zm"}
)
account = r.json()
print(account["id"])`
                },
                tryIt: { body: '{\n  "business_name": "Test Merchant",\n  "email": "test@example.com"\n}' }
            },
            {
                id: 'accounts-list',
                method: 'GET',
                path: '/v1/connect/accounts',
                summary: 'List all connected accounts',
                description: 'Returns all sub-merchant accounts associated with your platform, including their KYC status, balance summary, and compliance state.',
                response: `[
  {
    "id": "ca_01j9x2q3r4s5t6u7v8w9x0y1z",
    "business_name": "Lusaka Crafts Ltd",
    "email": "admin@lusakacrafts.zm",
    "status": "ACTIVE",
    "kyc_status": "verified",
    "livemode": false,
    "created_at": "2026-04-03T08:00:00.000Z"
  }
]`,
                code: {
                    curl: `curl https://api.flapapay.com/v1/connect/accounts \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx"`,
                    node: `const accounts = await connect.accounts.list();
accounts.forEach(a => console.log(a.business_name, a.kyc_status));`,
                    python: `r = requests.get(
    "http://localhost:3005/v1/connect/accounts",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"}
)
for account in r.json():
    print(account["business_name"], account["kyc_status"])`
                },
                tryIt: {}
            },
            {
                id: 'accounts-update',
                method: 'PATCH',
                path: '/v1/connect/accounts/:id',
                summary: 'Update an account',
                description: 'Update an account\'s status, payout cap, or internal platform notes. Suspending an account prevents new charges from being routed to it.',
                bodyParams: [
                    { name: 'status', type: 'ACTIVE | SUSPENDED | CLOSED', description: 'New account status' },
                    { name: 'max_payout_amount', type: 'number | null', description: 'Maximum single payout amount in ZMW. null = unlimited' },
                    { name: 'platform_notes', type: 'string', description: 'Internal notes visible only to the platform operator' },
                ],
                response: `{ "id": "ca_...", "status": "SUSPENDED", ... }`,
                code: {
                    curl: `curl -X PATCH https://api.flapapay.com/v1/connect/accounts/ca_xxx \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx" \\
  -d '{"status": "SUSPENDED", "platform_notes": "Fraud investigation"}'`,
                    node: `await connect.accounts.update('ca_xxx', {
  status: 'SUSPENDED',
  platform_notes: 'Fraud investigation',
});`,
                    python: `requests.patch(
    "http://localhost:3005/v1/connect/accounts/ca_xxx",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"},
    json={"status": "SUSPENDED"}
)`
                },
                tryIt: { body: '{\n  "status": "ACTIVE",\n  "platform_notes": "Verified by ops team"\n}' }
            }
        ]
    },
    {
        id: 'charges',
        label: 'Charges & Splits',
        icon: CreditCard,
        color: 'text-orange-600 bg-orange-50',
        endpoints: [
            {
                id: 'charges-create',
                method: 'POST',
                path: '/v1/charges',
                summary: 'Create a split charge',
                description: 'Create a charge where funds are automatically split between your platform and a connected account.\n\n`transfer_data.destination` routes the net amount (charge amount minus `application_fee_amount`) to the connected account.\n\n`application_fee_amount` is the amount your platform keeps. It must be ≤ the charge amount.\n\n**Settlement:** Split funds are held in the sub-merchant\'s **pending balance** until `available_at`, which is calculated as `NOW() + settlement_delay_days` from your platform config (default T+1). The `transaction.split.created` webhook fires immediately; `transaction.split.available` fires when the funds clear.',
                bodyParams: [
                    { name: 'amount', type: 'number', required: true, description: 'Charge amount in the smallest currency unit (e.g. 10000 = ZMW 100.00)' },
                    { name: 'currency', type: 'string', required: true, description: 'ISO 4217 currency code (ZMW, USD, ZAR, KES)' },
                    { name: 'source', type: 'mobile_money | card', required: true, description: 'Payment method type' },
                    { name: 'mobile_number', type: 'string', description: 'Mobile money phone number (required when source=mobile_money)' },
                    { name: 'provider', type: 'airtel | mtn | zamtel', description: 'Mobile money operator' },
                    { name: 'transfer_data.destination', type: 'string', description: 'ID of the connected account to receive funds' },
                    { name: 'application_fee_amount', type: 'number', description: 'Platform fee in smallest currency unit' },
                    { name: 'description', type: 'string', description: 'Description shown on the sub-merchant\'s statement' },
                ],
                response: `{
  "id": "ch_01j9xabc123def456",
  "amount": 10000,
  "currency": "ZMW",
  "status": "succeeded",
  "payment_method": "mobile_money",
  "application_fee": 250,
  "transfer_data": {
    "destination": "ca_01j9x2q3r4s5t6u7v8w9x0y1z",
    "amount": 9750
  },
  "livemode": false,
  "created_at": "2026-04-03T09:15:00.000Z",
  "available_at": "2026-04-04T09:15:00.000Z",
  "settlement_days": 1
}`,
                code: {
                    curl: `curl -X POST https://api.flapapay.com/v1/charges \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10000,
    "currency": "ZMW",
    "source": "mobile_money",
    "mobile_number": "0971234567",
    "provider": "airtel",
    "description": "Order #1042",
    "transfer_data": { "destination": "ca_xxx" },
    "application_fee_amount": 250
  }'`,
                    node: `const charge = await connect.charges.create({
  amount: 10000,
  currency: 'ZMW',
  source: 'mobile_money',
  mobile_number: '0971234567',
  provider: 'airtel',
  description: 'Order #1042',
  transfer_data: { destination: 'ca_xxx' },
  application_fee_amount: 250,
});
console.log(charge.status); // "succeeded"`,
                    python: `r = requests.post(
    "http://localhost:3005/v1/charges",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"},
    json={
        "amount": 10000, "currency": "ZMW",
        "source": "mobile_money", "mobile_number": "0971234567",
        "provider": "airtel",
        "transfer_data": {"destination": "ca_xxx"},
        "application_fee_amount": 250
    }
)
print(r.json()["status"])`
                },
                tryIt: { body: '{\n  "amount": 10000,\n  "currency": "ZMW",\n  "source": "mobile_money",\n  "mobile_number": "0971234567",\n  "provider": "airtel",\n  "application_fee_amount": 250\n}' }
            },
            {
                id: 'charges-list',
                method: 'GET',
                path: '/v1/connect/charges',
                summary: 'List platform charges',
                description: 'Returns all charges processed through your marketplace with optional filters. Includes a summary of GMV, fees collected, and charge counts.',
                params: [
                    { name: 'status', type: 'string', description: 'Filter by status: succeeded, pending, failed, refunded' },
                    { name: 'account_id', type: 'string', description: 'Filter by connected account ID' },
                    { name: 'from', type: 'string', description: 'Start date (YYYY-MM-DD)' },
                    { name: 'to', type: 'string', description: 'End date (YYYY-MM-DD)' },
                    { name: 'limit', type: 'number', description: 'Max results to return (default: 25, max: 100)' },
                    { name: 'offset', type: 'number', description: 'Number of results to skip for pagination' },
                ],
                response: `{
  "charges": [
    {
      "id": "ch_01j9xabc123",
      "amount": 10000,
      "currency": "ZMW",
      "status": "succeeded",
      "payment_method": "mobile_money",
      "application_fee_amount": 250,
      "account_id": "ca_xxx",
      "account_business_name": "Lusaka Crafts Ltd",
      "created_at": "2026-04-03T09:15:00.000Z"
    }
  ],
  "summary": {
    "total_gmv": 1250000,
    "total_fees": 31250,
    "total_count": 142,
    "succeeded_count": 138,
    "refunded_count": 4
  },
  "total": 142,
  "limit": 25,
  "offset": 0
}`,
                code: {
                    curl: `curl "https://api.flapapay.com/v1/connect/charges?status=succeeded&limit=10" \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx"`,
                    node: `const { charges, summary } = await connect.charges.list({
  status: 'succeeded',
  from: '2026-04-01',
  limit: 10,
});
console.log(\`GMV: ZMW \${summary.total_gmv / 100}\`);`,
                    python: `r = requests.get(
    "http://localhost:3005/v1/connect/charges",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"},
    params={"status": "succeeded", "limit": 10}
)
data = r.json()
print(f"GMV: ZMW {data['summary']['total_gmv'] / 100}")`
                },
                tryIt: {}
            }
        ]
    },
    {
        id: 'settlements',
        label: 'Settlements',
        icon: Zap,
        color: 'text-amber-600 bg-amber-50',
        endpoints: [
            {
                id: 'settlements-config',
                method: 'PATCH',
                path: '/v1/connect/config',
                summary: 'Configure settlement delay',
                description: 'Set `settlement_delay_days` to control how long funds remain in a sub-merchant\'s **pending balance** before moving to **available balance**. This mirrors Stripe\'s T+N settlement model.\n\n**Default: T+1 (next business day).** Set to `0` for instant settlement (simulation mode only).\n\nEvery split charge records `available_at = created_at + settlement_delay_days`. The settlement worker runs hourly and automatically moves pending → available when `available_at <= NOW()`, firing a `transaction.split.available` webhook.',
                bodyParams: [
                    { name: 'settlement_delay_days', type: 'number', description: 'Days until funds become available (0–7). Default: 1' },
                    { name: 'platform_fee_percent', type: 'number', description: 'Default platform fee percentage applied when application_fee_amount is not set' },
                    { name: 'auto_payout_enabled', type: 'boolean', description: 'Automatically trigger payouts when available balance exceeds threshold' },
                    { name: 'auto_payout_schedule', type: 'daily | weekly | monthly', description: 'Payout cadence when auto-payout is enabled' },
                    { name: 'min_payout_threshold', type: 'number', description: 'Minimum available balance required before auto-payout triggers' },
                ],
                response: `{
  "platform_fee_percent": 2.5,
  "fee_collection_method": "per_transaction",
  "settlement_delay_days": 2,
  "min_payout_threshold": 50,
  "auto_payout_enabled": true,
  "auto_payout_schedule": "daily"
}`,
                code: {
                    curl: `curl -X PATCH https://api.flapapay.com/v1/connect/config \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"settlement_delay_days": 2}'`,
                    node: `await connect.config.update({
  settlement_delay_days: 2,
  auto_payout_enabled: true,
  auto_payout_schedule: 'daily',
});`,
                    python: `requests.patch(
    "http://localhost:3005/v1/connect/config",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"},
    json={"settlement_delay_days": 2}
)`
                },
                tryIt: { body: '{\n  "settlement_delay_days": 1\n}' }
            },
            {
                id: 'settlements-earnings',
                method: 'GET',
                path: '/v1/connect/platform/earnings',
                summary: 'Platform earnings report',
                description: 'Returns aggregated platform commission income from ledger entries. Group by `day`, `week`, or `month`. Each period shows `fee_collected` (gross commissions earned) and `net_earnings` after any refund reversals.\n\nUse this to reconcile your platform\'s revenue against individual charges.',
                params: [
                    { name: 'from', type: 'string', description: 'Start date (YYYY-MM-DD)' },
                    { name: 'to', type: 'string', description: 'End date (YYYY-MM-DD)' },
                    { name: 'groupBy', type: 'day | week | month', description: 'Period granularity. Default: month' },
                    { name: 'currency', type: 'string', description: 'Currency code. Default: ZMW' },
                ],
                response: `{
  "from": "2026-04-01",
  "to": "2026-04-30",
  "groupBy": "month",
  "currency": "ZMW",
  "periods": [
    {
      "period": "2026-04",
      "fee_collected": 31250,
      "split_credits": 1218750,
      "net_earnings": 31250,
      "charge_count": 142
    }
  ],
  "totals": {
    "fee_collected": 31250,
    "net_earnings": 31250,
    "charge_count": 142
  }
}`,
                code: {
                    curl: `curl "https://api.flapapay.com/v1/connect/platform/earnings?from=2026-04-01&to=2026-04-30&groupBy=month" \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx"`,
                    node: `const report = await connect.platform.earnings({
  from: '2026-04-01',
  to: '2026-04-30',
  groupBy: 'month',
});
console.log('Total commission:', report.totals.fee_collected);`,
                    python: `r = requests.get(
    "http://localhost:3005/v1/connect/platform/earnings",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"},
    params={"from": "2026-04-01", "to": "2026-04-30", "groupBy": "month"}
)
print(r.json()["totals"]["fee_collected"])`
                },
                tryIt: { query: 'from=2026-04-01&to=2026-04-30&groupBy=month' }
            }
        ]
    },
    {
        id: 'payouts',
        label: 'Payouts',
        icon: DollarSign,
        color: 'text-emerald-600 bg-emerald-50',
        endpoints: [
            {
                id: 'payouts-create',
                method: 'POST',
                path: '/v1/connect/payouts',
                summary: 'Trigger a payout',
                description: 'Disburse funds from a connected account\'s available balance to their registered payout method (bank transfer or mobile money). The account must have at least one payout method and sufficient available balance.',
                bodyParams: [
                    { name: 'account_id', type: 'string', required: true, description: 'Connected account to payout' },
                    { name: 'amount', type: 'number', required: true, description: 'Amount to disburse in smallest currency unit' },
                    { name: 'currency', type: 'string', description: 'Currency code. Default: ZMW' },
                    { name: 'payout_method_id', type: 'string', required: true, description: 'ID of the payout method to use' },
                    { name: 'description', type: 'string', description: 'Description on the payout record' },
                ],
                response: `{
  "id": "po_01j9xpayout123",
  "account_id": "ca_xxx",
  "amount": 8750,
  "currency": "ZMW",
  "status": "processing",
  "payout_method_id": "pm_xxx",
  "created_at": "2026-04-03T10:00:00.000Z"
}`,
                code: {
                    curl: `curl -X POST https://api.flapapay.com/v1/connect/payouts \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx" \\
  -d '{
    "account_id": "ca_xxx",
    "amount": 8750,
    "currency": "ZMW",
    "payout_method_id": "pm_xxx"
  }'`,
                    node: `const [method] = await connect.accounts.listPayoutMethods('ca_xxx');

const payout = await connect.payouts.create({
  account_id: 'ca_xxx',
  amount: 8750,
  currency: 'ZMW',
  payout_method_id: method.id,
});`,
                    python: `requests.post(
    "http://localhost:3005/v1/connect/payouts",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"},
    json={"account_id": "ca_xxx", "amount": 8750,
          "currency": "ZMW", "payout_method_id": "pm_xxx"}
)`
                },
                tryIt: { body: '{\n  "account_id": "",\n  "amount": 5000,\n  "currency": "ZMW",\n  "payout_method_id": ""\n}' }
            },
            {
                id: 'payouts-bulk',
                method: 'POST',
                path: '/v1/connect/bulk/payout',
                summary: 'Bulk trigger payouts',
                description: 'Trigger payouts for **all** connected accounts that have an available balance above their minimum threshold and an auto-payout schedule enabled. Returns the number of payouts triggered.',
                bodyParams: [
                    { name: 'currency', type: 'string', description: 'Filter to accounts with balances in this currency. Default: ZMW' },
                ],
                response: `{ "triggered": 12, "details": [...] }`,
                code: {
                    curl: `curl -X POST https://api.flapapay.com/v1/connect/bulk/payout \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx" \\
  -d '{"currency": "ZMW"}'`,
                    node: `const { triggered } = await connect.payouts.bulkTrigger({ currency: 'ZMW' });
console.log(\`Triggered \${triggered} payouts\`);`,
                    python: `r = requests.post(
    "http://localhost:3005/v1/connect/bulk/payout",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"},
    json={"currency": "ZMW"}
)
print(r.json()["triggered"])`
                },
                tryIt: { body: '{\n  "currency": "ZMW"\n}' }
            }
        ]
    },
    {
        id: 'payout-methods',
        label: 'Payout Methods',
        icon: Landmark,
        color: 'text-emerald-600 bg-emerald-50',
        endpoints: [
            {
                id: 'payout-methods-add',
                method: 'POST',
                path: '/v1/connect/accounts/:id/payout_methods',
                summary: 'Add a payout method',
                description: 'Attach a mobile money wallet or bank account to a connected account as a settlement destination. The first method added is automatically set as the default.\n\nFlapaPay supports two payout types for Zambian merchants:\n\n**Mobile Money** — MTN, Airtel, and Zamtel. Settlements arrive same-day or next business day. Maximum ZMW 20,000 per transaction (unless the wallet is upgraded to Business tier). Fee: 2% of payout amount (min ZMW 1). Preferred for informal traders and merchants without a bank account.\n\n**Bank Account** — All major Zambian banks (Zanaco, Stanbic, ABSA, etc.). Settlements take 2–3 business days. No per-transaction limit beyond standard banking limits. Fee: 1% (min ZMW 2). Preferred by registered companies for accounting compliance and larger settlement volumes.',
                bodyParams: [
                    { name: 'type', type: 'mobile_money | bank_account', required: true, description: 'Payout method type' },
                    { name: 'is_default', type: 'boolean', description: 'Set as the default payout method. Automatically true for the first method added.' },
                    { name: 'details.provider', type: 'mtn | airtel | zamtel', description: 'Required when type=mobile_money. Mobile money network operator.' },
                    { name: 'details.number', type: 'string', description: 'Required when type=mobile_money. Phone number in E.164 format, e.g. +260971234567.' },
                    { name: 'details.bank_name', type: 'string', description: 'Required when type=bank_account. Supported: Zanaco, Stanbic, ABSA, Access Bank, Ecobank, FNB, Standard Chartered, UBA.' },
                    { name: 'details.account_number', type: 'string', description: 'Required when type=bank_account. Account number as printed on the bank statement.' },
                    { name: 'details.account_holder_name', type: 'string', description: 'Required when type=bank_account. Must match the registered name on the account exactly.' },
                    { name: 'details.branch_code', type: 'string', description: 'Branch or sort code (required for some banks).' },
                    { name: 'details.country', type: 'string', description: 'ISO 3166-1 alpha-2 country code. Default: ZM' },
                ],
                response: `{
  "id": "pm_01j9xpaymethod123",
  "account_id": "ca_xxx",
  "type": "mobile_money",
  "is_default": true,
  "verification_status": "pending",
  "details": {
    "provider": "airtel",
    "number_last4": "4567",
    "display": "Airtel Money \\u00b74567"
  },
  "created_at": "2026-04-12T08:00:00.000Z"
}`,
                code: {
                    curl: `# Mobile money
curl -X POST https://api.flapapay.com/v1/connect/accounts/ca_xxx/payout_methods \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "mobile_money",
    "is_default": true,
    "details": {
      "provider": "airtel",
      "number": "+260971234567",
      "country": "ZM"
    }
  }'

# Bank account
curl -X POST https://api.flapapay.com/v1/connect/accounts/ca_xxx/payout_methods \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx" \\
  -d '{
    "type": "bank_account",
    "is_default": true,
    "details": {
      "bank_name": "Zanaco",
      "account_number": "1234005678",
      "account_holder_name": "Lusaka Crafts Limited",
      "country": "ZM"
    }
  }'`,
                    node: `// Mobile money
await connect.accounts.addPayoutMethod('ca_xxx', {
  type: 'mobile_money',
  is_default: true,
  details: { provider: 'airtel', number: '+260971234567', country: 'ZM' },
});

// Bank account
await connect.accounts.addPayoutMethod('ca_xxx', {
  type: 'bank_account',
  is_default: true,
  details: {
    bank_name: 'Zanaco',
    account_number: '1234005678',
    account_holder_name: 'Lusaka Crafts Limited',
    country: 'ZM',
  },
});`,
                    python: `# Mobile money
requests.post(
    "https://api.flapapay.com/v1/connect/accounts/ca_xxx/payout_methods",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"},
    json={
        "type": "mobile_money", "is_default": True,
        "details": {"provider": "airtel", "number": "+260971234567", "country": "ZM"}
    }
)

# Bank account
requests.post(
    "https://api.flapapay.com/v1/connect/accounts/ca_xxx/payout_methods",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"},
    json={
        "type": "bank_account", "is_default": True,
        "details": {
            "bank_name": "Zanaco", "account_number": "1234005678",
            "account_holder_name": "Lusaka Crafts Limited", "country": "ZM"
        }
    }
)`
                },
                tryIt: { body: '{\n  "type": "mobile_money",\n  "is_default": true,\n  "details": {\n    "provider": "mtn",\n    "number": "+260971234567",\n    "country": "ZM"\n  }\n}' }
            },
            {
                id: 'payout-methods-list',
                method: 'GET',
                path: '/v1/connect/accounts/:id/payout_methods',
                summary: 'List payout methods',
                description: 'Returns all payout methods attached to a connected account, including their verification status. Use this to show sub-merchants their registered settlement destinations and to determine whether a method is ready to receive payouts.\n\n`verification_status` values: `pending` (not yet verified by OTP or micro-deposit), `verified` (ready to receive payouts), `failed` (verification failed — merchant must retry), `invalid` (account closed or number transferred — merchant must update their payout details).',
                response: `[
  {
    "id": "pm_01j9xpaymethod123",
    "type": "mobile_money",
    "is_default": true,
    "verification_status": "verified",
    "details": { "provider": "airtel", "display": "Airtel Money \\u00b74567" },
    "created_at": "2026-04-12T08:00:00.000Z"
  },
  {
    "id": "pm_01j9xpaymethod456",
    "type": "bank_account",
    "is_default": false,
    "verification_status": "pending",
    "details": { "bank_name": "Zanaco", "display": "Zanaco \\u00b75678" },
    "created_at": "2026-04-12T09:00:00.000Z"
  }
]`,
                code: {
                    curl: `curl https://api.flapapay.com/v1/connect/accounts/ca_xxx/payout_methods \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx"`,
                    node: `const methods = await connect.accounts.listPayoutMethods('ca_xxx');
const defaultMethod = methods.find(m => m.is_default);
console.log(defaultMethod?.details.display); // "Airtel Money ••••4567"`,
                    python: `r = requests.get(
    "https://api.flapapay.com/v1/connect/accounts/ca_xxx/payout_methods",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"}
)
default_method = next((m for m in r.json() if m["is_default"]), None)`
                },
                tryIt: {}
            },
        ]
    },
    {
        id: 'kyc',
        label: 'KYC',
        icon: ShieldCheck,
        color: 'text-teal-600 bg-teal-50',
        endpoints: [
            {
                id: 'kyc-get',
                method: 'GET',
                path: '/v1/connect/accounts/:id/kyc',
                summary: 'Get KYC status & documents',
                description: 'Returns the KYC verification status and all submitted documents for a connected account. Use this to build your KYC review workflow.',
                response: `{
  "account": {
    "id": "ca_xxx",
    "kyc_status": "pending_review",
    "kyc_submitted_at": "2026-04-03T07:30:00.000Z"
  },
  "documents": [
    {
      "id": "doc_xxx",
      "document_type": "nrc",
      "file_url": "/assets/images/kyc/document-xxx.jpg",
      "file_name": "national-id.jpg",
      "status": "pending_review",
      "rejection_reason": null,
      "uploaded_at": "2026-04-03T07:30:00.000Z"
    }
  ]
}`,
                code: {
                    curl: `curl https://api.flapapay.com/v1/connect/accounts/ca_xxx/kyc \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx"`,
                    node: `const { account, documents } = await connect.accounts.getKYC('ca_xxx');
const pending = documents.filter(d => d.status === 'pending_review');`,
                    python: `r = requests.get(
    "http://localhost:3005/v1/connect/accounts/ca_xxx/kyc",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"}
)
docs = r.json()["documents"]`
                },
                tryIt: {}
            },
            {
                id: 'kyc-review',
                method: 'PATCH',
                path: '/v1/connect/accounts/:id/kyc/:docId',
                summary: 'Approve or reject a document',
                description: 'Review a KYC document. Approving all documents for an account automatically advances its `kyc_status` to `verified` and its `status` to `ACTIVE`. Rejecting sets the account back to `rejected`.',
                bodyParams: [
                    { name: 'status', type: 'approved | rejected', required: true, description: 'Review decision' },
                    { name: 'rejection_reason', type: 'string', description: 'Required when status=rejected. Shown to the sub-merchant.' },
                ],
                response: `{ "success": true, "account_kyc_status": "verified" }`,
                code: {
                    curl: `curl -X PATCH https://api.flapapay.com/v1/connect/accounts/ca_xxx/kyc/doc_xxx \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx" \\
  -d '{"status": "approved"}'`,
                    node: `await connect.accounts.reviewKYCDocument('ca_xxx', 'doc_xxx', {
  status: 'approved',
});`,
                    python: `requests.patch(
    "http://localhost:3005/v1/connect/accounts/ca_xxx/kyc/doc_xxx",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"},
    json={"status": "approved"}
)`
                },
                tryIt: { body: '{\n  "status": "approved"\n}' }
            }
        ]
    },
    {
        id: 'webhooks',
        label: 'Webhooks',
        icon: Activity,
        color: 'text-purple-600 bg-purple-50',
        endpoints: [
            {
                id: 'webhooks-create',
                method: 'POST',
                path: '/v1/webhooks',
                summary: 'Register a webhook endpoint',
                description: 'Register a URL to receive real-time event notifications. The `signing_secret` is returned **only once** at creation — store it securely. Use it to verify webhook payloads with HMAC-SHA256.\n\nPass `["*"]` in events to subscribe to all event types.\n\n**Hosted Onboarding events:** `connect.onboarding.started`, `connect.onboarding.step_saved`, `connect.onboarding.completed`, `connect.payout.otp_verified`, `connect.payout.deposits_sent`, `connect.payout.deposits_verified`\n\n**Account lifecycle events:** `account.activated`, `account.suspended`, `kyc.submitted`, `kyc.approved`, `kyc.rejected`\n\n**Transaction events:** `charge.succeeded`, `charge.failed`, `payout.completed`, `payout.failed`, `dispute.opened`, `dispute.resolved`\n\n**Split payment events:** `transaction.split.created` — fired immediately when a split charge succeeds (funds are pending). `transaction.split.available` — fired by the settlement worker when `available_at` is reached and pending funds move to available balance. Both events include `charge_id`, `sub_merchant_id`, `platform_fee`, `sub_merchant_amount`, `available_at`, and `settlement_days`.',
                bodyParams: [
                    { name: 'url', type: 'string', required: true, description: 'HTTPS URL to receive event payloads' },
                    { name: 'events', type: 'string[]', required: true, description: 'Array of event types to subscribe to, or ["*"] for all. See description above for the full event catalog.' },
                    { name: 'description', type: 'string', description: 'Internal label for this endpoint' },
                ],
                response: `{
  "id": "we_01j9x...",
  "url": "https://yourapp.com/webhooks/flapapay",
  "events": ["account.activated", "payout.completed"],
  "enabled": true,
  "signing_secret": "whsec_a1b2c3d4e5f6...",
  "created_at": "2026-04-03T08:00:00.000Z"
}`,
                code: {
                    curl: `curl -X POST https://api.flapapay.com/v1/webhooks \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx" \\
  -d '{
    "url": "https://yourapp.com/webhooks/flapapay",
    "events": ["account.activated", "payout.completed", "charge.succeeded"],
    "description": "Production webhook"
  }'`,
                    node: `const endpoint = await connect.webhooks.create({
  url: 'https://yourapp.com/webhooks/flapapay',
  events: ['account.activated', 'payout.completed'],
  description: 'Production webhook',
});
// Save endpoint.signing_secret — shown only once!
console.log(endpoint.signing_secret);`,
                    python: `r = requests.post(
    "http://localhost:3005/v1/webhooks",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"},
    json={
        "url": "https://yourapp.com/webhooks/flapapay",
        "events": ["account.activated", "payout.completed"]
    }
)
secret = r.json()["signing_secret"]  # Save this!`
                },
                tryIt: { body: '{\n  "url": "https://webhook.site/your-unique-id",\n  "events": ["*"],\n  "description": "Test endpoint"\n}' }
            },
            {
                id: 'webhooks-verify',
                method: 'POST',
                path: '(your server)',
                summary: 'Verify webhook signatures',
                description: 'Every webhook payload is signed with HMAC-SHA256 using your endpoint\'s `signing_secret`. Always verify the `x-flapapay-signature` header before processing an event.\n\nThe signature header format is: `t={timestamp},v1={signature}`',
                response: `// Verified event object
{
  "id": "evt_01j9x...",
  "type": "payout.completed",
  "livemode": false,
  "created": 1743667800,
  "data": {
    "object": {
      "id": "po_01j9x...",
      "account_id": "ca_xxx",
      "amount": 8750,
      "status": "completed"
    }
  }
}`,
                code: {
                    curl: `# Webhook payloads are signed — verify on your server`,
                    node: `import express from 'express';
import { WebhookVerifier } from '@flapapay/connect';

app.post('/webhooks/flapapay',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['x-flapapay-signature'];
    const secret = process.env.FLAPAPAY_WEBHOOK_SECRET;

    const event = await WebhookVerifier.constructEvent(
      req.body, sig, secret
    );

    switch (event.type) {
      case 'transaction.split.created':
        // Funds pending — notify seller of incoming payment
        break;
      case 'transaction.split.available':
        // Funds released — safe to show "available to withdraw"
        break;
      case 'payout.completed':
        // Credit the sub-merchant in your DB
        break;
      case 'account.activated':
        // Notify the merchant
        break;
    }
    res.sendStatus(200);
  }
);`,
                    python: `import hmac, hashlib, time

def verify_webhook(payload: bytes, sig_header: str, secret: str) -> dict:
    parts = dict(p.split("=", 1) for p in sig_header.split(","))
    timestamp = int(parts.get("t", 0))
    received_sig = parts.get("v1", "")

    if abs(time.time() - timestamp) > 300:
        raise ValueError("Webhook too old")

    expected = hmac.new(
        secret.encode(), f"{timestamp}.{payload.decode()}".encode(),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected, received_sig):
        raise ValueError("Invalid signature")

    return json.loads(payload)`
                },
            }
        ]
    },
    {
        id: 'disputes',
        label: 'Disputes',
        icon: AlertTriangle,
        color: 'text-rose-600 bg-rose-50',
        endpoints: [
            {
                id: 'disputes-list',
                method: 'GET',
                path: '/v1/connect/disputes',
                summary: 'List disputes',
                description: 'Returns all disputes on your platform. Filter by status to find disputes that need attention.',
                params: [
                    { name: 'status', type: 'open | under_review | won | lost | closed', description: 'Filter by dispute status' },
                    { name: 'limit', type: 'number', description: 'Max results (default: 100)' },
                ],
                response: `{
  "disputes": [
    {
      "id": "disp_xxx",
      "charge_id": "ch_xxx",
      "account_business_name": "Lusaka Crafts Ltd",
      "amount": 10000,
      "currency": "ZMW",
      "status": "open",
      "reason": "product_not_received",
      "customer_email": "buyer@example.com",
      "created_at": "2026-04-03T09:00:00.000Z"
    }
  ]
}`,
                code: {
                    curl: `curl "https://api.flapapay.com/v1/connect/disputes?status=open" \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx"`,
                    node: `const { disputes } = await connect.disputes.list({ status: 'open' });`,
                    python: `r = requests.get(
    "http://localhost:3005/v1/connect/disputes",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"},
    params={"status": "open"}
)`
                },
                tryIt: {}
            }
        ]
    },
    {
        id: 'ledger',
        label: 'Ledger',
        icon: BookOpen,
        color: 'text-cyan-600 bg-cyan-50',
        endpoints: [
            {
                id: 'ledger-list',
                method: 'GET',
                path: '/v1/connect/ledger',
                summary: 'List ledger entries',
                description: 'Returns double-entry ledger records for your platform. Every fee collection, refund reversal, and payout disbursement creates an immutable ledger entry — ensuring BoZ audit compliance.',
                params: [
                    { name: 'from', type: 'string', description: 'Start date (YYYY-MM-DD)' },
                    { name: 'to', type: 'string', description: 'End date (YYYY-MM-DD)' },
                    { name: 'entry_type', type: 'fee_collected | refund_reversal | payout_disbursed | adjustment', description: 'Filter by entry type' },
                    { name: 'limit', type: 'number', description: 'Default: 25' },
                    { name: 'offset', type: 'number', description: 'Pagination offset' },
                ],
                response: `{
  "entries": [
    {
      "id": "le_xxx",
      "entry_type": "fee_collected",
      "account_name": "Lusaka Crafts Ltd",
      "amount": 250,
      "currency": "ZMW",
      "direction": "credit",
      "description": "Platform fee on charge ch_xxx",
      "created_at": "2026-04-03T09:15:00.000Z"
    }
  ],
  "summary": {
    "total_credits": 31250,
    "total_debits": 25000,
    "net_balance": 6250,
    "currency": "ZMW"
  }
}`,
                code: {
                    curl: `curl "https://api.flapapay.com/v1/connect/ledger?from=2026-04-01&to=2026-04-30" \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx"`,
                    node: `const { entries, summary } = await connect.ledger.list({
  from: '2026-04-01',
  to: '2026-04-30',
  entry_type: 'fee_collected',
});`,
                    python: `r = requests.get(
    "http://localhost:3005/v1/connect/ledger",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"},
    params={"from": "2026-04-01", "to": "2026-04-30"}
)`
                },
                tryIt: {}
            }
        ]
    },
    {
        id: 'analytics',
        label: 'Analytics',
        icon: BarChart2,
        color: 'text-violet-600 bg-violet-50',
        endpoints: [
            {
                id: 'analytics-platform',
                method: 'GET',
                path: '/v1/connect/analytics',
                summary: 'Platform analytics',
                description: 'Returns aggregated marketplace GMV, platform fees, and top performing sub-merchants for a given period.',
                params: [
                    { name: 'period', type: '7d | 30d | 90d', description: 'Time period. Default: 30d' },
                ],
                response: `{
  "period": { "from": "2026-03-04", "to": "2026-04-03" },
  "summary": {
    "total_gmv": 1250000,
    "total_fees": 31250,
    "total_charges": 142
  },
  "top_accounts": [
    { "id": "ca_xxx", "business_name": "Lusaka Crafts Ltd",
      "volume": 450000, "fees": 11250, "count": 48 }
  ]
}`,
                code: {
                    curl: `curl "https://api.flapapay.com/v1/connect/analytics?period=30d" \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx"`,
                    node: `const data = await connect.analytics.platform('30d');
console.log('GMV:', data.summary.total_gmv);`,
                    python: `r = requests.get(
    "http://localhost:3005/v1/connect/analytics",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"},
    params={"period": "30d"}
)`
                },
                tryIt: {}
            }
        ]
    },
    {
        id: 'invites',
        label: 'Invites',
        icon: Link2,
        color: 'text-amber-600 bg-amber-50',
        endpoints: [
            {
                id: 'invites-create',
                method: 'POST',
                path: '/v1/connect/invites',
                summary: 'Create an invite link',
                description: 'Generate a time-limited invite link for a new sub-merchant. Share the `invite_url` with them — they\'ll be taken through self-registration without needing a password from you.',
                bodyParams: [
                    { name: 'email', type: 'string', description: 'Pre-fill the registrant\'s email on the form' },
                    { name: 'business_name', type: 'string', description: 'Pre-fill the business name on the form' },
                    { name: 'expires_in_days', type: 'number', description: 'Link expiry in days. Default: 7' },
                ],
                response: `{
  "id": "inv_xxx",
  "token": "a1b2c3d4e5f6",
  "status": "pending",
  "invite_url": "https://yourplatform.com/connect/invite/a1b2c3d4e5f6",
  "expires_at": "2026-04-10T08:00:00.000Z",
  "created_at": "2026-04-03T08:00:00.000Z"
}`,
                code: {
                    curl: `curl -X POST https://api.flapapay.com/v1/connect/invites \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx" \\
  -d '{"email": "newmerchant@example.com", "expires_in_days": 7}'`,
                    node: `const invite = await connect.invites.create({
  email: 'newmerchant@example.com',
  expires_in_days: 7,
});
// Send invite.invite_url to the sub-merchant`,
                    python: `r = requests.post(
    "http://localhost:3005/v1/connect/invites",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"},
    json={"email": "newmerchant@example.com", "expires_in_days": 7}
)
print(r.json()["invite_url"])`
                },
                tryIt: { body: '{\n  "email": "test@example.com",\n  "business_name": "Test Merchant",\n  "expires_in_days": 7\n}' }
            }
        ]
    },
    {
        id: 'onboarding',
        label: 'Hosted Onboarding',
        icon: Zap,
        color: 'text-orange-600 bg-orange-50',
        endpoints: [
            {
                id: 'onboarding-create-link',
                method: 'POST',
                path: '/v1/connect/onboarding_links',
                summary: 'Create a hosted onboarding link',
                description: 'Generates a secure, time-limited URL you send to a sub-merchant so they can complete their own KYC and payout verification independently — on their own device, at their own pace.\n\nThis is FlapaPay\'s equivalent of Stripe\'s `account_links` API. The sub-merchant visits the URL and is guided through a branded, multi-step onboarding flow: account type selection → identity/KYC → contact details → business activity → payout method selection + verification (OTP for mobile money, micro-deposits for bank accounts) → Terms of Service acceptance.\n\nThe `return_url` receives the sub-merchant after successful completion. The `refresh_url` receives them if the link has already been used or has expired, so you can regenerate a fresh one.',
                bodyParams: [
                    { name: 'return_url', type: 'string', required: true, description: 'Where to redirect the sub-merchant after they successfully complete onboarding' },
                    { name: 'refresh_url', type: 'string', required: true, description: 'Where to redirect if the link is expired or has already been used' },
                    { name: 'account_id', type: 'string', description: 'Pre-created connected account ID. If omitted, a new account record is automatically created when the sub-merchant submits.' },
                    { name: 'expires_in_hours', type: 'number', description: 'Link lifetime in hours. Default: 72. Range: 1–168 (7 days). Use a longer window for Zambian merchants who may need time to gather TPIN/PACRA documents.' },
                    { name: 'platform_branding.name', type: 'string', description: 'Your platform name shown at the top of the hosted page, e.g. "ShopZambia"' },
                    { name: 'platform_branding.logo_url', type: 'string', description: 'Full URL of your platform logo (PNG or SVG, square preferred)' },
                    { name: 'platform_branding.color', type: 'string', description: 'Brand colour applied to buttons and accents on the hosted page, e.g. "#FF6600"' },
                ],
                response: `{
  "id": "ol_01j9x7onboard123",
  "url": "https://connect.flapapay.com/onboarding/tok_a1b2c3d4e5f6g7h8",
  "token": "tok_a1b2c3d4e5f6g7h8",
  "expires_at": "2026-04-15T08:00:00.000Z",
  "account_id": null,
  "return_url": "https://yourplatform.com/onboarding/complete",
  "refresh_url": "https://yourplatform.com/onboarding/restart",
  "status": "pending",
  "created_at": "2026-04-12T08:00:00.000Z"
}`,
                code: {
                    curl: `curl -X POST https://api.flapapay.com/v1/connect/onboarding_links \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "return_url": "https://yourplatform.com/onboarding/complete",
    "refresh_url": "https://yourplatform.com/onboarding/restart",
    "expires_in_hours": 72,
    "platform_branding": {
      "name": "ShopZambia",
      "logo_url": "https://yourplatform.com/logo.png",
      "color": "#FF6600"
    }
  }'`,
                    node: `const link = await connect.onboarding.createLink({
  return_url: 'https://yourplatform.com/onboarding/complete',
  refresh_url: 'https://yourplatform.com/onboarding/restart',
  expires_in_hours: 72,
  platform_branding: {
    name: 'ShopZambia',
    logo_url: 'https://yourplatform.com/logo.png',
    color: '#FF6600',
  },
});

// Redirect the sub-merchant to link.url
// or email it to them
console.log(link.url);`,
                    python: `r = requests.post(
    "https://api.flapapay.com/v1/connect/onboarding_links",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"},
    json={
        "return_url": "https://yourplatform.com/onboarding/complete",
        "refresh_url": "https://yourplatform.com/onboarding/restart",
        "expires_in_hours": 72,
        "platform_branding": {
            "name": "ShopZambia",
            "color": "#FF6600"
        }
    }
)
link = r.json()
print(link["url"])  # redirect sub-merchant to this URL`
                },
                tryIt: { body: '{\n  "return_url": "https://yourplatform.com/complete",\n  "refresh_url": "https://yourplatform.com/restart",\n  "expires_in_hours": 72\n}' }
            },
            {
                id: 'onboarding-get-session',
                method: 'GET',
                path: '/v1/connect/onboarding/:token',
                summary: 'Get onboarding session state',
                description: 'Fetch the current state of a hosted onboarding session. The hosted page frontend calls this on load to restore previously saved progress so sub-merchants can resume exactly where they left off without starting over.\n\nThe `requirements` object mirrors Stripe\'s `currently_due` / `eventually_due` pattern — it tells both the sub-merchant and your platform exactly which fields are outstanding, pending review, or already verified.\n\nThis endpoint is **public** — no API key required. The session token is the authentication mechanism.',
                response: `{
  "token": "tok_a1b2c3d4e5f6g7h8",
  "status": "pending",
  "expires_at": "2026-04-15T08:00:00.000Z",
  "platform_name": "ShopZambia",
  "platform_logo_url": "https://yourplatform.com/logo.png",
  "platform_color": "#FF6600",
  "current_step": 3,
  "partial_data": {
    "account_type": "individual",
    "full_name": "Chanda Mutale",
    "nrc": "123456/78/9"
  },
  "requirements": {
    "submitted": ["account_type", "full_name", "nrc"],
    "pending_review": ["nrc_document"],
    "verified": [],
    "outstanding": ["contact", "business_activity", "payout_method"]
  }
}`,
                code: {
                    curl: `# Public endpoint — no API key needed
curl https://api.flapapay.com/v1/connect/onboarding/tok_a1b2c3d4e5f6g7h8`,
                    node: `// Called automatically when the sub-merchant loads the URL
const session = await fetch(
  '/v1/connect/onboarding/' + token
).then(r => r.json());

console.log(session.current_step);
console.log(session.platform_name);
console.log(session.requirements.outstanding);`,
                    python: `# Public — no auth required
r = requests.get(
    f"https://api.flapapay.com/v1/connect/onboarding/{token}"
)
session = r.json()
print(session["current_step"])
print(session["requirements"]["outstanding"])`
                },
            },
            {
                id: 'onboarding-banks',
                method: 'GET',
                path: '/v1/connect/banks',
                summary: 'List supported banks',
                description: 'Returns the live list of Zambian banks supported for payout account linking, powered by Lenco. Call this to populate the bank selection grid on your hosted onboarding page.\n\nThis endpoint is **public** — no API key required.',
                params: [
                    { name: 'country', type: 'string', description: 'ISO 3166-1 alpha-2 country code. Default: zm (Zambia)' },
                ],
                response: `{
  "status": true,
  "data": [
    { "id": "lem_zanaco_zm", "name": "Zanaco", "country": "zm" },
    { "id": "lem_stanbic_zm", "name": "Stanbic Bank", "country": "zm" },
    { "id": "lem_absa_zm", "name": "Absa Bank Zambia", "country": "zm" },
    { "id": "lem_access_zm", "name": "Access Bank Zambia", "country": "zm" }
  ]
}`,
                code: {
                    curl: `curl "https://api.flapapay.com/v1/connect/banks?country=zm"`,
                    node: `const { data: banks } = await fetch(
  '/v1/connect/banks?country=zm'
).then(r => r.json());

// Render the bank selection grid
banks.forEach(b => console.log(b.id, b.name));`,
                    python: `r = requests.get("https://api.flapapay.com/v1/connect/banks", params={"country": "zm"})
banks = r.json()["data"]
for bank in banks:
    print(bank["id"], bank["name"])`
                },
            },
            {
                id: 'onboarding-verify-otp',
                method: 'POST',
                path: '/v1/connect/onboarding/:token/verify-otp',
                summary: 'Verify mobile money — OTP flow',
                description: 'Confirms that the sub-merchant controls the mobile money wallet they registered as their payout method.\n\nCall with `action: "send"` to dispatch a 6-digit OTP via SMS to the mobile number. The sub-merchant enters the code on the hosted page and you call again with `action: "confirm"` to complete verification. The OTP expires after 10 minutes and the sub-merchant gets a maximum of 3 confirmation attempts before it is invalidated and must be resent.\n\nFor higher assurance, combine this with a test payout of ZMW 1 that the merchant confirms — ensuring the wallet is fully functional for receiving settlements, not just SMS-capable.\n\nThis endpoint is **public** — the session token acts as authentication.',
                bodyParams: [
                    { name: 'action', type: 'send | confirm', required: true, description: '"send" dispatches an OTP via SMS. "confirm" verifies the code the merchant received.' },
                    { name: 'mobile_number', type: 'string', description: 'Required for action=send. Format: +260XXXXXXXXX' },
                    { name: 'network', type: 'mtn | airtel | zamtel', description: 'Required for action=send. Mobile money provider.' },
                    { name: 'otp', type: 'string', description: 'Required for action=confirm. The 6-digit code received via SMS.' },
                ],
                response: `// action: "send"
{
  "success": true,
  "message": "OTP sent to +260 9XX XXX XXX",
  "expires_in_seconds": 600,
  "attempts_remaining": 3
}

// action: "confirm" — correct code
{
  "success": true,
  "verified": true,
  "payout_method_id": "pm_01j9xmobile123"
}

// action: "confirm" — wrong code
{
  "success": false,
  "verified": false,
  "attempts_remaining": 2,
  "error": "Incorrect OTP. 2 attempts remaining."
}`,
                code: {
                    curl: `# Step 1: Send OTP
curl -X POST https://api.flapapay.com/v1/connect/onboarding/tok_xxx/verify-otp \\
  -H "Content-Type: application/json" \\
  -d '{"action":"send","mobile_number":"+260971234567","network":"airtel"}'

# Step 2: Merchant enters the code — confirm it
curl -X POST https://api.flapapay.com/v1/connect/onboarding/tok_xxx/verify-otp \\
  -H "Content-Type: application/json" \\
  -d '{"action":"confirm","otp":"483921"}'`,
                    node: `// Step 1 — send OTP
await fetch('/v1/connect/onboarding/' + token + '/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'send',
    mobile_number: '+260971234567',
    network: 'airtel',
  }),
});

// Step 2 — merchant enters code shown in hosted page input
const { verified } = await fetch(
  '/v1/connect/onboarding/' + token + '/verify-otp',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'confirm', otp: '483921' }),
  }
).then(r => r.json());

if (verified) goToNextStep();`,
                    python: `# Step 1 — send OTP
requests.post(
    f"https://api.flapapay.com/v1/connect/onboarding/{token}/verify-otp",
    json={"action": "send", "mobile_number": "+260971234567", "network": "airtel"}
)

# Step 2 — confirm OTP entered by sub-merchant
r = requests.post(
    f"https://api.flapapay.com/v1/connect/onboarding/{token}/verify-otp",
    json={"action": "confirm", "otp": "483921"}
)
print(r.json()["verified"])`
                },
                tryIt: { body: '{\n  "action": "send",\n  "mobile_number": "+260971234567",\n  "network": "mtn"\n}' }
            },
            {
                id: 'onboarding-verify-bank',
                method: 'POST',
                path: '/v1/connect/onboarding/:token/verify-bank',
                summary: 'Verify bank account (real-time)',
                description: 'Verifies the sub-merchant\'s bank account in real time using FlapaPay\'s Lenco bank integration. The sub-merchant selects their bank from a live list (fetched via `/banks`), enters their account number, and clicks "Verify". FlapaPay calls Lenco\'s account resolution API immediately and returns the verified account holder name within seconds.\n\nThis replaces traditional micro-deposit verification — no waiting 1–2 days. The merchant sees their exact registered account name on screen and confirms it is correct before proceeding.\n\nOn success, FlapaPay emits a `connect.payout.bank_verified` webhook and marks the payout method as `verification_status: verified`.\n\nThis endpoint is **public** — the session token acts as authentication.',
                bodyParams: [
                    { name: 'bank_id', type: 'string', required: true, description: 'Lenco bank ID returned by GET /v1/connect/banks?country=zm' },
                    { name: 'bank_name', type: 'string', required: true, description: 'Bank display name (stored with the payout method)' },
                    { name: 'account_number', type: 'string', required: true, description: 'Bank account number to verify' },
                ],
                response: `// Success — account found
{
  "success": true,
  "verified": true,
  "account_name": "LUSAKA CRAFTS LIMITED",
  "account_number": "1234005678",
  "bank_name": "Zanaco",
  "payout_method_id": "pm_01j9xbank789"
}

// Account not found
{
  "success": false,
  "verified": false,
  "error": "Account not found. Please check the account number and selected bank."
}`,
                code: {
                    curl: `curl -X POST https://api.flapapay.com/v1/connect/onboarding/tok_xxx/verify-bank \\
  -H "Content-Type: application/json" \\
  -d '{
    "bank_id": "lem_zanaco_zm",
    "bank_name": "Zanaco",
    "account_number": "1234005678"
  }'`,
                    node: `const result = await fetch(
  '/v1/connect/onboarding/' + token + '/verify-bank',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bank_id: 'lem_zanaco_zm',
      bank_name: 'Zanaco',
      account_number: '1234005678',
    }),
  }
).then(r => r.json());

if (result.verified) {
  // Show result.account_name to merchant for confirmation
  console.log('Account belongs to:', result.account_name);
}`,
                    python: `r = requests.post(
    f"https://api.flapapay.com/v1/connect/onboarding/{token}/verify-bank",
    json={
        "bank_id": "lem_zanaco_zm",
        "bank_name": "Zanaco",
        "account_number": "1234005678"
    }
)
result = r.json()
if result["verified"]:
    print("Account name:", result["account_name"])`
                },
                tryIt: { body: '{\n  "bank_id": "lem_zanaco_zm",\n  "bank_name": "Zanaco",\n  "account_number": "1234005678"\n}' }
            },
        ]
    },
    {
        id: 'embedded',
        label: 'Embedded Components',
        icon: Layers,
        color: 'text-orange-600 bg-orange-50',
        endpoints: [
            {
                id: 'embedded-overview',
                method: 'GET',
                path: '/v1/connect/account_sessions',
                summary: 'Overview & Architecture',
                description: `Embedded Components let marketplace owners embed seller-facing dashboard UI directly inside their own platform. Sellers see their balance, transactions, payouts, and KYC status without ever leaving your marketplace.

**How it works — 4 steps:**

1. **Your server** calls \`POST /v1/connect/account_sessions\` with a seller account ID → receives a short-lived \`client_secret\`
2. **Your frontend** initialises \`loadFlapaConnect({ fetchClientSecret })\` with a function that fetches that secret from your server
3. **FlapaConnectProvider** exchanges the \`client_secret\` for a scoped portal token via \`POST /v1/connect/account_sessions/:secret/exchange\`
4. **Components** render the seller's live data authenticated with that token — your API key is never exposed to the browser

**Security model:** The \`client_secret\` is single-use per session and expires in 1 hour. The portal token it produces only has access to that specific seller's data, scoped to the components you enable. No cross-account access is possible.`,
                response: `// Architecture flow:
// Marketplace server ──POST /v1/connect/account_sessions──► FlapaPay
//                    ◄── { client_secret: "cass_..." } ──────
//
// Seller browser ──loadFlapaConnect({ fetchClientSecret })──► Your server
//                ◄── client_secret ───────────────────────────
//
// FlapaConnectProvider ──POST /account_sessions/:secret/exchange──► FlapaPay
//                       ◄── { portal_token, account_id } ──────────
//
// <ConnectBalances /> ──GET /v1/connect/portal/me──► FlapaPay
//    (using portal_token)                         ◄── { balance }`,
                code: {
                    curl: `# Step 1 (server): Create an account session
curl -X POST https://api.flapapay.com/v1/connect/account_sessions \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "account": "ca_seller_id",
    "components": {
      "balances":       { "enabled": true },
      "payments":       { "enabled": true },
      "payouts":        { "enabled": true },
      "documents":      { "enabled": true },
      "notifications":  { "enabled": true }
    }
  }'`,
                    node: `// server.js — expose a /account-session endpoint
import express from 'express';
import { FlapaPayConnect } from '@flapapay/connect';

const connect = new FlapaPayConnect({ apiKey: process.env.FLAPAPAY_SECRET_KEY });
const app = express();

app.post('/account-session', async (req, res) => {
  // req.user.sellerId comes from your own auth
  const session = await connect.accountSessions.create({
    account: req.user.sellerId,
    components: {
      balances:      { enabled: true },
      payments:      { enabled: true },
      payouts:       { enabled: true },
      documents:     { enabled: true },
      notifications: { enabled: true },
    },
  });
  res.json({ client_secret: session.client_secret });
});`,
                    python: `# server.py — Flask endpoint
import requests
from flask import Flask, jsonify, g

app = Flask(__name__)
FLAPAPAY_KEY = "sk_test_flp_xxxxxxxxxxxx"

@app.post("/account-session")
def create_account_session():
    seller_id = g.current_user["seller_id"]  # from your auth
    r = requests.post(
        "https://api.flapapay.com/v1/connect/account_sessions",
        headers={"Authorization": f"Bearer {FLAPAPAY_KEY}"},
        json={
            "account": seller_id,
            "components": {
                "balances":      {"enabled": True},
                "payments":      {"enabled": True},
                "payouts":       {"enabled": True},
                "documents":     {"enabled": True},
                "notifications": {"enabled": True},
            },
        },
    )
    return jsonify(client_secret=r.json()["client_secret"])`
                },
                tryIt: {}
            },
            {
                id: 'embedded-session-create',
                method: 'POST',
                path: '/v1/connect/account_sessions',
                summary: 'Create Account Session',
                description: `Creates a short-lived session that grants a seller's browser access to their data via embedded components. The returned \`client_secret\` must be passed to \`loadFlapaConnect\` on the client — never log or cache it server-side beyond the request lifetime.

**Component permissions:** The \`components\` object controls exactly which embedded components are available in this session. Only enable the components your seller dashboard actually renders — principle of least privilege.

**Expiry:** Sessions expire after **1 hour**. \`loadFlapaConnect\` automatically calls your \`fetchClientSecret\` function to refresh when the session expires, so sellers never get logged out mid-session.`,
                bodyParams: [
                    { name: 'account', type: 'string', required: true, description: 'The connected seller account ID to create a session for.', example: 'ca_01j9x2q3r4s5t6u7v8w9x0y1z' },
                    { name: 'components', type: 'object', description: 'Map of component names to permission objects. Each component has an `enabled` boolean. Omitted components default to disabled.' },
                    { name: 'components.balances', type: '{ enabled: boolean }', description: 'Grants access to the ConnectBalances component (account balance + KYC status).' },
                    { name: 'components.payments', type: '{ enabled: boolean }', description: 'Grants access to the ConnectPayments component (transaction history).' },
                    { name: 'components.payouts', type: '{ enabled: boolean }', description: 'Grants access to the ConnectPayouts component (payout history + request payout).' },
                    { name: 'components.documents', type: '{ enabled: boolean }', description: 'Grants access to the ConnectDocuments component (KYC document upload & status).' },
                    { name: 'components.notifications', type: '{ enabled: boolean }', description: 'Grants access to the ConnectNotificationBanner component.' },
                ],
                response: `{
  "object": "account_session",
  "client_secret": "cass_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6",
  "account": "ca_01j9x2q3r4s5t6u7v8w9x0y1z",
  "expires_at": 1714000000
}`,
                code: {
                    curl: `curl -X POST https://api.flapapay.com/v1/connect/account_sessions \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "account": "ca_01j9x2q3r4s5t6u7v8w9x0y1z",
    "components": {
      "balances":  { "enabled": true },
      "payments":  { "enabled": true },
      "payouts":   { "enabled": true }
    }
  }'`,
                    node: `const session = await connect.accountSessions.create({
  account: 'ca_01j9x2q3r4s5t6u7v8w9x0y1z',
  components: {
    balances: { enabled: true },
    payments: { enabled: true },
    payouts:  { enabled: true },
  },
});

// Return only the client_secret to the browser — never the full session
res.json({ client_secret: session.client_secret });`,
                    python: `session = connect.account_sessions.create(
    account="ca_01j9x2q3r4s5t6u7v8w9x0y1z",
    components={
        "balances": {"enabled": True},
        "payments": {"enabled": True},
        "payouts":  {"enabled": True},
    },
)
return jsonify(client_secret=session["client_secret"])`
                },
                tryIt: { body: '{\n  "account": "ca_REPLACE_WITH_ACCOUNT_ID",\n  "components": {\n    "balances": { "enabled": true },\n    "payments": { "enabled": true },\n    "payouts":  { "enabled": true }\n  }\n}' }
            },
            {
                id: 'embedded-exchange',
                method: 'POST',
                path: '/v1/connect/account_sessions/:secret/exchange',
                summary: 'Exchange Client Secret for Portal Token',
                description: `Exchanges a \`client_secret\` (obtained from \`POST /v1/connect/account_sessions\`) for a scoped portal access token. **This endpoint is called automatically by \`FlapaConnectProvider\`** — you do not call it directly in your application code.

The returned \`portal_token\` authenticates all subsequent portal endpoint calls (\`/v1/connect/portal/*\`) made by embedded components. It inherits the expiry of the originating account session.

**No authentication header required** — the \`client_secret\` in the URL path is the credential. This is by design: this endpoint is called from the seller's browser, which cannot safely hold your API key.`,
                params: [
                    { name: 'secret', type: 'string', required: true, description: 'The client_secret from POST /v1/connect/account_sessions, passed as the URL path segment.', example: 'cass_a1b2c3d4...' },
                ],
                response: `{
  "portal_token": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c...",
  "account_id": "ca_01j9x2q3r4s5t6u7v8w9x0y1z",
  "components": {
    "balances":  { "enabled": true },
    "payments":  { "enabled": true },
    "payouts":   { "enabled": true }
  },
  "expires_at": 1714000000
}`,
                code: {
                    curl: `# Called automatically by FlapaConnectProvider — shown for reference only
curl -X POST https://api.flapapay.com/v1/connect/account_sessions/cass_xxx/exchange`,
                    node: `// FlapaConnectProvider does this automatically.
// Your application code only needs loadFlapaConnect() — see below.

// Internal flow (for reference):
const res = await fetch(\`/v1/connect/account_sessions/\${clientSecret}/exchange\`, {
  method: 'POST',
});
const { portal_token, account_id, components, expires_at } = await res.json();`,
                    python: `# Called internally by the SDK — shown for transparency only
import requests

r = requests.post(
    f"https://api.flapapay.com/v1/connect/account_sessions/{client_secret}/exchange"
)
portal_token = r.json()["portal_token"]`
                },
                tryIt: {}
            },
            {
                id: 'embedded-init',
                method: 'GET',
                path: '/v1/connect/portal/me',
                summary: 'Client Setup: loadFlapaConnect()',
                description: `Initialize the FlapaPay Connect instance on the seller's browser. Install the package and call \`loadFlapaConnect\` with a \`fetchClientSecret\` function that calls your server's account-session endpoint.

**Install:**
\`\`\`bash
npm install @flapapay/connect @flapapay/react-connect
\`\`\`

**Key rules:**
- Create **one instance per seller session** — not one per component
- \`fetchClientSecret\` is also called automatically on token refresh — always create a fresh session, never cache the secret
- Pass \`appearance\` to match your platform's brand colors and fonts
- The \`FlapaConnectProvider\` wrapper makes all child components share the same authenticated session`,
                response: `// GET /v1/connect/portal/me — called by ConnectBalances internally
{
  "id": "ca_01j9x2q3r4s5t6u7v8w9x0y1z",
  "business_name": "Lusaka Crafts Ltd",
  "email": "admin@lusakacrafts.zm",
  "kyc_status": "APPROVED",
  "status": "ACTIVE",
  "platform_merchant_id": "m_abc123",
  "balance": {
    "available": 125000,
    "pending": 34500
  }
}`,
                code: {
                    curl: `# No curl equivalent — this is a client-side JS initialisation step`,
                    node: `// seller-dashboard.tsx (React)
import { loadFlapaConnect } from '@flapapay/connect';
import { FlapaConnectProvider } from '@flapapay/react-connect';
import {
  ConnectBalances,
  ConnectPayments,
  ConnectPayouts,
  ConnectDocuments,
  ConnectNotificationBanner,
} from '@flapapay/react-connect';

// One instance per seller session
const connectInstance = loadFlapaConnect({
  fetchClientSecret: async () => {
    // Always fetch fresh — never cache
    const res = await fetch('/account-session', { method: 'POST' });
    const { client_secret } = await res.json();
    return client_secret;
  },
  appearance: {
    variables: {
      colorPrimary: '#ea580c',   // your brand color
      borderRadius: '1rem',
      fontFamily: 'Inter, sans-serif',
    },
  },
});

export function SellerDashboard() {
  return (
    <FlapaConnectProvider connectInstance={connectInstance}>
      {/* Drop any component anywhere inside the provider */}
      <ConnectNotificationBanner />
      <ConnectBalances />
      <ConnectPayments />
      <ConnectPayouts />
      <ConnectDocuments />
    </FlapaConnectProvider>
  );
}`,
                    python: `# Python/Django backend — serve the React frontend as a SPA
# The React frontend handles all FlapaConnect initialisation.

# views.py
from django.http import JsonResponse
from django.views.decorators.http import require_POST
import requests

FLAPAPAY_KEY = os.environ["FLAPAPAY_SECRET_KEY"]

@require_POST
@login_required
def account_session(request):
    seller_id = request.user.seller_profile.flapapay_account_id
    r = requests.post(
        "https://api.flapapay.com/v1/connect/account_sessions",
        headers={"Authorization": f"Bearer {FLAPAPAY_KEY}"},
        json={
            "account": seller_id,
            "components": {
                "balances":  {"enabled": True},
                "payments":  {"enabled": True},
                "payouts":   {"enabled": True},
                "documents": {"enabled": True},
            },
        },
    )
    return JsonResponse({"client_secret": r.json()["client_secret"]})`
                },
                tryIt: {}
            },
            {
                id: 'embedded-balances',
                method: 'GET',
                path: '/v1/connect/portal/me',
                summary: '<ConnectBalances /> Component',
                description: `Displays the seller's available balance, pending balance, account status, and KYC verification state. This is typically the first component marketplace owners embed — it gives sellers instant visibility into their earnings.

**Required session component:** \`balances: { enabled: true }\`

**Portal endpoint used internally:** \`GET /v1/connect/portal/me\`

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| \`onLoadError\` | \`(error: Error) => void\` | Called when the component fails to load |
| \`onLoaderStart\` | \`() => void\` | Called when the component begins rendering UI (use to hide your loading spinner) |

**Appearance:** Inherits \`colorPrimary\` from the \`FlapaConnectProvider\` appearance for the available balance highlight card.`,
                response: `// Internal portal endpoint response (GET /v1/connect/portal/me):
{
  "id": "ca_01j9x2q3r4s5t6u7v8w9x0y1z",
  "business_name": "Lusaka Crafts Ltd",
  "kyc_status": "APPROVED",
  "status": "ACTIVE",
  "balance": {
    "available": 125000,   // in ngwe (ZMW × 100)
    "pending": 34500
  }
}`,
                code: {
                    curl: `# Direct portal endpoint call (what ConnectBalances does internally):
curl https://api.flapapay.com/v1/connect/portal/me \\
  -H "Authorization: Bearer {portal_token}"`,
                    node: `import { FlapaConnectProvider } from '@flapapay/react-connect';
import { ConnectBalances } from '@flapapay/react-connect';

function SellerOverview() {
  return (
    <FlapaConnectProvider connectInstance={connectInstance}>
      <ConnectBalances
        onLoaderStart={() => setShowSpinner(false)}
        onLoadError={(err) => {
          console.error('Balances failed to load:', err.message);
          showErrorToast('Could not load balance. Try refreshing.');
        }}
      />
    </FlapaConnectProvider>
  );
}

// Customize appearance:
const connectInstance = loadFlapaConnect({
  fetchClientSecret,
  appearance: {
    variables: {
      colorPrimary: '#2563eb', // blue brand
      borderRadius: '0.75rem',
    }
  }
});`,
                    python: `# No server-side code needed for rendering components.
# Portal endpoints can also be called directly from your backend
# using the portal_token if needed for server-side rendering:

r = requests.get(
    "https://api.flapapay.com/v1/connect/portal/me",
    headers={"Authorization": f"Bearer {portal_token}"}
)
seller = r.json()
# seller["balance"]["available"] / 100  → ZMW balance`
                },
                tryIt: {}
            },
            {
                id: 'embedded-payments',
                method: 'GET',
                path: '/v1/connect/portal/charges',
                summary: '<ConnectPayments /> Component',
                description: `Lists the seller's recent payment transactions — amount, status, description, and date. Sellers can see exactly which orders have been paid, pending, or failed without contacting your support team.

**Required session component:** \`payments: { enabled: true }\`

**Portal endpoint used internally:** \`GET /v1/connect/portal/charges?limit=10\`

**What sellers see:**
- Transaction amount and currency (ZMW)
- Payment status: SUCCESS / PENDING / FAILED with colour-coded icons
- Transaction description (from the charge's description field)
- Truncated charge ID (for reference)
- Date of transaction

**Pagination:** The component loads the 10 most recent transactions. For full history, direct sellers to your hosted seller portal.`,
                response: `// GET /v1/connect/portal/charges?limit=10
{
  "charges": [
    {
      "id": "ch_01j9x2q3r4s5t6u7v8w9x0y1z",
      "amount": 25000,
      "currency": "ZMW",
      "status": "SUCCESS",
      "description": "Order #1042 — School Supplies",
      "created_at": "2026-04-19T14:30:00.000Z"
    },
    {
      "id": "ch_01j9x2q3r4s5t6u7v8w9x0y2a",
      "amount": 8500,
      "currency": "ZMW",
      "status": "PENDING",
      "description": "Order #1043 — Stationery Pack",
      "created_at": "2026-04-19T09:15:00.000Z"
    }
  ],
  "total": 47,
  "has_more": true
}`,
                code: {
                    curl: `# Direct portal call (what ConnectPayments does internally):
curl "https://api.flapapay.com/v1/connect/portal/charges?limit=10" \\
  -H "Authorization: Bearer {portal_token}"`,
                    node: `import { ConnectPayments } from '@flapapay/react-connect';

function SellerTransactions() {
  return (
    <FlapaConnectProvider connectInstance={connectInstance}>
      <ConnectPayments
        onLoadError={(err) => trackError('connect_payments_error', err)}
      />
    </FlapaConnectProvider>
  );
}

// Integration tip: Place ConnectPayments after ConnectBalances
// so sellers see their summary first, then drill into transactions.`,
                    python: `# Fetch seller charges server-side using the portal token:
r = requests.get(
    "https://api.flapapay.com/v1/connect/portal/charges",
    params={"limit": 10},
    headers={"Authorization": f"Bearer {portal_token}"}
)
charges = r.json()["charges"]
for charge in charges:
    amount_zmw = charge["amount"] / 100
    print(f"{charge['status']}: ZMW {amount_zmw:.2f} — {charge['description']}")`
                },
                tryIt: {}
            },
            {
                id: 'embedded-payouts',
                method: 'GET',
                path: '/v1/connect/portal/payouts',
                summary: '<ConnectPayouts /> Component',
                description: `Shows the seller's payout history and lets them request a manual payout. This component replaces the need for sellers to message you asking "when will I get paid?" — they can see exactly what was paid out, to which account, and when.

**Required session component:** \`payouts: { enabled: true }\`

**Portal endpoints used internally:**
- \`GET /v1/connect/portal/payouts?limit=10\` — load payout history
- \`POST /v1/connect/portal/payout-requests\` — request a manual payout

**What sellers see:**
- Payout amount and destination (Mobile Money or Bank, last 4 digits)
- Payout status: COMPLETED / PENDING / FAILED
- Date of payout
- "Request Payout" button — submits a payout request to the marketplace owner for approval

**Note:** The "Request Payout" button only triggers a \`payout_request\` record for your review — it does not initiate an automatic payout. Approve/deny from your Connect dashboard at \`/merchant/connect/payout-requests\`.`,
                response: `// GET /v1/connect/portal/payouts
{
  "payouts": [
    {
      "id": "po_01j9x2q3r4s5t6u7v8w9x0y1z",
      "amount": 95000,
      "currency": "ZMW",
      "status": "COMPLETED",
      "destination_type": "mobile_money",
      "destination_details": {
        "provider": "airtel",
        "number": "0971234567"
      },
      "created_at": "2026-04-15T10:00:00.000Z"
    }
  ]
}`,
                code: {
                    curl: `# View payout history:
curl "https://api.flapapay.com/v1/connect/portal/payouts?limit=10" \\
  -H "Authorization: Bearer {portal_token}"

# Submit a payout request:
curl -X POST https://api.flapapay.com/v1/connect/portal/payout-requests \\
  -H "Authorization: Bearer {portal_token}" \\
  -H "Content-Type: application/json" \\
  -d '{ "note": "Monthly earnings withdrawal" }'`,
                    node: `import { ConnectPayouts } from '@flapapay/react-connect';

function SellerPayouts() {
  return (
    <FlapaConnectProvider connectInstance={connectInstance}>
      {/* Sellers see history + can request payout in one component */}
      <ConnectPayouts
        onLoaderStart={() => hideSkeletonLoader()}
        onLoadError={(err) => reportError(err)}
      />
    </FlapaConnectProvider>
  );
}

// On your server, handle payout request approvals:
// GET  /v1/connect/payout-requests        → list pending requests
// PATCH /v1/connect/payout-requests/:id   → approve or deny`,
                    python: `# Approve a payout request on the marketplace owner's server:
r = requests.patch(
    f"https://api.flapapay.com/v1/connect/payout-requests/{request_id}",
    headers={"Authorization": f"Bearer {platform_api_key}"},
    json={"status": "approved", "note": "Approved by finance team"}
)
print(r.json())`
                },
                tryIt: {}
            },
            {
                id: 'embedded-documents',
                method: 'GET',
                path: '/v1/connect/portal/kyc',
                summary: '<ConnectDocuments /> Component',
                description: `Allows sellers to upload KYC identity documents and view the status of previously submitted documents. Embed this in your onboarding flow or seller settings page so sellers can complete verification without leaving your platform.

**Required session component:** \`documents: { enabled: true }\`

**Portal endpoints used internally:**
- \`GET /v1/connect/portal/kyc\` — load document list
- \`POST /v1/connect/portal/kyc\` — upload a new document (multipart/form-data)

**Supported document types:**
| Type | Label |
|------|-------|
| \`national_id\` | National ID (NRC) |
| \`passport\` | Passport |
| \`business_registration\` | Business Registration (PACRA) |
| \`tax_clearance\` | Tax Clearance (ZRA) |
| \`proof_of_address\` | Proof of Address |

**Document statuses:** \`PENDING\` → \`APPROVED\` / \`REJECTED\` (reviewed by your KYC team at \`/merchant/connect/kyc\`). Rejected documents show the reviewer's note to the seller.`,
                response: `// GET /v1/connect/portal/kyc
{
  "documents": [
    {
      "id": "doc_01j9x2q3",
      "document_type": "national_id",
      "status": "APPROVED",
      "review_notes": null,
      "created_at": "2026-04-01T12:00:00.000Z"
    },
    {
      "id": "doc_01j9x2q4",
      "document_type": "proof_of_address",
      "status": "REJECTED",
      "review_notes": "Document is more than 3 months old. Please upload a recent utility bill.",
      "created_at": "2026-04-05T09:30:00.000Z"
    }
  ]
}`,
                code: {
                    curl: `# List KYC documents:
curl https://api.flapapay.com/v1/connect/portal/kyc \\
  -H "Authorization: Bearer {portal_token}"

# Upload a document:
curl -X POST https://api.flapapay.com/v1/connect/portal/kyc \\
  -H "Authorization: Bearer {portal_token}" \\
  -F "document_type=national_id" \\
  -F "file=@/path/to/nrc_scan.jpg"`,
                    node: `import { ConnectDocuments } from '@flapapay/react-connect';

// Embed in your seller onboarding or settings page:
function SellerVerification() {
  return (
    <FlapaConnectProvider connectInstance={connectInstance}>
      <ConnectDocuments
        onLoadError={(err) => showBanner('Document upload unavailable', 'error')}
      />
    </FlapaConnectProvider>
  );
}

// Your KYC reviewers then approve/reject at:
// GET   /v1/connect/accounts/:id/kyc          → list docs for a seller
// PATCH /v1/connect/accounts/:id/kyc/:docId   → approve or reject`,
                    python: `# Review and approve a KYC document (marketplace owner server):
r = requests.patch(
    f"https://api.flapapay.com/v1/connect/accounts/{account_id}/kyc/{doc_id}",
    headers={"Authorization": f"Bearer {platform_api_key}"},
    json={"status": "APPROVED"}
)

# Bulk approve all pending docs for an account:
r = requests.post(
    f"https://api.flapapay.com/v1/connect/accounts/{account_id}/kyc/approve-all",
    headers={"Authorization": f"Bearer {platform_api_key}"}
)`
                },
                tryIt: {}
            },
            {
                id: 'embedded-notifications',
                method: 'GET',
                path: '/v1/connect/portal/me',
                summary: '<ConnectNotificationBanner /> Component',
                description: `Renders contextual alert banners based on the seller's account state — no configuration required. The banner automatically surfaces the most important actions a seller needs to take (KYC pending, KYC rejected, balance available, etc.).

**Required session component:** \`notifications: { enabled: true }\`

**Banners are shown for:**
| State | Banner Type | Message |
|-------|-------------|---------|
| \`kyc_status: PENDING\` | Warning | "Your identity documents are under review…" |
| \`kyc_status: REJECTED\` | Error | "Your documents were rejected. Upload new documents…" |
| \`kyc_status: APPROVED + status: ACTIVE\` | Success | "Your account is fully verified…" |
| \`balance.available > 0\` | Info | "You have ZMW X.XX available for payout" |

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| \`maxVisible\` | number | 3 | Maximum banners to show at once |
| \`onLoadError\` | function | — | Error callback |
| \`onLoaderStart\` | function | — | Loader start callback |

Sellers can dismiss individual banners. Banners do not reappear until the underlying state changes.`,
                response: `// ConnectNotificationBanner reads GET /v1/connect/portal/me
// and derives banners from the account state — no dedicated endpoint.

// Example account state that produces two banners:
{
  "kyc_status": "REJECTED",          // → Error banner
  "status": "ACTIVE",
  "balance": {
    "available": 75000,              // → Info banner (ZMW 750.00 available)
    "pending": 0
  }
}`,
                code: {
                    curl: `# No direct API call — ConnectNotificationBanner reads /v1/connect/portal/me`,
                    node: `import { ConnectNotificationBanner } from '@flapapay/react-connect';

// Best practice: place at the very top of your seller dashboard
function SellerDashboard() {
  return (
    <FlapaConnectProvider connectInstance={connectInstance}>
      {/* Always-visible notification area */}
      <ConnectNotificationBanner maxVisible={2} />

      {/* Rest of your seller dashboard */}
      <ConnectBalances />
      <ConnectPayments />
      <ConnectPayouts />
    </FlapaConnectProvider>
  );
}`,
                    python: `# No server-side action needed for notification banners.
# They're derived client-side from the account state.
# To trigger a KYC_REJECTED state for testing, reject a document:

r = requests.patch(
    f"https://api.flapapay.com/v1/connect/accounts/{account_id}/kyc/{doc_id}",
    headers={"Authorization": f"Bearer {platform_api_key}"},
    json={
        "status": "REJECTED",
        "review_notes": "Document is blurry. Please re-upload."
    }
)
# Seller will now see the error banner in ConnectNotificationBanner`
                },
                tryIt: {}
            },
            {
                id: 'embedded-appearance',
                method: 'GET',
                path: '/v1/connect/components',
                summary: 'Appearance & Branding',
                description: `Customise the visual appearance of all embedded components to match your marketplace brand. Appearance settings are applied globally via the \`FlapaConnectProvider\` — you cannot style individual components separately.

**Available variables:**
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| \`colorPrimary\` | CSS color | \`#ea580c\` | Buttons, active states, balance highlight card |
| \`colorBackground\` | CSS color | \`#ffffff\` | Component background |
| \`colorText\` | CSS color | \`#111827\` | Primary text color |
| \`fontFamily\` | CSS font stack | inherited | Font family for all component text |
| \`borderRadius\` | CSS length | \`1rem\` | Corner radius for cards and buttons |

**Runtime updates:** Call \`connectInstance.update({ appearance })\` to change appearance after initialization — useful for dark mode switches.

**Logout:** Call \`connectInstance.logout()\` when the seller logs out of your platform to invalidate the portal session.`,
                response: `// Appearance presets for common brand styles:

// Minimal / corporate:
{ variables: { colorPrimary: '#1d4ed8', borderRadius: '0.5rem' } }

// Rounded / friendly:
{ variables: { colorPrimary: '#16a34a', borderRadius: '1.5rem' } }

// Dark brand:
{ variables: { colorPrimary: '#7c3aed', colorBackground: '#1e1e2e',
               colorText: '#e2e8f0', borderRadius: '1rem' } }`,
                code: {
                    curl: `# No API call — appearance is a client-side configuration`,
                    node: `const connectInstance = loadFlapaConnect({
  fetchClientSecret,
  appearance: {
    variables: {
      colorPrimary:    '#1d4ed8',       // deep blue
      colorBackground: '#ffffff',
      colorText:       '#111827',
      fontFamily:      '"Inter", sans-serif',
      borderRadius:    '0.75rem',
    },
  },
});

// Switch to dark mode at runtime:
function toggleDarkMode(isDark) {
  connectInstance.update({
    appearance: {
      variables: {
        colorPrimary:    isDark ? '#818cf8' : '#4f46e5',
        colorBackground: isDark ? '#1e1e2e' : '#ffffff',
        colorText:       isDark ? '#e2e8f0' : '#111827',
      },
    },
  });
}

// Log out the seller (invalidates the portal session):
function onSellerLogout() {
  connectInstance.logout();
  router.push('/login');
}`,
                    python: `# Appearance is configured on the JavaScript client only.
# No server-side configuration is needed for branding.`
                },
                tryIt: {}
            },
            {
                id: 'embedded-integration-guide',
                method: 'POST',
                path: '/v1/connect/account_sessions',
                summary: 'Full Integration Walkthrough',
                description: `Complete end-to-end integration guide for adding embedded components to your marketplace seller dashboard.

**Prerequisites:**
- A FlapaPay Connect account with test API keys
- At least one connected seller account (\`POST /v1/connect/accounts\`)
- A React frontend and a Node/Python/any backend

---

**Step 1: Create an account session on your server**

Your server must create the session — never from the browser — because it requires your secret API key.

**Step 2: Expose a \`/account-session\` endpoint**

Your frontend calls this endpoint to get a fresh \`client_secret\`.

**Step 3: Initialise FlapaConnect on the client**

One instance per seller session. The \`fetchClientSecret\` function is called on init and again whenever the session expires.

**Step 4: Wrap your seller dashboard with \`FlapaConnectProvider\`**

All child components share the same authenticated session.

**Step 5: Drop in components**

Each component is self-contained — just render it inside the provider.

---

**Testing your integration:**

1. Create a test seller: \`POST /v1/connect/accounts\` with \`x-flapapay-test-mode: true\`
2. Go to \`/merchant/connect/components\` and select the seller in the live demo
3. Verify all 5 components render correctly
4. Test the payout request flow end-to-end
5. Upload a test KYC document and approve/reject from \`/merchant/connect/kyc\``,
                response: `// Complete integration — copy and adapt:

// server.js (Express)
app.post('/account-session', requireAuth, async (req, res) => {
  const { sellerId } = req.user; // from your session/JWT
  const r = await fetch('https://api.flapapay.com/v1/connect/account_sessions', {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      account: sellerId,
      components: {
        balances:      { enabled: true },
        payments:      { enabled: true },
        payouts:       { enabled: true },
        documents:     { enabled: true },
        notifications: { enabled: true },
      },
    }),
  });
  const { client_secret } = await r.json();
  res.json({ client_secret });
});

// seller-dashboard.tsx (React)
import { loadFlapaConnect } from '@flapapay/connect';
import { FlapaConnectProvider, ConnectNotificationBanner,
  ConnectBalances, ConnectPayments, ConnectPayouts,
  ConnectDocuments } from '@flapapay/react-connect';

const instance = loadFlapaConnect({
  fetchClientSecret: async () => {
    const r = await fetch('/account-session', { method: 'POST' });
    return (await r.json()).client_secret;
  },
  appearance: { variables: { colorPrimary: '#your-brand-color' } },
});

export function SellerDashboard() {
  return (
    <FlapaConnectProvider connectInstance={instance}>
      <ConnectNotificationBanner />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ConnectBalances />
        <ConnectPayouts />
      </div>
      <ConnectPayments />
      <ConnectDocuments />
    </FlapaConnectProvider>
  );
}`,
                code: {
                    curl: `# 1. Create a seller account (one time):
curl -X POST https://api.flapapay.com/v1/connect/accounts \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{ "business_name": "My Seller", "email": "seller@example.com" }'

# 2. Create an account session (per-page-load):
curl -X POST https://api.flapapay.com/v1/connect/account_sessions \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "account": "ca_SELLER_ID",
    "components": {
      "balances":      { "enabled": true },
      "payments":      { "enabled": true },
      "payouts":       { "enabled": true },
      "documents":     { "enabled": true },
      "notifications": { "enabled": true }
    }
  }'

# 3. Pass client_secret to your React frontend.
# 4. loadFlapaConnect() exchanges it automatically.
# 5. Wrap with <FlapaConnectProvider> and render components.`,
                    node: `// Complete working example — adapt to your stack

// ── server/routes/flapapay.js ──────────────────────────────
import express from 'express';
const router = express.Router();

router.post('/account-session', requireAuth, async (req, res) => {
  const sellerId = req.user.flapaPayAccountId;

  const response = await fetch(
    'https://api.flapapay.com/v1/connect/account_sessions',
    {
      method: 'POST',
      headers: {
        Authorization: \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: sellerId,
        components: {
          balances:      { enabled: true },
          payments:      { enabled: true },
          payouts:       { enabled: true },
          documents:     { enabled: true },
          notifications: { enabled: true },
        },
      }),
    }
  );

  const { client_secret } = await response.json();
  res.json({ client_secret }); // ← only the secret, never the full session
});

export default router;

// ── src/pages/SellerDashboard.tsx ─────────────────────────
import { useState, useMemo } from 'react';
import { loadFlapaConnect } from '@flapapay/connect';
import {
  FlapaConnectProvider,
  ConnectNotificationBanner,
  ConnectBalances,
  ConnectPayments,
  ConnectPayouts,
  ConnectDocuments,
} from '@flapapay/react-connect';

export function SellerDashboard() {
  // Create ONE instance per seller session
  const connectInstance = useMemo(() => loadFlapaConnect({
    fetchClientSecret: async () => {
      const res = await fetch('/api/account-session', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to get session');
      const { client_secret } = await res.json();
      return client_secret;
    },
    appearance: {
      variables: {
        colorPrimary: '#ea580c',
        borderRadius: '1rem',
        fontFamily:   '"Inter", sans-serif',
      },
    },
  }), []);

  return (
    <FlapaConnectProvider connectInstance={connectInstance}>
      {/* Seller sees alerts at the top */}
      <ConnectNotificationBanner maxVisible={2} />

      {/* Summary row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <ConnectBalances />
        <ConnectPayouts />
      </div>

      {/* Transaction detail */}
      <div className="mt-6">
        <ConnectPayments />
      </div>

      {/* KYC verification */}
      <div className="mt-6">
        <ConnectDocuments />
      </div>
    </FlapaConnectProvider>
  );
}`,
                    python: `# ── Django integration ────────────────────────────────────────
# requirements: requests, djangorestframework

# views.py
import os, requests
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

FLAPAPAY_API = "https://api.flapapay.com"
FLAPAPAY_KEY = os.environ["FLAPAPAY_SECRET_KEY"]

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def account_session(request):
    seller_id = request.user.profile.flapapay_account_id
    if not seller_id:
        return Response({"error": "No FlapaPay account linked"}, status=400)

    r = requests.post(
        f"{FLAPAPAY_API}/v1/connect/account_sessions",
        headers={"Authorization": f"Bearer {FLAPAPAY_KEY}"},
        json={
            "account": seller_id,
            "components": {
                "balances":      {"enabled": True},
                "payments":      {"enabled": True},
                "payouts":       {"enabled": True},
                "documents":     {"enabled": True},
                "notifications": {"enabled": True},
            },
        },
        timeout=10,
    )
    r.raise_for_status()
    return Response({"client_secret": r.json()["client_secret"]})

# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("api/account-session/", views.account_session),
]

# In your React frontend (served by Django or a CDN):
# Call POST /api/account-session/ → get client_secret
# Pass to loadFlapaConnect({ fetchClientSecret }) → render components`
                },
                tryIt: { body: '{\n  "account": "ca_REPLACE_WITH_SELLER_ACCOUNT_ID",\n  "components": {\n    "balances":      { "enabled": true },\n    "payments":      { "enabled": true },\n    "payouts":       { "enabled": true },\n    "documents":     { "enabled": true },\n    "notifications": { "enabled": true }\n  }\n}' }
            },
        ]
    },
    {
        id: 'config',
        label: 'Configuration',
        icon: Settings,
        color: 'text-gray-600 bg-gray-100',
        endpoints: [
            {
                id: 'config-get',
                method: 'GET',
                path: '/v1/connect/config',
                summary: 'Get platform configuration',
                description: 'Retrieve the platform\'s fee structure and payout settings. Fee changes take effect on new transactions only — existing transactions are unaffected.',
                response: `{
  "platform_fee_percent": 2.5,
  "fee_collection_method": "per_transaction",
  "settlement_delay_days": 1,
  "min_payout_threshold": 50,
  "auto_payout_enabled": true,
  "auto_payout_schedule": "daily",
  "currency": "ZMW"
}`,
                code: {
                    curl: `curl https://api.flapapay.com/v1/connect/config \\
  -H "Authorization: Bearer sk_test_flp_xxxxxxxxxxxx"`,
                    node: `const cfg = await connect.config.get();
console.log(\`Platform fee: \${cfg.platform_fee_percent}%\`);`,
                    python: `r = requests.get(
    "http://localhost:3005/v1/connect/config",
    headers={"Authorization": "Bearer sk_test_flp_xxxx"}
)`
                },
                tryIt: {}
            }
        ]
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CopyButton({ text, label = '' }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-lg text-[10px] font-bold transition-all"
        >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Copied' : (label || 'Copy')}
        </button>
    );
}

type Lang = 'curl' | 'node' | 'python';
const LANG_LABELS: Record<Lang, string> = { curl: 'cURL', node: 'Node.js', python: 'Python' };

function CodeBlock({ code, defaultLang = 'curl' }: { code: CodeExample; defaultLang?: Lang }) {
    const [lang, setLang] = useState<Lang>(defaultLang);
    const snippet = code[lang];
    return (
        <div className="rounded-2xl overflow-hidden bg-gray-900 text-sm font-mono">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800 border-b border-gray-700">
                <div className="flex gap-1">
                    {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
                        <button key={l} onClick={() => setLang(l)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${lang === l ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                            {LANG_LABELS[l]}
                        </button>
                    ))}
                </div>
                <CopyButton text={snippet} />
            </div>
            <pre className="p-4 overflow-x-auto text-gray-200 leading-relaxed whitespace-pre-wrap">{snippet}</pre>
        </div>
    );
}

function ResponseBlock({ json }: { json: string }) {
    return (
        <div className="rounded-2xl overflow-hidden bg-gray-950 text-sm font-mono">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800/60 border-b border-gray-700/50">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Response</span>
                <CopyButton text={json} />
            </div>
            <pre className="p-4 overflow-x-auto text-emerald-400 leading-relaxed text-xs whitespace-pre">{json}</pre>
        </div>
    );
}

function ParamsTable({ params, title }: { params: Param[]; title: string }) {
    if (!params.length) return null;
    return (
        <div className="mb-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{title}</h4>
            <div className="rounded-2xl overflow-hidden border border-gray-100">
                {params.map((p, i) => (
                    <div key={p.name} className={`grid grid-cols-[160px_1fr] gap-4 px-4 py-3 text-sm ${i < params.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <code className="text-orange-600 font-bold text-[13px]">{p.name}</code>
                                {p.required && <span className="text-[9px] font-black text-red-500 uppercase tracking-wide">required</span>}
                            </div>
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">{p.type}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-[13px]">{p.description}</p>
                            {p.example && <code className="text-[11px] text-gray-400 mt-1 block">e.g. {p.example}</code>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Try It Panel ─────────────────────────────────────────────────────────────

function TryItPanel({ endpoint, apiKey }: { endpoint: Endpoint; apiKey: string }) {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3005';
    const [body, setBody] = useState(endpoint.tryIt?.body ?? '');
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const needsId = endpoint.path.includes(':id') || endpoint.path.includes(':docId');

    async function run() {
        if (!apiKey) { setResult('{"error": "Enter your test API key above to try this endpoint"}'); return; }
        setLoading(true);
        setResult(null);
        try {
            const path = endpoint.path.replace(':id', 'REPLACE_ID').replace(':docId', 'REPLACE_ID');
            const url = `${baseUrl}${path}`;
            const opts: RequestInit = {
                method: endpoint.method,
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'x-flapapay-test-mode': 'true',
                },
            };
            if (['POST', 'PATCH', 'PUT'].includes(endpoint.method) && body) {
                opts.body = body;
            }
            const res = await fetch(url, opts);
            const data = await res.json();
            setResult(JSON.stringify(data, null, 2));
        } catch (err: any) {
            setResult(`{"error": "${err.message}"}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mt-4 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-100 border-b border-gray-200 flex items-center gap-2">
                <Terminal size={13} className="text-orange-500" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Try It</span>
                {needsId && <span className="text-[10px] text-amber-500 font-medium">Replace :id with a real ID</span>}
            </div>
            {['POST', 'PATCH', 'PUT'].includes(endpoint.method) && (
                <div className="p-3 border-b border-gray-200">
                    <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        rows={5}
                        className="w-full text-xs font-mono bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-y"
                        placeholder="Request body (JSON)…"
                    />
                </div>
            )}
            <div className="p-3 flex gap-2">
                <button
                    onClick={run}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 disabled:opacity-50 shadow-lg shadow-orange-500/20 transition-all"
                >
                    {loading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                    Send Request
                </button>
            </div>
            {result && (
                <div className="border-t border-gray-200 bg-gray-900 rounded-b-2xl">
                    <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre">{result}</pre>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConnectAPIReferencePage() {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('authentication');
    const [activeEndpoint, setActiveEndpoint] = useState('auth-overview');
    const [apiKey, setApiKey] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const contentRef = useRef<HTMLDivElement>(null);

    const currentSection = SECTIONS.find(s => s.id === activeSection)!;
    const currentEndpoint = currentSection?.endpoints.find(e => e.id === activeEndpoint) ?? currentSection?.endpoints[0];

    function selectEndpoint(sectionId: string, endpointId: string) {
        setActiveSection(sectionId);
        setActiveEndpoint(endpointId);
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return (
        <div className="flex h-screen bg-[#F9FAFB] font-sans overflow-hidden">
            {/* Left sidebar */}
            <aside className={`${sidebarOpen ? 'w-72' : 'w-16'} flex-shrink-0 bg-white border-r border-gray-100 shadow-sm flex flex-col transition-all duration-300 overflow-hidden`}>
                {/* Header */}
                <div className="px-4 pt-5 pb-4 border-b border-gray-100 flex items-center gap-3">
                    <button
                        onClick={() => navigate('/merchant/connect')}
                        className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25"
                    >
                        <Code size={14} className="text-white" />
                    </button>
                    {sidebarOpen && (
                        <div className="min-w-0">
                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">FlapaPay</p>
                            <p className="text-sm font-extrabold text-gray-900 leading-tight">Connect API</p>
                        </div>
                    )}
                    <button onClick={() => setSidebarOpen(o => !o)} className="ml-auto text-gray-300 hover:text-gray-500 flex-shrink-0">
                        {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                    </button>
                </div>

                {/* API Key input */}
                {sidebarOpen && (
                    <div className="px-4 py-3 border-b border-gray-100">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                            <Key size={9} /> Test API Key
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            placeholder="sk_test_flp_..."
                            className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 font-mono"
                        />
                    </div>
                )}

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-3">
                    {SECTIONS.map(section => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.id;
                        return (
                            <div key={section.id} className="mb-1">
                                <button
                                    onClick={() => selectEndpoint(section.id, section.endpoints[0].id)}
                                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-all ${isActive ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                                >
                                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? section.color : 'bg-gray-100 text-gray-400'}`}>
                                        <Icon size={13} />
                                    </div>
                                    {sidebarOpen && (
                                        <span className={`text-sm font-bold truncate ${isActive ? 'text-orange-700' : ''}`}>{section.label}</span>
                                    )}
                                </button>
                                {isActive && sidebarOpen && (
                                    <div className="ml-11 mt-0.5 mb-1 space-y-0.5">
                                        {section.endpoints.map(ep => (
                                            <button
                                                key={ep.id}
                                                onClick={() => selectEndpoint(section.id, ep.id)}
                                                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${activeEndpoint === ep.id ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${METHOD_COLOR[ep.method]}`}>{ep.method}</span>
                                                <span className="truncate">{ep.summary}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* SDK link */}
                {sidebarOpen && (
                    <div className="px-4 py-3 border-t border-gray-100">
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-3 border border-orange-100">
                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">SDK</p>
                            <code className="text-[11px] text-gray-700 font-mono">npm i @flapapay/connect</code>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main content */}
            <div ref={contentRef} className="flex-1 overflow-y-auto">
                {currentEndpoint && (
                    <div className="max-w-5xl mx-auto px-8 py-8">
                        {/* Section breadcrumb */}
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">
                            <Globe size={10} />
                            <span>Connect API</span>
                            <ChevronRight size={10} />
                            <span>{currentSection.label}</span>
                        </div>

                        {/* Endpoint header */}
                        <div className="flex items-start gap-4 mb-6">
                            <span className={`px-3 py-1.5 rounded-xl text-sm font-black border mt-1 flex-shrink-0 ${METHOD_COLOR[currentEndpoint.method]}`}>
                                {currentEndpoint.method}
                            </span>
                            <div>
                                <code className="text-2xl font-extrabold text-gray-900 font-mono">{currentEndpoint.path}</code>
                                <p className="text-gray-500 mt-1.5">{currentEndpoint.summary}</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="prose prose-sm max-w-none mb-8">
                            {currentEndpoint.description.split('\n\n').map((para, i) => (
                                <p key={i} className="text-gray-600 leading-relaxed mb-3 text-sm"
                                    dangerouslySetInnerHTML={{ __html: para.replace(/`([^`]+)`/g, '<code class="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-lg text-xs font-mono font-bold">$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') }}
                                />
                            ))}
                        </div>

                        {/* Grid: params + code */}
                        <div className="grid grid-cols-1 xl:grid-cols-[1fr_480px] gap-8">
                            {/* Left: params */}
                            <div>
                                {currentEndpoint.params && <ParamsTable params={currentEndpoint.params} title="Query Parameters" />}
                                {currentEndpoint.bodyParams && <ParamsTable params={currentEndpoint.bodyParams} title="Body Parameters" />}

                                {/* Try it */}
                                {currentEndpoint.tryIt !== undefined && (
                                    <TryItPanel endpoint={currentEndpoint} apiKey={apiKey} />
                                )}
                            </div>

                            {/* Right: code + response */}
                            <div className="space-y-4">
                                <CodeBlock code={currentEndpoint.code} />
                                {currentEndpoint.response && <ResponseBlock json={currentEndpoint.response} />}
                            </div>
                        </div>

                        {/* Section endpoints list */}
                        {currentSection.endpoints.length > 1 && (
                            <div className="mt-12 border-t border-gray-100 pt-8">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">More in {currentSection.label}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {currentSection.endpoints.filter(e => e.id !== currentEndpoint.id).map(ep => (
                                        <button
                                            key={ep.id}
                                            onClick={() => selectEndpoint(currentSection.id, ep.id)}
                                            className="text-left p-4 bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${METHOD_COLOR[ep.method]}`}>{ep.method}</span>
                                                <code className="text-[11px] text-gray-500 font-mono group-hover:text-orange-600 transition-colors">{ep.path}</code>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-700">{ep.summary}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
