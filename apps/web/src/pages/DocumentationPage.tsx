import React, { useState } from 'react';
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

    return (
        <div className="min-h-screen bg-black font-sans">
            <Navbar />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="relative border-b border-gray-800 py-24 bg-gradient-to-b from-gray-900 to-black">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto">
                            <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8">
                                <span className="flex h-2 w-2 rounded-full bg-purple-500 mr-3 animate-pulse"></span>
                                <span className="text-xs font-black text-purple-400 uppercase tracking-widest">Developer Documentation</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
                                Build with FlapaPay
                            </h1>
                            <p className="text-xl text-gray-400 font-medium leading-relaxed mb-8">
                                Everything you need to integrate payments, payouts, and financial services into your applications.
                            </p>

                            {/* Search Bar */}
                            <div className="relative max-w-xl mx-auto">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search documentation..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                />
                            </div>

                            {/* Quick Links */}
                            <div className="flex flex-wrap justify-center gap-4 mt-8">
                                {['Quick Start', 'API Reference', 'SDKs', 'Webhooks'].map((link) => (
                                    <a
                                        key={link}
                                        href="#"
                                        className="px-6 py-3 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 font-bold hover:border-purple-500 hover:text-white transition-all"
                                    >
                                        {link}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* API Status */}
                <section className="border-b border-gray-800 py-8 bg-black">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="text-sm font-bold text-gray-300">All Systems Operational</span>
                                </div>
                                <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
                                    <span>API: 99.99% uptime</span>
                                    <span>•</span>
                                    <span>Latency: 45ms avg</span>
                                </div>
                            </div>
                            <a href="/status" className="text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2">
                                Status Page
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </section>

                <section className="py-16 bg-black">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="flex gap-12">
                            {/* Sidebar Navigation */}
                            <aside className="hidden lg:block w-72 shrink-0">
                                <div className="sticky top-32">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 px-2">
                                        Documentation
                                    </p>
                                    <nav className="space-y-1">
                                        {mainSections.map((section) => (
                                            <div key={section.id}>
                                                <button
                                                    onClick={() => setActiveSection(activeSection === section.id ? '' : section.id)}
                                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                                        activeSection === section.id
                                                            ? 'bg-purple-500/10 text-purple-400'
                                                            : 'text-gray-400 hover:text-white hover:bg-gray-900'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className={activeSection === section.id ? 'text-purple-400' : 'text-gray-500'}>
                                                            {section.icon}
                                                        </span>
                                                        {section.title}
                                                    </div>
                                                    <ChevronRight className={`w-4 h-4 transition-transform ${activeSection === section.id ? 'rotate-90' : ''}`} />
                                                </button>
                                                {activeSection === section.id && (
                                                    <div className="mt-2 ml-6 space-y-1 border-l border-gray-800 pl-4">
                                                        {section.items.map((item) => (
                                                            <a
                                                                key={item}
                                                                href="#"
                                                                className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-white transition-colors"
                                                            >
                                                                {item}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </nav>

                                    {/* Need Help */}
                                    <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                                        <p className="text-sm font-black text-white mb-2">Need Help?</p>
                                        <p className="text-xs text-gray-400 mb-4">Can't find what you're looking for? Our team is here to help.</p>
                                        <a href="/contact" className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2">
                                            Contact Support
                                            <ChevronRight className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                            </aside>

                            {/* Main Content */}
                            <div className="flex-1 max-w-4xl">
                                {/* Introduction */}
                                <div className="mb-16">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                            <Book className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-white">Introduction</h2>
                                    </div>

                                    <div className="prose prose-invert max-w-none">
                                        <p className="text-gray-400 font-medium leading-relaxed mb-6">
                                            FlapaPay is a comprehensive financial infrastructure platform that enables businesses to accept payments, send payouts, issue cards, and manage financial operations globally.
                                        </p>

                                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                                            {[
                                                { icon: <Globe className="w-6 h-6" />, title: 'Global', desc: '50+ countries' },
                                                { icon: <CreditCard className="w-6 h-6" />, title: 'Payment Methods', desc: 'Cards, Mobile Money, Banks' },
                                                { icon: <Shield className="w-6 h-6" />, title: 'Security', desc: 'PCI-DSS Level 1' },
                                            ].map((item, i) => (
                                                <div key={i} className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
                                                    <div className="text-purple-400 mb-3">{item.icon}</div>
                                                    <p className="text-2xl font-black text-white mb-1">{item.title}</p>
                                                    <p className="text-sm text-gray-500 font-medium">{item.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Start */}
                                <div className="mb-16">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                            <Zap className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-white">Quick Start</h2>
                                    </div>

                                    <div className="space-y-8">
                                        {/* Step 1 */}
                                        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-black">1</span>
                                                <h3 className="text-xl font-black text-white">Install the SDK</h3>
                                            </div>
                                            <div className="relative">
                                                <pre className="p-4 rounded-xl bg-black border border-gray-800 overflow-x-auto">
                                                    <code className="text-sm text-gray-300 font-mono">npm install @flapapay/sdk</code>
                                                </pre>
                                                <button
                                                    onClick={() => copyCode('npm install @flapapay/sdk', 'install')}
                                                    className="absolute top-3 right-3 p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
                                                >
                                                    {copiedCode === 'install' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Step 2 */}
                                        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-black">2</span>
                                                <h3 className="text-xl font-black text-white">Initialize the Client</h3>
                                            </div>
                                            <div className="relative">
                                                <pre className="p-4 rounded-xl bg-black border border-gray-800 overflow-x-auto">
                                                    <code className="text-sm text-gray-300 font-mono">{codeExamples.init}</code>
                                                </pre>
                                                <button
                                                    onClick={() => copyCode(codeExamples.init, 'init')}
                                                    className="absolute top-3 right-3 p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
                                                >
                                                    {copiedCode === 'init' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Step 3 */}
                                        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-black">3</span>
                                                <h3 className="text-xl font-black text-white">Create Your First Payment</h3>
                                            </div>
                                            <div className="relative">
                                                <pre className="p-4 rounded-xl bg-black border border-gray-800 overflow-x-auto">
                                                    <code className="text-sm text-gray-300 font-mono">{codeExamples.createPayment}</code>
                                                </pre>
                                                <button
                                                    onClick={() => copyCode(codeExamples.createPayment, 'payment')}
                                                    className="absolute top-3 right-3 p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
                                                >
                                                    {copiedCode === 'payment' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* API Reference Preview */}
                                <div className="mb-16">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                            <Terminal className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-white">API Reference</h2>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        {[
                                            { method: 'POST', path: '/v1/payments', desc: 'Create payment', color: 'text-green-400' },
                                            { method: 'GET', path: '/v1/payments/:id', desc: 'Get payment', color: 'text-blue-400' },
                                            { method: 'POST', path: '/v1/refunds', desc: 'Create refund', color: 'text-green-400' },
                                            { method: 'GET', path: '/v1/customers', desc: 'List customers', color: 'text-blue-400' },
                                            { method: 'POST', path: '/v1/payouts', desc: 'Send payout', color: 'text-green-400' },
                                            { method: 'POST', path: '/v1/cards', desc: 'Issue card', color: 'text-green-400' },
                                            { method: 'GET', path: '/v1/invoices', desc: 'List invoices', color: 'text-blue-400' },
                                            { method: 'POST', path: '/v1/webhooks', desc: 'Create webhook', color: 'text-green-400' },
                                        ].map((endpoint, i) => (
                                            <a
                                                key={i}
                                                href="#"
                                                className="p-5 rounded-2xl bg-gray-900 border border-gray-800 hover:border-purple-500/50 transition-all group"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`text-xs font-black ${endpoint.color}`}>{endpoint.method}</span>
                                                    <code className="text-sm text-gray-300 font-mono">{endpoint.path}</code>
                                                </div>
                                                <p className="text-sm text-gray-500 font-medium">{endpoint.desc}</p>
                                            </a>
                                        ))}
                                    </div>

                                    <a
                                        href="/api-reference"
                                        className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500 text-white font-black hover:bg-purple-600 transition-all"
                                    >
                                        View Full API Reference
                                        <ChevronRight className="w-4 h-4" />
                                    </a>
                                </div>

                                {/* Webhooks */}
                                <div className="mb-16">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                            <Webhook className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-white">Webhooks</h2>
                                    </div>

                                    <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 mb-6">
                                        <p className="text-gray-400 font-medium leading-relaxed mb-6">
                                            Webhooks allow you to receive real-time notifications about events in your FlapaPay account. Set up endpoints to receive automatic updates for payments, payouts, and more.
                                        </p>

                                        <div className="space-y-4 mb-6">
                                            {[
                                                { event: 'payment.completed', desc: 'Triggered when a payment succeeds' },
                                                { event: 'payment.failed', desc: 'Triggered when a payment fails' },
                                                { event: 'payout.completed', desc: 'Triggered when a payout is processed' },
                                                { event: 'dispute.created', desc: 'Triggered when a dispute is opened' },
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-black border border-gray-800">
                                                    <code className="text-sm text-purple-400 font-mono">{item.event}</code>
                                                    <span className="text-sm text-gray-500">— {item.desc}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="relative">
                                            <pre className="p-4 rounded-xl bg-black border border-gray-800 overflow-x-auto">
                                                <code className="text-sm text-gray-300 font-mono">{codeExamples.webhook}</code>
                                            </pre>
                                            <button
                                                onClick={() => copyCode(codeExamples.webhook, 'webhook')}
                                                className="absolute top-3 right-3 p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
                                            >
                                                {copiedCode === 'webhook' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* SDKs */}
                                <div className="mb-16">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                            <Code className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-white">SDKs & Libraries</h2>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        {[
                                            { name: 'Node.js', version: 'v2.4.0', install: 'npm i @flapapay/sdk', icon: <Server className="w-5 h-5" /> },
                                            { name: 'Python', version: 'v1.8.2', install: 'pip install flapapay', icon: <Database className="w-5 h-5" /> },
                                            { name: 'PHP', version: 'v3.1.0', install: 'composer require flapapay/sdk', icon: <Globe className="w-5 h-5" /> },
                                            { name: 'React Native', version: 'v1.2.0', install: 'npm i @flapapay/react-native', icon: <Smartphone className="w-5 h-5" /> },
                                        ].map((sdk, i) => (
                                            <div key={i} className="p-6 rounded-2xl bg-gray-900 border border-gray-800 hover:border-purple-500/50 transition-all">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-purple-400">{sdk.icon}</div>
                                                        <div>
                                                            <h3 className="text-lg font-black text-white">{sdk.name}</h3>
                                                            <p className="text-xs text-gray-500">v{sdk.version}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between p-3 rounded-lg bg-black border border-gray-800">
                                                    <code className="text-sm text-gray-300 font-mono">{sdk.install}</code>
                                                    <button
                                                        onClick={() => copyCode(sdk.install, `sdk-${i}`)}
                                                        className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
                                                    >
                                                        {copiedCode === `sdk-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* CTA */}
                                <section className="bg-gradient-to-br from-purple-600 to-blue-700 rounded-3xl p-12 text-center">
                                    <h2 className="text-3xl font-black text-white mb-6">Ready to Start Building?</h2>
                                    <p className="text-purple-100 font-medium mb-8 max-w-xl mx-auto">
                                        Create your developer account and get API keys in minutes. Start testing in sandbox mode before going live.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <a href="/signup" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-white text-purple-600 font-black hover:bg-purple-50 transition-all">
                                            Get API Keys
                                        </a>
                                        <a href="/api-reference" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-purple-700 text-white font-black border border-purple-500 hover:bg-purple-600 transition-all">
                                            API Reference
                                        </a>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};
