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

const PUBLIC_API_BASE = 'https://api.flapapay.com';
const EXAMPLE_APP_BASE = 'https://yourapp.com';
const normalizeDocExample = (input: string) => input
    .replaceAll('http://localhost:3005', PUBLIC_API_BASE)
    .replaceAll('http://localhost:5173', EXAMPLE_APP_BASE)
    .replaceAll('localhost:3005', 'api.flapapay.com')
    .replaceAll('localhost:5173', 'yourapp.com');

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
            const response = await fetch(`${PUBLIC_API_BASE}/v1/checkout/sessions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${pgApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mode: 'subscription',
                    customer_email: pgEmail,
                    line_items: [{ price: pgPriceId, quantity: 1 }],
                    success_url: `${EXAMPLE_APP_BASE}/success`,
                    cancel_url: `${EXAMPLE_APP_BASE}/cancel`
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
            setPgResult({ error: 'Failed to connect to the API domain.' });
        } finally {
            setPgLoading(false);
        }
    };

    const fetchAvailablePrices = async () => {
        try {
            const response = await fetch(`${PUBLIC_API_BASE}/v1/prices`, {
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
        navigator.clipboard.writeText(normalizeDocExample(code));
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
            id: 'webhooks',
            title: 'Webhooks',
            icon: <Webhook className="w-5 h-5" />,
            items: ['Setup', 'Event Types', 'Security']
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
            title: 'Direct Wallet Settlement',
            badge: 'Merchant Hub',
            description: 'Checkout sessions remain the hosted payment entry point, but successful payments now settle directly into the merchant wallet and ledger.',
            params: [
                { name: 'wallet_id', type: 'string', required: false, desc: 'Optional wallet override when you want to settle into a specific merchant wallet record' },
                { name: 'metadata', type: 'object', required: false, desc: 'Attach order, invoice, or customer references for downstream reconciliation' },
                { name: 'success_url', type: 'string', required: true, desc: 'Redirect after successful payment' },
            ],
            response: `{
  "id": "cs_live_pay_xxx",
  "url": "https://checkout.flapapay.com/pay/cs_live_pay_xxx",
  "status": "open"
}`,
            snippets: {
                node: `// Customer pays ZK 1,000. FlapaPay credits the merchant wallet after successful payment.
const res = await fetch('http://localhost:3005/v1/checkout/sessions', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mode: 'payment',
    line_items: [{ price: 'price_product_xxx', quantity: 1 }],
    success_url: 'https://yourapp.com/order/success',
    cancel_url: 'https://yourapp.com/cart',
    metadata: { order_id: 'ord_123' },
  }),
});
const session = await res.json();`,
                python: `session = requests.post('http://localhost:3005/v1/checkout/sessions',
  json={
    'mode': 'payment',
    'line_items': [{'price': 'price_product_xxx', 'quantity': 1}],
    'success_url': 'https://yourapp.com/order/success',
    'cancel_url': 'https://yourapp.com/cart',
    'metadata': {'order_id': 'ord_123'},
  },
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl -X POST http://localhost:3005/v1/checkout/sessions \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY" \\
  -d '{
    "mode": "payment",
    "line_items": [{"price": "price_product_xxx", "quantity": 1}],
    "success_url": "https://yourapp.com/order/success",
    "cancel_url": "https://yourapp.com/cart",
    "metadata": {"order_id": "ord_123"}
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


    const escrowEndpoints: any[] = [];

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
    const infrastructureEndpoints = [
        {
            id: 'banks-list',
            method: 'GET',
            path: '/v1/banks',
            title: 'List Banks',
            badge: 'Accounts',
            description: 'Retrieve banks and financial institutions supported by FlapaPay for bank-account transfers and account resolution.',
            params: [
                { name: 'country', type: 'string', required: false, desc: 'Two-letter country code like "zm". Defaults to your operating country.' },
            ],
            response: `{
  "status": true,
  "message": "",
  "data": [
    { "id": "002", "name": "Absa Bank", "country": "zm" }
  ]
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/banks?country=zm', {
  headers: { 'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\` }
});
const banks = await res.json();`,
                python: `import requests, os
banks = requests.get(
  'http://localhost:3005/v1/banks',
  params={'country': 'zm'},
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl "http://localhost:3005/v1/banks?country=zm" \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY"`
            }
        },
        {
            id: 'resolve-bank-account',
            method: 'POST',
            path: '/v1/resolve/bank-account',
            title: 'Resolve Bank Account',
            badge: 'Accounts',
            description: 'Verify a bank account before creating a transfer or saving a recipient. FlapaPay returns the resolved account name and bank details.',
            params: [
                { name: 'accountNumber', type: 'string', required: true, desc: 'Destination bank account number' },
                { name: 'bankId', type: 'string', required: true, desc: 'Bank identifier returned by GET /v1/banks' },
                { name: 'country', type: 'string', required: false, desc: 'Country code like "zm"' },
            ],
            response: `{
  "status": true,
  "message": "",
  "data": {
    "type": "bank-account",
    "accountName": "Beata Jean",
    "accountNumber": "9130000000000",
    "bank": {
      "id": "002",
      "name": "Absa Bank",
      "country": "zm"
    }
  }
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/resolve/bank-account', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    accountNumber: '9130000000000',
    bankId: '002',
    country: 'zm'
  })
});
const resolved = await res.json();`,
                python: `import requests, os
resolved = requests.post(
  'http://localhost:3005/v1/resolve/bank-account',
  json={'accountNumber': '9130000000000', 'bankId': '002', 'country': 'zm'},
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl -X POST http://localhost:3005/v1/resolve/bank-account \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"accountNumber":"9130000000000","bankId":"002","country":"zm"}'`
            }
        },
        {
            id: 'resolve-mobile-money',
            method: 'POST',
            path: '/v1/resolve/mobile-money',
            title: 'Resolve Mobile Money',
            badge: 'Accounts',
            description: 'Resolve a mobile money account name before collection or transfer. Supported operators depend on country.',
            params: [
                { name: 'phone', type: 'string', required: true, desc: 'Customer mobile money number' },
                { name: 'operator', type: 'string', required: true, desc: 'Operator like "mtn", "airtel", or "zamtel"' },
                { name: 'country', type: 'string', required: false, desc: 'Country code like "zm"' },
            ],
            response: `{
  "status": true,
  "message": "",
  "data": {
    "type": "mobile-money",
    "accountName": "Beata Jean",
    "phone": "0750000000",
    "operator": "zamtel",
    "country": "zm"
  }
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/resolve/mobile-money', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: '0961111111',
    operator: 'mtn',
    country: 'zm'
  })
});
const resolved = await res.json();`,
                python: `import requests, os
resolved = requests.post(
  'http://localhost:3005/v1/resolve/mobile-money',
  json={'phone': '0961111111', 'operator': 'mtn', 'country': 'zm'},
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl -X POST http://localhost:3005/v1/resolve/mobile-money \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"phone":"0961111111","operator":"mtn","country":"zm"}'`
            }
        },
        {
            id: 'transfer-bank-account',
            method: 'POST',
            path: '/v1/transfers/bank-account',
            title: 'Transfer To Bank Account',
            badge: 'Transfers',
            description: 'Initiate an outbound bank-account transfer from a merchant wallet. FlapaPay debits the wallet, writes ledger entries, and tracks provider status under the same transfer reference.',
            params: [
                { name: 'wallet_id', type: 'string', required: true, desc: 'Merchant wallet to debit' },
                { name: 'amount', type: 'number', required: true, desc: 'Transfer amount in wallet currency' },
                { name: 'reference', type: 'string', required: true, desc: 'Unique client transfer reference' },
                { name: 'accountNumber', type: 'string', required: true, desc: 'Destination account number' },
                { name: 'bankId', type: 'string', required: true, desc: 'Destination bank ID from GET /v1/banks' },
                { name: 'country', type: 'string', required: false, desc: 'Country code like "zm"' },
                { name: 'narration', type: 'string', required: false, desc: 'Transfer narration shown in processor rails where supported' },
            ],
            response: `{
  "status": true,
  "message": "",
  "data": {
    "id": "9525b4c6-502b-45be-90e1-81eb81a3f424",
    "amount": "20.00",
    "fee": "8.50",
    "currency": "ZMW",
    "narration": "Vendor payout",
    "initiatedAt": "2026-07-30T10:00:00.000Z",
    "completedAt": null,
    "walletId": "wal_xxx",
    "creditAccount": {
      "type": "bank-account",
      "accountName": "Beata Jean",
      "accountNumber": "9130000000000",
      "bank": { "id": "002", "name": "Absa Bank", "country": "zm" }
    },
    "status": "pending",
    "reasonForFailure": null,
    "reference": "trf_001",
    "settlementStatus": "pending",
    "source": "api"
  }
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/transfers/bank-account', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    wallet_id: 'wal_123',
    amount: 20,
    reference: 'trf_001',
    narration: 'Vendor payout',
    accountNumber: '9130000000000',
    bankId: '002',
    country: 'zm'
  })
});
const transfer = await res.json();`,
                python: `import requests, os
transfer = requests.post(
  'http://localhost:3005/v1/transfers/bank-account',
  json={
    'wallet_id': 'wal_123',
    'amount': 20,
    'reference': 'trf_001',
    'narration': 'Vendor payout',
    'accountNumber': '9130000000000',
    'bankId': '002',
    'country': 'zm'
  },
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl -X POST http://localhost:3005/v1/transfers/bank-account \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "wallet_id": "wal_123",
    "amount": 20,
    "reference": "trf_001",
    "narration": "Vendor payout",
    "accountNumber": "9130000000000",
    "bankId": "002",
    "country": "zm"
  }'`
            }
        },
        {
            id: 'list-transfer-recipients',
            method: 'GET',
            path: '/v1/transfer-recipients',
            title: 'List Transfer Recipients',
            badge: 'Recipients',
            description: 'Fetch reusable bank recipients saved under your merchant profile for payout setup and repeat transfers.',
            params: [],
            response: `{
  "status": true,
  "message": "",
  "data": [
    {
      "id": "rcp_123",
      "type": "bank-account",
      "accountName": "Beata Jean",
      "accountNumber": "9130000000000",
      "bank": { "id": "002", "name": "Absa Bank", "country": "zm" },
      "isDefault": true,
      "createdAt": "2026-07-30T10:00:00.000Z"
    }
  ]
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/transfer-recipients', {
  headers: { 'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\` }
});
const recipients = await res.json();`,
                python: `import requests, os
recipients = requests.get(
  'http://localhost:3005/v1/transfer-recipients',
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl "http://localhost:3005/v1/transfer-recipients" \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY"`
            }
        },
        {
            id: 'create-transfer-recipient',
            method: 'POST',
            path: '/v1/transfer-recipients',
            title: 'Create Transfer Recipient',
            badge: 'Recipients',
            description: 'Resolve a bank account and store it as a reusable FlapaPay transfer recipient under the merchant account.',
            params: [
                { name: 'accountNumber', type: 'string', required: true, desc: 'Destination bank account number' },
                { name: 'bankId', type: 'string', required: true, desc: 'Bank identifier returned by GET /v1/banks' },
                { name: 'bankName', type: 'string', required: false, desc: 'Bank display name if you want to store it alongside the bank ID' },
                { name: 'country', type: 'string', required: false, desc: 'Country code like "zm"' },
                { name: 'isDefault', type: 'boolean', required: false, desc: 'Mark this recipient as the default payout destination' },
            ],
            response: `{
  "status": true,
  "message": "",
  "data": {
    "id": "rcp_123",
    "type": "bank-account",
    "accountName": "Beata Jean",
    "accountNumber": "9130000000000",
    "bank": { "id": "002", "name": "Absa Bank", "country": "zm" },
    "isDefault": true,
    "createdAt": "2026-07-30T10:00:00.000Z"
  }
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/transfer-recipients', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    accountNumber: '9130000000000',
    bankId: '002',
    bankName: 'Absa Bank',
    country: 'zm',
    isDefault: true
  })
});
const recipient = await res.json();`,
                python: `import requests, os
recipient = requests.post(
  'http://localhost:3005/v1/transfer-recipients',
  json={
    'accountNumber': '9130000000000',
    'bankId': '002',
    'bankName': 'Absa Bank',
    'country': 'zm',
    'isDefault': True
  },
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl -X POST http://localhost:3005/v1/transfer-recipients \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"accountNumber":"9130000000000","bankId":"002","bankName":"Absa Bank","country":"zm","isDefault":true}'`
            }
        },
        {
            id: 'get-transfer-recipient',
            method: 'GET',
            path: '/v1/transfer-recipients/:id',
            title: 'Get Transfer Recipient',
            badge: 'Recipients',
            description: 'Fetch one saved bank recipient by FlapaPay recipient ID.',
            params: [
                { name: 'id', type: 'string', required: true, desc: 'Transfer recipient identifier returned by creation or list calls' },
            ],
            response: `{
  "status": true,
  "message": "",
  "data": {
    "id": "rcp_123",
    "type": "bank-account",
    "accountName": "Beata Jean",
    "accountNumber": "9130000000000",
    "bank": { "id": "002", "name": "Absa Bank", "country": "zm" },
    "isDefault": true,
    "createdAt": "2026-07-30T10:00:00.000Z"
  }
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/transfer-recipients/rcp_123', {
  headers: { 'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\` }
});
const recipient = await res.json();`,
                python: `import requests, os
recipient = requests.get(
  'http://localhost:3005/v1/transfer-recipients/rcp_123',
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl "http://localhost:3005/v1/transfer-recipients/rcp_123" \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY"`
            }
        },
        {
            id: 'delete-transfer-recipient',
            method: 'DELETE',
            path: '/v1/transfer-recipients/:id',
            title: 'Delete Transfer Recipient',
            badge: 'Recipients',
            description: 'Delete a saved bank recipient from the merchant recipient vault.',
            params: [
                { name: 'id', type: 'string', required: true, desc: 'Transfer recipient identifier to remove' },
            ],
            response: `{
  "status": true,
  "message": "",
  "data": {
    "id": "rcp_123",
    "deleted": true
  }
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/transfer-recipients/rcp_123', {
  method: 'DELETE',
  headers: { 'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\` }
});
const result = await res.json();`,
                python: `import requests, os
result = requests.delete(
  'http://localhost:3005/v1/transfer-recipients/rcp_123',
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl -X DELETE "http://localhost:3005/v1/transfer-recipients/rcp_123" \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY"`
            }
        },
        {
            id: 'transfer-mobile-money',
            method: 'POST',
            path: '/v1/transfers/mobile-money',
            title: 'Transfer To Mobile Money',
            badge: 'Transfers',
            description: 'Initiate an outbound mobile money transfer from a merchant wallet. FlapaPay debits the wallet, writes ledger entries, and tracks the payout reference.',
            params: [
                { name: 'wallet_id', type: 'string', required: true, desc: 'Merchant wallet to debit' },
                { name: 'amount', type: 'number', required: true, desc: 'Transfer amount in wallet currency' },
                { name: 'reference', type: 'string', required: true, desc: 'Unique client transfer reference' },
                { name: 'phone', type: 'string', required: true, desc: 'Destination mobile money phone number' },
                { name: 'operator', type: 'string', required: true, desc: 'Operator like "mtn", "airtel", or "zamtel"' },
                { name: 'country', type: 'string', required: false, desc: 'Country code like "zm"' },
                { name: 'narration', type: 'string', required: false, desc: 'Narration for the payout where supported' },
            ],
            response: `{
  "status": true,
  "message": "",
  "data": {
    "id": "trf_123",
    "amount": "20.00",
    "fee": "8.50",
    "currency": "ZMW",
    "narration": "Agent payout",
    "initiatedAt": "2026-07-30T10:00:00.000Z",
    "completedAt": null,
    "walletId": "wal_123",
    "creditAccount": {
      "type": "mobile-money",
      "accountName": null,
      "phone": "260961111111",
      "operator": "mtn",
      "country": "zm"
    },
    "status": "pending",
    "reasonForFailure": null,
    "reference": "trf_momo_001",
    "settlementStatus": "pending",
    "providerReference": null,
    "source": "api"
  }
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/transfers/mobile-money', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    wallet_id: 'wal_123',
    amount: 20,
    reference: 'trf_momo_001',
    narration: 'Agent payout',
    phone: '0961111111',
    operator: 'mtn',
    country: 'zm'
  })
});
const transfer = await res.json();`,
                python: `import requests, os
transfer = requests.post(
  'http://localhost:3005/v1/transfers/mobile-money',
  json={
    'wallet_id': 'wal_123',
    'amount': 20,
    'reference': 'trf_momo_001',
    'narration': 'Agent payout',
    'phone': '0961111111',
    'operator': 'mtn',
    'country': 'zm'
  },
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl -X POST http://localhost:3005/v1/transfers/mobile-money \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"wallet_id":"wal_123","amount":20,"reference":"trf_momo_001","narration":"Agent payout","phone":"0961111111","operator":"mtn","country":"zm"}'`
            }
        },
        {
            id: 'list-transfers',
            method: 'GET',
            path: '/v1/transfers',
            title: 'List Transfers',
            badge: 'Transfers',
            description: 'List merchant wallet payouts across bank-account and mobile-money rails, with FlapaPay status synchronization on pending records.',
            params: [
                { name: 'wallet_id', type: 'string', required: false, desc: 'Filter to one wallet' },
                { name: 'status', type: 'string', required: false, desc: 'Filter by local status such as PENDING, COMPLETED, or FAILED' },
                { name: 'limit', type: 'number', required: false, desc: 'Number of records to return. Defaults to 20.' },
            ],
            response: `{
  "status": true,
  "message": "",
  "data": [
    {
      "id": "trf_123",
      "amount": "20.00",
      "fee": "8.50",
      "currency": "ZMW",
      "narration": "Transfer",
      "initiatedAt": "2026-07-30T10:00:00.000Z",
      "completedAt": null,
      "walletId": "wal_123",
      "creditAccount": {
        "type": "bank-account",
        "accountName": "",
        "accountNumber": "9130000000000",
        "bank": { "id": "002", "name": "Absa Bank", "country": "zm" }
      },
      "status": "pending",
      "reasonForFailure": null,
      "reference": "trf_001",
      "settlementStatus": "pending",
      "providerReference": "240010002",
      "source": "api"
    }
  ]
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/transfers?limit=10', {
  headers: { 'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\` }
});
const transfers = await res.json();`,
                python: `import requests, os
transfers = requests.get(
  'http://localhost:3005/v1/transfers',
  params={'limit': 10},
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl "http://localhost:3005/v1/transfers?limit=10" \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY"`
            }
        },
        {
            id: 'get-transfer',
            method: 'GET',
            path: '/v1/transfers/:reference',
            title: 'Get Transfer',
            badge: 'Transfers',
            description: 'Fetch one transfer by FlapaPay reference and re-sync pending status before returning the latest payout state.',
            params: [
                { name: 'reference', type: 'string', required: true, desc: 'FlapaPay transfer reference' },
            ],
            response: `{
  "status": true,
  "message": "",
  "data": {
    "id": "trf_123",
    "amount": "20.00",
    "fee": "8.50",
    "currency": "ZMW",
    "narration": "Transfer",
    "initiatedAt": "2026-07-30T10:00:00.000Z",
    "completedAt": null,
    "walletId": "wal_123",
    "creditAccount": {
      "type": "mobile-money",
      "accountName": null,
      "phone": "260961111111",
      "operator": "mtn",
      "country": "zm"
    },
    "status": "pending",
    "reasonForFailure": null,
    "reference": "trf_momo_001",
    "settlementStatus": "pending",
    "providerReference": null,
    "source": "api"
  }
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/transfers/trf_momo_001', {
  headers: { 'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\` }
});
const transfer = await res.json();`,
                python: `import requests, os
transfer = requests.get(
  'http://localhost:3005/v1/transfers/trf_momo_001',
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl "http://localhost:3005/v1/transfers/trf_momo_001" \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY"`
            }
        },
        {
            id: 'create-mobile-money-collection',
            method: 'POST',
            path: '/v1/collections/mobile-money',
            title: 'Create Mobile Money Collection',
            badge: 'Collections',
            description: 'Initiate a customer mobile money collection into a merchant wallet. FlapaPay tracks the provider lifecycle and credits the wallet when settlement completes.',
            params: [
                { name: 'wallet_id', type: 'string', required: true, desc: 'Merchant wallet to credit on successful settlement' },
                { name: 'amount', type: 'number', required: true, desc: 'Requested collection amount in wallet currency' },
                { name: 'reference', type: 'string', required: true, desc: 'Unique merchant collection reference' },
                { name: 'phone', type: 'string', required: true, desc: 'Customer mobile money phone number' },
                { name: 'operator', type: 'string', required: true, desc: 'Operator like "mtn", "airtel", or "zamtel"' },
                { name: 'country', type: 'string', required: false, desc: 'Country code like "zm"' },
            ],
            response: `{
  "status": true,
  "message": "",
  "data": {
    "id": "col_123",
    "initiatedAt": "2026-07-30T10:00:00.000Z",
    "completedAt": null,
    "amount": "50.00",
    "fee": "0.90",
    "bearer": "merchant",
    "currency": "ZMW",
    "reference": "col_001",
    "type": "mobile-money",
    "status": "pay-offline",
    "source": "api",
    "reasonForFailure": null,
    "settlementStatus": "pending",
    "walletId": "wal_123",
    "mobileMoneyDetails": {
      "country": "zm",
      "phone": "0961111111",
      "operator": "mtn",
      "accountName": null,
      "operatorTransactionId": null
    },
    "ledgerReference": null
  }
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/collections/mobile-money', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    wallet_id: 'wal_123',
    amount: 50,
    reference: 'col_001',
    phone: '0961111111',
    operator: 'mtn',
    country: 'zm'
  })
});
const collection = await res.json();`,
                python: `import requests, os
collection = requests.post(
  'http://localhost:3005/v1/collections/mobile-money',
  json={
    'wallet_id': 'wal_123',
    'amount': 50,
    'reference': 'col_001',
    'phone': '0961111111',
    'operator': 'mtn',
    'country': 'zm'
  },
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl -X POST http://localhost:3005/v1/collections/mobile-money \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"wallet_id":"wal_123","amount":50,"reference":"col_001","phone":"0961111111","operator":"mtn","country":"zm"}'`
            }
        },
        {
            id: 'create-card-collection',
            method: 'POST',
            path: '/v1/collections/card',
            title: 'Create Card Collection',
            badge: 'Collections',
            description: 'Charge a customer card through FlapaPay secure card capture and settle the successful collection directly into the merchant wallet.',
            params: [
                { name: 'wallet_id', type: 'string', required: true, desc: 'Merchant wallet to credit on successful settlement' },
                { name: 'amount', type: 'number', required: true, desc: 'Requested collection amount in wallet currency' },
                { name: 'currency', type: 'string', required: true, desc: 'Wallet currency for the collection, for example "ZMW"' },
                { name: 'reference', type: 'string', required: true, desc: 'Unique merchant collection reference' },
                { name: 'description', type: 'string', required: false, desc: 'Collection description for reconciliation' },
                { name: 'transientToken', type: 'string', required: false, desc: 'Secure single-use card token from FlapaPay card capture' },
                { name: 'customerId', type: 'string', required: false, desc: 'Stored customer card identity if you are charging a previously linked payment method' },
                { name: 'billingDetails', type: 'object', required: false, desc: 'Optional cardholder billing object with name, email, phone, and address fields' },
            ],
            response: `{
  "status": true,
  "message": "",
  "data": {
    "id": "card_123",
    "initiatedAt": "2026-07-30T10:00:00.000Z",
    "completedAt": "2026-07-30T10:00:00.000Z",
    "amount": "50.00",
    "fee": "0.00",
    "bearer": "merchant",
    "currency": "ZMW",
    "reference": "card_col_001",
    "type": "card",
    "status": "authorized",
    "source": "api",
    "reasonForFailure": null,
    "settlementStatus": "settled",
    "walletId": "wal_123",
    "cardDetails": {
      "brand": "card",
      "last4": "4242"
    },
    "ledgerReference": "COLCARD-card_col_001"
  }
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/collections/card', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    wallet_id: 'wal_123',
    amount: 50,
    currency: 'ZMW',
    reference: 'card_col_001',
    description: 'Card checkout collection',
    transientToken: 'eyJhbGciOi...',
    billingDetails: {
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '0977000000',
      country: 'ZM'
    }
  })
});
const collection = await res.json();`,
                python: `import requests, os
collection = requests.post(
  'http://localhost:3005/v1/collections/card',
  json={
    'wallet_id': 'wal_123',
    'amount': 50,
    'currency': 'ZMW',
    'reference': 'card_col_001',
    'description': 'Card checkout collection',
    'transientToken': 'eyJhbGciOi...',
    'billingDetails': {
      'name': 'Jane Doe',
      'email': 'jane@example.com',
      'phone': '0977000000',
      'country': 'ZM'
    }
  },
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl -X POST http://localhost:3005/v1/collections/card \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "wallet_id": "wal_123",
    "amount": 50,
    "currency": "ZMW",
    "reference": "card_col_001",
    "description": "Card checkout collection",
    "transientToken": "eyJhbGciOi...",
    "billingDetails": {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "0977000000",
      "country": "ZM"
    }
  }'`
            }
        },
        {
            id: 'list-collections',
            method: 'GET',
            path: '/v1/collections',
            title: 'List Collections',
            badge: 'Collections',
            description: 'List mobile money collections created through FlapaPay and inspect their processing or settlement lifecycle.',
            params: [
                { name: 'wallet_id', type: 'string', required: false, desc: 'Filter to a specific wallet' },
                { name: 'status', type: 'string', required: false, desc: 'Filter by local settlement status such as PENDING, COMPLETED, or FAILED' },
                { name: 'limit', type: 'number', required: false, desc: 'Number of records to return. Defaults to 20.' },
            ],
            response: `{
  "status": true,
  "message": "",
  "data": [
    {
      "id": "col_123",
      "initiatedAt": "2026-07-30T10:00:00.000Z",
      "completedAt": null,
      "amount": "50.00",
      "fee": "0.90",
      "bearer": "merchant",
      "currency": "ZMW",
      "reference": "col_001",
      "type": "mobile-money",
      "status": "pay-offline",
      "source": "api",
      "reasonForFailure": null,
      "settlementStatus": "pending",
      "walletId": "wal_123",
      "mobileMoneyDetails": {
        "country": "zm",
        "phone": "0961111111",
        "operator": "mtn",
        "accountName": null,
        "operatorTransactionId": null
      },
      "ledgerReference": null
    }
  ]
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/collections?limit=10', {
  headers: { 'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\` }
});
const collections = await res.json();`,
                python: `import requests, os
collections = requests.get(
  'http://localhost:3005/v1/collections',
  params={'limit': 10},
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl "http://localhost:3005/v1/collections?limit=10" \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY"`
            }
        },
        {
            id: 'get-collection',
            method: 'GET',
            path: '/v1/collections/:reference',
            title: 'Get Collection',
            badge: 'Collections',
            description: 'Fetch one collection by reference and re-sync its status so wallet settlement is reflected as soon as it completes.',
            params: [
                { name: 'reference', type: 'string', required: true, desc: 'FlapaPay collection reference from collection creation' },
            ],
            response: `{
  "status": true,
  "message": "",
  "data": {
    "id": "col_123",
    "initiatedAt": "2026-07-30T10:00:00.000Z",
    "completedAt": "2026-07-30T10:02:00.000Z",
    "amount": "50.00",
    "fee": "0.90",
    "bearer": "merchant",
    "currency": "ZMW",
    "reference": "col_001",
    "type": "mobile-money",
    "status": "successful",
    "source": "api",
    "reasonForFailure": null,
    "settlementStatus": "settled",
    "walletId": "wal_123",
    "mobileMoneyDetails": {
      "country": "zm",
      "phone": "0961111111",
      "operator": "mtn",
      "accountName": "Jane Doe",
      "operatorTransactionId": "op_123"
    },
    "ledgerReference": "LMMDEP-ABC123"
  }
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/collections/col_001', {
  headers: { 'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\` }
});
const collection = await res.json();`,
                python: `import requests, os
collection = requests.get(
  'http://localhost:3005/v1/collections/col_001',
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl "http://localhost:3005/v1/collections/col_001" \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY"`
            }
        },
        {
            id: 'list-settlements',
            method: 'GET',
            path: '/v1/settlements',
            title: 'List Settlements',
            badge: 'Settlements',
            description: 'Read the normalized FlapaPay settlement stream across inbound mobile money collections and outbound wallet transfers.',
            params: [
                { name: 'limit', type: 'number', required: false, desc: 'Number of records to return. Defaults to 20.' },
            ],
            response: `{
  "status": true,
  "message": "",
  "data": [
    {
      "type": "collection",
      "reference": "col_001",
      "walletId": "wal_123",
      "amount": "50.00",
      "fee": "0.90",
      "grossAmount": "50.90",
      "currency": "ZMW",
      "status": "completed",
      "settlementStatus": "settled",
      "ledgerReference": "LMMDEP-ABC123",
      "reasonForFailure": null,
      "createdAt": "2026-07-30T10:00:00.000Z",
      "settledAt": "2026-07-30T10:02:00.000Z"
    },
    {
      "type": "transfer",
      "reference": "trf_001",
      "walletId": "wal_123",
      "amount": "20.00",
      "fee": "8.50",
      "grossAmount": "28.50",
      "currency": "ZMW",
      "status": "pending",
      "settlementStatus": "pending",
      "ledgerReference": "trf_001",
      "reasonForFailure": null,
      "destinationType": "bank_account",
      "providerReference": "240010002",
      "createdAt": "2026-07-30T10:00:00.000Z",
      "settledAt": null
    }
  ]
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/settlements?limit=10', {
  headers: { 'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\` }
});
const settlements = await res.json();`,
                python: `import requests, os
settlements = requests.get(
  'http://localhost:3005/v1/settlements',
  params={'limit': 10},
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl "http://localhost:3005/v1/settlements?limit=10" \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY"`
            }
        },
        {
            id: 'get-settlement',
            method: 'GET',
            path: '/v1/settlements/:reference',
            title: 'Get Settlement',
            badge: 'Settlements',
            description: 'Fetch one normalized settlement record by FlapaPay reference across collection and transfer flows.',
            params: [
                { name: 'reference', type: 'string', required: true, desc: 'Collection or transfer reference' },
            ],
            response: `{
  "status": true,
  "message": "",
  "data": {
    "type": "collection",
    "reference": "col_001",
    "walletId": "wal_123",
    "amount": "50.00",
    "fee": "0.90",
    "grossAmount": "50.90",
    "currency": "ZMW",
    "status": "completed",
    "settlementStatus": "settled",
    "ledgerReference": "LMMDEP-ABC123",
    "reasonForFailure": null,
    "createdAt": "2026-07-30T10:00:00.000Z",
    "settledAt": "2026-07-30T10:02:00.000Z"
  }
}`,
            snippets: {
                node: `const res = await fetch('http://localhost:3005/v1/settlements/col_001', {
  headers: { 'Authorization': \`Bearer \${process.env.FLAPAPAY_SECRET_KEY}\` }
});
const settlement = await res.json();`,
                python: `import requests, os
settlement = requests.get(
  'http://localhost:3005/v1/settlements/col_001',
  headers={'Authorization': f"Bearer {os.environ['FLAPAPAY_SECRET_KEY']}"}
).json()`,
                curl: `curl "http://localhost:3005/v1/settlements/col_001" \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY"`
            }
        }
    ];
    const connectEndpoints: any[] = [];

    const LANG_LABELS: Record<string, string> = { node: 'Node.js', python: 'Python', curl: 'cURL' };

    const renderEndpointCard = (endpoint: any) => {
        const lang = getLang(endpoint.id);
        const code = normalizeDocExample(endpoint.snippets[lang] || endpoint.snippets.node);
        const responseExample = normalizeDocExample(endpoint.response);
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
                                    {responseExample}
                                </pre>
                                <button
                                    onClick={() => copyCode(responseExample, `${endpoint.id}-res`)}
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

    const sidebarGroups = [
        {
            label: 'Overview',
            items: [
                { id: 'introduction', label: 'Introduction', icon: <Book className="w-4 h-4" />, anchor: '#introduction' },
                { id: 'quickstart', label: 'Quick Start', icon: <Zap className="w-4 h-4" />, anchor: '#quickstart' },
                { id: 'authentication', label: 'Authentication', icon: <Key className="w-4 h-4" />, anchor: '#auth' },
            ]
        },
        {
            label: 'Accept Payments',
            items: [
                { id: 'banking', label: 'Banks & Settlement', icon: <Database className="w-4 h-4" />, anchor: '#banking', count: infrastructureEndpoints.length },
                { id: 'checkout', label: 'Checkout Sessions', icon: <CreditCard className="w-4 h-4" />, anchor: '#checkout', count: checkoutEndpoints.length },
                { id: 'webhooks', label: 'Webhooks', icon: <Webhook className="w-4 h-4" />, anchor: '#webhooks' },
            ]
        },
        {
            label: 'Platform',
            items: [
                { id: 'subscriptions', label: 'Subscriptions', icon: <RefreshCw className="w-4 h-4" />, anchor: '#subscriptions' },
                { id: 'sdks', label: 'SDKs', icon: <Code className="w-4 h-4" />, anchor: '#sdks' },
            ]
        }
    ];

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
                                    Complete API reference, integration guides, and code examples for payments, subscriptions, wallets, ledgers, and more.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {[
                                        { label: 'Quick Start', href: '#quickstart' },
                                        { label: 'Checkout', href: '#checkout' },
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
                                        <button onClick={() => copyCode(normalizeDocExample(codeExamples.createPayment), 'hero')} className="text-[10px] font-bold text-gray-500 hover:text-orange-400 transition-colors flex items-center gap-1">
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
                            <div className="mb-6 px-2">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.22em]">API Reference</p>
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                                    <span className="text-xs font-semibold text-gray-300">FlapaPay Docs</span>
                                    <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-400">v1</span>
                                </div>
                            </div>

                            <nav className="space-y-5">
                                {sidebarGroups.map((group) => (
                                    <div key={group.label}>
                                        <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-600">{group.label}</p>
                                        <div className="rounded-2xl border border-gray-800/70 bg-gray-950/60 p-2">
                                            {group.items.map((item) => (
                                                <a
                                                    key={item.id}
                                                    href={item.anchor}
                                                    onClick={() => setActiveSection(item.id)}
                                                    className={`group flex items-center justify-between rounded-xl border-l-2 px-3 py-2.5 text-sm transition-all ${
                                                        activeSection === item.id
                                                            ? 'border-orange-500 bg-orange-500/8 text-white'
                                                            : 'border-transparent text-gray-400 hover:bg-white/[0.03] hover:text-gray-100'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <span className={activeSection === item.id ? 'text-orange-400' : 'text-gray-600 group-hover:text-gray-300'}>
                                                            {item.icon}
                                                        </span>
                                                        <span className="truncate font-semibold">{item.label}</span>
                                                    </div>
                                                    {item.count && (
                                                        <span className={`ml-3 rounded-md px-1.5 py-0.5 text-[10px] font-black ${
                                                            activeSection === item.id
                                                                ? 'bg-orange-500/15 text-orange-300'
                                                                : 'bg-gray-900 text-gray-500'
                                                        }`}>
                                                            {item.count}
                                                        </span>
                                                    )}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </nav>

                            {/* Base URL box */}
                            <div className="mt-8 rounded-2xl border border-gray-800 bg-black/30 overflow-hidden">
                                <div className="border-b border-gray-800 px-4 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-600">Base URL</p>
                                </div>
                                <div className="px-4 py-4">
                                    <code className="block text-xs font-mono text-orange-400">{PUBLIC_API_BASE}</code>
                                    <p className="mt-2 text-[11px] text-gray-600">Test keys and live keys both authenticate against the same API domain.</p>
                                </div>
                            </div>

                            <div className="mt-4 rounded-2xl border border-orange-500/15 bg-gradient-to-br from-orange-500/8 to-yellow-500/6 p-4">
                                <p className="text-sm font-black text-white mb-1">Need help?</p>
                                <p className="text-xs text-gray-500 mb-3 leading-relaxed">Developer support responds during business hours for integration issues and launch blockers.</p>
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
                                    FlapaPay is a complete financial infrastructure platform. You can use it to build payment, subscription, payout, and reconciliation flows on a single API surface.
                                </p>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {[
                                        { title: 'Payments & Checkout', desc: 'One-time and recurring payments, checkout sessions, payment links' },
                                        { title: 'Wallets & Settlement', desc: 'Direct wallet settlement, ledger entries, and reporting flows' },
                                        { title: 'Virtual Cards', desc: 'Issue and control prepaid virtual Visa/Mastercard cards' },
                                        { title: 'Subscriptions', desc: 'Recurring billing with products, prices, and customer lifecycle handling' },
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
                                                    <button onClick={() => copyCode(normalizeDocExample(s.code), `qs-${i}`)} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-orange-400 transition-colors">
                                                        {copiedCode === `qs-${i}` ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                                                    </button>
                                                </div>
                                                <pre className="p-4 rounded-b-xl bg-black border border-gray-800 text-sm font-mono text-gray-300 overflow-x-auto leading-relaxed">{normalizeDocExample(s.code)}</pre>
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

                        <section id="banking">
                            <SectionHeader icon={<Database className="w-5 h-5" />} title="Banking, Collections & Settlements" subtitle="Provider-agnostic FlapaPay resources for bank lookup, recipients, collections, payouts, and wallet settlement" />
                            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6 mb-8">
                                <p className="text-gray-400 leading-relaxed text-[15px] mb-4">
                                    FlapaPay exposes banking and settlement infrastructure as FlapaPay API resources. Merchants authenticate with FlapaPay API keys, resolve accounts, create recipients, initiate collections and transfers, and read back normalized settlement records while provider infrastructure stays behind the scenes.
                                </p>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {[
                                        { title: 'Banks', desc: 'List supported financial institutions for payout setup and validation.' },
                                        { title: 'Resolve & Recipients', desc: 'Verify bank and mobile money destinations before collecting, storing, or transferring.' },
                                        { title: 'Collections & Transfers', desc: 'Credit or debit merchant wallets while FlapaPay tracks lifecycle under one API contract.' },
                                        { title: 'Settlement Model', desc: 'Wallets and ledger entries remain the source of truth for merchant balances and reporting.' },
                                    ].map((item) => (
                                        <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl bg-black/30 border border-gray-800/60">
                                            <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0"></div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{item.title}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-6">
                                {infrastructureEndpoints.map(renderEndpointCard)}
                            </div>
                        </section>

                        {/* ── CHECKOUT SESSIONS ─────────────────────── */}
                        <section id="checkout">
                            <SectionHeader
                                icon={<CreditCard className="w-5 h-5" />}
                                title="Checkout Sessions"
                                subtitle="Create hosted checkout pages, subscriptions, and direct wallet settlement flows"
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
                                            { event: 'payout.completed', desc: 'Payout succeeded' },
                                            { event: 'payout.failed', desc: 'Payout failed' },
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
                                            <button onClick={() => copyCode(normalizeDocExample(codeExamples.webhook), 'webhook-main')} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-orange-400 transition-colors">
                                                {copiedCode === 'webhook-main' ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                                            </button>
                                        </div>
                                        <pre className="p-5 rounded-b-xl bg-black border border-gray-800 text-sm font-mono text-gray-300 overflow-x-auto leading-relaxed">{normalizeDocExample(codeExamples.webhook)}</pre>
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
