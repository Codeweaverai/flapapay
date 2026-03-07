import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { AskAIAssistant } from '../components/AskAIAssistant';

const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language: _language = 'bash' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-[#0D0D0D] rounded-2xl p-6 overflow-x-auto my-6 border border-white/5 group relative shadow-2xl">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className={`text-xs border-white/10 ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                >
                    {copied ? 'Copied!' : 'Copy'}
                </Button>
            </div>
            <div className="flex gap-1.5 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
            </div>
            <pre className="font-mono text-sm text-gray-400 leading-relaxed">
                <code>{code}</code>
            </pre>
        </div>
    );
};

const Endpoint: React.FC<{ method: string; path: string; description: string }> = ({ method, path, description }) => (
    <div className="group border border-gray-100 rounded-[32px] p-8 mb-8 hover:border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/5 transition-all duration-500 bg-white">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${method === 'GET' ? 'bg-blue-50 text-blue-600' :
                method === 'POST' ? 'bg-orange-50 text-orange-600' :
                    method === 'DELETE' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                }`}>
                {method}
            </span>
            <code className="font-mono text-gray-900 font-black text-lg">{path}</code>
        </div>
        <p className="text-gray-500 text-lg leading-relaxed">{description}</p>
    </div>
);

const ParameterTable: React.FC<{ params: { name: string; type: string; desc: string; required?: boolean }[] }> = ({ params }) => (
    <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm my-8">
        <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 font-mono">Parameter</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 font-mono">Type</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 font-mono">Description</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {params.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-6">
                            <code className="text-orange-600 font-bold">{p.name}</code>
                            {p.required && <span className="ml-2 text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Required</span>}
                        </td>
                        <td className="px-8 py-6"><span className="text-xs font-mono text-gray-400 px-2 py-1 bg-gray-50 rounded-lg">{p.type}</span></td>
                        <td className="px-8 py-6 text-gray-500 text-sm leading-relaxed">{p.desc}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const MultiLangRequestResponse: React.FC<{
    requestSamples: { id: string; name: string; code: string }[];
    responseCode: string;
}> = ({ requestSamples, responseCode }) => {
    const [activeLang, setActiveLang] = useState(requestSamples[0].id);
    const [copied, setCopied] = useState(false);

    const activeCode = requestSamples.find(r => r.id === activeLang)?.code || '';

    const handleCopy = () => {
        navigator.clipboard.writeText(activeCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-[#0a0a0b] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden mt-8">
            {/* Header Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-white/[0.02] border-b border-white/5">
                <div className="flex overflow-x-auto scrollbar-hide">
                    {requestSamples.map(sample => (
                        <button
                            key={sample.id}
                            onClick={() => setActiveLang(sample.id)}
                            className={`px-6 py-4 text-sm font-bold tracking-wide transition-colors whitespace-nowrap border-b-2 ${activeLang === sample.id
                                ? 'text-orange-400 border-orange-400 bg-orange-400/5'
                                : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/[0.02]'
                                }`}
                        >
                            {sample.name}
                        </button>
                    ))}
                </div>
                <div className="px-4 py-2 hidden md:block">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopy}
                        className={`text-xs border-white/10 ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-white/5">
                {/* Request Side */}
                <div className="p-6">
                    <div className="mb-4">
                        <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Request</span>
                    </div>
                    <pre className="font-mono text-[13px] text-gray-300 overflow-x-auto leading-relaxed scrollbar-hide">
                        <code>{activeCode}</code>
                    </pre>
                </div>

                {/* Response Side */}
                <div className="p-6 bg-black/40">
                    <div className="mb-4 flex justify-between items-center">
                        <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Response</span>
                        <span className="text-[10px] font-black tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">200 OK</span>
                    </div>
                    <pre className="font-mono text-[13px] text-gray-400 overflow-x-auto leading-relaxed scrollbar-hide">
                        <code>{responseCode}</code>
                    </pre>
                </div>
            </div>
        </div>
    );
};

