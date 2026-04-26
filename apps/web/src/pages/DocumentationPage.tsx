import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import {
    Book,
    Code,
    FileText,
    Zap,
    Shield,
    CreditCard,
    Users,
    Settings,
    ChevronRight,
    Search,
    ExternalLink,
    Copy,
    Check,
    Terminal,
    Key,
    Webhook,
    RefreshCw,
    Database,
    Lock,
    Globe,
    Smartphone,
    Server
} from 'lucide-react';

export const DocumentationPage: React.FC = () => {
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSection, setActiveSection] = useState('introduction');
    const [activeLangs, setActiveLangs] = useState<Record<string, string>>({});
    const [expandedSidebarSections, setExpandedSidebarSections] = useState<Set<string>>(new Set(['introduction']));

    const getLang = (id: string) => activeLangs[id] || 'node';
    const setLang = (id: string, lang: string) => setActiveLangs(prev => ({ ...prev, [id]: lang }));

    const methodBadge = (method: string) => {
        const map: Record<string, string> = {
            POST:   'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
            GET:    'bg-blue-500/15 text-blue-400 border border-blue-500/30',
            PATCH:  'bg-amber-500/15 text-amber-400 border border-amber-500/30',
            DELETE: 'bg-red-500/15 text-red-400 border border-red-500/30',
            PUT:    'bg-purple-500/15 text-purple-400 border border-purple-500/30',
        };
        return map[method] || 'bg-gray-500/15 text-gray-400 border border-gray-500/30';
    };

    // Playground State
    const [pgApiKey, setPgApiKey] = useState('');
    const [pgPriceId, setPgPriceId] = useState('');
    const [pgEmail, setPgEmail] = useState('customer@example.com');
    const [pgResult, setPgResult] = useState<any>(null);
    const [pgLoading, setPgLoading] = useState(false);
    const [availablePrices, setAvailablePrices] = useState<any[]>([]);
    const [showPriceSuggestions, setShowPriceSuggestions] = useState(false);
    const [testApiKey, setTestApiKey] = useState('flp_test_sk_a1109d78c04c1238a8194aed5a28f7ff6c189dd1');

    useEffect(() => {
        fetchAvailablePrices().then(setAvailablePrices);
    }, []);

    const runPlayground = async () => {
        if (!pgApiKey || !pgPriceId) {
            setPgResult({ error: 'API Key and Price ID are required' });
            return;
        }
        setPgLoading(true);
        setPgResult(null);
        try {
            const response = await fetch('http://localhost:3005/v1/checkout/sessions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${pgApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mode: 'subscription',
                    customer_email: pgEmail,
                    line_items: [{ price: pgPriceId, quantity: 1 }],
                    success_url: 'http://localhost:5173/success',
                    cancel_url: 'http://localhost:5173/cancel'
                })
            });
            const data = await response.json();
            
            // Add helpful context to error messages
            if (data.error) {
                if (response.status === 401) {
                    data.error = 'Invalid API Key. Click FILL to use the test key, or enter a valid key from your dashboard.';
                } else if (data.error.includes('Invalid Price ID')) {
                    data.error = `Invalid Price ID "${pgPriceId}". Select a valid price from the dropdown, or create a product first.`;
                } else if (data.error.includes('Line items')) {
                    data.error = 'Line items (price IDs) are required for subscription mode.';
                }
            }
            
            setPgResult(data);
        } catch (err: any) {
            setPgResult({ error: 'Failed to connect to server. Ensure unified-server is running on port 3005.' });
        } finally {
            setPgLoading(false);
        }
    };

    const fetchAvailablePrices = async () => {
        try {
            const response = await fetch('http://localhost:3005/v1/prices', {
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            // Handle different response formats
            if (data && Array.isArray(data)) return data;
            if (data && Array.isArray(data.data)) return data.data;
            if (data && Array.isArray(data.prices)) return data.prices;
            return [];
        } catch (err) {
            console.error('Failed to fetch prices:', err);
            return [];
        }
    };

    const copyCode = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const mainSections = [
        {
            id: 'introduction',
            title: 'Introduction',
            icon: <Book className="w-5 h-5" />,
            items: ['Overview', 'What is FlapaPay', 'Quick Start']
        },
        {
            id: 'authentication',
            title: 'Authentication',
            icon: <Lock className="w-5 h-5" />,
            items: ['API Keys', 'OAuth 2.0', 'JWT Tokens']
        },
        {
            id: 'payments',
            title: 'Payments',
            icon: <CreditCard className="w-5 h-5" />,
            items: ['Accept Payments', 'Payment Methods', 'Refunds', 'Disputes']
        },
        {
            id: 'payouts',
            title: 'Payouts',
            icon: <Zap className="w-5 h-5" />,
            items: ['Send Money', 'Bulk Payouts', 'Bank Transfers']
        },
        {
            id: 'virtual-cards',
            title: 'Virtual Cards',
            icon: <CreditCard className="w-5 h-5" />,
            items: ['Create Cards', 'Card Controls', 'Transactions']
        },
        {
            id: 'invoices',
            title: 'Invoices',
            icon: <FileText className="w-5 h-5" />,
            items: ['Create Invoice', 'Send Invoice', 'Track Payments']
        },
        {
            id: 'subscriptions',
            title: 'Subscription Billing',
            icon: <RefreshCw className="w-5 h-5" />,
            items: ['Products', 'Pricing', 'Customers', 'Subscriptions', 'Webhooks']
        },
        {
            id: 'connect',
            title: 'Connect (Marketplace)',
            icon: <Globe className="w-5 h-5" />,
            items: [
                'Overview', 'Authentication', 'Connected Accounts', 'Account Sessions',
                'Embedded Components', 'KYC & Verification', 'Payout Methods',
                'Payouts & Settlements', 'Charges & Splits', 'Disputes',
                'Risk Management', 'Webhooks', 'Invites & Onboarding',
                'Analytics & Ledger', 'Seller Portal', 'Fee Configuration'
            ]
        },
        {
            id: 'webhooks',
            title: 'Webhooks',
            icon: <Webhook className="w-5 h-5" />,
            items: ['Setup', 'Event Types', 'Security']
        },
        {
            id: 'escrow',
            title: 'Escrow Service',
            icon: <Shield className="w-5 h-5" />,
            items: ['Overview', 'Create Escrow', 'Funding', 'Release & Disputes']
        },
        {
            id: 'sdks',
            title: 'SDKs & Libraries',
            icon: <Code className="w-5 h-5" />,
            items: ['Node.js', 'Python', 'PHP', 'Mobile']
        },
    ];

    const codeExamples = {
        init: `// Initialize FlapaPay SDK
import { FlapaPay } from '@flapapay/sdk';

const client = new FlapaPay({
  apiKey: 'fpk_live_xxxxxxxxxxxxx',
  environment: 'production' // or 'sandbox'
});`,

        createPayment: `// Create a payment intent
const payment = await client.payments.create({
  amount: 10000, // Amount in smallest currency unit
  currency: 'USD',
  customer: {
    email: 'customer@example.com',
    name: 'John Doe'
  },
  payment_method: 'card',
  description: 'Order #12345'
});

console.log('Payment URL:', payment.url);`,

        webhook: `// Verify webhook signature
import { verifyWebhook } from '@flapapay/webhooks';

app.post('/webhook', (req, res) => {
  const signature = req.headers['flapapay-signature'];
  const payload = req.body;
  
  const event = verifyWebhook(payload, signature, process.env.WEBHOOK_SECRET);
  
  switch (event.type) {
    case 'payment.completed':
      // Handle successful payment
      break;
    case 'payment.failed':
      // Handle failed payment
      break;
  }
  
  res.json({ received: true });
});`
    };

    const checkoutEndpoints = [
        {
            id: 'checkout-create',
            method: 'POST',
            path: '/v1/checkout/sessions',
            title: 'Create Checkout Session',
            badge: 'Core',
            description: 'Creates a Checkout Session — the primary way to accept payments. A session is a one-time URL you redirect your customer to. FlapaPay handles the entire payment UX. Supports one-time payments, subscriptions, and marketplace splits.',
            params: [
                { name: 'mode', type: 'string', required: true, desc: '"payment" (one-time), "subscription" (recurring), or "setup" (save payment method only)' },
                { name: 'line_items', type: 'array', required: true, desc: 'Items being purchased. Each item has: { price: "price_xxx", quantity: 1 }' },
                { name: 'customer_email', type: 'string', required: false, desc: 'Pre-fills the customer email on the checkout page' },
                { name: 'customer', type: 'string', required: false, desc: 'Existing customer ID to attach the session to' },
                { name: 'currency', type: 'string', required: false, desc: 'ISO 4217 currency code. Defaults to your account currency (ZMW)' },
                { name: 'success_url', type: 'string', required: true, desc: 'URL to redirect to after successful payment. Append ?session_id={CHECKOUT_SESSION_ID} to retrieve session details' },
                { name: 'cancel_url', type: 'string', required: true, desc: 'URL to redirect to if the customer abandons checkout' },
                { name: 'transfer_data', type: 'object', required: false, desc: 'Marketplace split: { destination: "acct_xxx", amount: 9500 }' },
                { name: 'application_fee_amount', type: 'number', required: false, desc: 'Platform fee in smallest currency unit (retained by your account)' },
                { name: 'payment_method_types', type: 'array', required: false, desc: 'Allowed payment methods: ["card", "mobile_money", "bank_transfer"]. Default: all enabled' },
                { name: 'metadata', type: 'object', required: false, desc: 'Up to 50 key-value pairs attached to the session. Accessible on the resulting payment object' },
                { name: 'expires_at', type: 'number', required: false, desc: 'Unix timestamp. Session auto-expires between 30 minutes and 24 hours from creation' },
                { name: 'allow_promotion_codes', type: 'boolean', required: false, desc: 'Show a promotion code field on the checkout page' },
                { name: 'billing_address_collection', type: 'string', required: false, desc: '"auto" (default) or "required" — collect billing address' },
                { name: 'phone_number_collection', type: 'object', required: false, desc: '{ enabled: true } — collect customer phone number' },
            ],
            response: `{
  "id": "cs_live_a1B2c3D4e5F6",
  "object": "checkout.session",
  "url": "https://checkout.flapapay.com/pay/cs_live_a1B2c3D4e5F6",
  "status": "open",
  "mode": "payment",
  "currency": "ZMW",
  "amount_total": 100000,
  "amount_subtotal": 100000,
  "customer_email": "buyer@example.com",
  "payment_status": "unpaid",
  "payment_intent": null,
  "success_url": "https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}",
  "cancel_url": "https://yourapp.com/cancel",
  "expires_at": 1716003600,
  "line_items": {
    "object": "list",
    "data": [{ "id": "li_xxx", "price": { "id": "price_xxx", "unit_amount": 100000, "currency": "zmw" }, "quantity": 1 }]
  },
  "metadata": {},
  "created": 1716000000
}`,
            snippets: {
                node: `const BASE = 'http://localhost:3005';

// One-time payment
const res = await fetch(\`\${BASE}/v1/checkout/sessions\`, {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mode: 'payment',
    line_items: [{ price: 'price_xxx', quantity: 1 }],
    customer_email: 'buyer@example.com',
    success_url: 'https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://yourapp.com/cancel',
    metadata: { order_id: 'ORD-1234' }
  }),
});

const session = await res.json();
// Redirect your customer:
// window.location.href = session.url;
console.log('Checkout URL:', session.url);`,
                python: `import requests, os

BASE = 'http://localhost:3005'
KEY = os.environ['FLAPAPAY_SECRET_KEY']

session = requests.post(f'{BASE}/v1/checkout/sessions',
  json={
    'mode': 'payment',
    'line_items': [{'price': 'price_xxx', 'quantity': 1}],
    'customer_email': 'buyer@example.com',
    'success_url': 'https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}',
    'cancel_url': 'https://yourapp.com/cancel',
    'metadata': {'order_id': 'ORD-1234'},
  },
  headers={'Authorization': f'Bearer {KEY}'}
).json()

print('Checkout URL:', session['url'])
# Redirect your user to session['url']`,
                curl: `curl -X POST http://localhost:3005/v1/checkout/sessions \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mode": "payment",
    "line_items": [{"price": "price_xxx", "quantity": 1}],
    "customer_email": "buyer@example.com",
    "success_url": "https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}",
    "cancel_url": "https://yourapp.com/cancel",
    "metadata": {"order_id": "ORD-1234"}
  }'`
            }
        },
        {
            id: 'checkout-subscription',
            method: 'POST',
            path: '/v1/checkout/sessions',
            title: 'Subscription Checkout',
            badge: 'Recurring',
            description: 'Create a checkout session in subscription mode. When the customer completes checkout a Subscription and Customer object are automatically created. The resulting subscription renews on the interval defined in the Price (daily, weekly, monthly, yearly).',
            params: [
                { name: 'mode', type: 'string', required: true, desc: 'Must be "subscription"' },
                { name: 'line_items', type: 'array', required: true, desc: 'Recurring price items: [{ price: "price_monthly_xxx", quantity: 1 }]' },
                { name: 'customer_email', type: 'string', required: false, desc: 'Pre-fill email. A Customer is created automatically if none provided' },
                { name: 'subscription_data', type: 'object', required: false, desc: '{ trial_period_days: 14, metadata: {} } — attach a free trial or metadata to the subscription' },
                { name: 'success_url', type: 'string', required: true, desc: 'Redirect after checkout. Append ?session_id={CHECKOUT_SESSION_ID}' },
                { name: 'cancel_url', type: 'string', required: true, desc: 'Redirect if customer cancels checkout' },
            ],
            response: `{
  "id": "cs_live_sub_xxx",
  "mode": "subscription",
  "status": "open",
  "subscription": null,
  "customer": null,
  "payment_status": "unpaid",
  "url": "https://checkout.flapapay.com/pay/cs_live_sub_xxx"
}

// After checkout completes, retrieve the session:
// GET /v1/checkout/sessions/cs_live_sub_xxx
// → { "subscription": "sub_xxx", "customer": "cus_xxx", "payment_status": "paid" }`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/checkout/sessions', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mode: 'subscription',
    line_items: [{ price: 'price_monthly_xxx', quantity: 1 }],
    customer_email: 'subscriber@example.com',
    subscription_data: { trial_period_days: 14 },
    success_url: 'https://yourapp.com/subscribed?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://yourapp.com/pricing',
  }),
});
const session = await res.json();
// Redirect → session.url`,
                python: `import requests, os
session = requests.post('http://localhost:3005/v1/checkout/sessions',
  json={
    'mode': 'subscription',
    'line_items': [{'price': 'price_monthly_xxx', 'quantity': 1}],
    'customer_email': 'subscriber@example.com',
    'subscription_data': {'trial_period_days': 14},
    'success_url': 'https://yourapp.com/subscribed',
    'cancel_url': 'https://yourapp.com/pricing',
  },
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl -X POST http://localhost:3005/v1/checkout/sessions \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY" \\
  -d '{
    "mode": "subscription",
    "line_items": [{"price": "price_monthly_xxx", "quantity": 1}],
    "customer_email": "subscriber@example.com",
    "subscription_data": {"trial_period_days": 14},
    "success_url": "https://yourapp.com/subscribed",
    "cancel_url": "https://yourapp.com/pricing"
  }'`
            }
        },
        {
            id: 'checkout-retrieve',
            method: 'GET',
            path: '/v1/checkout/sessions/:id',
            title: 'Retrieve Checkout Session',
            badge: null,
            description: 'Retrieve the details of an existing checkout session. Call this from your success_url handler to confirm payment status and extract the customer, subscription, or payment_intent IDs.',
            params: [
                { name: 'id (path)', type: 'string', required: true, desc: 'The checkout session ID (cs_live_...)' },
            ],
            response: `{
  "id": "cs_live_a1B2c3D4e5F6",
  "status": "complete",
  "payment_status": "paid",
  "mode": "payment",
  "customer": "cus_xxx",
  "customer_email": "buyer@example.com",
  "payment_intent": "pi_xxx",
  "subscription": null,
  "amount_total": 100000,
  "currency": "ZMW",
  "metadata": { "order_id": "ORD-1234" }
}`,
            snippets: {
                node: `// In your success_url handler:
const params = new URLSearchParams(window.location.search);
const sessionId = params.get('session_id');

const res = await fetch(\`http://localhost:3005/v1/checkout/sessions/\${sessionId}\`, {
  headers: { 'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\` }
});
const session = await res.json();

if (session.payment_status === 'paid') {
  const orderId = session.metadata.order_id;
  // ✅ Fulfil the order
}`,
                python: `import requests, os
from flask import request as flask_request

session_id = flask_request.args.get('session_id')
session = requests.get(
  f'http://localhost:3005/v1/checkout/sessions/{session_id}',
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()

if session['payment_status'] == 'paid':
    order_id = session['metadata']['order_id']
    fulfil_order(order_id)`,
                curl: `curl http://localhost:3005/v1/checkout/sessions/cs_live_a1B2c3D4e5F6 \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY"`
            }
        },
        {
            id: 'checkout-list',
            method: 'GET',
            path: '/v1/checkout/sessions',
            title: 'List Checkout Sessions',
            badge: null,
            description: 'Returns a paginated list of checkout sessions. Filter by status, customer, or date range. Useful for reconciliation and reporting.',
            params: [
                { name: 'customer', type: 'string', required: false, desc: 'Filter sessions for a specific customer ID' },
                { name: 'status', type: 'string', required: false, desc: '"open", "complete", or "expired"' },
                { name: 'limit', type: 'number', required: false, desc: 'Number of sessions to return (1–100, default 10)' },
                { name: 'starting_after', type: 'string', required: false, desc: 'Cursor for forward pagination — last ID from previous page' },
                { name: 'ending_before', type: 'string', required: false, desc: 'Cursor for backward pagination' },
                { name: 'created[gte]', type: 'number', required: false, desc: 'Unix timestamp — sessions created at or after this time' },
                { name: 'created[lte]', type: 'number', required: false, desc: 'Unix timestamp — sessions created at or before this time' },
            ],
            response: `{
  "object": "list",
  "data": [
    { "id": "cs_live_xxx", "status": "complete", "amount_total": 100000, "payment_status": "paid", "created": 1716000000 },
    { "id": "cs_live_yyy", "status": "open",     "amount_total":  50000, "payment_status": "unpaid", "created": 1715996400 }
  ],
  "has_more": true,
  "url": "/v1/checkout/sessions"
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/checkout/sessions?status=complete&limit=25', {
  headers: { 'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\` }
});
const { data, has_more } = await res.json();
console.log(\`Fetched \${data.length} sessions, has_more: \${has_more}\`);`,
                python: `import requests, os
result = requests.get('http://localhost:3005/v1/checkout/sessions',
  params={'status': 'complete', 'limit': 25},
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()
for session in result['data']:
    print(session['id'], session['amount_total'])`,
                curl: `curl "http://localhost:3005/v1/checkout/sessions?status=complete&limit=25" \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY"`
            }
        },
        {
            id: 'checkout-expire',
            method: 'POST',
            path: '/v1/checkout/sessions/:id/expire',
            title: 'Expire Checkout Session',
            badge: null,
            description: 'Manually expire an open checkout session before its natural expiry. The customer will see an expiration message if they try to complete checkout after this point.',
            params: [
                { name: 'id (path)', type: 'string', required: true, desc: 'Checkout session ID to expire' },
            ],
            response: `{ "id": "cs_live_a1B2c3D4e5F6", "status": "expired", "expired_at": 1716001234 }`,
            snippets: {
                node: `await fetch('http://localhost:3005/v1/checkout/sessions/cs_live_xxx/expire', {
  method: 'POST',
  headers: { 'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\` }
});`,
                python: `requests.post(
  'http://localhost:3005/v1/checkout/sessions/cs_live_xxx/expire',
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
)`,
                curl: `curl -X POST http://localhost:3005/v1/checkout/sessions/cs_live_xxx/expire \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY"`
            }
        },
        {
            id: 'checkout-marketplace',
            method: 'POST',
            path: '/v1/checkout/sessions',
            title: 'Marketplace / Split Payment',
            badge: 'Connect',
            description: 'Route the majority of funds to a connected sub-merchant and retain a platform fee. Use transfer_data.destination with the sub-merchant account ID and application_fee_amount for your cut. The buyer pays a single total amount — the split happens server-side.',
            params: [
                { name: 'transfer_data.destination', type: 'string', required: true, desc: 'Connected account ID (acct_xxx) that receives the funds' },
                { name: 'transfer_data.amount', type: 'number', required: false, desc: 'Amount to transfer (defaults to total minus application_fee_amount)' },
                { name: 'application_fee_amount', type: 'number', required: false, desc: 'Platform fee retained by your account, in smallest currency unit' },
                { name: 'on_behalf_of', type: 'string', required: false, desc: 'Run the payment on behalf of this connected account (useful for local card acceptance)' },
            ],
            response: `{
  "id": "cs_live_mkt_xxx",
  "url": "https://checkout.flapapay.com/pay/cs_live_mkt_xxx",
  "transfer_data": { "destination": "acct_abc123", "amount": 95000 },
  "application_fee_amount": 5000,
  "status": "open"
}`,
            snippets: {
                node: `// Customer pays ZK 1,000. Sub-merchant gets ZK 950. You keep ZK 50 (5% fee).
const res = await fetch('http://localhost:3005/v1/checkout/sessions', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mode: 'payment',
    line_items: [{ price: 'price_product_xxx', quantity: 1 }],
    transfer_data: { destination: 'acct_abc123' },
    application_fee_amount: 5000,   // ZK 50 in ngwe (smallest unit)
    success_url: 'https://yourapp.com/order/success',
    cancel_url: 'https://yourapp.com/cart',
  }),
});
const session = await res.json();`,
                python: `session = requests.post('http://localhost:3005/v1/checkout/sessions',
  json={
    'mode': 'payment',
    'line_items': [{'price': 'price_product_xxx', 'quantity': 1}],
    'transfer_data': {'destination': 'acct_abc123'},
    'application_fee_amount': 5000,
    'success_url': 'https://yourapp.com/order/success',
    'cancel_url': 'https://yourapp.com/cart',
  },
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl -X POST http://localhost:3005/v1/checkout/sessions \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY" \\
  -d '{
    "mode": "payment",
    "line_items": [{"price": "price_product_xxx", "quantity": 1}],
    "transfer_data": {"destination": "acct_abc123"},
    "application_fee_amount": 5000,
    "success_url": "https://yourapp.com/order/success",
    "cancel_url": "https://yourapp.com/cart"
  }'`
            }
        },
        {
            id: 'checkout-products',
            method: 'POST',
            path: '/v1/products',
            title: 'Create Product',
            badge: 'Billing',
            description: 'Products represent goods or services you sell. Create a product first, then create Prices on top of it. Products can be archived (not deleted) to hide them from new purchases.',
            params: [
                { name: 'name', type: 'string', required: true, desc: 'Display name of the product (shown on invoices and checkout)' },
                { name: 'description', type: 'string', required: false, desc: 'Optional description shown to customers' },
                { name: 'images', type: 'array', required: false, desc: 'Array of image URLs (up to 8). First image shown on checkout' },
                { name: 'metadata', type: 'object', required: false, desc: 'Up to 50 key-value pairs for your own lookups' },
                { name: 'active', type: 'boolean', required: false, desc: 'Whether the product can be purchased. Default true' },
            ],
            response: `{
  "id": "prod_xxx",
  "object": "product",
  "name": "Pro Plan",
  "description": "Everything in Starter plus advanced analytics",
  "active": true,
  "images": ["https://yourcdn.com/pro-plan.png"],
  "metadata": { "tier": "pro" },
  "created": 1716000000
}`,
            snippets: {
                node: `const product = await fetch('http://localhost:3005/v1/products', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Pro Plan',
    description: 'Everything in Starter plus advanced analytics',
    metadata: { tier: 'pro' },
  }),
}).then(r => r.json());
console.log('Product ID:', product.id);`,
                python: `product = requests.post('http://localhost:3005/v1/products',
  json={'name': 'Pro Plan', 'description': 'Everything in Starter plus advanced analytics'},
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl -X POST http://localhost:3005/v1/products \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY" \\
  -d '{"name": "Pro Plan", "description": "Everything in Starter plus advanced analytics"}'`
            }
        },
        {
            id: 'checkout-prices',
            method: 'POST',
            path: '/v1/prices',
            title: 'Create Price',
            badge: 'Billing',
            description: 'Prices define how much and how often a product costs. A product can have multiple prices (e.g., monthly vs yearly). Use the price ID in checkout line_items. For recurring prices set recurring.interval.',
            params: [
                { name: 'product', type: 'string', required: true, desc: 'Product ID this price belongs to (prod_xxx)' },
                { name: 'unit_amount', type: 'number', required: true, desc: 'Price in smallest currency unit (e.g., 10000 = ZK 100.00)' },
                { name: 'currency', type: 'string', required: true, desc: 'ISO 4217 code — e.g., "zmw", "usd"' },
                { name: 'recurring', type: 'object', required: false, desc: '{ interval: "month" | "week" | "year" | "day", interval_count: 1 }. Omit for one-time prices' },
                { name: 'nickname', type: 'string', required: false, desc: 'Internal label (e.g., "Monthly ZMW" or "Annual Discount")' },
                { name: 'metadata', type: 'object', required: false, desc: 'Key-value pairs' },
            ],
            response: `{
  "id": "price_monthly_zmw_xxx",
  "object": "price",
  "product": "prod_xxx",
  "unit_amount": 10000,
  "currency": "zmw",
  "recurring": { "interval": "month", "interval_count": 1 },
  "nickname": "Monthly ZMW",
  "active": true,
  "created": 1716000000
}`,
            snippets: {
                node: `// Monthly recurring price at ZK 100/month
const price = await fetch('http://localhost:3005/v1/prices', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    product: 'prod_xxx',
    unit_amount: 10000,      // ZK 100.00
    currency: 'zmw',
    recurring: { interval: 'month', interval_count: 1 },
    nickname: 'Monthly ZMW',
  }),
}).then(r => r.json());

// Now use price.id in checkout:
// line_items: [{ price: price.id, quantity: 1 }]`,
                python: `price = requests.post('http://localhost:3005/v1/prices',
  json={
    'product': 'prod_xxx',
    'unit_amount': 10000,
    'currency': 'zmw',
    'recurring': {'interval': 'month', 'interval_count': 1},
    'nickname': 'Monthly ZMW',
  },
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()
print('Price ID:', price['id'])`,
                curl: `curl -X POST http://localhost:3005/v1/prices \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY" \\
  -d '{
    "product": "prod_xxx",
    "unit_amount": 10000,
    "currency": "zmw",
    "recurring": {"interval": "month", "interval_count": 1},
    "nickname": "Monthly ZMW"
  }'`
            }
        },
        {
            id: 'checkout-webhook-confirm',
            method: 'POST',
            path: '/webhook',
            title: 'Confirm Payment via Webhook',
            badge: 'Best Practice',
            description: 'Never rely solely on the success_url redirect to fulfil orders — customers can close their browser before being redirected. Use webhooks as the authoritative confirmation. Listen for checkout.session.completed (payment) or invoice.payment_succeeded (subscriptions).',
            params: [
                { name: 'flapapay-signature (header)', type: 'string', required: true, desc: 'HMAC-SHA256 signature used to verify the event came from FlapaPay' },
                { name: 'type', type: 'string', required: false, desc: 'checkout.session.completed | invoice.payment_succeeded | payment_intent.payment_failed' },
            ],
            response: `// Event payload:
{
  "id": "evt_xxx",
  "object": "event",
  "type": "checkout.session.completed",
  "created": 1716000000,
  "data": {
    "object": {
      "id": "cs_live_a1B2c3D4e5F6",
      "payment_status": "paid",
      "metadata": { "order_id": "ORD-1234" },
      "customer_email": "buyer@example.com",
      "amount_total": 100000
    }
  }
}`,
            snippets: {
                node: `import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.raw({ type: 'application/json' })); // ← raw body required for sig verification

const WEBHOOK_SECRET = process.env.FLAPAPAY_WEBHOOK_SECRET;

app.post('/webhook', (req, res) => {
  const sig = req.headers['flapapay-signature'];
  const payload = req.body;

  // Verify signature
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (sig !== \`sha256=\${expected}\`) {
    return res.status(400).send('Invalid signature');
  }

  const event = JSON.parse(payload.toString());

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.payment_status === 'paid') {
      const orderId = session.metadata.order_id;
      await fulfillOrder(orderId); // ✅ safe to fulfil
    }
  }

  res.json({ received: true });
});`,
                python: `from flask import Flask, request, jsonify, abort
import hmac, hashlib, os, json

app = Flask(__name__)
WEBHOOK_SECRET = os.environ['FLAPAPAY_WEBHOOK_SECRET']

@app.route('/webhook', methods=['POST'])
def webhook():
    payload = request.get_data()
    sig = request.headers.get('flapapay-signature', '')
    expected = 'sha256=' + hmac.new(
        WEBHOOK_SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(sig, expected):
        abort(400, 'Invalid signature')

    event = json.loads(payload)
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        if session['payment_status'] == 'paid':
            fulfil_order(session['metadata']['order_id'])

    return jsonify(received=True)`,
                curl: `# Test your webhook locally with the FlapaPay CLI:
# flapapay listen --forward-to localhost:3000/webhook

# Or manually send a test event from your dashboard → Webhooks → Send test event`
            }
        },
    ];


    const escrowEndpoints = [
        {
            id: 'create-escrow',
            method: 'POST',
            path: '/escrows/create',
            title: 'Create Standard Escrow',
            description: 'Initialize a new escrow agreement between a buyer and a seller.',
            params: [
                { name: 'seller_email', type: 'string', required: true, desc: 'Email of the seller' },
                { name: 'amount', type: 'number', required: true, desc: 'Transaction amount' },
                { name: 'currency', type: 'string', required: true, desc: 'Currency code (e.g., USD, ZMW)' },
                { name: 'description', type: 'string', required: false, desc: 'Item or service description' }
            ],
            response: '{ "id": "esc_123...", "status": "PENDING_FUNDING", ... }',
            snippets: {
                node: `const res = await fetch('http://localhost:5173/escrows/create', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer JWT_TOKEN', 'Content-Type': 'application/json' },
  body: JSON.stringify({ seller_email: 'seller@example.com', amount: 100, currency: 'USD' })
});`,
                python: `import requests
res = requests.post('http://localhost:5173/escrows/create', 
  json={'seller_email': 'seller@example.com', 'amount': 100, 'currency': 'USD'},
  headers={'Authorization': 'Bearer JWT_TOKEN'})`,
                curl: `curl -X POST http://localhost:5173/escrows/create \\
  -H "Authorization: Bearer JWT_TOKEN" \\
  -d '{"seller_email":"seller@example.com","amount":100,"currency":"USD"}'`
            }
        },
        {
            id: 'fund-escrow',
            method: 'POST',
            path: '/escrows/:id/fund',
            title: 'Fund Escrow',
            description: 'Move funds from the buyer\'s wallet into the escrow hold.',
            params: [
                { name: 'paymentMethodId', type: 'string', required: false, desc: 'Optional Stripe payment method ID' }
            ],
            response: '{ "message": "Escrow funded successfully", "status": "FUNDED" }',
            snippets: {
                node: `await fetch('http://localhost:5173/escrows/ESCROW_ID/fund', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer JWT_TOKEN' }
});`,
                python: `requests.post('http://localhost:5173/escrows/ESCROW_ID/fund', 
  headers={'Authorization': 'Bearer JWT_TOKEN'})`,
                curl: `curl -X POST http://localhost:5173/escrows/ESCROW_ID/fund \\
  -H "Authorization: Bearer JWT_TOKEN"`
            }
        },
        {
            id: 'deliver-escrow',
            method: 'POST',
            path: '/escrows/:id/deliver',
            title: 'Mark as Delivered',
            description: 'Seller signals that the item has been shipped or service provided.',
            params: [],
            response: '{ "message": "Marked as shipped", "status": "SHIPPED" }',
            snippets: {
                node: `await fetch('http://localhost:5173/escrows/ESCROW_ID/deliver', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer JWT_TOKEN' }
});`,
                python: `requests.post('http://localhost:5173/escrows/ESCROW_ID/deliver', 
  headers={'Authorization': 'Bearer JWT_TOKEN'})`,
                curl: `curl -X POST http://localhost:5173/escrows/ESCROW_ID/deliver \\
  -H "Authorization: Bearer JWT_TOKEN"`
            }
        },
        {
            id: 'confirm-escrow',
            method: 'POST',
            path: '/escrows/:id/confirm',
            title: 'Confirm & Release',
            description: 'Buyer confirms receipt, triggering immediate fund release to the seller.',
            params: [],
            response: '{ "message": "Funds released to seller", "status": "COMPLETED" }',
            snippets: {
                node: `await fetch('http://localhost:5173/escrows/ESCROW_ID/confirm', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer JWT_TOKEN' }
});`,
                python: `requests.post('http://localhost:5173/escrows/ESCROW_ID/confirm', 
  headers={'Authorization': 'Bearer JWT_TOKEN'})`,
                curl: `curl -X POST http://localhost:5173/escrows/ESCROW_ID/confirm \\
  -H "Authorization: Bearer JWT_TOKEN"`
            }
        },
        {
            id: 'dispute-escrow',
            method: 'POST',
            path: '/escrows/:id/dispute',
            title: 'Dispute Escrow',
            description: 'Halt the transaction and request administrative mediation.',
            params: [
                { name: 'reason', type: 'string', required: true, desc: 'Reason for the dispute' },
                { name: 'evidenceUrl', type: 'string', required: false, desc: 'URL to supporting documents' }
            ],
            response: '{ "message": "Dispute opened", "status": "DISPUTED" }',
            snippets: {
                node: `await fetch('http://localhost:5173/escrows/ESCROW_ID/dispute', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer JWT_TOKEN', 'Content-Type': 'application/json' },
  body: JSON.stringify({ reason: 'Item not as described' })
});`,
                python: `requests.post('http://localhost:5173/escrows/ESCROW_ID/dispute', 
  json={'reason': 'Item not as described'},
  headers={'Authorization': 'Bearer JWT_TOKEN'})`,
                curl: `curl -X POST http://localhost:5173/escrows/ESCROW_ID/dispute \\
  -H "Authorization: Bearer JWT_TOKEN" \\
  -d '{"reason":"Item not as described"}'`
            }
        },
        {
            id: 'v1-create-escrow',
            method: 'POST',
            path: '/api/v1/escrows',
            title: 'Marketplace Create (v1)',
            description: 'Developer API for marketplaces to create escrows on behalf of users.',
            params: [
                { name: 'seller_email', type: 'string', required: true, desc: 'Email of the seller' },
                { name: 'buyer_id', type: 'string', required: true, desc: 'FlapaPay User ID of the buyer' },
                { name: 'amount', type: 'number', required: true, desc: 'Amount' },
                { name: 'currency', type: 'string', required: true, desc: 'Currency' }
            ],
            response: '{ "id": "esc_v1_...", "status": "PENDING_FUNDING" }',
            snippets: {
                node: `await fetch('http://localhost:5173/api/v1/escrows', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer MERCHANT_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ seller_email: 's@ex.com', buyer_id: 'usr_123', amount: 50, currency: 'USD' })
});`,
                python: `requests.post('http://localhost:5173/api/v1/escrows', 
  json={'seller_email': 's@ex.com', 'buyer_id': 'usr_123', 'amount': 50, 'currency': 'USD'},
  headers={'Authorization': 'Bearer MERCHANT_KEY'})`,
                curl: `curl -X POST http://localhost:5173/api/v1/escrows \\
  -H "Authorization: Bearer MERCHANT_KEY" \\
  -d '{"seller_email":"s@ex.com","buyer_id":"usr_123","amount":50,"currency":"USD"}'`
            }
        },
        {
            id: 'list-escrows',
            method: 'GET',
            path: '/escrows',
            title: 'List My Escrows',
            description: 'Fetch all escrow transactions where the authenticated user is a buyer or seller.',
            params: [],
            response: '[ { "id": "esc_1", "status": "COMPLETED", ... }, ... ]',
            snippets: {
                node: `const res = await fetch('http://localhost:5173/escrows', {
  headers: { 'Authorization': 'Bearer JWT_TOKEN' }
});`,
                python: `res = requests.get('http://localhost:5173/escrows', 
  headers={'Authorization': 'Bearer JWT_TOKEN'})`,
                curl: `curl http://localhost:5173/escrows -H "Authorization: Bearer JWT_TOKEN"`
            }
        },
        {
            id: 'get-escrow',
            method: 'GET',
            path: '/escrows/:id',
            title: 'Get Escrow Details',
            description: 'Fetch full details of a specific escrow, including participant profiles.',
            params: [],
            response: '{ "id": "esc_123", "buyer_name": "John Doe", "seller_name": "Jane Smith", ... }',
            snippets: {
                node: `const res = await fetch('http://localhost:5173/escrows/ESCROW_ID', {
  headers: { 'Authorization': 'Bearer JWT_TOKEN' }
});`,
                python: `res = requests.get('http://localhost:5173/escrows/ESCROW_ID', 
  headers={'Authorization': 'Bearer JWT_TOKEN'})`,
                curl: `curl http://localhost:5173/escrows/ESCROW_ID -H "Authorization: Bearer JWT_TOKEN"`
            }
        },
        {
            id: 'public-escrow',
            method: 'GET',
            path: '/escrow-public/:id',
            title: 'Public Escrow View',
            description: 'A read-only public view of an escrow status. No authentication required.',
            params: [],
            response: '{ "id": "esc_123", "status": "SHIPPED", "amount": 50, "currency": "USD" }',
            snippets: {
                node: `const res = await fetch('http://localhost:5173/escrow-public/ESCROW_ID');`,
                python: `res = requests.get('http://localhost:5173/escrow-public/ESCROW_ID')`,
                curl: `curl http://localhost:5173/escrow-public/ESCROW_ID`
            }
        }
    ];

    const subscriptionEndpoints = [
        {
            id: 'create-product',
            method: 'POST',
            path: '/v1/products',
            title: 'Create Product',
            description: 'Define a service or physical good being billed for.',
            params: [
                { name: 'name', type: 'string', required: true, desc: 'Name of the product' },
                { name: 'description', type: 'string', required: false, desc: 'Optional details' }
            ],
            response: '{ "id": "prod_123...", "name": "Premium Plan", ... }',
            snippets: {
                node: `const res = await fetch('http://localhost:5173/v1/products', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Premium Plan' })
});`,
                python: `import requests
res = requests.post('http://localhost:5173/v1/products', 
  json={'name': 'Premium Plan'},
  headers={'Authorization': 'Bearer API_KEY'})`,
                curl: `curl -X POST http://localhost:5173/v1/products \\
  -H "Authorization: Bearer API_KEY" \\
  -d '{"name":"Premium Plan"}'`
            }
        },
        {
            id: 'create-price',
            method: 'POST',
            path: '/v1/prices',
            title: 'Create Price',
            description: 'Associate a recurring price to a product.',
            params: [
                { name: 'product_id', type: 'string', required: true, desc: 'ID of the product' },
                { name: 'amount', type: 'number', required: true, desc: 'Amount in decimal' },
                { name: 'currency', type: 'string', required: true, desc: 'e.g. USD, ZMW' },
                { name: 'interval', type: 'string', required: true, desc: '"month" or "year"' }
            ],
            response: '{ "id": "price_123...", "product_id": "prod_123", ... }',
            snippets: {
                node: `await fetch('http://localhost:5173/v1/prices', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ product_id: 'prod_123', amount: 50, currency: 'USD', interval: 'month' })
});`,
                python: `requests.post('http://localhost:5173/v1/prices', 
  json={'product_id': 'prod_123', 'amount': 50, 'currency': 'USD', 'interval': 'month'},
  headers={'Authorization': 'Bearer API_KEY'})`,
                curl: `curl -X POST http://localhost:5173/v1/prices \\
  -H "Authorization: Bearer API_KEY" \\
  -d '{"product_id":"prod_123","amount":50,"currency":"USD","interval":"month"}'`
            }
        },
        {
            id: 'create-subscription',
            method: 'POST',
            path: '/v1/subscriptions',
            title: 'Create Subscription',
            description: 'Enroll a customer in a pricing plan. Integrates with ledger for double-entry.',
            params: [
                { name: 'customer_id', type: 'string', required: true, desc: 'ID of the customer' },
                { name: 'price_id', type: 'string', required: true, desc: 'ID of the price' }
            ],
            response: '{ "id": "sub_123...", "status": "incomplete", "clientSecret": "pi_123..." }',
            snippets: {
                node: `await fetch('http://localhost:5173/v1/subscriptions', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ customer_id: 'cus_123', price_id: 'price_123' })
});`,
                python: `requests.post('http://localhost:5173/v1/subscriptions', 
  json={'customer_id': 'cus_123', 'price_id': 'price_123'},
  headers={'Authorization': 'Bearer API_KEY'})`,
                curl: `curl -X POST http://localhost:5173/v1/subscriptions \\
  -H "Authorization: Bearer API_KEY" \\
  -d '{"customer_id":"cus_123","price_id":"price_123"}'`
            }
        }
    ];

    const connectEndpoints = [
        // ── ACCOUNT MANAGEMENT ───────────────────────────────────────────────────
        {
            id: 'connect-overview',
            method: 'GET',
            path: '/v1/connect/stats',
            title: '① Overview — Marketplace Stats',
            description: 'FlapaPay Connect is a full marketplace infrastructure layer. Authenticate all platform-owner requests with your merchant secret key (sk_test_flp_... or sk_live_flp_...) in the Authorization header. Use x-flapapay-test-mode: true for sandbox testing without moving real money.',
            params: [],
            response: `{
  "totalSubMerchants": 42,
  "activeSubMerchants": 38,
  "marketplaceGMV": 12500000,
  "platformRevenue": 312500,
  "pendingKYC": 4,
  "currency": "ZMW"
}`,
            snippets: {
                node: `import fetch from 'node-fetch';

const BASE = 'http://localhost:3005';
const KEY  = process.env.FLAPAPAY_SECRET_KEY; // sk_test_flp_...

const res = await fetch(\`\${BASE}/v1/connect/stats\`, {
  headers: {
    Authorization: \`Bearer \${KEY}\`,
    'x-flapapay-test-mode': 'true',
  },
});
const stats = await res.json();
console.log(\`Sellers: \${stats.totalSubMerchants}, GMV: ZMW \${stats.marketplaceGMV / 100}\`);`,
                python: `import requests, os

BASE = "http://localhost:3005"
KEY  = os.environ["FLAPAPAY_SECRET_KEY"]

r = requests.get(f"{BASE}/v1/connect/stats",
    headers={"Authorization": f"Bearer {KEY}", "x-flapapay-test-mode": "true"})
print(r.json())`,
                curl: `curl http://localhost:3005/v1/connect/stats \\
  -H "Authorization: Bearer sk_test_flp_xxxx" \\
  -H "x-flapapay-test-mode: true"`,
            },
        },
        {
            id: 'create-connected-account',
            method: 'POST',
            path: '/v1/connect/accounts',
            title: 'Create Connected Account',
            description: 'Register a new sub-merchant (seller) on your platform. Creates a shell account and initialises their balance ledger.',
            params: [
                { name: 'email', type: 'string', required: true, desc: 'Email address of the sub-merchant' },
                { name: 'business_name', type: 'string', required: true, desc: 'Legal business name' },
                { name: 'business_type', type: 'string', required: false, desc: '"individual" or "company" (default: individual)' },
                { name: 'tpin', type: 'string', required: false, desc: 'Zambia Revenue Authority TPIN number' },
                { name: 'pacra_number', type: 'string', required: false, desc: 'PACRA business registration number' },
                { name: 'country', type: 'string', required: false, desc: 'ISO 3166 country code (default: ZM)' },
            ],
            response: '{ "id": "acct_abc123", "object": "account", "type": "custom", "capabilities": { "transfers": { "requested": true } } }',
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/accounts', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'vendor@example.com',
    business_name: 'Lusaka Crafts Ltd',
    tpin: '1234567890',
    country: 'ZM'
  })
});
const account = await res.json();
console.log('Account ID:', account.id); // acct_abc123`,
                python: `import requests
res = requests.post('http://localhost:3005/v1/connect/accounts',
  json={
    'email': 'vendor@example.com',
    'business_name': 'Lusaka Crafts Ltd',
    'tpin': '1234567890',
    'country': 'ZM'
  },
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})
account = res.json()`,
                curl: `curl -X POST http://localhost:3005/v1/connect/accounts \\
  -H "Authorization: Bearer MERCHANT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"vendor@example.com","business_name":"Lusaka Crafts Ltd","country":"ZM"}'`
            }
        },
        {
            id: 'list-connected-accounts',
            method: 'GET',
            path: '/v1/connect/accounts',
            title: 'List Connected Accounts',
            description: 'Retrieve all sub-merchants on your platform with their aggregated volume and fees. Supports test/live mode filtering via x-flapapay-test-mode header.',
            params: [],
            response: `[{ "id": "acct_abc123", "businessName": "Lusaka Crafts Ltd", "email": "vendor@example.com", "status": "ACTIVE", "volume": "12500.00", "fees": "312.50" }]`,
            snippets: {
                node: `// Live mode
const res = await fetch('http://localhost:3005/v1/connect/accounts', {
  headers: {
    'Authorization': 'Bearer MERCHANT_API_KEY',
    'x-flapapay-test-mode': 'false'
  }
});
const accounts = await res.json();`,
                python: `res = requests.get('http://localhost:3005/v1/connect/accounts',
  headers={'Authorization': 'Bearer MERCHANT_API_KEY', 'x-flapapay-test-mode': 'false'})`,
                curl: `curl http://localhost:3005/v1/connect/accounts \\
  -H "Authorization: Bearer MERCHANT_API_KEY" \\
  -H "x-flapapay-test-mode: false"`
            }
        },
        {
            id: 'destination-charge',
            method: 'POST',
            path: '/v1/checkout/sessions',
            title: 'Destination Charge (Split Payment)',
            description: 'Create a checkout session that routes the payment to a connected account. Set transfer_data.destination to the sub-merchant account ID and application_fee_amount to your platform fee in the smallest currency unit.',
            params: [
                { name: 'amount', type: 'number', required: true, desc: 'Total amount in smallest unit (e.g., 10000 = ZK 100.00)' },
                { name: 'currency', type: 'string', required: true, desc: 'e.g., ZMW, USD' },
                { name: 'transfer_data.destination', type: 'string', required: true, desc: 'Connected account ID of the sub-merchant receiving funds' },
                { name: 'application_fee_amount', type: 'number', required: false, desc: 'Platform fee in smallest unit. Retained by your wallet.' },
                { name: 'success_url', type: 'string', required: true, desc: 'Redirect URL on success' },
            ],
            response: '{ "id": "cs_abc123", "url": "https://flapapay.com/checkout/cs_abc123", "status": "open" }',
            snippets: {
                node: `// Marketplace checkout: customer pays ZK 1,000, platform keeps ZK 50 (5%)
const res = await fetch('http://localhost:3005/v1/checkout/sessions', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 100000,                        // ZK 1,000.00
    currency: 'ZMW',
    transfer_data: { destination: 'acct_abc123' },
    application_fee_amount: 5000,         // ZK 50.00 platform fee (5%)
    success_url: 'https://yourapp.com/success',
    cancel_url: 'https://yourapp.com/cancel'
  })
});
const session = await res.json();
// Redirect customer to session.url`,
                python: `res = requests.post('http://localhost:3005/v1/checkout/sessions',
  json={
    'amount': 100000,
    'currency': 'ZMW',
    'transfer_data': {'destination': 'acct_abc123'},
    'application_fee_amount': 5000,
    'success_url': 'https://yourapp.com/success',
    'cancel_url': 'https://yourapp.com/cancel'
  },
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl -X POST http://localhost:3005/v1/checkout/sessions \\
  -H "Authorization: Bearer MERCHANT_API_KEY" \\
  -d '{"amount":100000,"currency":"ZMW","transfer_data":{"destination":"acct_abc123"},"application_fee_amount":5000,"success_url":"https://yourapp.com/success","cancel_url":"https://yourapp.com/cancel"}'`
            }
        },
        {
            id: 'connect-payout',
            method: 'POST',
            path: '/v1/connect/payouts',
            title: 'Pay Out to Sub-merchant',
            description: 'Disburse available funds from a connected account to their registered payout method (mobile money or bank). Executed via PawaPay for mobile money and Lenco for bank transfers.',
            params: [
                { name: 'account_id', type: 'string', required: true, desc: 'Connected account ID to pay out from' },
                { name: 'amount', type: 'number', required: true, desc: 'Amount to disburse (decimal, e.g., 500.00)' },
                { name: 'currency', type: 'string', required: true, desc: 'Currency code (e.g., ZMW)' },
            ],
            response: '{ "id": "txn_xyz789", "status": "COMPLETED", "amount": 500, "destination": { "network": "MTN", "number": "260976XXXXXX" } }',
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/payouts', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({
    account_id: 'acct_abc123',
    amount: 500.00,
    currency: 'ZMW'
  })
});
const payout = await res.json();
console.log('Payout status:', payout.status); // COMPLETED`,
                python: `res = requests.post('http://localhost:3005/v1/connect/payouts',
  json={'account_id': 'acct_abc123', 'amount': 500.00, 'currency': 'ZMW'},
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl -X POST http://localhost:3005/v1/connect/payouts \\
  -H "Authorization: Bearer MERCHANT_API_KEY" \\
  -d '{"account_id":"acct_abc123","amount":500,"currency":"ZMW"}'`
            }
        },
        {
            id: 'vendor-stats',
            method: 'GET',
            path: '/v1/connect/accounts/:id/stats',
            title: 'Get Vendor Stats',
            description: 'Retrieve revenue, platform fees, pending settlement, and available balance for a specific sub-merchant.',
            params: [],
            response: '{ "totalRevenue": "12500.00", "platformFees": "312.50", "netEarnings": "12187.50", "pendingSettlement": "2000.00", "availableBalance": "10187.50" }',
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/accounts/acct_abc123/stats', {
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY' }
});
const stats = await res.json();`,
                python: `res = requests.get('http://localhost:3005/v1/connect/accounts/acct_abc123/stats',
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl http://localhost:3005/v1/connect/accounts/acct_abc123/stats \\
  -H "Authorization: Bearer MERCHANT_API_KEY"`
            }
        },
        {
            id: 'connect-config',
            method: 'PATCH',
            path: '/v1/connect/config',
            title: 'Update Platform Fee Config',
            description: 'Configure your platform fee percentage, settlement delay, payout threshold, and auto-payout schedule. Also accessible via the Connect Settings page in your dashboard.',
            params: [
                { name: 'platform_fee_percent', type: 'number', required: false, desc: 'Fee % taken on each transaction (0–20). Default: 2.50' },
                { name: 'fee_collection_method', type: 'string', required: false, desc: '"per_transaction" or "monthly"' },
                { name: 'settlement_delay_days', type: 'number', required: false, desc: '0, 1, or 2 days. Default: 1 (T+1)' },
                { name: 'min_payout_threshold', type: 'number', required: false, desc: 'Minimum balance before auto-payout triggers. Default: 50.00' },
                { name: 'auto_payout_enabled', type: 'boolean', required: false, desc: 'Whether to auto-pay vendors on schedule' },
                { name: 'auto_payout_schedule', type: 'string', required: false, desc: '"daily", "weekly", or "monthly"' },
            ],
            response: '{ "merchant_id": "mer_123", "platform_fee_percent": "3.00", "settlement_delay_days": 1, "auto_payout_enabled": true, "auto_payout_schedule": "daily" }',
            snippets: {
                node: `await fetch('http://localhost:3005/v1/connect/config', {
  method: 'PATCH',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platform_fee_percent: 3.0,
    settlement_delay_days: 1,
    min_payout_threshold: 100,
    auto_payout_enabled: true,
    auto_payout_schedule: 'daily'
  })
});`,
                python: `requests.patch('http://localhost:3005/v1/connect/config',
  json={'platform_fee_percent': 3.0, 'settlement_delay_days': 1, 'auto_payout_enabled': True, 'auto_payout_schedule': 'daily'},
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl -X PATCH http://localhost:3005/v1/connect/config \\
  -H "Authorization: Bearer MERCHANT_API_KEY" \\
  -d '{"platform_fee_percent":3.0,"settlement_delay_days":1,"auto_payout_enabled":true,"auto_payout_schedule":"daily"}'`
            }
        },

        // ── ACCOUNT SESSIONS ─────────────────────────────────────────────────────
        {
            id: 'create-account-session',
            method: 'POST',
            path: '/v1/connect/account_sessions',
            title: 'Create Account Session',
            description: 'Generate a short-lived client_secret for a connected account. Pass this to your frontend so the seller\'s browser can call the exchange endpoint and mount embedded components — your secret key never leaves the server.',
            params: [
                { name: 'account', type: 'string', required: true, desc: 'Connected account ID (e.g., acct_abc123)' },
                { name: 'components', type: 'object', required: true, desc: 'Components to enable. Keys: account_management, balances, payments, payouts, documents, notification_banner' },
                { name: 'expires_in', type: 'number', required: false, desc: 'Session lifetime in seconds (default 3600, max 86400)' },
            ],
            response: `{
  "client_secret": "acs_live_eyJhbGciO...",
  "account": "acct_abc123",
  "expires_at": 1716000000,
  "components": { "balances": true, "payments": true, "payouts": true, "documents": true }
}`,
            snippets: {
                node: `// Server-side — never expose your secret key to the browser
const res = await fetch('http://localhost:3005/v1/connect/account_sessions', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({
    account: 'acct_abc123',
    components: { balances: true, payments: true, payouts: true, documents: true },
    expires_in: 3600
  })
});
const { client_secret } = await res.json();
// Return client_secret to your frontend`,
                python: `import requests
res = requests.post('http://localhost:3005/v1/connect/account_sessions',
  json={
    'account': 'acct_abc123',
    'components': { 'balances': True, 'payments': True, 'payouts': True, 'documents': True },
    'expires_in': 3600
  },
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})
client_secret = res.json()['client_secret']`,
                curl: `curl -X POST http://localhost:3005/v1/connect/account_sessions \\
  -H "Authorization: Bearer MERCHANT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"account":"acct_abc123","components":{"balances":true,"payments":true},"expires_in":3600}'`
            }
        },
        {
            id: 'exchange-account-session',
            method: 'POST',
            path: '/v1/connect/account_sessions/:secret/exchange',
            title: 'Exchange Client Secret → Portal Token',
            description: 'Called automatically by the FlapaPay Connect JS SDK. Trades a client_secret (issued server-side) for a scoped portal_token that embedded components use for all subsequent API calls. The client_secret IS the credential — no extra authentication required.',
            params: [],
            response: `{
  "portal_token": "pt_live_...",
  "account_id": "acct_abc123",
  "components": { "balances": true, "payments": true },
  "expires_at": 1716003600
}`,
            snippets: {
                node: `// This is called automatically by loadFlapaConnect — you don't need to call it manually.
// Shown here for documentation purposes only.
const res = await fetch(\`http://localhost:3005/v1/connect/account_sessions/\${clientSecret}/exchange\`, {
  method: 'POST'
});
const { portal_token } = await res.json();`,
                python: `# Called automatically by the JS SDK
import requests
res = requests.post(
  f'http://localhost:3005/v1/connect/account_sessions/{client_secret}/exchange'
)
portal_token = res.json()['portal_token']`,
                curl: `curl -X POST "http://localhost:3005/v1/connect/account_sessions/acs_live_eyJ.../exchange"`
            }
        },

        // ── EMBEDDED COMPONENTS (CLIENT-SIDE SDK) ────────────────────────────────
        {
            id: 'embedded-components-overview',
            method: 'GET',
            path: '— Client SDK',
            title: 'Embedded Components — Overview',
            description: 'FlapaPay Embedded Components let marketplace owners mount pre-built, branded UI widgets inside their platform so sellers can view balances, transactions, payouts, and KYC status without leaving your site. Components are rendered in your React tree via FlapaConnectProvider.',
            params: [],
            response: `// Available components:
// <ConnectBalances />        — balance overview + KYC status
// <ConnectPayments />        — paginated transaction list
// <ConnectPayouts />         — payout history + request payout
// <ConnectDocuments />       — KYC document upload / status
// <ConnectNotificationBanner /> — contextual alerts`,
            snippets: {
                node: `// 1. Install the SDK (or copy the source from apps/web/src/lib/flapaConnect.ts)
// npm install @flapapay/connect-js   (coming soon)

// 2. Load the Connect SDK
import { loadFlapaConnect } from '@flapapay/connect-js';

// 3. Fetch a client_secret from your server for the logged-in seller
const { client_secret } = await fetch('/api/connect/session').then(r => r.json());

// 4. Initialise the Connect instance
const connectInstance = loadFlapaConnect({
  fetchClientSecret: () => fetch('/api/connect/session').then(r => r.json()).then(d => d.client_secret),
  appearance: {
    variables: {
      colorPrimary: '#ea580c',   // orange brand colour
      borderRadius: '1rem',
      fontFamily: 'Inter, sans-serif',
    }
  }
});

// 5. Wrap your components
import { FlapaConnectProvider, ConnectBalances, ConnectPayments } from '@flapapay/connect-js/react';

function SellerDashboard() {
  return (
    <FlapaConnectProvider connectInstance={connectInstance}>
      <ConnectBalances />
      <ConnectPayments />
    </FlapaConnectProvider>
  );
}`,
                python: `# Python backend: return a client_secret for the authenticated seller
from flask import Flask, jsonify, request
import requests, os

app = Flask(__name__)
FLAPAPAY_KEY = os.environ['FLAPAPAY_SECRET_KEY']
BASE = 'http://localhost:3005'

@app.route('/api/connect/session')
def connect_session():
    account_id = get_current_seller_account_id()  # your auth logic
    r = requests.post(f'{BASE}/v1/connect/account_sessions',
        json={'account': account_id, 'components': {'balances': True, 'payments': True, 'payouts': True, 'documents': True}},
        headers={'Authorization': f'Bearer {FLAPAPAY_KEY}'})
    return jsonify(r.json())`,
                curl: `# No cURL example — this is a client-side SDK concept.
# See the Node.js tab for the full integration pattern.`
            }
        },
        {
            id: 'connect-balances-component',
            method: 'GET',
            path: '/v1/connect/portal/me',
            title: 'ConnectBalances Component',
            description: 'Shows the seller\'s available and pending balance, KYC verification status, account status badge, and payment capabilities. Requires the balances component to be enabled in the Account Session.',
            params: [],
            response: `{
  "account_id": "acct_abc123",
  "business_name": "Lusaka Crafts Ltd",
  "kyc_status": "VERIFIED",
  "status": "ACTIVE",
  "available_balance": 18750.00,
  "pending_balance": 2500.00,
  "currency": "ZMW"
}`,
            snippets: {
                node: `import { ConnectBalances } from '@flapapay/connect-js/react';

// Inside <FlapaConnectProvider connectInstance={...}>
<ConnectBalances
  onLoadError={(err) => console.error('Balances failed to load', err)}
/>`,
                python: `# Portal endpoint (called by the component internally)
import requests
res = requests.get('http://localhost:3005/v1/connect/portal/me',
  headers={'Authorization': 'Bearer PORTAL_TOKEN'})
print(res.json())`,
                curl: `curl http://localhost:3005/v1/connect/portal/me \\
  -H "Authorization: Bearer PORTAL_TOKEN"`
            }
        },
        {
            id: 'connect-payments-component',
            method: 'GET',
            path: '/v1/connect/portal/charges',
            title: 'ConnectPayments Component',
            description: 'Renders a paginated list of the seller\'s transactions — amount, status, date, and currency. Requires the payments component in the Account Session.',
            params: [
                { name: 'limit', type: 'number', required: false, desc: 'Max records to return (default 10, max 100)' },
                { name: 'offset', type: 'number', required: false, desc: 'Pagination offset' },
            ],
            response: `{
  "charges": [
    { "id": "ch_xxx", "amount": 500.00, "currency": "ZMW", "status": "COMPLETED", "created_at": "2025-01-15T10:00:00Z" }
  ],
  "total": 42
}`,
            snippets: {
                node: `import { ConnectPayments } from '@flapapay/connect-js/react';

<ConnectPayments
  onLoadError={(err) => console.error('Payments failed to load', err)}
/>`,
                python: `res = requests.get('http://localhost:3005/v1/connect/portal/charges?limit=10',
  headers={'Authorization': 'Bearer PORTAL_TOKEN'})`,
                curl: `curl "http://localhost:3005/v1/connect/portal/charges?limit=10" \\
  -H "Authorization: Bearer PORTAL_TOKEN"`
            }
        },
        {
            id: 'connect-payouts-component',
            method: 'GET',
            path: '/v1/connect/portal/payouts',
            title: 'ConnectPayouts Component',
            description: 'Shows payout history and a "Request Payout" button. When the seller clicks Request Payout, the component calls POST /v1/connect/portal/payout-requests. Requires the payouts component.',
            params: [],
            response: `{
  "payouts": [
    { "id": "po_xxx", "amount": 2000.00, "currency": "ZMW", "status": "COMPLETED", "created_at": "2025-01-14T08:00:00Z", "method": "MTN_MOMO" }
  ]
}`,
            snippets: {
                node: `import { ConnectPayouts } from '@flapapay/connect-js/react';

<ConnectPayouts
  onLoadError={(err) => console.error('Payouts failed to load', err)}
/>`,
                python: `res = requests.get('http://localhost:3005/v1/connect/portal/payouts?limit=10',
  headers={'Authorization': 'Bearer PORTAL_TOKEN'})`,
                curl: `curl "http://localhost:3005/v1/connect/portal/payouts?limit=10" \\
  -H "Authorization: Bearer PORTAL_TOKEN"

# Request a payout
curl -X POST http://localhost:3005/v1/connect/portal/payout-requests \\
  -H "Authorization: Bearer PORTAL_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 1000, "currency": "ZMW"}'`
            }
        },
        {
            id: 'connect-documents-component',
            method: 'GET',
            path: '/v1/connect/portal/kyc',
            title: 'ConnectDocuments Component',
            description: 'Displays the seller\'s uploaded KYC documents with APPROVED / PENDING / REJECTED status and review notes. Includes a file picker for uploading new documents (National ID, Passport, Business Registration, Tax Clearance, Proof of Address). Requires the documents component.',
            params: [
                { name: 'document_type (form field)', type: 'string', required: true, desc: 'national_id | passport | business_registration | tax_clearance | proof_of_address' },
                { name: 'file (form field)', type: 'file', required: true, desc: 'Image (JPEG/PNG) or PDF, max 10 MB' },
            ],
            response: `{
  "documents": [
    { "id": "doc_xxx", "document_type": "national_id", "status": "APPROVED", "created_at": "2025-01-10T09:00:00Z" },
    { "id": "doc_yyy", "document_type": "business_registration", "status": "PENDING", "review_notes": null, "created_at": "2025-01-15T11:00:00Z" }
  ]
}`,
            snippets: {
                node: `import { ConnectDocuments } from '@flapapay/connect-js/react';

<ConnectDocuments
  onLoadError={(err) => console.error('Documents failed to load', err)}
/>`,
                python: `# List documents
res = requests.get('http://localhost:3005/v1/connect/portal/kyc',
  headers={'Authorization': 'Bearer PORTAL_TOKEN'})

# Upload a document (multipart form)
with open('national_id.jpg', 'rb') as f:
    res = requests.post('http://localhost:3005/v1/connect/portal/kyc',
        files={'file': f},
        data={'document_type': 'national_id'},
        headers={'Authorization': 'Bearer PORTAL_TOKEN'})`,
                curl: `# List documents
curl http://localhost:3005/v1/connect/portal/kyc \\
  -H "Authorization: Bearer PORTAL_TOKEN"

# Upload document
curl -X POST http://localhost:3005/v1/connect/portal/kyc \\
  -H "Authorization: Bearer PORTAL_TOKEN" \\
  -F "document_type=national_id" \\
  -F "file=@/path/to/national_id.jpg"`
            }
        },
        {
            id: 'connect-notification-banner',
            method: 'GET',
            path: '— Derived from /portal/me',
            title: 'ConnectNotificationBanner Component',
            description: 'Displays contextual alert banners derived from the seller\'s account state (KYC pending, KYC rejected, restricted, verification needed, or funds available). Banners are dismissible and styled by the appearance theme. Requires the notification_banner component.',
            params: [],
            response: `// No dedicated API call — banners are computed from /v1/connect/portal/me
// Banner types: "warning" (KYC pending), "error" (restricted/rejected), "info" (verify), "success" (funds available)`,
            snippets: {
                node: `import { ConnectNotificationBanner } from '@flapapay/connect-js/react';

// Place at the top of the seller dashboard — shows relevant alerts
<ConnectNotificationBanner />`,
                python: `# No separate endpoint — see /v1/connect/portal/me`,
                curl: `# No separate endpoint — banners are derived from account state`
            }
        },

        // ── KYC MANAGEMENT (PLATFORM ADMIN) ──────────────────────────────────────
        {
            id: 'list-kyc-documents',
            method: 'GET',
            path: '/v1/connect/kyc',
            title: 'List All KYC Documents',
            description: 'Returns all KYC documents submitted across all sub-merchants. Filter by status (PENDING, APPROVED, REJECTED) or account ID. Use this to build a KYC review queue.',
            params: [
                { name: 'status', type: 'string', required: false, desc: 'Filter by PENDING | APPROVED | REJECTED' },
                { name: 'account_id', type: 'string', required: false, desc: 'Filter to a specific sub-merchant' },
            ],
            response: `{
  "documents": [
    { "id": "doc_xxx", "account_id": "acct_abc123", "document_type": "national_id", "status": "PENDING", "file_url": "https://...", "created_at": "..." }
  ]
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/kyc?status=PENDING', {
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY' }
});
const { documents } = await res.json();`,
                python: `res = requests.get('http://localhost:3005/v1/connect/kyc?status=PENDING',
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl "http://localhost:3005/v1/connect/kyc?status=PENDING" \\
  -H "Authorization: Bearer MERCHANT_API_KEY"`
            }
        },
        {
            id: 'review-kyc-document',
            method: 'PATCH',
            path: '/v1/connect/kyc/:documentId',
            title: 'Approve / Reject KYC Document',
            description: 'Update the review status of a KYC document. On approval the document status is set to APPROVED. On rejection, supply review_notes explaining what is wrong so the seller can resubmit.',
            params: [
                { name: 'status', type: 'string', required: true, desc: 'APPROVED or REJECTED' },
                { name: 'review_notes', type: 'string', required: false, desc: 'Required when rejecting — shown to the seller in ConnectDocuments' },
            ],
            response: `{ "id": "doc_xxx", "status": "APPROVED", "reviewed_at": "2025-01-15T12:00:00Z" }`,
            snippets: {
                node: `await fetch('http://localhost:3005/v1/connect/kyc/doc_xxx', {
  method: 'PATCH',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'REJECTED', review_notes: 'Document is blurry — please resubmit a clear photo.' })
});`,
                python: `requests.patch('http://localhost:3005/v1/connect/kyc/doc_xxx',
  json={'status': 'REJECTED', 'review_notes': 'Document is blurry'},
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl -X PATCH http://localhost:3005/v1/connect/kyc/doc_xxx \\
  -H "Authorization: Bearer MERCHANT_API_KEY" \\
  -d '{"status":"REJECTED","review_notes":"Document is blurry"}'`
            }
        },
        {
            id: 'bulk-approve-kyc',
            method: 'POST',
            path: '/v1/connect/kyc/bulk-approve',
            title: 'Bulk Approve KYC Documents',
            description: 'Approve multiple KYC documents in a single request. Useful when processing a backlog or during onboarding campaigns.',
            params: [
                { name: 'document_ids', type: 'array', required: true, desc: 'Array of document IDs to approve' },
            ],
            response: `{ "approved": 5, "failed": 0 }`,
            snippets: {
                node: `await fetch('http://localhost:3005/v1/connect/kyc/bulk-approve', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ document_ids: ['doc_1', 'doc_2', 'doc_3'] })
});`,
                python: `requests.post('http://localhost:3005/v1/connect/kyc/bulk-approve',
  json={'document_ids': ['doc_1', 'doc_2', 'doc_3']},
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl -X POST http://localhost:3005/v1/connect/kyc/bulk-approve \\
  -H "Authorization: Bearer MERCHANT_API_KEY" \\
  -d '{"document_ids":["doc_1","doc_2","doc_3"]}'`
            }
        },

        // ── PAYOUT METHODS ────────────────────────────────────────────────────────
        {
            id: 'add-payout-method',
            method: 'POST',
            path: '/v1/connect/accounts/:id/payout-methods',
            title: 'Add Payout Method',
            description: 'Register a mobile money wallet or bank account as the sub-merchant\'s payout destination. Supported networks: MTN_MOMO, AIRTEL_MONEY, ZAMTEL_KWACHA (Zambia), and bank via LENCO.',
            params: [
                { name: 'type', type: 'string', required: true, desc: 'mobile_money or bank_account' },
                { name: 'network', type: 'string', required: false, desc: 'MTN_MOMO | AIRTEL_MONEY | ZAMTEL_KWACHA (required for mobile_money)' },
                { name: 'phone_number', type: 'string', required: false, desc: 'E.164 phone number e.g. +260976XXXXXX' },
                { name: 'bank_code', type: 'string', required: false, desc: 'Bank sort code (required for bank_account)' },
                { name: 'account_number', type: 'string', required: false, desc: 'Bank account number' },
                { name: 'account_name', type: 'string', required: false, desc: 'Account holder name (bank only)' },
            ],
            response: `{ "id": "pm_xxx", "type": "mobile_money", "network": "MTN_MOMO", "phone_number": "+260976XXXXXX", "is_default": true }`,
            snippets: {
                node: `await fetch('http://localhost:3005/v1/connect/accounts/acct_abc123/payout-methods', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'mobile_money', network: 'MTN_MOMO', phone_number: '+260976XXXXXX' })
});`,
                python: `requests.post('http://localhost:3005/v1/connect/accounts/acct_abc123/payout-methods',
  json={'type': 'mobile_money', 'network': 'MTN_MOMO', 'phone_number': '+260976XXXXXX'},
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl -X POST http://localhost:3005/v1/connect/accounts/acct_abc123/payout-methods \\
  -H "Authorization: Bearer MERCHANT_API_KEY" \\
  -d '{"type":"mobile_money","network":"MTN_MOMO","phone_number":"+260976XXXXXX"}'`
            }
        },
        {
            id: 'list-payout-methods',
            method: 'GET',
            path: '/v1/connect/accounts/:id/payout-methods',
            title: 'List Payout Methods',
            description: 'Retrieve all registered payout destinations for a sub-merchant.',
            params: [],
            response: `[{ "id": "pm_xxx", "type": "mobile_money", "network": "MTN_MOMO", "phone_number": "+260976XXXXXX", "is_default": true }]`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/accounts/acct_abc123/payout-methods', {
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY' }
});`,
                python: `res = requests.get('http://localhost:3005/v1/connect/accounts/acct_abc123/payout-methods',
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl http://localhost:3005/v1/connect/accounts/acct_abc123/payout-methods \\
  -H "Authorization: Bearer MERCHANT_API_KEY"`
            }
        },

        // ── BULK PAYOUTS ──────────────────────────────────────────────────────────
        {
            id: 'bulk-payout',
            method: 'POST',
            path: '/v1/connect/payouts/bulk',
            title: 'Bulk Payout',
            description: 'Disburse funds to multiple sub-merchants in a single API call. The platform wallet is debited atomically. Returns a batch ID for tracking.',
            params: [
                { name: 'payouts', type: 'array', required: true, desc: 'Array of { account_id, amount, currency, note? }' },
            ],
            response: `{ "batch_id": "batch_xxx", "total_count": 10, "total_amount": 5000.00, "currency": "ZMW", "status": "PROCESSING" }`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/payouts/bulk', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({
    payouts: [
      { account_id: 'acct_1', amount: 500, currency: 'ZMW' },
      { account_id: 'acct_2', amount: 750, currency: 'ZMW' },
    ]
  })
});`,
                python: `requests.post('http://localhost:3005/v1/connect/payouts/bulk',
  json={'payouts': [{'account_id': 'acct_1', 'amount': 500, 'currency': 'ZMW'}]},
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl -X POST http://localhost:3005/v1/connect/payouts/bulk \\
  -H "Authorization: Bearer MERCHANT_API_KEY" \\
  -d '{"payouts":[{"account_id":"acct_1","amount":500,"currency":"ZMW"}]}'`
            }
        },
        {
            id: 'auto-payout-schedule',
            method: 'POST',
            path: '/v1/connect/accounts/:id/auto-payout',
            title: 'Set Auto-Payout Schedule',
            description: 'Configure an automatic recurring payout schedule for a specific sub-merchant. Overrides the platform-wide default for this account.',
            params: [
                { name: 'enabled', type: 'boolean', required: true, desc: 'Enable or disable auto-payout' },
                { name: 'schedule', type: 'string', required: true, desc: 'daily | weekly | monthly' },
                { name: 'min_threshold', type: 'number', required: false, desc: 'Minimum balance required before triggering payout' },
            ],
            response: `{ "account_id": "acct_abc123", "auto_payout_enabled": true, "schedule": "weekly", "min_threshold": 100.00 }`,
            snippets: {
                node: `await fetch('http://localhost:3005/v1/connect/accounts/acct_abc123/auto-payout', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ enabled: true, schedule: 'weekly', min_threshold: 100 })
});`,
                python: `requests.post('http://localhost:3005/v1/connect/accounts/acct_abc123/auto-payout',
  json={'enabled': True, 'schedule': 'weekly', 'min_threshold': 100},
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl -X POST http://localhost:3005/v1/connect/accounts/acct_abc123/auto-payout \\
  -H "Authorization: Bearer MERCHANT_API_KEY" \\
  -d '{"enabled":true,"schedule":"weekly","min_threshold":100}'`
            }
        },

        // ── CHARGES & SPLITS ──────────────────────────────────────────────────────
        {
            id: 'list-connect-charges',
            method: 'GET',
            path: '/v1/connect/charges',
            title: 'List All Charges',
            description: 'Retrieve all charges processed through your marketplace, including split details, platform fees, and per-transaction sub-merchant credits.',
            params: [
                { name: 'account_id', type: 'string', required: false, desc: 'Filter to a specific sub-merchant' },
                { name: 'from', type: 'string', required: false, desc: 'ISO 8601 start date' },
                { name: 'to', type: 'string', required: false, desc: 'ISO 8601 end date' },
                { name: 'limit', type: 'number', required: false, desc: 'Default 20, max 100' },
            ],
            response: `{
  "charges": [{ "id": "ch_xxx", "amount": 1000, "platform_fee": 50, "net_to_seller": 950, "account_id": "acct_abc123", "status": "COMPLETED" }],
  "total": 150
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/charges?account_id=acct_abc123&limit=20', {
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY' }
});`,
                python: `res = requests.get('http://localhost:3005/v1/connect/charges',
  params={'account_id': 'acct_abc123', 'limit': 20},
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl "http://localhost:3005/v1/connect/charges?account_id=acct_abc123&limit=20" \\
  -H "Authorization: Bearer MERCHANT_API_KEY"`
            }
        },

        // ── DISPUTES ──────────────────────────────────────────────────────────────
        {
            id: 'create-dispute',
            method: 'POST',
            path: '/v1/connect/disputes',
            title: 'Create Dispute',
            description: 'Open a dispute on behalf of a buyer against a charge. The charge amount is held pending resolution. The marketplace owner arbitrates by calling the update endpoint.',
            params: [
                { name: 'charge_id', type: 'string', required: true, desc: 'Charge ID to dispute' },
                { name: 'reason', type: 'string', required: true, desc: 'product_not_received | product_unacceptable | fraudulent | duplicate' },
                { name: 'description', type: 'string', required: false, desc: 'Buyer\'s description of the issue' },
            ],
            response: `{ "id": "dis_xxx", "charge_id": "ch_xxx", "status": "OPEN", "reason": "product_not_received", "created_at": "..." }`,
            snippets: {
                node: `await fetch('http://localhost:3005/v1/connect/disputes', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ charge_id: 'ch_xxx', reason: 'product_not_received', description: 'Item never arrived' })
});`,
                python: `requests.post('http://localhost:3005/v1/connect/disputes',
  json={'charge_id': 'ch_xxx', 'reason': 'product_not_received', 'description': 'Item never arrived'},
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl -X POST http://localhost:3005/v1/connect/disputes \\
  -H "Authorization: Bearer MERCHANT_API_KEY" \\
  -d '{"charge_id":"ch_xxx","reason":"product_not_received","description":"Item never arrived"}'`
            }
        },
        {
            id: 'update-dispute',
            method: 'PATCH',
            path: '/v1/connect/disputes/:id',
            title: 'Update / Resolve Dispute',
            description: 'Marketplace owner resolves a dispute. Set status to WON (refund buyer, claw back seller funds) or LOST (release funds to seller). Optionally upload evidence files via the evidence_files endpoint first.',
            params: [
                { name: 'status', type: 'string', required: true, desc: 'WON | LOST | UNDER_REVIEW' },
                { name: 'resolution_notes', type: 'string', required: false, desc: 'Internal notes about the decision' },
            ],
            response: `{ "id": "dis_xxx", "status": "WON", "resolution_notes": "Buyer provided shipping evidence", "resolved_at": "..." }`,
            snippets: {
                node: `await fetch('http://localhost:3005/v1/connect/disputes/dis_xxx', {
  method: 'PATCH',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'WON', resolution_notes: 'Buyer confirmed non-delivery' })
});`,
                python: `requests.patch('http://localhost:3005/v1/connect/disputes/dis_xxx',
  json={'status': 'WON', 'resolution_notes': 'Buyer confirmed non-delivery'},
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl -X PATCH http://localhost:3005/v1/connect/disputes/dis_xxx \\
  -H "Authorization: Bearer MERCHANT_API_KEY" \\
  -d '{"status":"WON","resolution_notes":"Buyer confirmed non-delivery"}'`
            }
        },

        // ── RISK MANAGEMENT ───────────────────────────────────────────────────────
        {
            id: 'risk-rules',
            method: 'GET',
            path: '/v1/connect/risk/rules',
            title: 'List Risk Rules',
            description: 'Retrieve all fraud and risk rules configured for your marketplace. Rules automatically flag or block transactions based on velocity, amount, country, or account status.',
            params: [],
            response: `{
  "rules": [
    { "id": "rule_xxx", "name": "High amount block", "condition": "amount > 50000", "action": "BLOCK", "enabled": true }
  ]
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/risk/rules', {
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY' }
});`,
                python: `res = requests.get('http://localhost:3005/v1/connect/risk/rules',
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl http://localhost:3005/v1/connect/risk/rules \\
  -H "Authorization: Bearer MERCHANT_API_KEY"`
            }
        },
        {
            id: 'create-risk-rule',
            method: 'POST',
            path: '/v1/connect/risk/rules',
            title: 'Create Risk Rule',
            description: 'Define a new automated risk rule. Supports amount thresholds, velocity limits (transactions per hour), country blocklists, and account-status checks.',
            params: [
                { name: 'name', type: 'string', required: true, desc: 'Rule name' },
                { name: 'condition', type: 'string', required: true, desc: 'Rule expression e.g. "amount > 50000" or "tx_per_hour > 20"' },
                { name: 'action', type: 'string', required: true, desc: 'BLOCK | FLAG | NOTIFY' },
                { name: 'enabled', type: 'boolean', required: false, desc: 'Default true' },
            ],
            response: `{ "id": "rule_yyy", "name": "Velocity limit", "condition": "tx_per_hour > 20", "action": "FLAG", "enabled": true }`,
            snippets: {
                node: `await fetch('http://localhost:3005/v1/connect/risk/rules', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Velocity limit', condition: 'tx_per_hour > 20', action: 'FLAG' })
});`,
                python: `requests.post('http://localhost:3005/v1/connect/risk/rules',
  json={'name': 'Velocity limit', 'condition': 'tx_per_hour > 20', 'action': 'FLAG'},
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl -X POST http://localhost:3005/v1/connect/risk/rules \\
  -H "Authorization: Bearer MERCHANT_API_KEY" \\
  -d '{"name":"Velocity limit","condition":"tx_per_hour > 20","action":"FLAG"}'`
            }
        },

        // ── FEE CONFIGURATION ─────────────────────────────────────────────────────
        {
            id: 'fee-tiers',
            method: 'GET',
            path: '/v1/connect/fee-tiers',
            title: 'List Fee Tiers',
            description: 'Retrieve volume-based fee tiers. Sub-merchants automatically move to lower fee brackets as their monthly GMV increases.',
            params: [],
            response: `{
  "tiers": [
    { "id": "tier_1", "min_volume": 0, "max_volume": 10000, "fee_percent": 3.0 },
    { "id": "tier_2", "min_volume": 10001, "max_volume": 100000, "fee_percent": 2.0 },
    { "id": "tier_3", "min_volume": 100001, "max_volume": null, "fee_percent": 1.5 }
  ]
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/fee-tiers', {
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY' }
});`,
                python: `res = requests.get('http://localhost:3005/v1/connect/fee-tiers',
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl http://localhost:3005/v1/connect/fee-tiers \\
  -H "Authorization: Bearer MERCHANT_API_KEY"`
            }
        },
        {
            id: 'per-account-fee-override',
            method: 'POST',
            path: '/v1/connect/accounts/:id/fee-override',
            title: 'Set Per-account Fee Override',
            description: 'Override the platform fee percentage for a specific sub-merchant. Useful for VIP sellers, negotiated rates, or promotional periods.',
            params: [
                { name: 'fee_percent', type: 'number', required: true, desc: 'Custom fee % (0–20)' },
                { name: 'reason', type: 'string', required: false, desc: 'Internal note about why the override was applied' },
                { name: 'expires_at', type: 'string', required: false, desc: 'ISO 8601 date when the override expires' },
            ],
            response: `{ "account_id": "acct_abc123", "fee_percent": 1.0, "reason": "VIP seller", "expires_at": "2026-01-01T00:00:00Z" }`,
            snippets: {
                node: `await fetch('http://localhost:3005/v1/connect/accounts/acct_abc123/fee-override', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ fee_percent: 1.0, reason: 'VIP seller', expires_at: '2026-01-01T00:00:00Z' })
});`,
                python: `requests.post('http://localhost:3005/v1/connect/accounts/acct_abc123/fee-override',
  json={'fee_percent': 1.0, 'reason': 'VIP seller'},
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl -X POST http://localhost:3005/v1/connect/accounts/acct_abc123/fee-override \\
  -H "Authorization: Bearer MERCHANT_API_KEY" \\
  -d '{"fee_percent":1.0,"reason":"VIP seller"}'`
            }
        },

        // ── WEBHOOKS ──────────────────────────────────────────────────────────────
        {
            id: 'register-connect-webhook',
            method: 'POST',
            path: '/v1/connect/webhooks',
            title: 'Register Connect Webhook',
            description: 'Subscribe to Connect platform events. FlapaPay will POST a signed JSON payload to your endpoint when events occur. Sign verification uses HMAC-SHA256 with your webhook secret.',
            params: [
                { name: 'url', type: 'string', required: true, desc: 'HTTPS endpoint that will receive events' },
                { name: 'events', type: 'array', required: true, desc: 'Event types: account.created, kyc.approved, kyc.rejected, payout.completed, payout.failed, charge.completed, dispute.opened, dispute.resolved' },
                { name: 'description', type: 'string', required: false, desc: 'Human-readable label' },
            ],
            response: `{ "id": "wh_xxx", "url": "https://yourapp.com/webhooks/connect", "events": ["kyc.approved", "payout.completed"], "secret": "whsec_xxx" }`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/webhooks', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://yourapp.com/webhooks/connect',
    events: ['kyc.approved', 'kyc.rejected', 'payout.completed', 'payout.failed', 'dispute.opened']
  })
});
const { secret } = await res.json(); // store this securely`,
                python: `res = requests.post('http://localhost:3005/v1/connect/webhooks',
  json={
    'url': 'https://yourapp.com/webhooks/connect',
    'events': ['kyc.approved', 'payout.completed']
  },
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})
secret = res.json()['secret']`,
                curl: `curl -X POST http://localhost:3005/v1/connect/webhooks \\
  -H "Authorization: Bearer MERCHANT_API_KEY" \\
  -d '{"url":"https://yourapp.com/webhooks/connect","events":["kyc.approved","payout.completed"]}'`
            }
        },
        {
            id: 'connect-webhook-events',
            method: 'GET',
            path: '/v1/connect/webhooks/:id/deliveries',
            title: 'Webhook Delivery Logs',
            description: 'Inspect delivery history for a webhook endpoint — request/response bodies, HTTP status codes, and retry attempts. Essential for debugging integration issues.',
            params: [
                { name: 'status', type: 'string', required: false, desc: 'Filter by delivered | failed | pending' },
            ],
            response: `{
  "deliveries": [
    { "id": "del_xxx", "event": "payout.completed", "status": "delivered", "http_status": 200, "delivered_at": "...", "attempts": 1 }
  ]
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/webhooks/wh_xxx/deliveries?status=failed', {
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY' }
});`,
                python: `res = requests.get('http://localhost:3005/v1/connect/webhooks/wh_xxx/deliveries',
  params={'status': 'failed'},
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl "http://localhost:3005/v1/connect/webhooks/wh_xxx/deliveries?status=failed" \\
  -H "Authorization: Bearer MERCHANT_API_KEY"`
            }
        },
        {
            id: 'retry-webhook',
            method: 'POST',
            path: '/v1/connect/webhooks/:id/retry',
            title: 'Retry Failed Webhook Delivery',
            description: 'Immediately retry a specific failed webhook delivery. FlapaPay also automatically retries failed deliveries with exponential backoff (5 attempts, up to 24 hours).',
            params: [
                { name: 'delivery_id', type: 'string', required: true, desc: 'Delivery ID to retry' },
            ],
            response: `{ "delivery_id": "del_xxx", "status": "retrying" }`,
            snippets: {
                node: `await fetch('http://localhost:3005/v1/connect/webhooks/wh_xxx/retry', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ delivery_id: 'del_xxx' })
});`,
                python: `requests.post('http://localhost:3005/v1/connect/webhooks/wh_xxx/retry',
  json={'delivery_id': 'del_xxx'},
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl -X POST http://localhost:3005/v1/connect/webhooks/wh_xxx/retry \\
  -H "Authorization: Bearer MERCHANT_API_KEY" \\
  -d '{"delivery_id":"del_xxx"}'`
            }
        },

        // ── INVITES & ONBOARDING ──────────────────────────────────────────────────
        {
            id: 'create-invite',
            method: 'POST',
            path: '/v1/connect/invites',
            title: 'Create Seller Invite',
            description: 'Generate a one-time invite link that a prospective seller uses to register on your marketplace. The invite pre-populates their email and links their account to your platform.',
            params: [
                { name: 'email', type: 'string', required: true, desc: 'Prospective seller\'s email address' },
                { name: 'business_name', type: 'string', required: false, desc: 'Pre-fill their business name' },
                { name: 'expires_in', type: 'number', required: false, desc: 'Invite validity in seconds (default 604800 = 7 days)' },
                { name: 'metadata', type: 'object', required: false, desc: 'Any key-value data to attach to the invite (e.g., referral source)' },
            ],
            response: `{ "id": "inv_xxx", "email": "seller@example.com", "invite_url": "https://yourmarketplace.com/join?token=abc123", "expires_at": "...", "status": "PENDING" }`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/invites', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'seller@example.com', business_name: 'ABC Suppliers', expires_in: 604800 })
});
const { invite_url } = await res.json();
// Email invite_url to the seller`,
                python: `res = requests.post('http://localhost:3005/v1/connect/invites',
  json={'email': 'seller@example.com', 'business_name': 'ABC Suppliers'},
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})
invite_url = res.json()['invite_url']`,
                curl: `curl -X POST http://localhost:3005/v1/connect/invites \\
  -H "Authorization: Bearer MERCHANT_API_KEY" \\
  -d '{"email":"seller@example.com","business_name":"ABC Suppliers"}'`
            }
        },
        {
            id: 'hosted-onboarding',
            method: 'POST',
            path: '/v1/connect/accounts/:id/onboarding-link',
            title: 'Create Hosted Onboarding Link',
            description: 'Generate a time-limited URL that takes an existing sub-merchant through the FlapaPay hosted onboarding flow (KYC upload, payout method setup, T&C acceptance). Redirect the seller to this URL.',
            params: [
                { name: 'return_url', type: 'string', required: true, desc: 'URL to redirect the seller back to after completing onboarding' },
                { name: 'refresh_url', type: 'string', required: true, desc: 'URL FlapaPay calls if the link expires before completion' },
            ],
            response: `{ "url": "https://connect.flapapay.com/onboard/acs_xxx", "expires_at": 1716003600 }`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/accounts/acct_abc123/onboarding-link', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({
    return_url: 'https://yourapp.com/seller/onboarding-complete',
    refresh_url: 'https://yourapp.com/seller/onboarding-refresh'
  })
});
const { url } = await res.json();
// Redirect the seller to url`,
                python: `res = requests.post('http://localhost:3005/v1/connect/accounts/acct_abc123/onboarding-link',
  json={
    'return_url': 'https://yourapp.com/seller/onboarding-complete',
    'refresh_url': 'https://yourapp.com/seller/onboarding-refresh'
  },
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})
url = res.json()['url']`,
                curl: `curl -X POST http://localhost:3005/v1/connect/accounts/acct_abc123/onboarding-link \\
  -H "Authorization: Bearer MERCHANT_API_KEY" \\
  -d '{"return_url":"https://yourapp.com/seller/onboarding-complete","refresh_url":"https://yourapp.com/seller/onboarding-refresh"}'`
            }
        },

        // ── ANALYTICS & REPORTING ─────────────────────────────────────────────────
        {
            id: 'connect-analytics',
            method: 'GET',
            path: '/v1/connect/analytics',
            title: 'Platform Analytics',
            description: 'Aggregated marketplace analytics: GMV, platform fee revenue, active seller count, payout totals, and dispute rate — broken down by time period.',
            params: [
                { name: 'from', type: 'string', required: false, desc: 'ISO 8601 start date' },
                { name: 'to', type: 'string', required: false, desc: 'ISO 8601 end date' },
                { name: 'granularity', type: 'string', required: false, desc: 'day | week | month (default day)' },
            ],
            response: `{
  "period": { "from": "2025-01-01", "to": "2025-01-31" },
  "gmv": 1250000,
  "platform_revenue": 31250,
  "active_sellers": 38,
  "payouts_total": 1100000,
  "dispute_rate": 0.012,
  "series": [{ "date": "2025-01-01", "gmv": 45000, "revenue": 1125 }]
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/analytics?from=2025-01-01&to=2025-01-31&granularity=day', {
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY' }
});`,
                python: `res = requests.get('http://localhost:3005/v1/connect/analytics',
  params={'from': '2025-01-01', 'to': '2025-01-31', 'granularity': 'day'},
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl "http://localhost:3005/v1/connect/analytics?from=2025-01-01&to=2025-01-31&granularity=day" \\
  -H "Authorization: Bearer MERCHANT_API_KEY"`
            }
        },
        {
            id: 'connect-ledger',
            method: 'GET',
            path: '/v1/connect/accounts/:id/ledger',
            title: 'Account Ledger',
            description: 'Full transaction-by-transaction ledger for a sub-merchant account — credits, debits, fees, payouts, and running balance.',
            params: [
                { name: 'from', type: 'string', required: false, desc: 'ISO 8601 start date' },
                { name: 'to', type: 'string', required: false, desc: 'ISO 8601 end date' },
                { name: 'limit', type: 'number', required: false, desc: 'Default 50, max 500' },
            ],
            response: `{
  "entries": [
    { "id": "led_xxx", "type": "CREDIT", "amount": 950, "fee": 50, "balance_after": 4750, "description": "Payment from customer", "created_at": "..." }
  ],
  "opening_balance": 3800,
  "closing_balance": 4750
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/accounts/acct_abc123/ledger?from=2025-01-01', {
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY' }
});`,
                python: `res = requests.get('http://localhost:3005/v1/connect/accounts/acct_abc123/ledger',
  params={'from': '2025-01-01', 'limit': 100},
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl "http://localhost:3005/v1/connect/accounts/acct_abc123/ledger?from=2025-01-01" \\
  -H "Authorization: Bearer MERCHANT_API_KEY"`
            }
        },
        {
            id: 'export-report',
            method: 'POST',
            path: '/v1/connect/reports/export',
            title: 'Export Report (CSV / PDF)',
            description: 'Queue an async report export for a date range. The response includes a download_url that becomes available once the report is generated (poll GET /v1/connect/reports/:id).',
            params: [
                { name: 'type', type: 'string', required: true, desc: 'transactions | payouts | fees | kyc | disputes' },
                { name: 'format', type: 'string', required: true, desc: 'csv | pdf' },
                { name: 'from', type: 'string', required: true, desc: 'ISO 8601 start date' },
                { name: 'to', type: 'string', required: true, desc: 'ISO 8601 end date' },
                { name: 'account_id', type: 'string', required: false, desc: 'Limit to a single sub-merchant' },
            ],
            response: `{ "report_id": "rpt_xxx", "status": "PENDING", "download_url": null }`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/reports/export', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'transactions', format: 'csv', from: '2025-01-01', to: '2025-01-31' })
});
const { report_id } = await res.json();
// Poll GET /v1/connect/reports/report_id until status === 'READY'`,
                python: `res = requests.post('http://localhost:3005/v1/connect/reports/export',
  json={'type': 'transactions', 'format': 'csv', 'from': '2025-01-01', 'to': '2025-01-31'},
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})
report_id = res.json()['report_id']`,
                curl: `curl -X POST http://localhost:3005/v1/connect/reports/export \\
  -H "Authorization: Bearer MERCHANT_API_KEY" \\
  -d '{"type":"transactions","format":"csv","from":"2025-01-01","to":"2025-01-31"}'`
            }
        },

        // ── SELLER PORTAL ENDPOINTS ───────────────────────────────────────────────
        {
            id: 'portal-login',
            method: 'POST',
            path: '/v1/connect/portal/login',
            title: 'Portal Login (Direct)',
            description: 'Authenticate a sub-merchant directly using email + password if they have standalone portal credentials. Returns a portal_token for subsequent portal API calls. For embedded components, prefer the Account Session flow instead.',
            params: [
                { name: 'email', type: 'string', required: true, desc: 'Sub-merchant email' },
                { name: 'password', type: 'string', required: true, desc: 'Sub-merchant password' },
            ],
            response: `{ "portal_token": "pt_live_...", "account_id": "acct_abc123", "expires_at": 1716003600 }`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/portal/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'seller@example.com', password: 'password' })
});
const { portal_token } = await res.json();`,
                python: `res = requests.post('http://localhost:3005/v1/connect/portal/login',
  json={'email': 'seller@example.com', 'password': 'password'})
portal_token = res.json()['portal_token']`,
                curl: `curl -X POST http://localhost:3005/v1/connect/portal/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"seller@example.com","password":"password"}'`
            }
        },
        {
            id: 'portal-me',
            method: 'GET',
            path: '/v1/connect/portal/me',
            title: 'Portal — Get My Account',
            description: 'Returns the authenticated seller\'s account details — balance, KYC status, business information, and enabled capabilities. This is the primary data source for ConnectBalances and ConnectNotificationBanner.',
            params: [],
            response: `{
  "account_id": "acct_abc123",
  "business_name": "Lusaka Crafts Ltd",
  "email": "seller@example.com",
  "kyc_status": "VERIFIED",
  "status": "ACTIVE",
  "available_balance": 18750.00,
  "pending_balance": 2500.00,
  "currency": "ZMW",
  "capabilities": { "transfers": true, "payouts": true }
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/portal/me', {
  headers: { 'Authorization': 'Bearer PORTAL_TOKEN' }
});`,
                python: `res = requests.get('http://localhost:3005/v1/connect/portal/me',
  headers={'Authorization': 'Bearer PORTAL_TOKEN'})`,
                curl: `curl http://localhost:3005/v1/connect/portal/me \\
  -H "Authorization: Bearer PORTAL_TOKEN"`
            }
        },
        {
            id: 'portal-charges',
            method: 'GET',
            path: '/v1/connect/portal/charges',
            title: 'Portal — My Charges',
            description: 'List transactions processed for the authenticated seller — scoped to their account only. Supports pagination and date filters.',
            params: [
                { name: 'limit', type: 'number', required: false, desc: 'Default 10, max 100' },
                { name: 'offset', type: 'number', required: false, desc: 'Pagination offset' },
            ],
            response: `{ "charges": [{ "id": "ch_xxx", "amount": 500, "currency": "ZMW", "status": "COMPLETED", "created_at": "..." }], "total": 42 }`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/portal/charges?limit=10', {
  headers: { 'Authorization': 'Bearer PORTAL_TOKEN' }
});`,
                python: `res = requests.get('http://localhost:3005/v1/connect/portal/charges?limit=10',
  headers={'Authorization': 'Bearer PORTAL_TOKEN'})`,
                curl: `curl "http://localhost:3005/v1/connect/portal/charges?limit=10" \\
  -H "Authorization: Bearer PORTAL_TOKEN"`
            }
        },
        {
            id: 'portal-payouts',
            method: 'GET',
            path: '/v1/connect/portal/payouts',
            title: 'Portal — My Payouts',
            description: 'List payout history for the authenticated seller. Shows amount, destination network, and status.',
            params: [
                { name: 'limit', type: 'number', required: false, desc: 'Default 10' },
            ],
            response: `{ "payouts": [{ "id": "po_xxx", "amount": 2000, "currency": "ZMW", "status": "COMPLETED", "method": "MTN_MOMO", "created_at": "..." }] }`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/portal/payouts?limit=10', {
  headers: { 'Authorization': 'Bearer PORTAL_TOKEN' }
});`,
                python: `res = requests.get('http://localhost:3005/v1/connect/portal/payouts?limit=10',
  headers={'Authorization': 'Bearer PORTAL_TOKEN'})`,
                curl: `curl "http://localhost:3005/v1/connect/portal/payouts?limit=10" \\
  -H "Authorization: Bearer PORTAL_TOKEN"`
            }
        },
        {
            id: 'portal-payout-request',
            method: 'POST',
            path: '/v1/connect/portal/payout-requests',
            title: 'Portal — Request Payout',
            description: 'Seller initiates a withdrawal of their available balance to their registered payout method. The marketplace owner reviews and approves via the Connect Dashboard, or auto-approval fires if auto_payout_enabled.',
            params: [
                { name: 'amount', type: 'number', required: false, desc: 'Amount to withdraw — defaults to full available balance' },
                { name: 'currency', type: 'string', required: false, desc: 'Default: account currency (ZMW)' },
            ],
            response: `{ "id": "pr_xxx", "amount": 18750.00, "currency": "ZMW", "status": "PENDING", "created_at": "..." }`,
            snippets: {
                node: `await fetch('http://localhost:3005/v1/connect/portal/payout-requests', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer PORTAL_TOKEN', 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 5000, currency: 'ZMW' })
});`,
                python: `requests.post('http://localhost:3005/v1/connect/portal/payout-requests',
  json={'amount': 5000, 'currency': 'ZMW'},
  headers={'Authorization': 'Bearer PORTAL_TOKEN'})`,
                curl: `curl -X POST http://localhost:3005/v1/connect/portal/payout-requests \\
  -H "Authorization: Bearer PORTAL_TOKEN" \\
  -d '{"amount":5000,"currency":"ZMW"}'`
            }
        },
        {
            id: 'portal-statements',
            method: 'GET',
            path: '/v1/connect/portal/statements',
            title: 'Portal — Account Statements',
            description: 'Monthly account statements for the seller — downloadable as PDF. Each statement summarises opening balance, credits, debits, fees, payouts, and closing balance.',
            params: [
                { name: 'year', type: 'number', required: false, desc: 'Filter by year (e.g., 2025)' },
                { name: 'month', type: 'number', required: false, desc: 'Filter by month (1–12)' },
            ],
            response: `{ "statements": [{ "id": "stmt_xxx", "period": "2025-01", "download_url": "https://...", "status": "READY" }] }`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/portal/statements?year=2025', {
  headers: { 'Authorization': 'Bearer PORTAL_TOKEN' }
});`,
                python: `res = requests.get('http://localhost:3005/v1/connect/portal/statements',
  params={'year': 2025},
  headers={'Authorization': 'Bearer PORTAL_TOKEN'})`,
                curl: `curl "http://localhost:3005/v1/connect/portal/statements?year=2025" \\
  -H "Authorization: Bearer PORTAL_TOKEN"`
            }
        },

        // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
        {
            id: 'connect-notifications',
            method: 'GET',
            path: '/v1/connect/notifications',
            title: 'List Platform Notifications',
            description: 'Retrieve notifications for the marketplace owner — KYC review alerts, payout completions, disputes opened, and risk events. Supports unread-only filtering.',
            params: [
                { name: 'unread_only', type: 'boolean', required: false, desc: 'Return only unread notifications' },
                { name: 'limit', type: 'number', required: false, desc: 'Default 20' },
            ],
            response: `{
  "notifications": [
    { "id": "notif_xxx", "type": "kyc.submitted", "message": "Lusaka Crafts Ltd submitted a National ID", "read": false, "created_at": "..." }
  ],
  "unread_count": 4
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/connect/notifications?unread_only=true', {
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY' }
});`,
                python: `res = requests.get('http://localhost:3005/v1/connect/notifications',
  params={'unread_only': True},
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl "http://localhost:3005/v1/connect/notifications?unread_only=true" \\
  -H "Authorization: Bearer MERCHANT_API_KEY"`
            }
        },
        {
            id: 'mark-notification-read',
            method: 'PATCH',
            path: '/v1/connect/notifications/:id/read',
            title: 'Mark Notification as Read',
            description: 'Mark a single notification as read, or pass { all: true } in the body to mark all as read.',
            params: [
                { name: 'all', type: 'boolean', required: false, desc: 'Set to true to mark ALL notifications as read' },
            ],
            response: `{ "updated": 1 }`,
            snippets: {
                node: `// Mark one
await fetch('http://localhost:3005/v1/connect/notifications/notif_xxx/read', {
  method: 'PATCH',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY' }
});

// Mark all
await fetch('http://localhost:3005/v1/connect/notifications/all/read', {
  method: 'PATCH',
  headers: { 'Authorization': 'Bearer MERCHANT_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ all: true })
});`,
                python: `requests.patch('http://localhost:3005/v1/connect/notifications/notif_xxx/read',
  headers={'Authorization': 'Bearer MERCHANT_API_KEY'})`,
                curl: `curl -X PATCH http://localhost:3005/v1/connect/notifications/notif_xxx/read \\
  -H "Authorization: Bearer MERCHANT_API_KEY"`
            }
        },
    ];

    const LANG_LABELS: Record<string, string> = { node: 'Node.js', python: 'Python', curl: 'cURL' };

    const renderEndpointCard = (endpoint: any) => {
        const lang = getLang(endpoint.id);
        const code = endpoint.snippets[lang] || endpoint.snippets.node;
        return (
            <div key={endpoint.id} id={endpoint.id} className="rounded-2xl border border-gray-800 bg-gray-950 overflow-hidden shadow-xl">
                {/* Card Header */}
                <div className="flex flex-wrap items-center gap-3 px-6 py-4 bg-gray-900 border-b border-gray-800">
                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-md ${methodBadge(endpoint.method)}`}>
                        {endpoint.method}
                    </span>
                    <code className="text-sm font-mono text-gray-200 bg-black/40 px-3 py-1 rounded-lg border border-gray-800">
                        {endpoint.path}
                    </code>
                    <span className="font-black text-white text-base flex-1">{endpoint.title}</span>
                    {endpoint.badge && (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 uppercase tracking-widest">
                            {endpoint.badge}
                        </span>
                    )}
                </div>

                <div className="grid lg:grid-cols-[1fr_1fr] divide-y lg:divide-y-0 lg:divide-x divide-gray-800">
                    {/* Left: description + params + response */}
                    <div className="p-6 space-y-6 overflow-hidden">
                        <p className="text-gray-400 leading-relaxed text-[15px]">{endpoint.description}</p>

                        {endpoint.params.length > 0 && (
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="w-4 h-px bg-gray-700 inline-block"></span>
                                    Parameters
                                </p>
                                <div className="rounded-xl border border-gray-800 overflow-hidden">
                                    {endpoint.params.map((p: any, i: number) => (
                                        <div key={p.name} className={`flex items-start gap-4 px-4 py-3 ${i % 2 === 0 ? 'bg-black/20' : 'bg-transparent'}`}>
                                            <div className="shrink-0 pt-0.5">
                                                <code className="text-orange-400 text-xs font-bold">{p.name}</code>
                                            </div>
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[10px] font-bold text-gray-500 bg-gray-800/80 px-2 py-0.5 rounded">{p.type}</span>
                                                    {p.required
                                                        ? <span className="text-[10px] font-black text-red-400 uppercase tracking-wider">Required</span>
                                                        : <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Optional</span>
                                                    }
                                                </div>
                                                <p className="text-xs text-gray-400 leading-relaxed">{p.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-4 h-px bg-gray-700 inline-block"></span>
                                Response
                            </p>
                            <div className="relative">
                                <pre className="p-4 rounded-xl bg-black border border-gray-800 text-xs text-emerald-400 font-mono overflow-x-auto leading-relaxed max-h-64 scrollbar-thin">
                                    {endpoint.response}
                                </pre>
                                <button
                                    onClick={() => copyCode(endpoint.response, `${endpoint.id}-res`)}
                                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-gray-800/80 text-gray-500 hover:text-white transition-colors"
                                >
                                    {copiedCode === `${endpoint.id}-res` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: code tabs */}
                    <div className="p-6 flex flex-col gap-4 bg-black/30">
                        {/* Language selector */}
                        <div className="flex items-center gap-1.5 bg-gray-900 rounded-xl p-1 border border-gray-800 self-start">
                            {(['node', 'python', 'curl'] as const).map(l => (
                                <button
                                    key={l}
                                    onClick={() => setLang(endpoint.id, l)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${lang === l ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {LANG_LABELS[l]}
                                </button>
                            ))}
                        </div>

                        <div className="relative flex-1">
                            <div className="flex items-center justify-between px-4 py-2 bg-gray-900 rounded-t-xl border border-gray-800 border-b-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/60"></div>
                                </div>
                                <span className="text-[10px] text-gray-600 font-bold">{LANG_LABELS[lang]}</span>
                                <button
                                    onClick={() => copyCode(code, `${endpoint.id}-code`)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors text-[10px] font-bold"
                                >
                                    {copiedCode === `${endpoint.id}-code` ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                                </button>
                            </div>
                            <pre className="p-4 rounded-b-xl bg-black border border-gray-800 text-sm font-mono text-gray-300 overflow-x-auto leading-relaxed min-h-[200px]">
                                {code}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const SectionHeader = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) => (
        <div className="flex items-start gap-4 mb-10 pb-6 border-b border-gray-800">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0 mt-1">
                {icon}
            </div>
            <div>
                <h2 className="text-2xl font-black text-white">{title}</h2>
                {subtitle && <p className="text-gray-500 text-sm mt-1 font-medium">{subtitle}</p>}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#080808] font-sans">
            <Navbar />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="relative border-b border-gray-800/60 py-20 bg-gradient-to-b from-gray-950 to-[#080808] overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-20 left-1/3 w-[700px] h-[700px] bg-orange-600/6 rounded-full blur-[120px]"></div>
                        <div className="absolute top-10 right-1/4 w-[400px] h-[400px] bg-yellow-500/5 rounded-full blur-[80px]"></div>
                        {/* Grid lines */}
                        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',backgroundSize:'60px 60px'}}></div>
                    </div>

                    <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="flex flex-col lg:flex-row items-center gap-12">
                            <div className="flex-1 text-left">
                                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6">
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-orange-400 mr-2 animate-pulse"></span>
                                    <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">API v1 — Live</span>
                                </div>
                                <h1 className="text-5xl lg:text-6xl font-black text-white mb-5 leading-tight tracking-tight">
                                    Build anything<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">with FlapaPay</span>
                                </h1>
                                <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-xl">
                                    Complete API reference, integration guides, and code examples for payments, subscriptions, marketplace payouts, virtual cards, and more.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {[
                                        { label: 'Quick Start', href: '#quickstart' },
                                        { label: 'Checkout', href: '#checkout' },
                                        { label: 'Connect', href: '#connect' },
                                        { label: 'Webhooks', href: '#webhooks' },
                                    ].map(l => (
                                        <a key={l.label} href={l.href}
                                            className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 text-sm font-bold hover:border-orange-500/60 hover:text-white transition-all">
                                            {l.label}
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Hero code preview */}
                            <div className="w-full lg:w-[480px] shrink-0">
                                <div className="rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
                                    <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-600">quickstart.js</span>
                                        <button onClick={() => copyCode(codeExamples.createPayment, 'hero')} className="text-[10px] font-bold text-gray-500 hover:text-orange-400 transition-colors flex items-center gap-1">
                                            {copiedCode === 'hero' ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                                        </button>
                                    </div>
                                    <pre className="p-5 text-xs font-mono text-gray-300 bg-black leading-relaxed overflow-x-auto">
                                        {`import { loadFlapaPay } from '@flapapay/sdk';

const flapa = loadFlapaPay(process.env.FLAPAPAY_SECRET_KEY);

// Create a checkout session
const session = await flapa.checkout.sessions.create({
  mode: 'payment',
  line_items: [{ price: 'price_xxx', quantity: 1 }],
  success_url: 'https://yourapp.com/success',
  cancel_url:  'https://yourapp.com/cancel',
});

// → Redirect your customer
window.location.href = session.url;`}
                                    </pre>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    {[
                                        { label: 'REST API', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                                        { label: 'Node.js SDK', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                                        { label: 'Python SDK', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
                                        { label: 'React SDK', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
                                    ].map(t => (
                                        <span key={t.label} className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${t.color}`}>{t.label}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Status bar */}
                <div className="border-b border-gray-800/60 bg-gray-950">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 py-3 flex items-center justify-between gap-6 flex-wrap">
                        <div className="flex items-center gap-6 flex-wrap">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span className="text-xs font-bold text-gray-300">All Systems Operational</span>
                            </div>
                            <span className="text-gray-700 hidden md:block">|</span>
                            {[
                                { label: 'API Uptime', val: '99.99%', color: 'text-emerald-400' },
                                { label: 'Avg Latency', val: '42ms', color: 'text-blue-400' },
                                { label: 'API Version', val: 'v1', color: 'text-orange-400' },
                            ].map(s => (
                                <span key={s.label} className="text-xs text-gray-500 hidden md:block">
                                    {s.label}: <span className={`font-bold ${s.color}`}>{s.val}</span>
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                                <input
                                    type="text"
                                    placeholder="Search docs..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-8 pr-4 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 w-48 transition-all"
                                />
                            </div>
                            <a href="/status" className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors">
                                Status <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Main two-column layout */}
                <div className="mx-auto max-w-[1400px] flex min-h-[calc(100vh-80px)]">
                    {/* ─── Sidebar ─── */}
                    <aside className="hidden xl:flex w-72 shrink-0 flex-col">
                        <div className="sticky top-20 h-[calc(100vh-80px)] overflow-y-auto py-8 px-5 border-r border-gray-800/60 scrollbar-thin">
                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-5 px-2">Documentation</p>
                            <nav className="space-y-1">
                                {[
                                    { id: 'introduction', label: 'Introduction', icon: <Book className="w-4 h-4" />, anchor: '#introduction' },
                                    { id: 'quickstart', label: 'Quick Start', icon: <Zap className="w-4 h-4" />, anchor: '#quickstart' },
                                    { id: 'authentication', label: 'Authentication', icon: <Key className="w-4 h-4" />, anchor: '#auth' },
                                    { id: 'checkout', label: 'Checkout Sessions', icon: <CreditCard className="w-4 h-4" />, anchor: '#checkout', count: checkoutEndpoints.length },
                                    { id: 'escrow', label: 'Escrow', icon: <Shield className="w-4 h-4" />, anchor: '#escrow', count: escrowEndpoints.length },
                                    { id: 'connect', label: 'Connect / Marketplace', icon: <Globe className="w-4 h-4" />, anchor: '#connect', count: connectEndpoints.length },
                                    { id: 'webhooks', label: 'Webhooks', icon: <Webhook className="w-4 h-4" />, anchor: '#webhooks' },
                                    { id: 'subscriptions', label: 'Subscriptions', icon: <RefreshCw className="w-4 h-4" />, anchor: '#subscriptions' },
                                    { id: 'sdks', label: 'SDKs', icon: <Code className="w-4 h-4" />, anchor: '#sdks' },
                                ].map(item => (
                                    <a key={item.id} href={item.anchor}
                                        onClick={() => setActiveSection(item.id)}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${
                                            activeSection === item.id
                                                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                                : 'text-gray-500 hover:text-gray-200 hover:bg-gray-900'
                                        }`}>
                                        <div className="flex items-center gap-2.5">
                                            <span className={activeSection === item.id ? 'text-orange-400' : 'text-gray-600 group-hover:text-gray-400'}>
                                                {item.icon}
                                            </span>
                                            {item.label}
                                        </div>
                                        {item.count && (
                                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-gray-800 text-gray-500">{item.count}</span>
                                        )}
                                    </a>
                                ))}
                            </nav>

                            {/* Base URL box */}
                            <div className="mt-8 p-4 rounded-2xl bg-gray-900/80 border border-gray-800">
                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Base URL</p>
                                <code className="text-xs font-mono text-orange-400">https://api.flapapay.com</code>
                                <p className="text-[10px] text-gray-600 mt-2">Test: <code className="text-gray-500">https://sandbox.flapapay.com</code></p>
                            </div>

                            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-orange-500/8 to-yellow-500/8 border border-orange-500/15">
                                <p className="text-sm font-black text-white mb-1">Need help?</p>
                                <p className="text-xs text-gray-500 mb-3 leading-relaxed">Our developer support team responds within 2 hours on business days.</p>
                                <a href="/contact" className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1.5 transition-colors">
                                    Contact support <ChevronRight className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </aside>

                    {/* ─── Content ─── */}
                    <div className="flex-1 min-w-0 px-6 lg:px-10 py-12 space-y-24">

                        {/* ── INTRODUCTION ─────────────────────────── */}
                        <section id="introduction">
                            <SectionHeader icon={<Book className="w-5 h-5" />} title="Introduction" subtitle="Everything you need to know to get started with FlapaPay APIs" />
                            <div className="grid md:grid-cols-3 gap-5 mb-8">
                                {[
                                    { icon: <Globe className="w-5 h-5" />, title: '50+ Countries', desc: 'Accept payments globally with local payment methods' },
                                    { icon: <Shield className="w-5 h-5" />, title: 'PCI-DSS Level 1', desc: 'Bank-grade security for every transaction' },
                                    { icon: <Zap className="w-5 h-5" />, title: '<100ms API', desc: 'Sub-100ms median response time worldwide' },
                                ].map((item, i) => (
                                    <div key={i} className="p-5 rounded-2xl bg-gray-950 border border-gray-800 hover:border-gray-700 transition-colors">
                                        <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-4">{item.icon}</div>
                                        <p className="font-black text-white mb-1">{item.title}</p>
                                        <p className="text-sm text-gray-500">{item.desc}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6">
                                <p className="text-gray-400 leading-relaxed text-[15px] mb-4">
                                    FlapaPay is a complete financial infrastructure platform. You can use it to build any kind of payments product — from a simple e-commerce checkout to a complex multi-sided marketplace with embedded seller portals.
                                </p>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {[
                                        { title: 'Payments & Checkout', desc: 'One-time and recurring payments, checkout sessions, payment links' },
                                        { title: 'Connect / Marketplace', desc: 'Onboard sellers, split payments, embedded portals, KYC' },
                                        { title: 'Virtual Cards', desc: 'Issue and control prepaid virtual Visa/Mastercard cards' },
                                        { title: 'Escrow', desc: 'Hold funds securely with buyer/seller dispute resolution' },
                                    ].map((f, i) => (
                                        <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-black/30 border border-gray-800/60">
                                            <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0"></div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{f.title}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* ── QUICK START ───────────────────────────── */}
                        <section id="quickstart">
                            <SectionHeader icon={<Zap className="w-5 h-5" />} title="Quick Start" subtitle="Go from zero to accepting payments in under 5 minutes" />
                            <div className="space-y-5">
                                {[
                                    {
                                        step: '01', title: 'Get your API keys',
                                        desc: 'Create an account and grab your test and live keys from the Dashboard → Developers → API Keys.',
                                        code: '# Test key prefix\nsk_test_flp_...\n\n# Live key prefix\nsk_live_flp_...',
                                        lang: 'bash'
                                    },
                                    {
                                        step: '02', title: 'Install the SDK',
                                        desc: 'Install the Node.js SDK, or use the REST API directly from any language.',
                                        code: 'npm install @flapapay/sdk\n\n# or\nyarn add @flapapay/sdk',
                                        lang: 'bash'
                                    },
                                    {
                                        step: '03', title: 'Initialize the client',
                                        desc: 'Import the SDK and initialize with your secret key. Never expose your secret key client-side.',
                                        code: codeExamples.init,
                                        lang: 'js'
                                    },
                                    {
                                        step: '04', title: 'Create your first checkout session',
                                        desc: 'Server-side: create a session and redirect your customer to session.url to complete payment.',
                                        code: codeExamples.createPayment,
                                        lang: 'js'
                                    },
                                ].map((s, i) => (
                                    <div key={i} className="flex gap-5">
                                        <div className="shrink-0 flex flex-col items-center">
                                            <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 text-xs font-black">{s.step}</div>
                                            {i < 3 && <div className="w-px flex-1 bg-gray-800 mt-2 min-h-[20px]"></div>}
                                        </div>
                                        <div className="flex-1 pb-6">
                                            <p className="font-black text-white mb-1 text-base">{s.title}</p>
                                            <p className="text-sm text-gray-500 mb-3 leading-relaxed">{s.desc}</p>
                                            <div className="relative">
                                                <div className="flex items-center justify-between px-4 py-2 bg-gray-900 rounded-t-xl border border-gray-800 border-b-0">
                                                    <span className="text-[10px] font-bold text-gray-600 uppercase">{s.lang}</span>
                                                    <button onClick={() => copyCode(s.code, `qs-${i}`)} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-orange-400 transition-colors">
                                                        {copiedCode === `qs-${i}` ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                                                    </button>
                                                </div>
                                                <pre className="p-4 rounded-b-xl bg-black border border-gray-800 text-sm font-mono text-gray-300 overflow-x-auto leading-relaxed">{s.code}</pre>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* ── AUTHENTICATION ────────────────────────── */}
                        <section id="auth">
                            <SectionHeader icon={<Key className="w-5 h-5" />} title="Authentication" subtitle="How to authenticate every request to the FlapaPay API" />
                            <div className="space-y-5">
                                <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6">
                                    <p className="text-gray-400 leading-relaxed mb-5">
                                        All API requests are authenticated using a Bearer token in the <code className="text-orange-400 text-sm bg-black/50 px-1.5 py-0.5 rounded">Authorization</code> header.
                                        Use your <span className="text-white font-bold">secret key</span> server-side and your <span className="text-white font-bold">publishable key</span> client-side.
                                    </p>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {[
                                            { label: 'Secret Key (server-side only)', prefix: 'sk_test_flp_... / sk_live_flp_...', color: 'border-red-500/20 bg-red-500/5', note: 'Never expose in browser or mobile code' },
                                            { label: 'Publishable Key (client-side)', prefix: 'pk_test_flp_... / pk_live_flp_...', color: 'border-blue-500/20 bg-blue-500/5', note: 'Safe to embed in your frontend' },
                                        ].map((k, i) => (
                                            <div key={i} className={`p-4 rounded-xl border ${k.color}`}>
                                                <p className="text-xs font-black text-white mb-2">{k.label}</p>
                                                <code className="text-xs font-mono text-gray-400">{k.prefix}</code>
                                                <p className="text-[11px] text-gray-600 mt-2">{k.note}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="relative">
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 rounded-t-2xl border border-gray-800 border-b-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">HTTP Header</span>
                                        </div>
                                        <button onClick={() => copyCode(`Authorization: Bearer sk_test_flp_xxxxxxxxxxxx`, 'auth-header')} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-orange-400 transition-colors">
                                            {copiedCode === 'auth-header' ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                                        </button>
                                    </div>
                                    <pre className="p-5 rounded-b-2xl bg-black border border-gray-800 font-mono text-sm leading-loose">
                                        <span className="text-blue-400">Authorization</span><span className="text-gray-500">: </span><span className="text-emerald-400">Bearer sk_test_flp_xxxxxxxxxxxx</span>{'\n'}
                                        <span className="text-blue-400">Content-Type</span><span className="text-gray-500">: </span><span className="text-emerald-400">application/json</span>{'\n'}
                                        <span className="text-gray-600"># Test mode header (optional)</span>{'\n'}
                                        <span className="text-blue-400">x-flapapay-test-mode</span><span className="text-gray-500">: </span><span className="text-emerald-400">true</span>
                                    </pre>
                                </div>
                                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
                                    <span className="text-amber-400 text-xl mt-0.5">⚠</span>
                                    <div>
                                        <p className="text-sm font-bold text-amber-300 mb-1">Test vs Live Mode</p>
                                        <p className="text-xs text-gray-400 leading-relaxed">Test keys (sk_test_flp_...) work with test card numbers and simulate mobile money without moving real money. Switch to live keys when you're ready to accept real payments. You can also pass <code className="text-amber-400">x-flapapay-test-mode: true</code> with any key to force test mode.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ── CHECKOUT SESSIONS ─────────────────────── */}
                        <section id="checkout">
                            <SectionHeader
                                icon={<CreditCard className="w-5 h-5" />}
                                title="Checkout Sessions"
                                subtitle="Create hosted checkout pages, subscriptions, and marketplace splits"
                            />

                            {/* Conceptual flow diagram */}
                            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6 mb-8">
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-5">How it works</p>
                                <div className="flex flex-wrap items-center gap-2">
                                    {[
                                        { step: 'Your Server', note: 'Creates the session', color: 'bg-blue-500/10 border-blue-500/25 text-blue-300' },
                                        { step: '→', note: '', color: '' },
                                        { step: 'FlapaPay API', note: 'Returns session.url', color: 'bg-orange-500/10 border-orange-500/25 text-orange-300' },
                                        { step: '→', note: '', color: '' },
                                        { step: 'Customer Browser', note: 'Redirected to checkout', color: 'bg-purple-500/10 border-purple-500/25 text-purple-300' },
                                        { step: '→', note: '', color: '' },
                                        { step: 'Your success_url', note: 'Verify via webhook', color: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' },
                                    ].map((item, i) => item.step === '→' ? (
                                        <span key={i} className="text-gray-600 text-xl font-bold hidden sm:block">→</span>
                                    ) : (
                                        <div key={i} className={`px-4 py-3 rounded-xl border text-center ${item.color}`}>
                                            <p className="text-xs font-black">{item.step}</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5">{item.note}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                {checkoutEndpoints.map(renderEndpointCard)}
                            </div>
                        </section>

                        {/* ── ESCROW ────────────────────────────────── */}
                        <section id="escrow">
                            <SectionHeader icon={<Shield className="w-5 h-5" />} title="Escrow Service" subtitle="Hold funds securely with buyer/seller protection and dispute resolution" />
                            <div className="space-y-6">
                                {escrowEndpoints.map(ep => renderEndpointCard({ ...ep, badge: null }))}
                            </div>
                        </section>

                        {/* ── CONNECT / MARKETPLACE ─────────────────── */}
                        <section id="connect">
                            <SectionHeader icon={<Globe className="w-5 h-5" />} title="Connect — Marketplace API" subtitle="Onboard sellers, split payments, manage KYC, and embed seller portals" />

                            {/* Architecture overview */}
                            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6 mb-8">
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Architecture</p>
                                <pre className="text-[11px] font-mono text-gray-500 leading-relaxed overflow-x-auto">{`Your Platform (marketplace owner)
    │
    ├─ POST /v1/connect/accounts              → Create sub-merchant accounts
    ├─ POST /v1/checkout/sessions             → Split payments with transfer_data
    ├─ POST /v1/connect/account_sessions      → Create client_secret for seller
    │
    └─ Seller's Browser (embedded)
           │
           └─ loadFlapaConnect({ fetchClientSecret })
                  │
                  ├─ <ConnectBalances />       → Balance + KYC status
                  ├─ <ConnectPayments />        → Transaction history
                  ├─ <ConnectPayouts />         → Payout requests
                  └─ <ConnectDocuments />       → KYC document upload`}</pre>
                                <div className="mt-4 grid sm:grid-cols-3 gap-3">
                                    {[
                                        { label: 'Test Mode Header', val: 'x-flapapay-test-mode: true' },
                                        { label: 'Platform Auth', val: 'Bearer sk_test_flp_...' },
                                        { label: 'Portal Auth', val: 'Bearer pt_live_...' },
                                    ].map((h, i) => (
                                        <div key={i} className="p-3 rounded-xl bg-black border border-gray-800">
                                            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">{h.label}</p>
                                            <code className="text-xs font-mono text-orange-400">{h.val}</code>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                {connectEndpoints.map(renderEndpointCard)}
                            </div>
                        </section>

                        {/* ── WEBHOOKS ──────────────────────────────── */}
                        <section id="webhooks">
                            <SectionHeader icon={<Webhook className="w-5 h-5" />} title="Webhooks" subtitle="Receive real-time event notifications when things happen in your account" />
                            <div className="space-y-5 mb-8">
                                <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6">
                                    <p className="text-gray-400 leading-relaxed text-[15px] mb-5">
                                        Webhooks are HTTP POST requests that FlapaPay sends to your server when an event occurs. Always verify the <code className="text-orange-400 bg-black/50 px-1.5 py-0.5 rounded text-sm">flapapay-signature</code> header before processing.
                                    </p>

                                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Event types</p>
                                    <div className="grid sm:grid-cols-2 gap-2 mb-5">
                                        {[
                                            { event: 'checkout.session.completed', desc: 'Customer completed checkout' },
                                            { event: 'payment_intent.succeeded', desc: 'Payment confirmed' },
                                            { event: 'payment_intent.payment_failed', desc: 'Payment failed' },
                                            { event: 'invoice.payment_succeeded', desc: 'Subscription payment succeeded' },
                                            { event: 'invoice.payment_failed', desc: 'Subscription payment failed' },
                                            { event: 'customer.subscription.created', desc: 'New subscription started' },
                                            { event: 'customer.subscription.deleted', desc: 'Subscription cancelled' },
                                            { event: 'account.created', desc: 'New sub-merchant registered' },
                                            { event: 'payout.completed', desc: 'Seller payout succeeded' },
                                            { event: 'payout.failed', desc: 'Seller payout failed' },
                                            { event: 'kyc.approved', desc: 'KYC document approved' },
                                            { event: 'dispute.opened', desc: 'Dispute created' },
                                        ].map((e, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-gray-800/60">
                                                <code className="text-xs text-orange-400 font-mono shrink-0">{e.event}</code>
                                                <span className="text-xs text-gray-500">— {e.desc}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="relative">
                                        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 rounded-t-xl border border-gray-800 border-b-0">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">Webhook Handler — Node.js</span>
                                            <button onClick={() => copyCode(codeExamples.webhook, 'webhook-main')} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-orange-400 transition-colors">
                                                {copiedCode === 'webhook-main' ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                                            </button>
                                        </div>
                                        <pre className="p-5 rounded-b-xl bg-black border border-gray-800 text-sm font-mono text-gray-300 overflow-x-auto leading-relaxed">{codeExamples.webhook}</pre>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ── SUBSCRIPTIONS PLAYGROUND ──────────────── */}
                        <section id="subscriptions">
                            <SectionHeader icon={<RefreshCw className="w-5 h-5" />} title="Subscription Billing" subtitle="Products, Prices, Customers, and recurring billing cycles" />
                            <div className="grid lg:grid-cols-[1fr_380px] gap-6">
                                <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6 space-y-5">
                                    <p className="text-gray-400 leading-relaxed">
                                        Subscription billing revolves around three objects: <span className="text-white font-bold">Products</span> (what you sell), <span className="text-white font-bold">Prices</span> (how much and how often), and <span className="text-white font-bold">Customers</span>. When a customer completes a subscription checkout, FlapaPay automatically creates a <span className="text-white font-bold">Subscription</span> and charges them on the billing interval.
                                    </p>
                                    <div className="grid sm:grid-cols-3 gap-3">
                                        {[
                                            { label: 'Product', icon: '📦', desc: 'POST /v1/products' },
                                            { label: 'Price', icon: '💰', desc: 'POST /v1/prices' },
                                            { label: 'Subscribe', icon: '🔄', desc: 'Checkout mode: subscription' },
                                        ].map((s, i) => (
                                            <div key={i} className="p-4 rounded-xl bg-black/40 border border-gray-800 text-center">
                                                <div className="text-2xl mb-2">{s.icon}</div>
                                                <p className="text-sm font-black text-white">{s.label}</p>
                                                <code className="text-[10px] text-gray-500 font-mono">{s.desc}</code>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Playground */}
                                <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-b from-orange-500/5 to-transparent p-6">
                                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-4">Live API Playground</p>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 mb-1.5 block">API Key</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={pgApiKey}
                                                    onChange={e => setPgApiKey(e.target.value)}
                                                    placeholder="sk_test_flp_..."
                                                    className="flex-1 px-3 py-2 rounded-xl bg-black border border-gray-800 text-white text-xs font-mono placeholder-gray-600 focus:outline-none focus:border-orange-500/60"
                                                />
                                                <button onClick={() => setPgApiKey(testApiKey)} className="px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-black hover:bg-orange-500/20 transition-colors">
                                                    Fill
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 mb-1.5 block">Price ID</label>
                                            <input
                                                type="text"
                                                value={pgPriceId}
                                                onChange={e => setPgPriceId(e.target.value)}
                                                placeholder="price_xxx"
                                                className="w-full px-3 py-2 rounded-xl bg-black border border-gray-800 text-white text-xs font-mono placeholder-gray-600 focus:outline-none focus:border-orange-500/60"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 mb-1.5 block">Customer Email</label>
                                            <input
                                                type="email"
                                                value={pgEmail}
                                                onChange={e => setPgEmail(e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl bg-black border border-gray-800 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-orange-500/60"
                                            />
                                        </div>
                                        <button
                                            onClick={runPlayground}
                                            disabled={pgLoading}
                                            className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm font-black hover:bg-orange-600 transition-all disabled:opacity-50"
                                        >
                                            {pgLoading ? 'Creating session...' : 'Create Checkout Session →'}
                                        </button>
                                        {pgResult && (
                                            <div className={`rounded-xl border p-3 ${pgResult.error ? 'border-red-500/30 bg-red-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
                                                <p className="text-[10px] font-black uppercase tracking-widest mb-2 ${pgResult.error ? 'text-red-400' : 'text-emerald-400'}">
                                                    {pgResult.error ? 'Error' : 'Success'}
                                                </p>
                                                <pre className="text-[11px] font-mono text-gray-300 overflow-x-auto leading-relaxed">
                                                    {JSON.stringify(pgResult, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ── SDKs ──────────────────────────────────── */}
                        <section id="sdks">
                            <SectionHeader icon={<Code className="w-5 h-5" />} title="SDKs & Libraries" subtitle="Official client libraries — install and ship in minutes" />

                            {/* Live SDKs */}
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Available now</p>
                            <div className="grid sm:grid-cols-3 gap-4 mb-8">
                                {/* Node.js */}
                                <div className="p-5 rounded-2xl border border-emerald-800/40 bg-emerald-950/20 hover:border-emerald-700/60 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-emerald-500/10 text-emerald-400">⬢</div>
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">v1.0.0 · stable</span>
                                    </div>
                                    <p className="font-black text-white mb-0.5">Node.js</p>
                                    <p className="text-[11px] text-gray-400 mb-3">TypeScript-first. Generics, retries, webhooks.</p>
                                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-black border border-gray-800 mb-3">
                                        <code className="text-[11px] text-gray-300 font-mono">npm install @flapapay/node</code>
                                        <button onClick={() => copyCode('npm install @flapapay/node', 'sdk-node')} className="ml-2 shrink-0 p-1 rounded text-gray-600 hover:text-white transition-colors">
                                            {copiedCode === 'sdk-node' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                    </div>
                                    <div className="rounded-lg bg-black border border-gray-800 p-3">
                                        <pre className="text-[10px] text-gray-300 font-mono leading-relaxed overflow-x-auto">{`import { FlapaPay } from '@flapapay/node';

const flapa = new FlapaPay('sk_test_flp_...');

const session = await flapa.checkout.sessions.create({
  mode: 'payment',
  line_items: [{ price: 'price_xxx', quantity: 1 }],
  success_url: 'https://yourapp.com/success',
  cancel_url: 'https://yourapp.com/cancel',
});
// redirect to session.url`}</pre>
                                    </div>
                                </div>

                                {/* Python */}
                                <div className="p-5 rounded-2xl border border-yellow-800/40 bg-yellow-950/20 hover:border-yellow-700/60 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-yellow-500/10 text-yellow-400">🐍</div>
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">v1.0.0 · beta</span>
                                    </div>
                                    <p className="font-black text-white mb-0.5">Python</p>
                                    <p className="text-[11px] text-gray-400 mb-3">Sync & async ready. Stripe-style module API.</p>
                                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-black border border-gray-800 mb-3">
                                        <code className="text-[11px] text-gray-300 font-mono">pip install flapapay</code>
                                        <button onClick={() => copyCode('pip install flapapay', 'sdk-python')} className="ml-2 shrink-0 p-1 rounded text-gray-600 hover:text-white transition-colors">
                                            {copiedCode === 'sdk-python' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                    </div>
                                    <div className="rounded-lg bg-black border border-gray-800 p-3">
                                        <pre className="text-[10px] text-gray-300 font-mono leading-relaxed overflow-x-auto">{`import flapapay

flapapay.api_key = "sk_test_flp_..."

session = flapapay.checkout.sessions.create(
    mode="payment",
    line_items=[{"price": "price_xxx", "quantity": 1}],
    success_url="https://yourapp.com/success",
    cancel_url="https://yourapp.com/cancel",
)
# redirect to session["url"]`}</pre>
                                    </div>
                                </div>

                                {/* Connect SDK */}
                                <div className="p-5 rounded-2xl border border-blue-800/40 bg-blue-950/20 hover:border-blue-700/60 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-blue-500/10 text-blue-400">🔗</div>
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">v1.0.0 · stable</span>
                                    </div>
                                    <p className="font-black text-white mb-0.5">Connect SDK</p>
                                    <p className="text-[11px] text-gray-400 mb-3">Marketplace & sub-merchant management.</p>
                                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-black border border-gray-800 mb-3">
                                        <code className="text-[11px] text-gray-300 font-mono">npm install @flapapay/connect</code>
                                        <button onClick={() => copyCode('npm install @flapapay/connect', 'sdk-connect')} className="ml-2 shrink-0 p-1 rounded text-gray-600 hover:text-white transition-colors">
                                            {copiedCode === 'sdk-connect' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                    </div>
                                    <div className="rounded-lg bg-black border border-gray-800 p-3">
                                        <pre className="text-[10px] text-gray-300 font-mono leading-relaxed overflow-x-auto">{`import { FlapaPayConnect } from '@flapapay/connect';

const connect = new FlapaPayConnect({
  apiKey: 'sk_test_flp_...',
});

const account = await connect.accounts.create({
  type: 'express',
  email: 'merchant@example.com',
});`}</pre>
                                    </div>
                                </div>
                            </div>

                            {/* More SDKs */}
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">More languages</p>
                            <div className="grid sm:grid-cols-2 gap-4">

                                {/* PHP */}
                                <div className="p-5 rounded-2xl border border-purple-800/40 bg-purple-950/20 hover:border-purple-700/60 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-purple-500/10">🐘</div>
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">v1.0.0 · beta</span>
                                    </div>
                                    <p className="font-black text-white mb-0.5">PHP</p>
                                    <p className="text-[11px] text-gray-400 mb-3">Composer package. PSR-compatible, PHP 8.1+.</p>
                                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-black border border-gray-800 mb-3">
                                        <code className="text-[11px] text-gray-300 font-mono">composer require flapapay/flapapay-php</code>
                                        <button onClick={() => copyCode('composer require flapapay/flapapay-php', 'sdk-php')} className="ml-2 shrink-0 p-1 rounded text-gray-600 hover:text-white transition-colors">
                                            {copiedCode === 'sdk-php' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                    </div>
                                    <div className="rounded-lg bg-black border border-gray-800 p-3">
                                        <pre className="text-[10px] text-gray-300 font-mono leading-relaxed overflow-x-auto">{`use FlapaPay\\FlapaPay;

$flapa = new FlapaPay('sk_test_flp_...');

$session = $flapa->checkout->sessions->create([
  'mode'        => 'payment',
  'line_items'  => [['price' => 'price_xxx', 'quantity' => 1]],
  'success_url' => 'https://yourapp.com/success',
  'cancel_url'  => 'https://yourapp.com/cancel',
]);

header('Location: ' . $session->url);`}</pre>
                                    </div>
                                </div>

                                {/* Go */}
                                <div className="p-5 rounded-2xl border border-cyan-800/40 bg-cyan-950/20 hover:border-cyan-700/60 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-cyan-500/10">🔵</div>
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">v1.0.0 · beta</span>
                                    </div>
                                    <p className="font-black text-white mb-0.5">Go</p>
                                    <p className="text-[11px] text-gray-400 mb-3">Go module. Idiomatic structs, context support.</p>
                                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-black border border-gray-800 mb-3">
                                        <code className="text-[11px] text-gray-300 font-mono">go get github.com/flapapay/flapapay-go</code>
                                        <button onClick={() => copyCode('go get github.com/flapapay/flapapay-go', 'sdk-go')} className="ml-2 shrink-0 p-1 rounded text-gray-600 hover:text-white transition-colors">
                                            {copiedCode === 'sdk-go' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                    </div>
                                    <div className="rounded-lg bg-black border border-gray-800 p-3">
                                        <pre className="text-[10px] text-gray-300 font-mono leading-relaxed overflow-x-auto">{`import flapa "github.com/flapapay/flapapay-go"

client := flapa.New("sk_test_flp_...")

params := &flapa.CheckoutSessionParams{
  Mode: flapa.String("payment"),
  LineItems: []*flapa.LineItemParams{{
    Price:    flapa.String("price_xxx"),
    Quantity: flapa.Int64(1),
  }},
  SuccessURL: flapa.String("https://yourapp.com/success"),
  CancelURL:  flapa.String("https://yourapp.com/cancel"),
}
session, err := client.CheckoutSessions.Create(params)`}</pre>
                                    </div>
                                </div>

                                {/* Java */}
                                <div className="p-5 rounded-2xl border border-amber-800/40 bg-amber-950/20 hover:border-amber-700/60 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-amber-500/10">☕</div>
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">v1.0.0 · beta</span>
                                    </div>
                                    <p className="font-black text-white mb-0.5">Java</p>
                                    <p className="text-[11px] text-gray-400 mb-3">Maven & Gradle. Java 11+, builder pattern API.</p>
                                    {/* Maven / Gradle tab */}
                                    <div className="flex gap-1 mb-2">
                                        {['gradle', 'maven'].map(t => (
                                            <button key={t} onClick={() => setLang('sdk-java', t)}
                                                className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-colors ${getLang('sdk-java') === t ? 'bg-amber-500/20 text-amber-300' : 'text-gray-500 hover:text-gray-300'}`}>
                                                {t === 'gradle' ? 'Gradle' : 'Maven'}
                                            </button>
                                        ))}
                                    </div>
                                    {getLang('sdk-java') !== 'maven' ? (
                                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-black border border-gray-800 mb-3">
                                            <code className="text-[11px] text-gray-300 font-mono">implementation 'com.flapapay:flapapay-java:1.0.0'</code>
                                            <button onClick={() => copyCode("implementation 'com.flapapay:flapapay-java:1.0.0'", 'sdk-java-i')} className="ml-2 shrink-0 p-1 rounded text-gray-600 hover:text-white transition-colors">
                                                {copiedCode === 'sdk-java-i' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-black border border-gray-800 mb-3">
                                            <code className="text-[11px] text-gray-300 font-mono whitespace-pre">{`<dependency>\n  <groupId>com.flapapay</groupId>\n  <artifactId>flapapay-java</artifactId>\n  <version>1.0.0</version>\n</dependency>`}</code>
                                            <button onClick={() => copyCode('<dependency>\n  <groupId>com.flapapay</groupId>\n  <artifactId>flapapay-java</artifactId>\n  <version>1.0.0</version>\n</dependency>', 'sdk-java-m')} className="ml-2 shrink-0 p-1 rounded text-gray-600 hover:text-white transition-colors">
                                                {copiedCode === 'sdk-java-m' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </div>
                                    )}
                                    <div className="rounded-lg bg-black border border-gray-800 p-3">
                                        <pre className="text-[10px] text-gray-300 font-mono leading-relaxed overflow-x-auto">{`import com.flapapay.FlapaPay;
import com.flapapay.model.CheckoutSession;
import com.flapapay.param.CheckoutSessionCreateParams;

FlapaPay.apiKey = "sk_test_flp_...";

var params = CheckoutSessionCreateParams.builder()
    .setMode(CheckoutSessionCreateParams.Mode.PAYMENT)
    .addLineItem(
        CheckoutSessionCreateParams.LineItem.builder()
            .setPrice("price_xxx")
            .setQuantity(1L)
            .build())
    .setSuccessUrl("https://yourapp.com/success")
    .setCancelUrl("https://yourapp.com/cancel")
    .build();

CheckoutSession session = CheckoutSession.create(params);`}</pre>
                                    </div>
                                </div>

                                {/* iOS / Swift */}
                                <div className="p-5 rounded-2xl border border-gray-700/40 bg-gray-900/30 hover:border-gray-600/60 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gray-500/10">🍎</div>
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-300 border border-gray-500/30">v1.0.0 · beta</span>
                                    </div>
                                    <p className="font-black text-white mb-0.5">iOS / Swift</p>
                                    <p className="text-[11px] text-gray-400 mb-3">SwiftPM package. async/await, Codable models.</p>
                                    <div className="rounded-lg bg-black border border-gray-800 p-2.5 mb-3">
                                        <div className="flex items-center justify-between">
                                            <code className="text-[10px] text-gray-300 font-mono whitespace-pre">{`.package(\n  url: "https://github.com/flapapay/flapapay-swift.git",\n  from: "1.0.0"\n)`}</code>
                                            <button onClick={() => copyCode('.package(\n  url: "https://github.com/flapapay/flapapay-swift.git",\n  from: "1.0.0"\n)', 'sdk-swift')} className="ml-2 shrink-0 self-start p-1 rounded text-gray-600 hover:text-white transition-colors">
                                                {copiedCode === 'sdk-swift' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="rounded-lg bg-black border border-gray-800 p-3">
                                        <pre className="text-[10px] text-gray-300 font-mono leading-relaxed overflow-x-auto">{`import FlapaPay

let flapa = FlapaPay(apiKey: "sk_test_flp_...")

let params = CheckoutSession.CreateParams(
    mode: .payment,
    lineItems: [.init(price: "price_xxx", quantity: 1)],
    successURL: URL(string: "https://yourapp.com/success")!,
    cancelURL:  URL(string: "https://yourapp.com/cancel")!
)

let session = try await flapa.checkoutSessions.create(params)
// open session.url in SFSafariViewController`}</pre>
                                    </div>
                                </div>

                            </div>
                        </section>

                        {/* ── CTA ───────────────────────────────────── */}
                        <section className="rounded-3xl overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-500"></div>
                            <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px)',backgroundSize:'30px 30px'}}></div>
                            <div className="relative p-12 text-center">
                                <p className="text-orange-100 text-sm font-bold uppercase tracking-widest mb-4">Ready to ship?</p>
                                <h2 className="text-4xl font-black text-white mb-4">Start building in minutes</h2>
                                <p className="text-orange-100 font-medium mb-8 max-w-lg mx-auto text-[15px] leading-relaxed">
                                    Get your API keys, pick an SDK, and make your first payment in under 5 minutes. No contracts. No minimums.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <a href="/signup" className="inline-flex items-center justify-center px-8 py-3.5 rounded-2xl bg-white text-orange-600 font-black hover:bg-orange-50 transition-all shadow-xl">
                                        Get API Keys — Free
                                    </a>
                                    <a href="/api-reference" className="inline-flex items-center justify-center px-8 py-3.5 rounded-2xl bg-orange-700/60 text-white font-black border border-orange-400/30 hover:bg-orange-700/80 transition-all">
                                        API Reference <ChevronRight className="w-4 h-4 ml-1" />
                                    </a>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};