export const DevelopersPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('quickstart');

    // Playground State
    const [playgroundAmount, setPlaygroundAmount] = useState('2000');
    const [playgroundCurrency, setPlaygroundCurrency] = useState('ZMW');
    const [playgroundApiKey, setPlaygroundApiKey] = useState('');
    const [playgroundResponse, setPlaygroundResponse] = useState<any>(null);
    const [playgroundRequest, setPlaygroundRequest] = useState<any>(null);
    const [playgroundStatus, setPlaygroundStatus] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [playgroundMode, setPlaygroundMode] = useState<'checkout' | 'connect' | 'marketplace'>('checkout');
    const [connectEmail, setConnectEmail] = useState('vendor@example.com');
    const [connectBusinessName, setConnectBusinessName] = useState('Green Solutions Ltd');
    const [escrowSellerEmail, setEscrowSellerEmail] = useState('seller@marketplace.com');
    const [escrowDescription, setEscrowDescription] = useState('Vintage Professional Camera');

    // Payment Link Playground State
    const [paymentLinkUrlInput, setPaymentLinkUrlInput] = useState('http://localhost:5173/pay/demo-link');
    const [activeDemoUrl, setActiveDemoUrl] = useState('');

    const handlePlaygroundCall = async () => {
        setIsLoading(true);
        setPlaygroundResponse(null);
        setPlaygroundRequest(null);
        setPlaygroundStatus(null);

        const demoKey = 'sk_test_6e4a1c2a940dc1de7629f61f2c28062ec1f2dcd419c83f17';
        const authKey = playgroundApiKey || demoKey;

        let url = '';
        let body = {};
        const method = 'POST';

        if (playgroundMode === 'checkout') {
            url = 'http://localhost:3005/v1/checkout/sessions';
            body = {
                amount: parseInt(playgroundAmount),
                currency: playgroundCurrency.toLowerCase(),
                success_url: 'http://localhost:5173/merchant/dashboard?success=true',
                cancel_url: 'http://localhost:5173/developers?tab=checkout&cancel=true',
                payment_method_types: ['card', 'mobile_money']
            };
        } else if (playgroundMode === 'connect') {
            url = 'http://localhost:3005/v1/connect/accounts';
            body = {
                type: 'custom',
                country: 'ZM',
                email: connectEmail,
                business_name: connectBusinessName,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true }
                }
            };
        } else {
            url = 'http://localhost:3005/api/v1/escrows';
            body = {
                amount: parseInt(playgroundAmount),
                currency: playgroundCurrency.toLowerCase(),
                description: escrowDescription,
                seller_email: escrowSellerEmail,
                metadata: { marketplace: 'Developer Playground v1' }
            };
        }

        const headers = { 'Authorization': `Bearer ${authKey.substring(0, 12)}...` };
        setPlaygroundRequest({ method, url, headers, body });

        try {
            const response = await axios({
                method,
                url,
                data: body,
                headers: { 'Authorization': `Bearer ${authKey}` }
            });

            setPlaygroundStatus(response.status);
            setPlaygroundResponse(response.data);
        } catch (error: any) {
            console.error('Playground Error:', error);
            setPlaygroundStatus(error.response?.status || 500);
            setPlaygroundResponse({
                error: error.response?.data?.error || 'Failed to complete request',
                code: error.code,
                message: error.message,
                tip: error.response?.status === 401 ? 'Your API key is invalid or unauthorized.' : 'Make sure the backend is running on port 3005'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const sidebarItems = [
        { section: 'GUIDES', items: ['Quickstart', 'Authentication', 'Errors', 'Webhooks'] },
        { section: 'API REFERENCE', items: ['Charges', 'Checkout', 'Connect', 'Marketplace v1', 'Refunds', 'Payment Links', 'Customers', 'Wallets', 'Payouts'] }
    ];

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-32 pb-24 bg-black text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500 rounded-full blur-[200px] opacity-10 -translate-y-1/2 translate-x-1/4"></div>
                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-black text-orange-400 uppercase tracking-widest mb-8">
                            Documentation
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight">
                            Build for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400 text-shadow-glow">Next Era</span> of African Commerce.
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-400 leading-relaxed mb-12">
                            Integrate global payments, mobile money, and virtual cards with a single unified REST API.
                            Developer-first, enterprise-ready.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/merchant/signup">
                                <Button size="lg" className="bg-orange-500 text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-orange-500/20 active:scale-95 transition-all text-xl">
                                    Create Test Account
                                </Button>
                            </Link>
                            <Link to="/merchant/login">
                                <Button size="lg" variant="outline" className="px-10 py-5 rounded-2xl font-black border-white/20 text-white hover:bg-white/10 active:scale-95 transition-all text-xl">
                                    Log in to Dashboard
                                </Button>
                            </Link>
                        </div>
                        <p className="mt-6 text-gray-500 text-sm">
                            Already have a developer account? <Link to="/merchant/login" className="text-orange-400 hover:underline">Sign in here</Link>
                        </p>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-20">
                    {/* Sidebar Nav */}
                    <div className="hidden lg:block space-y-12 sticky top-32 self-start">
                        {sidebarItems.map((group, idx) => (
                            <div key={idx}>
                                <h4 className="font-black text-gray-900 mb-6 text-sm uppercase tracking-[0.2em]">{group.section}</h4>
                                <div className="space-y-2">
                                    {group.items.map(item => (
                                        <button
                                            key={item}
                                            onClick={() => setActiveTab(item.toLowerCase())}
                                            className={`group flex items-center w-full text-left px-5 py-3 rounded-2xl text-lg font-bold transition-all duration-300 ${activeTab === item.toLowerCase()
                                                ? 'bg-orange-50 text-orange-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                                }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full bg-orange-500 mr-4 transition-all duration-300 ${activeTab === item.toLowerCase() ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                                                }`}></span>
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
                            {activeTab === 'quickstart' && (
                                <div className="space-y-16">
                                    <header>
                                        <h2 className="text-4xl font-black text-gray-900 mb-6">Quickstart</h2>
                                        <p className="text-xl text-gray-500 leading-relaxed max-w-3xl">
                                            The FlapaPay API is organized around REST. It has predictable resource-oriented URLs,
                                            accepts JSON-encoded request bodies, and returns standard HTTP response codes.
                                        </p>
                                    </header>

                                    <section className="space-y-8">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-black">1</div>
                                            <h3 className="text-2xl font-black text-gray-900">Install the SDK</h3>
                                        </div>
                                        <CodeBlock code="npm install @flapapay/node-sdk --save" />
                                    </section>

                                    <section className="space-y-8">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-black">2</div>
                                            <h3 className="text-2xl font-black text-gray-900">Authenticate</h3>
                                        </div>
                                        <p className="text-gray-500 text-lg leading-relaxed">
                                            Use your Secret Key to authenticate requests. Manage keys in your Developer Dashboard.
                                        </p>
                                        <CodeBlock language="javascript" code={`const FlapaPay = require('@flapapay/node-sdk');\nconst client = new FlapaPay('sk_test_...');`} />
                                    </section>
                                </div>
                            )}

                            {activeTab === 'authentication' && (
                                <div className="space-y-12">
                                    <header>
                                        <h2 className="text-4xl font-black text-gray-900 mb-6">Authentication</h2>
                                        <p className="text-xl text-gray-500 leading-relaxed max-w-4xl">
                                            The FlapaPay API uses API keys to authenticate requests. You can view and manage your API keys in the FlapaPay Dashboard.
                                        </p>
                                    </header>

                                    <section className="bg-orange-50 rounded-[32px] p-8 border border-orange-100 italic">
                                        <h4 className="font-black text-orange-900 mb-4 uppercase tracking-widest text-sm underline decoration-orange-500/20 underline-offset-4">Security Requirement</h4>
                                        <p className="text-orange-800 leading-relaxed text-lg">
                                            Your API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.
                                        </p>
                                    </section>

                                    <section className="space-y-10">
                                        <h3 className="text-3xl font-black text-gray-900">Types of Keys</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="p-8 border border-gray-100 rounded-3xl bg-white hover:border-emerald-500/30 transition-all">
                                                <div className="flex items-center gap-3 mb-4 text-emerald-600">
                                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                                    <h4 className="font-black uppercase tracking-widest text-xs">Live Mode</h4>
                                                </div>
                                                <p className="text-gray-500 text-lg leading-relaxed">Used for real transactions. Prefixed with <code>sk_live_</code>.</p>
                                            </div>
                                            <div className="p-8 border border-gray-100 rounded-3xl bg-white hover:border-orange-500/30 transition-all">
                                                <div className="flex items-center gap-3 mb-4 text-orange-600">
                                                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                                    <h4 className="font-black uppercase tracking-widest text-xs">Test Mode</h4>
                                                </div>
                                                <p className="text-gray-500 text-lg leading-relaxed">Used for integration and testing. Prefixed with <code>sk_test_</code>.</p>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="text-3xl font-black text-gray-900 mb-8">Authentication Header</h3>
                                        <p className="text-gray-500 text-lg mb-8 leading-relaxed max-w-3xl">All API requests must be made over HTTPS. Calls made over plain HTTP will fail. API requests without authentication will also fail.</p>
                                        <CodeBlock code={`curl https://api.flapapay.com/v1/charges \\\n  -H "Authorization: Bearer YOUR_SECRET_KEY"`} />
                                    </section>
                                </div>
                            )}

                            {activeTab === 'checkout' && (
                                <div className="space-y-16">
                                    <header>
                                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6">
                                            Unified Checkout
                                        </div>
                                        <h2 className="text-5xl font-black text-gray-900 mb-8 leading-tight">Checkout Sessions</h2>
                                        <p className="text-2xl text-gray-500 leading-relaxed max-w-3xl">
                                            FlapaPay Checkout is a pre-built, hosted payment page optimized for conversion.
                                            It supports Mobile Money, Cards, and Bank Transfers across Africa.
                                        </p>
                                    </header>

                                    <section className="space-y-10">
                                        <h3 className="text-3xl font-black text-gray-900 mb-10">Integration Flow</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            {[
                                                { step: '1', title: 'Create Session', desc: 'Securely generate a unique checkout URL from your server.' },
                                                { step: '2', title: 'Redirect User', desc: 'Send customers to FlapaPay\'s high-converting hosted interface.' },
                                                { step: '3', title: 'Confirm Status', desc: 'User returns to your site. Webhooks confirm the payment status.' }
                                            ].map((item, i) => (
                                                <div key={i} className="group p-10 rounded-[40px] bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-2xl transition-all duration-500">
                                                    <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center font-black text-xl mb-6">{item.step}</div>
                                                    <h4 className="font-black text-gray-900 mb-3 text-lg">{item.title}</h4>
                                                    <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="space-y-10">
                                        <h3 className="text-3xl font-black text-gray-900">Create a Session</h3>
                                        <Endpoint method="POST" path="/v1/checkout/sessions" description="Initialize a new checkout flow for your customer." />
                                        <ParameterTable params={[
                                            { name: 'amount', type: 'integer', desc: 'Amount in minor units (e.g., 2000 for 20.00).', required: true },
                                            { name: 'currency', type: 'string', desc: 'ISO currency code (zmw, usd).', required: true },
                                            { name: 'success_url', type: 'string', desc: 'URL to redirect after payment.', required: true },
                                            { name: 'cancel_url', type: 'string', desc: 'URL to redirect if user cancels.', required: true }
                                        ]} />
                                        <MultiLangRequestResponse
                                            requestSamples={[
                                                { id: 'curl', name: 'cURL', code: `curl https://api.flapapay.com/v1/checkout/sessions \\\n  -u sk_test_...: \\\n  -d amount=5000 \\\n  -d currency=zmw \\\n  -d success_url="https://myshop.com/success" \\\n  -d cancel_url="https://myshop.com/cancel"` },
                                                { id: 'node', name: 'Node.js', code: `const flapapay = require('flapapay')('sk_test_...');\n\nconst session = await flapapay.checkout.sessions.create({\n  amount: 5000,\n  currency: 'zmw',\n  success_url: 'https://myshop.com/success',\n  cancel_url: 'https://myshop.com/cancel',\n});` },
                                                { id: 'python', name: 'Python', code: `import flapapay\nflapapay.api_key = "sk_test_..."\n\nsession = flapapay.checkout.Session.create(\n  amount=5000,\n  currency="zmw",\n  success_url="https://myshop.com/success",\n  cancel_url="https://myshop.com/cancel",\n)` },
                                                { id: 'php', name: 'PHP', code: `$flapapay = new \\FlapaPay\\FlapaPay('sk_test_...');\n\n$session = $flapapay->checkout->sessions->create([\n  'amount' => 5000,\n  'currency' => 'zmw',\n  'success_url' => 'https://myshop.com/success',\n  'cancel_url' => 'https://myshop.com/cancel',\n]);` },
                                                { id: 'ruby', name: 'Ruby', code: `require 'flapapay'\nFlapaPay.api_key = 'sk_test_...'\n\nsession = FlapaPay::Checkout::Session.create({\n  amount: 5000,\n  currency: 'zmw',\n  success_url: 'https://myshop.com/success',\n  cancel_url: 'https://myshop.com/cancel',\n})` },
                                                { id: 'go', name: 'Go', code: `import "github.com/flapapay/flapapay-go/v1"\nimport "github.com/flapapay/flapapay-go/v1/checkout/session"\n\nflapapay.Key = "sk_test_..."\n\nparams := &session.CreateParams{\n  Amount: flapapay.Int64(5000),\n  Currency: flapapay.String(string(flapapay.CurrencyZmw)),\n  SuccessURL: flapapay.String("https://myshop.com/success"),\n  CancelURL: flapapay.String("https://myshop.com/cancel"),\n}\ns, err := session.New(params)` },
                                                { id: 'java', name: 'Java', code: `import com.flapapay.FlapaPay;\nimport com.flapapay.model.checkout.Session;\nimport com.flapapay.param.checkout.SessionCreateParams;\n\nFlapaPay.apiKey = "sk_test_...";\n\nSessionCreateParams params =\n  SessionCreateParams.builder()\n    .setAmount(5000L)\n    .setCurrency("zmw")\n    .setSuccessUrl("https://myshop.com/success")\n    .setCancelUrl("https://myshop.com/cancel")\n    .build();\n\nSession session = Session.create(params);` }
                                            ]}
                                            responseCode={`{\n  "id": "cs_test_a1b2c3d4e5f6g7h8",\n  "object": "checkout.session",\n  "amount_total": 5000,\n  "currency": "zmw",\n  "payment_status": "unpaid",\n  "status": "open",\n  "url": "https://checkout.flapapay.com/c/pay/cs_test_a1b2...",\n  "success_url": "https://myshop.com/success",\n  "cancel_url": "https://myshop.com/cancel",\n  "created": 1678901234\n}`}
                                        />
                                    </section>

                                    <div className="p-12 bg-black rounded-[50px] shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500 rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/4 group-hover:scale-110 transition-transform duration-1000"></div>
                                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                            <div>
                                                <h4 className="text-3xl font-black text-white mb-4">Try Checkout Now</h4>
                                                <p className="text-gray-400 text-lg max-w-sm">Experience the hosted checkout interface in our playground below.</p>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    setPlaygroundMode('checkout');
                                                    document.getElementById('playground-area')?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                                className="bg-white text-black px-12 py-6 rounded-2xl font-black shadow-xl hover:scale-105 transition-all"
                                            >
                                                Open Playground
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'payment links' && (
                                <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <header>
                                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-6">
                                            No-Code & Low-Code
                                        </div>
                                        <h2 className="text-5xl font-black text-gray-900 mb-8 leading-tight">Payment Links & Widgets</h2>
                                        <p className="text-2xl text-gray-500 leading-relaxed max-w-3xl">
                                            Generate secure payment URLs that you can share via SMS, WhatsApp, email, or embed directly into your website as a powerful payment widget. <span className="text-gray-900 font-bold">No backend API required!</span> Just generate links directly from your Merchant Dashboard.
                                        </p>
                                    </header>

                                    <section className="space-y-10">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black">1</div>
                                            <h3 className="text-3xl font-black text-gray-900">Create from Dashboard</h3>
                                        </div>
                                        <p className="text-gray-500 text-lg leading-relaxed max-w-4xl">
                                            Forget complex integrations. Head over to <b>Payment Links</b> in your Merchant Dashboard, set an amount, and instantly generate a link. You can then copy the unique ID or the full URL.
                                        </p>
                                    </section>

                                    <section className="space-y-10">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black">2</div>
                                            <h3 className="text-3xl font-black text-gray-900">Embed on Website (Widget)</h3>
                                        </div>
                                        <p className="text-gray-500 text-lg leading-relaxed max-w-4xl">
                                            You can embed any Payment Link directly into your HTML website as a slick, modal checkout widget. Your customers will pay without ever leaving your product page.
                                        </p>

                                        <div className="bg-slate-900 rounded-[2rem] p-8 mt-6 border border-slate-800 shadow-2xl">
                                            <h4 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4">HTML Example</h4>
                                            <CodeBlock language="html" code={`<!-- 1. Include the FlapaPay Widget Script in your <head> or before closing </body> -->
<script src="https://js.flapapay.com/v1/widget.js"></script>

<!-- 2. Add a payment button -->
<button id="buy-button">Buy Consultation - K500</button>

<!-- 3. Initialize the Widget with your Payment Link ID -->
<script>
  document.getElementById('buy-button').addEventListener('click', () => {
    FlapaPayWidget.open({
      paymentLinkUrl: 'http://localhost:5173/pay/7fad513e-b308-496d-9c97-9d4790f2eb87',
      onSuccess: function() { alert('Payment successful!'); }
    });
  });
</script>`} />
                                        </div>
                                    </section>

                                    <section className="space-y-10 pt-10 border-t border-gray-100">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-black">✨</div>
                                            <h3 className="text-3xl font-black text-gray-900">Interactive Widget Playground</h3>
                                        </div>
                                        <p className="text-gray-500 text-lg leading-relaxed max-w-4xl">
                                            Paste your generated Payment Link URL below to see it live in action. This represents exactly how your customers will see the checkout when they interact with your website widget.
                                        </p>

                                        <div className="grid grid-cols-1 xl:grid-cols-5 gap-10 bg-gray-50 rounded-[3rem] p-10 border border-gray-200">
                                            {/* Configuration Side */}
                                            <div className="xl:col-span-2 space-y-6">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">Payment Link URL</label>
                                                    <input
                                                        type="text"
                                                        value={paymentLinkUrlInput}
                                                        onChange={(e) => setPaymentLinkUrlInput(e.target.value)}
                                                        className="w-full bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 text-lg font-bold text-gray-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                                                        placeholder="http://localhost:5173/pay/..."
                                                    />
                                                </div>
                                                <Button
                                                    onClick={() => setActiveDemoUrl(paymentLinkUrlInput)}
                                                    className="w-full py-4 bg-black text-white rounded-2xl font-black shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                                                >
                                                    Launch Live Preview
                                                </Button>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest text-center mt-4">
                                                    Renders the real FlapaPay checkout interface
                                                </p>
                                            </div>

                                            {/* Rendered Widget Side */}
                                            <div className="xl:col-span-3 bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100 relative overflow-hidden min-h-[500px] flex items-center justify-center">
                                                {!activeDemoUrl ? (
                                                    <div className="text-center opacity-50">
                                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-300">
                                                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        </div>
                                                        <p className="text-gray-500 font-bold text-sm">Paste a URL to see the live checkout</p>
                                                    </div>
                                                ) : (
                                                    <div className="animate-in fade-in zoom-in duration-500 w-full h-full absolute inset-0">
                                                        <div className="absolute top-4 right-4 z-20">
                                                            <button
                                                                onClick={() => setActiveDemoUrl('')}
                                                                className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors font-black"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                        <iframe
                                                            src={activeDemoUrl}
                                                            className="w-full h-full border-0 rounded-[1.5rem]"
                                                            title="Payment Link Preview"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'connect' && (
                                <div className="space-y-16">
                                    <header>
                                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-6">
                                            Marketplace & Platforms
                                        </div>
                                        <h2 className="text-5xl font-black text-gray-900 mb-8 leading-tight">Connect</h2>
                                        <p className="text-2xl text-gray-500 leading-relaxed max-w-4xl">
                                            Onboard vendors, split payments, and manage payouts at scale. Connect is the powerful engine behind Africa's leading platforms.
                                        </p>
                                    </header>

                                    <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="p-10 bg-emerald-50 rounded-[40px] border border-emerald-100">
                                            <h4 className="text-2xl font-black text-emerald-900 mb-4">Express Onboarding</h4>
                                            <p className="text-emerald-800 leading-relaxed mb-6">Onboard sellers with FlapaPay-hosted KYC flows. We handle verify identities and bank accounts for you.</p>
                                            <ul className="space-y-3">
                                                {['Self-serve KYC', 'Instant Payout Access', 'Multi-currency Support'].map((f, i) => (
                                                    <li key={i} className="flex items-center gap-3 text-emerald-900 font-bold">
                                                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="p-10 bg-gray-900 rounded-[40px] text-white">
                                            <h4 className="text-2xl font-black mb-4 text-emerald-400 font-mono italic underline decoration-emerald-500/20 underline-offset-4 tracking-tighter">Split Payments</h4>
                                            <p className="text-gray-400 leading-relaxed mb-6">Automatically route funds to multiple sellers while taking your platform fee in one transaction.</p>
                                            <CodeBlock code={`// Split example\n{\n  "amount": 10000,\n  "splits": [\n    { "account": "acct_...", "amount": 8500 },\n    { "amount": 1500 } // Your fee\n  ]\n}`} />
                                        </div>
                                    </section>

                                    <section className="space-y-10">
                                        <h3 className="text-3xl font-black text-gray-900 mb-8">Provisioning Accounts</h3>
                                        <Endpoint method="POST" path="/v1/connect/accounts" description="Create a new account for your vendor or marketplace participant." />
                                        <ParameterTable params={[
                                            { name: 'email', type: 'string', desc: 'Vendor\'s contact email.', required: true },
                                            { name: 'business_name', type: 'string', desc: 'Display name of the vendor business.', required: true },
                                            { name: 'country', type: 'string', desc: 'ISO country code (default: ZM).' }
                                        ]} />
                                        <MultiLangRequestResponse
                                            requestSamples={[
                                                { id: 'curl', name: 'cURL', code: `curl https://api.flapapay.com/v1/connect/accounts \\\n  -H "Authorization: Bearer sk_test_6e4a..." \\\n  -H "Content-Type: application/json" \\\n  -d '{\n  "type": "custom",\n  "country": "ZM",\n  "email": "taylor@example.com",\n  "business_name": "Taylor Solutions Ltd",\n  "capabilities": {\n    "card_payments": {"requested": true},\n    "transfers": {"requested": true}\n  }\n}'` },
                                                { id: 'node', name: 'Node.js', code: `const flapapay = require('flapapay')('sk_test_6e4a...');\n\nconst account = await flapapay.connect.accounts.create({\n  type: 'custom',\n  country: 'ZM',\n  email: 'taylor@example.com',\n  business_name: 'Taylor Solutions Ltd',\n  capabilities: {\n    card_payments: { requested: true },\n    transfers: { requested: true },\n  },\n});` },
                                                { id: 'python', name: 'Python', code: `import flapapay\nflapapay.api_key = "sk_test_6e4a..."\n\naccount = flapapay.connect.Account.create(\n  type="custom",\n  country="ZM",\n  email="taylor@example.com",\n  business_name="Taylor Solutions Ltd",\n  capabilities={\n    "card_payments": {"requested": True},\n    "transfers": {"requested": True},\n  },\n)` },
                                                { id: 'php', name: 'PHP', code: `$flapapay = new \\FlapaPay\\FlapaPay('sk_test_6e4a...');\n\n$account = $flapapay->connect->accounts->create([\n  'type' => 'custom',\n  'country' => 'ZM',\n  'email' => 'taylor@example.com',\n  'business_name' => 'Taylor Solutions Ltd',\n  'capabilities' => [\n    'card_payments' => ['requested' => true],\n    'transfers' => ['requested' => true],\n  ],\n]);` },
                                                { id: 'ruby', name: 'Ruby', code: `require 'flapapay'\nFlapaPay.api_key = 'sk_test_6e4a...'\n\naccount = FlapaPay::Connect::Account.create({\n  type: 'custom',\n  country: 'ZM',\n  email: 'taylor@example.com',\n  business_name: 'Taylor Solutions Ltd',\n  capabilities: {\n    card_payments: { requested: true },\n    transfers: { requested: true },\n  },\n})` },
                                                { id: 'go', name: 'Go', code: `import "github.com/flapapay/flapapay-go/v1"\nimport "github.com/flapapay/flapapay-go/v1/connect/account"\n\nflapapay.Key = "sk_test_6e4a..."\n\nparams := &account.CreateParams{\n  Type: flapapay.String("custom"),\n  Country: flapapay.String("ZM"),\n  Email: flapapay.String("taylor@example.com"),\n  BusinessName: flapapay.String("Taylor Solutions Ltd"),\n  Capabilities: &account.CapabilitiesParams{\n    CardPayments: &account.CapabilitiesCardPaymentsParams{Requested: flapapay.Bool(true)},\n    Transfers: &account.CapabilitiesTransfersParams{Requested: flapapay.Bool(true)},\n  },\n}\na, err := account.New(params)` },
                                                { id: 'java', name: 'Java', code: `import com.flapapay.FlapaPay;\nimport com.flapapay.model.connect.Account;\nimport com.flapapay.param.connect.AccountCreateParams;\n\nFlapaPay.apiKey = "sk_test_6e4a...";\n\nAccountCreateParams params =\n  AccountCreateParams.builder()\n    .setType("custom")\n    .setCountry("ZM")\n    .setEmail("taylor@example.com")\n    .setBusinessName("Taylor Solutions Ltd")\n    .setCapabilities(\n      AccountCreateParams.Capabilities.builder()\n        .setCardPayments(AccountCreateParams.Capabilities.CardPayments.builder().setRequested(true).build())\n        .setTransfers(AccountCreateParams.Capabilities.Transfers.builder().setRequested(true).build())\n        .build()\n    )\n    .build();\n\nAccount account = Account.create(params);` }
                                            ]}
                                            responseCode={`{\n  "id": "49144fa0-486c-47e7-9879-c10566fdad35",\n  "object": "account",\n  "type": "custom",\n  "capabilities": {\n    "transfers": {\n      "requested": true\n    },\n    "card_payments": {\n      "requested": true\n    }\n  },\n  "requirements": {\n    "currently_due": [\n      "business.tax_id",\n      "individual.id_number"\n    ],\n    "eventually_due": []\n  }\n}`}
                                        />
                                    </section>

                                    <div className="p-12 bg-white rounded-[50px] border-4 border-emerald-500/10 shadow-2xl relative overflow-hidden group">
                                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                            <div className="text-center md:text-left">
                                                <h4 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter italic">Connect Sandbox</h4>
                                                <p className="text-gray-500 text-xl max-w-sm leading-relaxed">Test the onboarding flow and account creation in real-time.</p>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    setPlaygroundMode('connect');
                                                    document.getElementById('playground-area')?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                                className="bg-emerald-600 text-white px-12 py-6 rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition-all"
                                            >
                                                Start Simulation
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'charges' && (
                                <div className="space-y-16">
                                    <header>
                                        <h2 className="text-4xl font-black text-gray-900 mb-6">Charges</h2>
                                        <p className="text-2xl text-gray-500 leading-relaxed max-w-4xl">
                                            Directly process payments using mobile money numbers or card tokens.
                                        </p>
                                    </header>

                                    <section className="space-y-10">
                                        <Endpoint method="POST" path="/v1/charges" description="Charge a customer immediately using a source identifier." />
                                        <ParameterTable params={[
                                            { name: 'amount', type: 'integer', desc: 'The amount in the smallest unit.', required: true },
                                            { name: 'currency', type: 'string', desc: 'ISO currency code (e.g., zmw).', required: true },
                                            { name: 'source', type: 'string', desc: 'A mobile number (260...) or card token (tok_...).', required: true },
                                            { name: 'description', type: 'string', desc: 'An arbitrary string to describe the charge.' }
                                        ]} />
                                        <CodeBlock code={`curl https://api.flapapay.com/v1/charges \\\n  -d amount=4500 \\\n  -d currency="zmw" \\\n  -d source="260977000000"`} />
                                    </section>
                                </div>
                            )}

                            {activeTab === 'payouts' && (
                                <div className="space-y-16">
                                    <header>
                                        <h2 className="text-4xl font-black text-gray-900 mb-6">Payouts</h2>
                                        <p className="text-2xl text-gray-500 leading-relaxed max-w-4xl">
                                            Automate disbursements to vendors, employees, or customers worldwide.
                                        </p>
                                    </header>

                                    <section className="space-y-10">
                                        <Endpoint method="POST" path="/v1/payouts" description="Send funds to a bank account or mobile money wallet." />
                                        <ParameterTable params={[
                                            { name: 'amount', type: 'integer', desc: 'The amount to send.', required: true },
                                            { name: 'currency', type: 'string', desc: 'ISO currency code.', required: true },
                                            { name: 'destination', type: 'string', desc: 'Recipient identifier (bank acct or phone).', required: true }
                                        ]} />
                                        <CodeBlock code={`curl https://api.flapapay.com/v1/payouts \\\n  -d amount=15000 \\\n  -d destination="260955000123"`} />
                                    </section>
                                </div>
                            )}

                            {activeTab === 'marketplace v1' && (
                                <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
                                    <header>
                                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6 shadow-sm">
                                            Beta v1.0
                                        </div>
                                        <h2 className="text-5xl font-black text-gray-900 mb-8 leading-tight tracking-tight">Marketplace Escrow</h2>
                                        <p className="text-2xl text-gray-500 leading-relaxed max-w-4xl font-medium">
                                            Integrate enterprise-grade escrow protocols into your platform. Perfect for marketplaces like eBay, service companies, or private trade.
                                        </p>
                                    </header>

                                    {/* Lifecycle Breakdown */}
                                    <section className="space-y-10">
                                        <h3 className="text-3xl font-black text-gray-900 group flex items-center gap-3">
                                            The Escrow Protocol
                                            <span className="w-12 h-0.5 bg-indigo-500 rounded-full group-hover:w-20 transition-all"></span>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {[
                                                { stage: '1. PENDING', desc: 'Awaiting payment confirmation' },
                                                { stage: '2. FUNDED', desc: 'Securely held in FlapaPay Vault' },
                                                { stage: '3. SHIPPED', desc: 'Seller has dispatched items' },
                                                { stage: '4. RELEASED', desc: 'Final payout to seller account' }
                                            ].map((s, i) => (
                                                <div key={i} className="p-6 rounded-[2.5rem] bg-indigo-50/30 border border-indigo-100/50 hover:bg-white hover:shadow-xl transition-all">
                                                    <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">{s.stage}</div>
                                                    <p className="text-gray-900 font-bold leading-tight">{s.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Create Escrow */}
                                    <section className="space-y-10">
                                        <div className="flex flex-col gap-4">
                                            <h3 className="text-3xl font-black text-gray-900">Initiate Escrow</h3>
                                            <p className="text-gray-500 text-lg max-w-2xl">Create a secure transaction between a buyer and a seller. The funds are held by FlapaPay until both parties fulfill their obligations.</p>
                                        </div>

                                        <Endpoint method="POST" path="/api/v1/escrows" description="Creates a new marketplace escrow session and notifies the seller." />

                                        <ParameterTable params={[
                                            { name: 'amount', type: 'integer', desc: 'Amount in minor units (e.g. 10000 for 100.00)', required: true },
                                            { name: 'currency', type: 'string', desc: 'ISO code (zmw, usd, ngn)', required: true },
                                            { name: 'description', type: 'string', desc: 'Description of items/services.', required: true },
                                            { name: 'seller_email', type: 'string', desc: 'Email of the seller to invite.', required: true },
                                            { name: 'metadata', type: 'object', desc: 'Your own reference data.' }
                                        ]} />

                                        <MultiLangRequestResponse
                                            requestSamples={[
                                                { id: 'curl', name: 'cURL', code: `curl https://api.flapapay.com/api/v1/escrows \\\n  -H "Authorization: Bearer sk_test_..." \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "amount": 25000,\n    "currency": "zmw",\n    "description": "Custom Gaming PC Build",\n    "seller_email": "seller@vendor.com",\n    "metadata": { "order_id": "99331" }\n  }'` },
                                                { id: 'node', name: 'Node.js', code: `const axios = require('axios');\n\nconst createEscrow = async () => {\n  const res = await axios.post('https://api.flapapay.com/api/v1/escrows', {\n    amount: 25000,\n    currency: 'zmw',\n    description: 'Custom Gaming PC Build',\n    seller_email: 'seller@vendor.com'\n  }, {\n    headers: { 'Authorization': 'Bearer sk_test_...' }\n  });\n  console.log(res.data.checkout_url);\n};` }
                                            ]}
                                            responseCode={`{\n  "id": "esc_8k20kX9a...",\n  "status": "PENDING_PAYMENT",\n  "checkout_url": "https://flapapay.com/escrow-gateway/esc_8k20...",\n  "expires_at": "2024-12-01T12:00:00Z"\n}`}
                                        />
                                    </section>

                                    {/* Integration Best Practices */}
                                    <section className="p-12 bg-gray-900 rounded-[3rem] text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                                        <div className="relative z-10">
                                            <h4 className="text-2xl font-black mb-6 flex items-center gap-3">
                                                <span className="text-indigo-400">💡</span>
                                                Integration Flow for Marketplaces
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                                <div className="space-y-4">
                                                    <h5 className="font-black text-indigo-400 text-sm uppercase tracking-widest">Client Side</h5>
                                                    <p className="text-gray-400 text-sm leading-relaxed">After creating the escrow via your backend, redirect your buyer to the <code>checkout_url</code> provided in the response. This renders the FlapaPay Secure Gateway.</p>
                                                </div>
                                                <div className="space-y-4">
                                                    <h5 className="font-black text-indigo-400 text-sm uppercase tracking-widest">Server Side</h5>
                                                    <p className="text-gray-400 text-sm leading-relaxed">Listen for <code>escrow.funded</code> and <code>escrow.released</code> webhooks to update your order status automatically.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'errors' && (
                                <div className="space-y-16">
                                    <header>
                                        <h2 className="text-4xl font-black text-gray-900 mb-6">Error Handling</h2>
                                        <p className="text-2xl text-gray-500 leading-relaxed max-w-4xl">
                                            FlapaPay uses standard HTTP response codes to indicate the success or failure of an API request.
                                        </p>
                                    </header>

                                    <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 font-mono">Status Code</th>
                                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 font-mono">Meaning</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {[
                                                    { code: '200 - OK', desc: 'Everything worked as expected.' },
                                                    { code: '400 - Bad Request', desc: 'The request was unacceptable, often due to missing parameters.' },
                                                    { code: '401 - Unauthorized', desc: 'No valid API key provided.' },
                                                    { code: '402 - Request Failed', desc: 'The parameters were valid but the request failed.' },
                                                    { code: '500 - Server Errors', desc: 'Something went wrong on FlapaPay\'s end.' }
                                                ].map((err, i) => (
                                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-8 py-6 font-mono text-sm font-bold text-gray-900">{err.code}</td>
                                                        <td className="px-8 py-6 text-gray-500">{err.desc}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab !== 'quickstart' && activeTab !== 'authentication' && activeTab !== 'charges' && activeTab !== 'checkout' && activeTab !== 'connect' && activeTab !== 'payouts' && activeTab !== 'errors' && (
                                <div className="py-20 text-center">
                                    <div className="w-24 h-24 rounded-[40px] bg-gray-50 flex items-center justify-center text-4xl mx-auto mb-8 border border-gray-100">📖</div>
                                    <h3 className="text-3xl font-black text-gray-900 mb-4">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Reference</h3>
                                    <p className="text-xl text-gray-500 max-w-md mx-auto mb-10">We're updating our documentation for this module. Check back soon or contact support for the beta reference.</p>
                                    <Button variant="outline" className="px-10 py-4 rounded-2xl font-black border-gray-200">Contact Developer Support</Button>
                                </div>
                            )}

                            {/* Persistently Accessible Playground Area */}
                            <div id="playground-area" className="mt-32 scroll-mt-32">
                                <section className="p-16 bg-gray-50 rounded-[60px] border border-gray-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                                        <svg className="w-64 h-64" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z" />
                                        </svg>
                                    </div>

                                    <header className="text-center max-w-2xl mx-auto mb-16">
                                        <h3 className="text-4xl font-black text-gray-900 mb-6 italic tracking-tight underline decoration-orange-500/20 underline-offset-8">API Playground</h3>
                                        <p className="text-lg text-gray-500 leading-relaxed">
                                            Choose a module to test our live endpoints. All requests use your selected environment (Test Mode by default).
                                        </p>
                                    </header>

                                    {/* Select Playground Type */}
                                    <div className="flex flex-wrap gap-4 p-2 bg-white/50 backdrop-blur-sm rounded-3xl w-fit border border-gray-100 mb-12 mx-auto shadow-sm">
                                        <button
                                            onClick={() => setPlaygroundMode('checkout')}
                                            className={`px-10 py-4 rounded-2xl font-black transition-all ${playgroundMode === 'checkout' ? 'bg-black text-white shadow-2xl shadow-black/20' : 'text-gray-400 hover:text-gray-600'}`}>
                                            Checkout API
                                        </button>
                                        <button
                                            onClick={() => setPlaygroundMode('connect')}
                                            className={`px-10 py-4 rounded-2xl font-black transition-all ${playgroundMode === 'connect' ? 'bg-black text-white shadow-2xl shadow-black/20' : 'text-gray-400 hover:text-gray-600'}`}>
                                            Connect API
                                        </button>
                                        <button
                                            onClick={() => setPlaygroundMode('marketplace')}
                                            className={`px-10 py-4 rounded-2xl font-black transition-all ${playgroundMode === 'marketplace' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20' : 'text-gray-400 hover:text-gray-600'}`}>
                                            Marketplace v1
                                        </button>
                                    </div>

                                    {/* Form Section */}
                                    <div className="space-y-10 max-w-6xl mx-auto">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                            <div className="lg:col-span-2 space-y-3">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 group-hover:text-orange-500 transition-colors">API Secret Key</label>
                                                <div className="relative group/key">
                                                    <input
                                                        type="password"
                                                        value={playgroundApiKey}
                                                        onChange={(e) => setPlaygroundApiKey(e.target.value)}
                                                        className="w-full bg-white border-2 border-gray-100 rounded-[28px] px-8 py-6 text-gray-900 font-mono text-sm focus:border-orange-500/50 outline-none transition-all shadow-sm group-hover/key:border-orange-200"
                                                        placeholder="sk_test_6e4a1c2a94..."
                                                    />
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                                        <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${((playgroundApiKey || 'sk_test_').startsWith('sk_live') || (playgroundApiKey || 'flp_test_').startsWith('flp_live')) ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-orange-500 shadow-orange-500/50 animate-pulse'
                                                            }`}></div>
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{
                                                            ((playgroundApiKey || 'sk_test_').startsWith('sk_live') || (playgroundApiKey || 'flp_test_').startsWith('flp_live')) ? 'Live Mode' : 'Test Mode'
                                                        }</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {playgroundMode === 'checkout' && (
                                                <>
                                                    <div className="space-y-3">
                                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Amount (Minor Units)</label>
                                                        <input
                                                            type="number"
                                                            value={playgroundAmount}
                                                            onChange={(e) => setPlaygroundAmount(e.target.value)}
                                                            className="w-full bg-white border-2 border-gray-100 rounded-[28px] px-8 py-6 text-gray-900 font-black text-xl focus:border-orange-500/50 outline-none transition-all shadow-sm"
                                                            placeholder="2000"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Currency</label>
                                                        <select
                                                            value={playgroundCurrency}
                                                            onChange={(e) => setPlaygroundCurrency(e.target.value)}
                                                            className="w-full bg-white border-2 border-gray-100 rounded-[28px] px-8 py-6 text-gray-900 font-black text-lg focus:border-orange-500/50 outline-none transition-all appearance-none cursor-pointer shadow-sm"
                                                        >
                                                            <option value="ZMW">ZMW (Kwacha)</option>
                                                            <option value="USD">USD (Dollar)</option>
                                                        </select>
                                                    </div>
                                                </>
                                            )}

                                            {playgroundMode === 'connect' && (
                                                <>
                                                    <div className="space-y-3">
                                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Vendor Contact</label>
                                                        <input
                                                            type="email"
                                                            value={connectEmail}
                                                            onChange={(e) => setConnectEmail(e.target.value)}
                                                            className="w-full bg-white border-2 border-gray-100 rounded-[28px] px-8 py-6 text-gray-900 font-bold focus:border-orange-500/50 outline-none transition-all shadow-sm"
                                                            placeholder="vendor@platform.com"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Business Name</label>
                                                        <input
                                                            type="text"
                                                            value={connectBusinessName}
                                                            onChange={(e) => setConnectBusinessName(e.target.value)}
                                                            className="w-full bg-white border-2 border-gray-100 rounded-[28px] px-8 py-6 text-gray-900 font-bold focus:border-orange-500/50 outline-none transition-all shadow-sm"
                                                            placeholder="Apex Services Ltd"
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            {playgroundMode === 'marketplace' && (
                                                <>
                                                    <div className="space-y-3">
                                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Seller Email</label>
                                                        <input
                                                            type="email"
                                                            value={escrowSellerEmail}
                                                            onChange={(e) => setEscrowSellerEmail(e.target.value)}
                                                            className="w-full bg-white border-2 border-gray-100 rounded-[28px] px-8 py-6 text-gray-900 font-bold focus:border-indigo-500/50 outline-none transition-all shadow-sm"
                                                            placeholder="seller@market.com"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Item Description</label>
                                                        <input
                                                            type="text"
                                                            value={escrowDescription}
                                                            onChange={(e) => setEscrowDescription(e.target.value)}
                                                            className="w-full bg-white border-2 border-gray-100 rounded-[28px] px-8 py-6 text-gray-900 font-bold focus:border-indigo-500/50 outline-none transition-all shadow-sm"
                                                            placeholder="e.g. iPhone 15 Pro"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <Button
                                            disabled={isLoading}
                                            onClick={handlePlaygroundCall}
                                            className="w-full bg-orange-600 hover:bg-orange-700 text-white h-24 rounded-[32px] font-black text-2xl shadow-3xl shadow-orange-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-6 group"
                                        >
                                            {isLoading ? (
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                                    <span>Sending Request...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <span>
                                                        {playgroundMode === 'checkout' ? 'Execute Checkout Intent' :
                                                            playgroundMode === 'connect' ? 'Provision Connected Account' :
                                                                'Initiate Marketplace Escrow'}
                                                    </span>
                                                    <svg className="w-8 h-8 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                </>
                                            )}
                                        </Button>

                                        {/* Visualization Grid */}
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 mt-12">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between px-4">
                                                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">HTTP Request</h5>
                                                    <code className="text-[10px] text-gray-900 font-bold bg-white px-3 py-1 rounded-full border border-gray-100">
                                                        POST {playgroundMode === 'checkout' ? '/v1/checkout/sessions' :
                                                            playgroundMode === 'connect' ? '/v1/connect/accounts' :
                                                                '/api/v1/escrows'}
                                                    </code>
                                                </div>
                                                <div className="bg-[#0D0D0D] rounded-[40px] p-10 border border-white/5 shadow-2xl h-[450px] relative">
                                                    <pre className="font-mono text-[13px] text-gray-400 h-full overflow-y-auto scrollbar-hide leading-relaxed">
                                                        <code>
                                                            {playgroundRequest
                                                                ? `// Request Headers\n${JSON.stringify(playgroundRequest.headers, null, 2)}\n\n// POST Body\n${JSON.stringify(playgroundRequest.body, null, 2)}`
                                                                : `// Ready to send request\n// Choose parameters above and execute.`}
                                                        </code>
                                                    </pre>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between px-4">
                                                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Server Response</h5>
                                                    {playgroundStatus && (
                                                        <div className={`px-4 py-1.5 rounded-full font-black text-[10px] border ${playgroundStatus < 400 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                            {playgroundStatus} {playgroundStatus === 200 ? 'OK' : 'Error'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`bg-[#0D0D0D] rounded-[40px] p-10 border shadow-2xl h-[450px] relative transition-colors duration-700 ${playgroundStatus && playgroundStatus >= 400 ? 'border-red-500/30' : 'border-white/5'}`}>
                                                    <pre className="font-mono text-[13px] text-gray-400 h-full overflow-y-auto scrollbar-hide leading-relaxed">
                                                        <code>
                                                            {playgroundResponse
                                                                ? JSON.stringify(playgroundResponse, null, 2)
                                                                : `// Awaiting response...\n// Execute request to see live data.`}
                                                        </code>
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Gateway Integration Button */}
                                        {(playgroundResponse?.url || playgroundResponse?.checkout_url) && (
                                            <div className="mt-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                                                <a
                                                    href={playgroundResponse.url || playgroundResponse.checkout_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white p-10 rounded-[48px] font-black text-2xl shadow-3xl shadow-emerald-500/20 flex items-center justify-between group/link transition-all active:scale-[0.98]"
                                                >
                                                    <div className="flex items-center gap-8">
                                                        <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center backdrop-blur-md group-hover/link:scale-110 transition-transform">
                                                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm text-emerald-100 uppercase tracking-widest mb-1">Interactive Demo Available</p>
                                                            <h6 className="text-3xl font-black">Open Life-like Checkout Page</h6>
                                                        </div>
                                                    </div>
                                                    <div className="px-10 py-5 bg-white/10 rounded-2xl backdrop-blur-md group-hover/link:bg-white/20 transition-all font-black uppercase text-sm tracking-widest">
                                                        Launch Interface
                                                    </div>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AskAIAssistant />
            <Footer />
        </div>
    );
};