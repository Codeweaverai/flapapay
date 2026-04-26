import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

// ─── Types ───────────────────────────────────────────────────────────────────

type SidebarSection =
  | 'quickstart' | 'authentication' | 'create-session'
  | 'retrieve-session' | 'list-sessions' | 'expire-session'
  | 'subscription-mode' | 'marketplace-split'
  | 'products' | 'prices' | 'webhook-confirm' | 'errors';

type Lang = 'curl' | 'node' | 'python' | 'php';

const LANG_LABELS: Record<Lang, string> = { curl: 'cURL', node: 'Node.js', python: 'Python', php: 'PHP' };

// ─── Code Block ──────────────────────────────────────────────────────────────

const CodeBlock: React.FC<{ code: string; lang?: string; id?: string }> = ({ code, lang, id }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-800 shadow-lg">
      <div className="flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{lang ?? 'code'}</span>
        <button onClick={copy} className="text-[10px] font-bold text-gray-500 hover:text-orange-400 transition-colors flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-5 bg-black text-sm font-mono text-gray-300 overflow-x-auto leading-relaxed"><code>{code}</code></pre>
    </div>
  );
};

// ─── Multi-lang block ─────────────────────────────────────────────────────────

const MultiLang: React.FC<{
  id: string;
  samples: Partial<Record<Lang, string>>;
  response: string;
  status?: number;
}> = ({ id, samples, response, status = 200 }) => {
  const langs = Object.keys(samples) as Lang[];
  const [active, setActive] = useState<Lang>(langs[0]);
  const [copied, setCopied] = useState<'req' | 'res' | null>(null);
  const copy = (text: string, side: 'req' | 'res') => {
    navigator.clipboard.writeText(text);
    setCopied(side);
    setTimeout(() => setCopied(null), 2000);
  };
  const code = samples[active] ?? '';

  return (
    <div className="rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
      <div className="flex items-center justify-between bg-gray-950 border-b border-gray-800 px-2">
        <div className="flex">
          {langs.map(l => (
            <button key={l} onClick={() => setActive(l)}
              className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-all ${active === l ? 'text-orange-400 border-orange-500 bg-orange-500/5' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-gray-800">
        <div className="bg-black p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Request</span>
            <button onClick={() => copy(code, 'req')} className="text-[10px] font-bold text-gray-600 hover:text-orange-400 transition-colors">{copied === 'req' ? '✓ Copied' : 'Copy'}</button>
          </div>
          <pre className="font-mono text-[13px] text-gray-300 overflow-x-auto leading-relaxed"><code>{code}</code></pre>
        </div>
        <div className="bg-gray-950/60 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Response</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${status < 400 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{status} {status < 400 ? 'OK' : 'Error'}</span>
          </div>
          <pre className="font-mono text-[13px] text-gray-400 overflow-x-auto leading-relaxed"><code>{response}</code></pre>
        </div>
      </div>
    </div>
  );
};

// ─── Parameter Table ──────────────────────────────────────────────────────────

const ParamTable: React.FC<{ params: { name: string; type: string; required?: boolean; desc: string }[] }> = ({ params }) => (
  <div className="rounded-2xl border border-gray-800 overflow-hidden">
    <div className="px-5 py-3 bg-gray-950 border-b border-gray-800 grid grid-cols-[180px_100px_1fr] gap-4">
      {['Parameter', 'Type', 'Description'].map(h => (
        <span key={h} className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{h}</span>
      ))}
    </div>
    {params.map((p, i) => (
      <div key={p.name} className={`px-5 py-4 grid grid-cols-[180px_100px_1fr] gap-4 items-start ${i % 2 === 0 ? 'bg-black/30' : 'bg-transparent'} border-b border-gray-800/50 last:border-0`}>
        <div className="flex items-center gap-2 flex-wrap">
          <code className="text-orange-400 text-xs font-bold">{p.name}</code>
          {p.required && <span className="text-[9px] font-black text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded uppercase">req</span>}
        </div>
        <span className="text-[10px] font-mono text-gray-500 bg-gray-800/60 px-2 py-1 rounded self-start">{p.type}</span>
        <span className="text-xs text-gray-400 leading-relaxed">{p.desc}</span>
      </div>
    ))}
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────

const SH: React.FC<{ tag?: string; title: string; subtitle?: string; method?: string; path?: string }> = ({ tag, title, subtitle, method, path }) => {
  const methodColor: Record<string, string> = {
    POST: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    GET:  'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  };
  return (
    <div className="mb-8 pb-6 border-b border-gray-800">
      {tag && <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3 block">{tag}</span>}
      <h2 className="text-2xl font-black text-white mb-2">{title}</h2>
      {(method || path) && (
        <div className="flex items-center gap-3 mt-3">
          {method && <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg ${methodColor[method] ?? 'bg-gray-800 text-gray-400'}`}>{method}</span>}
          {path && <code className="text-sm font-mono text-gray-300 bg-black/50 px-3 py-1 rounded-lg border border-gray-800">{path}</code>}
        </div>
      )}
      {subtitle && <p className="text-gray-500 mt-3 leading-relaxed">{subtitle}</p>}
    </div>
  );
};

// ─── Info callout ─────────────────────────────────────────────────────────────

const Callout: React.FC<{ type?: 'info' | 'warn' | 'tip'; children: React.ReactNode }> = ({ type = 'info', children }) => {
  const styles = {
    info: 'border-blue-500/20 bg-blue-500/5 text-blue-300',
    warn: 'border-amber-500/20 bg-amber-500/5 text-amber-300',
    tip:  'border-emerald-500/20 bg-emerald-500/5 text-emerald-300',
  };
  const icons = { info: 'ℹ', warn: '⚠', tip: '✦' };
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm leading-relaxed ${styles[type]}`}>
      <span className="text-lg mt-0.5">{icons[type]}</span>
      <div>{children}</div>
    </div>
  );
};

// ─── Sidebar items ────────────────────────────────────────────────────────────

const SIDEBAR: { label: string; id: SidebarSection; method?: string }[] = [
  { label: 'Quick Start',           id: 'quickstart' },
  { label: 'Authentication',        id: 'authentication' },
  { label: 'Create Session',        id: 'create-session',     method: 'POST' },
  { label: 'Retrieve Session',      id: 'retrieve-session',   method: 'GET' },
  { label: 'List Sessions',         id: 'list-sessions',      method: 'GET' },
  { label: 'Expire Session',        id: 'expire-session',     method: 'POST' },
  { label: 'Subscription Mode',     id: 'subscription-mode',  method: 'POST' },
  { label: 'Marketplace Split',     id: 'marketplace-split',  method: 'POST' },
  { label: 'Products',              id: 'products',           method: 'POST' },
  { label: 'Prices',                id: 'prices',             method: 'POST' },
  { label: 'Webhook Confirmation',  id: 'webhook-confirm' },
  { label: 'Error Codes',           id: 'errors' },
];

// ─── Playground ───────────────────────────────────────────────────────────────

const Playground: React.FC = () => {
  const [apiKey, setApiKey]       = useState('');
  const [amount, setAmount]       = useState('5000');
  const [currency, setCurrency]   = useState('ZMW');
  const [email, setEmail]         = useState('customer@example.com');
  const [mode, setMode]           = useState<'payment' | 'subscription'>('payment');
  const [loading, setLoading]     = useState(false);
  const [request, setRequest]     = useState<object | null>(null);
  const [response, setResponse]   = useState<object | null>(null);
  const [status, setStatus]       = useState<number | null>(null);
  const [sessionUrl, setSessionUrl] = useState('');

  const TEST_KEY = 'sk_test_6e4a1c2a940dc1de7629f61f2c28062ec1f2dcd419c83f17';
  const activeKey = apiKey || TEST_KEY;
  const isLive = activeKey.startsWith('sk_live') || activeKey.startsWith('flp_live');

  const run = async () => {
    setLoading(true); setResponse(null); setRequest(null); setStatus(null); setSessionUrl('');
    const body = {
      amount: parseInt(amount),
      currency: currency.toLowerCase(),
      success_url: 'http://localhost:5173/developers?checkout=success',
      cancel_url:  'http://localhost:5173/developers?checkout=cancel',
      payment_method_types: ['card', 'mobile_money'],
      customer_email: email,
      mode,
    };
    setRequest({ method: 'POST', url: '/v1/checkout/sessions', headers: { Authorization: `Bearer ${activeKey.slice(0, 16)}...` }, body });
    try {
      const res = await axios.post('http://localhost:3005/v1/checkout/sessions', body, {
        headers: { Authorization: `Bearer ${activeKey}` },
      });
      setStatus(res.status);
      setResponse(res.data);
      if (res.data?.url) setSessionUrl(res.data.url);
    } catch (err: any) {
      setStatus(err.response?.status ?? 500);
      setResponse(err.response?.data ?? { error: 'Network error — is the server running on port 3005?' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-orange-500/20 bg-gradient-to-b from-orange-500/5 to-transparent overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-orange-500/15">
        <div>
          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Interactive Playground</p>
          <p className="text-white font-black text-lg">POST /v1/checkout/sessions</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${isLive ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-orange-500/30 bg-orange-500/10 text-orange-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-orange-400 animate-pulse'}`} />
          {isLive ? 'Live Mode' : 'Test Mode'}
        </div>
      </div>

      <div className="p-8 grid lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">API Secret Key</label>
            <div className="flex gap-2">
              <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                placeholder="sk_test_flp_..."
                className="flex-1 px-4 py-3 rounded-xl bg-black border border-gray-800 text-white text-sm font-mono placeholder-gray-700 focus:outline-none focus:border-orange-500/60 transition-colors" />
              <button onClick={() => setApiKey(TEST_KEY)}
                className="px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-black hover:bg-orange-500/20 transition-colors">
                Fill Test Key
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Mode</label>
              <div className="flex gap-1 p-1 bg-black border border-gray-800 rounded-xl">
                {(['payment', 'subscription'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${mode === m ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black border border-gray-800 text-white text-sm font-bold focus:outline-none focus:border-orange-500/60 appearance-none">
                <option value="ZMW">ZMW — Zambian Kwacha</option>
                <option value="USD">USD — US Dollar</option>
                <option value="KES">KES — Kenyan Shilling</option>
                <option value="NGN">NGN — Nigerian Naira</option>
                <option value="GHS">GHS — Ghanaian Cedi</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Amount (minor units)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black border border-gray-800 text-white text-sm font-mono focus:outline-none focus:border-orange-500/60 transition-colors" />
              <p className="text-[10px] text-gray-700 mt-1 font-mono">{currency} {(parseInt(amount || '0') / 100).toFixed(2)}</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Customer Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black border border-gray-800 text-white text-sm focus:outline-none focus:border-orange-500/60 transition-colors" />
            </div>
          </div>

          <button onClick={run} disabled={loading}
            className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20">
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending Request...</>
            ) : (
              <>Execute → POST /v1/checkout/sessions</>
            )}
          </button>

          {/* Generated request preview */}
          <div className="rounded-xl border border-gray-800 bg-black/50 p-4">
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Generated Request Body</p>
            <pre className="text-[11px] font-mono text-gray-500 leading-relaxed overflow-x-auto">{JSON.stringify({
              mode, amount: parseInt(amount), currency: currency.toLowerCase(),
              customer_email: email,
              success_url: 'https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}',
              cancel_url: 'https://yourapp.com/cancel',
            }, null, 2)}</pre>
          </div>
        </div>

        {/* Response */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Server Response</p>
            {status && (
              <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${status < 400 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                {status} {status < 400 ? 'OK' : 'Error'}
              </span>
            )}
          </div>

          <div className={`rounded-2xl border p-5 min-h-[320px] transition-colors ${status && status >= 400 ? 'border-red-500/20 bg-red-500/5' : 'border-gray-800 bg-black/60'}`}>
            <pre className="font-mono text-[12px] leading-relaxed overflow-y-auto text-gray-300">
              {response
                ? JSON.stringify(response, null, 2)
                : request
                  ? '// Waiting for response...'
                  : `// Fill in the fields and click Execute\n// to make a live API call against\n// http://localhost:3005\n\n// Responses appear here in real time.`}
            </pre>
          </div>

          {/* Open checkout URL */}
          {sessionUrl && (
            <a href={sessionUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-all group shadow-xl shadow-emerald-500/20">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100 mb-1">Session created ✓</p>
                <p className="font-black text-lg">Open Checkout Page →</p>
                <p className="text-emerald-200 text-xs font-mono mt-1 truncate max-w-[280px]">{sessionUrl}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">↗</div>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const DevelopersPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SidebarSection>('quickstart');
  const contentRef = useRef<HTMLDivElement>(null);

  const nav = (id: SidebarSection) => {
    setActiveSection(id);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const methodColor: Record<string, string> = {
    POST: 'bg-emerald-500/15 text-emerald-400',
    GET:  'bg-blue-500/15 text-blue-400',
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-20 border-b border-gray-800/60 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 left-1/3 w-[600px] h-[600px] bg-orange-600/6 rounded-full blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '50px 50px' }} />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Checkout API — v1</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-5">
              Checkout Sessions<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">API Reference</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-2xl">
              Complete reference for FlapaPay's Checkout Sessions API — create hosted payment pages,
              subscriptions, and marketplace splits with full code examples in cURL, Node.js, Python, and PHP.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/documentation" className="px-5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 text-sm font-bold hover:border-orange-500/50 hover:text-white transition-all">
                → Full Documentation
              </Link>
              <a href="#playground" onClick={() => nav('create-session')}
                className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20">
                Try Playground
              </a>
              <a href="http://localhost:3005/v1/checkout/sessions" target="_blank" rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 text-sm font-bold hover:border-orange-500/50 hover:text-white transition-all">
                Base URL ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-[1400px] flex">

        {/* Sidebar */}
        <aside className="hidden xl:block w-64 shrink-0">
          <div className="sticky top-20 h-[calc(100vh-80px)] overflow-y-auto py-8 px-4 border-r border-gray-800/60">
            <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.2em] mb-5 px-2">Checkout Sessions</p>
            <nav className="space-y-0.5">
              {SIDEBAR.map(item => (
                <button key={item.id} onClick={() => nav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-bold transition-all group ${activeSection === item.id ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'text-gray-500 hover:text-gray-200 hover:bg-gray-900'}`}>
                  <span>{item.label}</span>
                  {item.method && (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded ${activeSection === item.id ? methodColor[item.method] : 'bg-gray-800 text-gray-600'}`}>
                      {item.method}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="mt-8 p-4 rounded-2xl bg-gray-950 border border-gray-800">
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Base URL</p>
              <code className="text-[11px] font-mono text-orange-400 block mb-1">http://localhost:3005</code>
              <code className="text-[10px] font-mono text-gray-600">prod: api.flapapay.com</code>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-gray-950 border border-gray-800">
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Other APIs</p>
              <Link to="/documentation" className="text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1">
                Connect, Escrow, Webhooks →
              </Link>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main ref={contentRef} className="flex-1 min-w-0 px-6 lg:px-12 py-12 space-y-20 max-w-4xl">

          {/* ── QUICK START ─────────────────────────────── */}
          {activeSection === 'quickstart' && (
            <section>
              <SH tag="Guide" title="Quick Start" subtitle="Go from zero to a working checkout in under 5 minutes." />
              <div className="space-y-8">
                {[
                  {
                    n: '01', title: 'Get your API key',
                    desc: 'Sign up and find your keys under Dashboard → Developers → API Keys.',
                    code: '# Test keys are prefixed sk_test_flp_\n# Live keys are prefixed sk_live_flp_\nexport FLAPAPAY_SECRET_KEY="sk_test_flp_..."',
                    lang: 'bash',
                  },
                  {
                    n: '02', title: 'Install the SDK',
                    desc: 'Use the official SDK or call the REST API directly from any language.',
                    code: '# Node.js\nnpm install @flapapay/node\n\n# Python\npip install flapapay',
                    lang: 'bash',
                  },
                  {
                    n: '03', title: 'Create a session on your server',
                    desc: 'Never create sessions client-side — your secret key must stay on the server.',
                    code: `import { FlapaPay } from '@flapapay/node';

const flapa = new FlapaPay({ apiKey: process.env.FLAPAPAY_SECRET_KEY });

// Express.js example
app.post('/create-checkout', async (req, res) => {
  const session = await flapa.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: 'price_xxx', quantity: 1 }],
    success_url: \`https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}\`,
    cancel_url: 'https://yourapp.com/cancel',
    metadata: { order_id: req.body.orderId },
  });
  res.json({ url: session.url });
});`,
                    lang: 'Node.js',
                  },
                  {
                    n: '04', title: 'Redirect your customer',
                    desc: 'Send the customer to session.url — FlapaPay handles the payment UI.',
                    code: `// Client-side — after calling your /create-checkout endpoint
const { url } = await fetch('/create-checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orderId: 'ORD-1234' }),
}).then(r => r.json());

window.location.href = url; // Redirect to hosted checkout`,
                    lang: 'javascript',
                  },
                  {
                    n: '05', title: 'Confirm via webhook (not just redirect)',
                    desc: 'Always use webhooks as the authoritative confirmation — customers can close the browser before being redirected back.',
                    code: `app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const { WebhookVerifier } = require('@flapapay/node');
  const event = WebhookVerifier.constructEvent(
    req.body,
    req.headers['flapapay-signature'],
    process.env.FLAPAPAY_WEBHOOK_SECRET,
  );
  if (event.type === 'checkout.session.completed') {
    const { metadata, payment_status } = event.data.object;
    if (payment_status === 'paid') fulfillOrder(metadata.order_id);
  }
  res.json({ received: true });
});`,
                    lang: 'Node.js',
                  },
                ].map((s, i) => (
                  <div key={i} className="flex gap-5">
                    <div className="shrink-0 flex flex-col items-center">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 text-xs font-black">{s.n}</div>
                      {i < 4 && <div className="w-px flex-1 bg-gray-800 mt-2 min-h-[20px]" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-black text-white text-base mb-1">{s.title}</p>
                      <p className="text-sm text-gray-500 mb-3 leading-relaxed">{s.desc}</p>
                      <CodeBlock code={s.code} lang={s.lang} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── AUTHENTICATION ──────────────────────────── */}
          {activeSection === 'authentication' && (
            <section>
              <SH tag="Guide" title="Authentication" subtitle="Every request must include your API key in the Authorization header." />
              <div className="space-y-6">
                <Callout type="warn">
                  <strong>Keep your secret key secure.</strong> Never commit it to source control, expose it client-side, or log it. If compromised, rotate it immediately from the Dashboard → Developers → API Keys.
                </Callout>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Test Secret Key', prefix: 'sk_test_flp_...', desc: 'Use for development and testing. No real money moves.', color: 'border-orange-500/20 bg-orange-500/5' },
                    { label: 'Live Secret Key', prefix: 'sk_live_flp_...', desc: 'Use in production. Real money moves.', color: 'border-emerald-500/20 bg-emerald-500/5' },
                  ].map((k, i) => (
                    <div key={i} className={`p-5 rounded-2xl border ${k.color}`}>
                      <p className="text-xs font-black text-white mb-2">{k.label}</p>
                      <code className="text-xs font-mono text-gray-400 block mb-2">{k.prefix}</code>
                      <p className="text-xs text-gray-500">{k.desc}</p>
                    </div>
                  ))}
                </div>
                <CodeBlock lang="http" code={`POST /v1/checkout/sessions HTTP/1.1
Host: localhost:3005
Authorization: Bearer sk_test_flp_xxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
x-flapapay-test-mode: true`} />
                <Callout type="tip">
                  Pass <code className="text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded text-xs">x-flapapay-test-mode: true</code> with any key to force test mode — useful for staging environments that use a live key structure.
                </Callout>
              </div>
            </section>
          )}

          {/* ── CREATE SESSION ──────────────────────────── */}
          {activeSection === 'create-session' && (
            <section>
              <SH tag="Checkout Sessions" title="Create a Checkout Session" method="POST" path="/v1/checkout/sessions"
                subtitle="Creates a hosted checkout page. Returns a session with a url — redirect your customer to this URL to complete payment." />
              <div className="space-y-6">
                <Callout type="info">
                  Append <code className="text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">?session_id={'{CHECKOUT_SESSION_ID}'}</code> to your <code className="text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">success_url</code> to retrieve the completed session from your success handler.
                </Callout>
                <ParamTable params={[
                  { name: 'mode', type: 'string', required: true, desc: '"payment" (one-time), "subscription" (recurring), or "setup" (save payment method only)' },
                  { name: 'line_items', type: 'array', required: true, desc: 'Array of { price: "price_xxx", quantity: 1 }. Each price must exist in your catalog.' },
                  { name: 'success_url', type: 'string', required: true, desc: 'URL FlapaPay redirects to after payment. Use {CHECKOUT_SESSION_ID} placeholder.' },
                  { name: 'cancel_url', type: 'string', required: true, desc: 'URL to redirect to if the customer closes the checkout page.' },
                  { name: 'customer_email', type: 'string', required: false, desc: 'Pre-fill the email field on the checkout page.' },
                  { name: 'customer', type: 'string', required: false, desc: 'Existing customer ID (cus_xxx) to attach this session to.' },
                  { name: 'currency', type: 'string', required: false, desc: 'ISO 4217 code (zmw, usd, kes, ngn, ghs). Defaults to your account currency.' },
                  { name: 'payment_method_types', type: 'array', required: false, desc: '["card", "mobile_money", "bank_transfer"]. Default: all enabled methods.' },
                  { name: 'transfer_data', type: 'object', required: false, desc: 'Marketplace split: { destination: "acct_xxx", amount: 9500 }.' },
                  { name: 'application_fee_amount', type: 'integer', required: false, desc: 'Platform fee in smallest currency unit. Retained by your account.' },
                  { name: 'allow_promotion_codes', type: 'boolean', required: false, desc: 'Show a promo code field on the checkout page.' },
                  { name: 'metadata', type: 'object', required: false, desc: 'Up to 50 key-value pairs. Available on the resulting payment object.' },
                  { name: 'expires_at', type: 'integer', required: false, desc: 'Unix timestamp. Session expires between 30 minutes and 24 hours from creation.' },
                ]} />
                <MultiLang id="create" samples={{
                  curl: `curl -X POST http://localhost:3005/v1/checkout/sessions \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mode": "payment",
    "line_items": [{ "price": "price_xxx", "quantity": 1 }],
    "customer_email": "buyer@example.com",
    "success_url": "https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}",
    "cancel_url": "https://yourapp.com/cancel",
    "metadata": { "order_id": "ORD-1234" }
  }'`,
                  node: `import { FlapaPay } from '@flapapay/node';

const flapa = new FlapaPay({ apiKey: process.env.FLAPAPAY_SECRET_KEY! });

const session = await flapa.checkout.sessions.create({
  mode: 'payment',
  line_items: [{ price: 'price_xxx', quantity: 1 }],
  customer_email: 'buyer@example.com',
  success_url: 'https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://yourapp.com/cancel',
  metadata: { order_id: 'ORD-1234' },
});

// Redirect your customer
res.redirect(session.url);`,
                  python: `import flapapay

flapapay.api_key = "sk_test_flp_..."

session = flapapay.checkout.sessions.create(
    mode="payment",
    line_items=[{"price": "price_xxx", "quantity": 1}],
    customer_email="buyer@example.com",
    success_url="https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url="https://yourapp.com/cancel",
    metadata={"order_id": "ORD-1234"},
)

# Flask: return redirect(session["url"])`,
                  php: `$flapa = new \\FlapaPay\\FlapaPay('sk_test_flp_...');

$session = $flapa->checkout->sessions->create([
  'mode' => 'payment',
  'line_items' => [['price' => 'price_xxx', 'quantity' => 1]],
  'customer_email' => 'buyer@example.com',
  'success_url' => 'https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}',
  'cancel_url' => 'https://yourapp.com/cancel',
  'metadata' => ['order_id' => 'ORD-1234'],
]);

header('Location: ' . $session->url);`,
                }} response={`{
  "id": "cs_live_a1B2c3D4e5F6",
  "object": "checkout.session",
  "url": "https://checkout.flapapay.com/pay/cs_live_a1B2c3D4e5F6",
  "status": "open",
  "mode": "payment",
  "payment_status": "unpaid",
  "currency": "ZMW",
  "amount_total": 100000,
  "customer_email": "buyer@example.com",
  "success_url": "https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}",
  "cancel_url": "https://yourapp.com/cancel",
  "expires_at": 1716003600,
  "metadata": { "order_id": "ORD-1234" },
  "created": 1716000000
}`} />
              </div>
            </section>
          )}

          {/* ── RETRIEVE SESSION ────────────────────────── */}
          {activeSection === 'retrieve-session' && (
            <section>
              <SH tag="Checkout Sessions" title="Retrieve a Session" method="GET" path="/v1/checkout/sessions/:id"
                subtitle="Fetch a checkout session by ID. Call this from your success_url handler to confirm payment_status === 'paid' before fulfilling the order." />
              <div className="space-y-6">
                <Callout type="warn">
                  <strong>Do not fulfil orders based on the redirect alone.</strong> Customers can edit the URL. Always retrieve the session server-side and check <code className="bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded text-xs">payment_status === "paid"</code> before fulfilling.
                </Callout>
                <ParamTable params={[
                  { name: 'id', type: 'string', required: true, desc: 'The checkout session ID (cs_live_... or cs_test_...)' },
                ]} />
                <MultiLang id="retrieve" samples={{
                  curl: `curl http://localhost:3005/v1/checkout/sessions/cs_live_a1B2c3D4e5F6 \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY"`,
                  node: `// In your Express success handler
app.get('/success', async (req, res) => {
  const sessionId = req.query.session_id;

  const session = await flapa.checkout.sessions.retrieve(sessionId);

  if (session.payment_status === 'paid') {
    const orderId = session.metadata.order_id;
    await fulfillOrder(orderId);  // ✅ safe to fulfil
    res.render('success', { session });
  } else {
    res.redirect('/payment-failed');
  }
});`,
                  python: `from flask import request, redirect

@app.route('/success')
def success():
    session_id = request.args.get('session_id')
    session = flapapay.checkout.sessions.retrieve(session_id)

    if session['payment_status'] == 'paid':
        fulfil_order(session['metadata']['order_id'])
        return render_template('success.html', session=session)
    return redirect('/payment-failed')`,
                  php: `$session_id = $_GET['session_id'];
$session = $flapa->checkout->sessions->retrieve($session_id);

if ($session->payment_status === 'paid') {
  fulfil_order($session->metadata->order_id);
  // Show success page
} else {
  header('Location: /payment-failed');
}`,
                }} response={`{
  "id": "cs_live_a1B2c3D4e5F6",
  "status": "complete",
  "payment_status": "paid",
  "mode": "payment",
  "customer": "cus_xxx",
  "customer_email": "buyer@example.com",
  "payment_intent": "pi_xxx",
  "amount_total": 100000,
  "currency": "ZMW",
  "metadata": { "order_id": "ORD-1234" }
}`} />
              </div>
            </section>
          )}

          {/* ── LIST SESSIONS ───────────────────────────── */}
          {activeSection === 'list-sessions' && (
            <section>
              <SH tag="Checkout Sessions" title="List Sessions" method="GET" path="/v1/checkout/sessions"
                subtitle="Returns a paginated list of checkout sessions. Useful for reconciliation and reporting dashboards." />
              <div className="space-y-6">
                <ParamTable params={[
                  { name: 'limit', type: 'integer', desc: 'Number of sessions to return. 1–100, default 10.' },
                  { name: 'starting_after', type: 'string', desc: 'Session ID cursor for forward pagination — the last ID from the previous page.' },
                  { name: 'ending_before', type: 'string', desc: 'Session ID cursor for backward pagination.' },
                  { name: 'status', type: 'string', desc: '"open", "complete", or "expired".' },
                  { name: 'customer', type: 'string', desc: 'Filter sessions by customer ID.' },
                  { name: 'created[gte]', type: 'integer', desc: 'Unix timestamp — return sessions created at or after this time.' },
                  { name: 'created[lte]', type: 'integer', desc: 'Unix timestamp — return sessions created at or before this time.' },
                ]} />
                <MultiLang id="list" samples={{
                  curl: `curl "http://localhost:3005/v1/checkout/sessions?status=complete&limit=25" \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY"`,
                  node: `const { data, has_more } = await flapa.checkout.sessions.list({
  status: 'complete',
  limit: 25,
});

// Paginate
if (has_more) {
  const nextPage = await flapa.checkout.sessions.list({
    status: 'complete',
    limit: 25,
    starting_after: data[data.length - 1].id,
  });
}`,
                  python: `result = flapapay.checkout.sessions.list(
    status="complete",
    limit=25,
)
for session in result["data"]:
    print(session["id"], session["amount_total"])

# Paginate
if result["has_more"]:
    next_page = flapapay.checkout.sessions.list(
        status="complete",
        limit=25,
        starting_after=result["data"][-1]["id"],
    )`,
                  php: `$result = $flapa->checkout->sessions->list([
  'status' => 'complete',
  'limit' => 25,
]);

foreach ($result->data as $session) {
  echo $session->id . ': ' . $session->amount_total . PHP_EOL;
}`,
                }} response={`{
  "object": "list",
  "data": [
    {
      "id": "cs_live_a1B2c3D4e5F6",
      "status": "complete",
      "payment_status": "paid",
      "amount_total": 100000,
      "currency": "ZMW",
      "created": 1716000000
    },
    {
      "id": "cs_live_g7H8i9J0k1L2",
      "status": "complete",
      "payment_status": "paid",
      "amount_total": 50000,
      "currency": "ZMW",
      "created": 1715996400
    }
  ],
  "has_more": true,
  "url": "/v1/checkout/sessions"
}`} />
              </div>
            </section>
          )}

          {/* ── EXPIRE SESSION ──────────────────────────── */}
          {activeSection === 'expire-session' && (
            <section>
              <SH tag="Checkout Sessions" title="Expire a Session" method="POST" path="/v1/checkout/sessions/:id/expire"
                subtitle="Manually expire an open checkout session. The customer will see an expiration message if they visit the URL after this." />
              <div className="space-y-6">
                <ParamTable params={[
                  { name: 'id', type: 'string', required: true, desc: 'The session ID to expire. Must be in "open" status.' },
                ]} />
                <MultiLang id="expire" samples={{
                  curl: `curl -X POST http://localhost:3005/v1/checkout/sessions/cs_live_xxx/expire \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY"`,
                  node: `const session = await flapa.checkout.sessions.expire('cs_live_xxx');
console.log(session.status); // 'expired'`,
                  python: `session = flapapay.checkout.sessions.expire("cs_live_xxx")
print(session["status"])  # "expired"`,
                  php: `$session = $flapa->checkout->sessions->expire('cs_live_xxx');
echo $session->status; // "expired"`,
                }} response={`{
  "id": "cs_live_xxx",
  "status": "expired",
  "payment_status": "unpaid",
  "expired_at": 1716001234
}`} />
              </div>
            </section>
          )}

          {/* ── SUBSCRIPTION MODE ───────────────────────── */}
          {activeSection === 'subscription-mode' && (
            <section>
              <SH tag="Checkout Sessions" title="Subscription Mode" method="POST" path="/v1/checkout/sessions"
                subtitle='Create a recurring subscription checkout. When the customer completes payment a Subscription and Customer are automatically created. Set mode: "subscription".' />
              <div className="space-y-6">
                <Callout type="info">
                  Subscription prices must have a <code className="text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">recurring</code> interval set. Create prices first with <code className="text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">POST /v1/prices</code> and pass the price ID here.
                </Callout>
                <ParamTable params={[
                  { name: 'mode', type: 'string', required: true, desc: 'Must be "subscription"' },
                  { name: 'line_items', type: 'array', required: true, desc: 'Recurring price items: [{ price: "price_monthly_xxx", quantity: 1 }]' },
                  { name: 'subscription_data.trial_period_days', type: 'integer', desc: 'Number of free trial days before charging. Default: 0.' },
                  { name: 'subscription_data.metadata', type: 'object', desc: 'Key-value pairs attached to the resulting Subscription object.' },
                ]} />
                <MultiLang id="subscription" samples={{
                  curl: `curl -X POST http://localhost:3005/v1/checkout/sessions \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mode": "subscription",
    "line_items": [{ "price": "price_monthly_zmw_xxx", "quantity": 1 }],
    "customer_email": "subscriber@example.com",
    "subscription_data": { "trial_period_days": 14 },
    "success_url": "https://yourapp.com/subscribed?session_id={CHECKOUT_SESSION_ID}",
    "cancel_url": "https://yourapp.com/pricing"
  }'`,
                  node: `const session = await flapa.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: 'price_monthly_zmw_xxx', quantity: 1 }],
  customer_email: 'subscriber@example.com',
  subscription_data: { trial_period_days: 14 },
  success_url: 'https://yourapp.com/subscribed?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://yourapp.com/pricing',
});

res.redirect(session.url);`,
                  python: `session = flapapay.checkout.sessions.create(
    mode="subscription",
    line_items=[{"price": "price_monthly_zmw_xxx", "quantity": 1}],
    customer_email="subscriber@example.com",
    subscription_data={"trial_period_days": 14},
    success_url="https://yourapp.com/subscribed?session_id={CHECKOUT_SESSION_ID}",
    cancel_url="https://yourapp.com/pricing",
)`,
                  php: `$session = $flapa->checkout->sessions->create([
  'mode' => 'subscription',
  'line_items' => [['price' => 'price_monthly_zmw_xxx', 'quantity' => 1]],
  'customer_email' => 'subscriber@example.com',
  'subscription_data' => ['trial_period_days' => 14],
  'success_url' => 'https://yourapp.com/subscribed',
  'cancel_url' => 'https://yourapp.com/pricing',
]);`,
                }} response={`{
  "id": "cs_live_sub_xxx",
  "mode": "subscription",
  "status": "open",
  "payment_status": "unpaid",
  "subscription": null,
  "customer": null,
  "url": "https://checkout.flapapay.com/pay/cs_live_sub_xxx"
}

// After completion — retrieve the session:
// { "subscription": "sub_xxx", "customer": "cus_xxx", "payment_status": "paid" }`} />
              </div>
            </section>
          )}

          {/* ── MARKETPLACE SPLIT ───────────────────────── */}
          {activeSection === 'marketplace-split' && (
            <section>
              <SH tag="Checkout Sessions" title="Marketplace / Split Payment" method="POST" path="/v1/checkout/sessions"
                subtitle="Route funds to a connected sub-merchant and retain a platform fee. The buyer pays a single total — the split happens automatically server-side." />
              <div className="space-y-6">
                <Callout type="info">
                  The sub-merchant account must be created first via <code className="text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">POST /v1/connect/accounts</code>. See the <Link to="/documentation" className="text-blue-400 underline">Connect docs</Link> for the full marketplace setup guide.
                </Callout>
                <ParamTable params={[
                  { name: 'transfer_data.destination', type: 'string', required: true, desc: 'Connected account ID (acct_xxx) that receives the funds.' },
                  { name: 'transfer_data.amount', type: 'integer', desc: 'Exact amount (minor units) to route to the seller. Defaults to total minus application_fee_amount.' },
                  { name: 'application_fee_amount', type: 'integer', desc: 'Platform fee in smallest currency unit retained by your account.' },
                ]} />
                <MultiLang id="split" samples={{
                  curl: `# Customer pays ZK 1,000. Seller gets ZK 950. Platform keeps ZK 50 (5%).
curl -X POST http://localhost:3005/v1/checkout/sessions \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mode": "payment",
    "line_items": [{ "price": "price_product_xxx", "quantity": 1 }],
    "transfer_data": { "destination": "acct_abc123" },
    "application_fee_amount": 5000,
    "success_url": "https://yourapp.com/order/success",
    "cancel_url": "https://yourapp.com/cart"
  }'`,
                  node: `const session = await flapa.checkout.sessions.create({
  mode: 'payment',
  line_items: [{ price: 'price_product_xxx', quantity: 1 }],
  transfer_data: { destination: 'acct_abc123' },
  application_fee_amount: 5000,   // ZK 50 — your platform fee
  success_url: 'https://yourapp.com/order/success',
  cancel_url: 'https://yourapp.com/cart',
});`,
                  python: `session = flapapay.checkout.sessions.create(
    mode="payment",
    line_items=[{"price": "price_product_xxx", "quantity": 1}],
    transfer_data={"destination": "acct_abc123"},
    application_fee_amount=5000,
    success_url="https://yourapp.com/order/success",
    cancel_url="https://yourapp.com/cart",
)`,
                  php: `$session = $flapa->checkout->sessions->create([
  'mode' => 'payment',
  'line_items' => [['price' => 'price_product_xxx', 'quantity' => 1]],
  'transfer_data' => ['destination' => 'acct_abc123'],
  'application_fee_amount' => 5000,
  'success_url' => 'https://yourapp.com/order/success',
  'cancel_url' => 'https://yourapp.com/cart',
]);`,
                }} response={`{
  "id": "cs_live_mkt_xxx",
  "url": "https://checkout.flapapay.com/pay/cs_live_mkt_xxx",
  "transfer_data": { "destination": "acct_abc123" },
  "application_fee_amount": 5000,
  "amount_total": 100000,
  "status": "open"
}`} />
              </div>
            </section>
          )}

          {/* ── PRODUCTS ────────────────────────────────── */}
          {activeSection === 'products' && (
            <section>
              <SH tag="Billing" title="Products" method="POST" path="/v1/products"
                subtitle="Products represent goods or services you sell. Create a product first, then create Prices on top of it. Use the price ID in checkout line_items." />
              <div className="space-y-6">
                <ParamTable params={[
                  { name: 'name', type: 'string', required: true, desc: 'Display name shown on invoices, receipts, and the checkout page.' },
                  { name: 'description', type: 'string', desc: 'Optional description shown to customers during checkout.' },
                  { name: 'images', type: 'array', desc: 'Array of image URLs (up to 8). First image shown on checkout.' },
                  { name: 'active', type: 'boolean', desc: 'Whether the product can be purchased. Default true.' },
                  { name: 'metadata', type: 'object', desc: 'Up to 50 key-value pairs for your own lookups.' },
                ]} />
                <MultiLang id="products" samples={{
                  curl: `curl -X POST http://localhost:3005/v1/products \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Pro Plan",
    "description": "Everything in Starter plus advanced analytics",
    "metadata": { "tier": "pro" }
  }'`,
                  node: `const product = await flapa.products.create({
  name: 'Pro Plan',
  description: 'Everything in Starter plus advanced analytics',
  metadata: { tier: 'pro' },
});

console.log('Product ID:', product.id);
// Next: create a price for this product`,
                  python: `product = flapapay.products.create(
    "Pro Plan",
    description="Everything in Starter plus advanced analytics",
    metadata={"tier": "pro"},
)
print("Product ID:", product["id"])`,
                  php: `$product = $flapa->products->create([
  'name' => 'Pro Plan',
  'description' => 'Everything in Starter plus advanced analytics',
  'metadata' => ['tier' => 'pro'],
]);`,
                }} response={`{
  "id": "prod_xxx",
  "object": "product",
  "name": "Pro Plan",
  "description": "Everything in Starter plus advanced analytics",
  "active": true,
  "images": [],
  "metadata": { "tier": "pro" },
  "created": 1716000000
}`} />
              </div>
            </section>
          )}

          {/* ── PRICES ──────────────────────────────────── */}
          {activeSection === 'prices' && (
            <section>
              <SH tag="Billing" title="Prices" method="POST" path="/v1/prices"
                subtitle="Prices define how much and how often a product costs. A product can have multiple prices (monthly/yearly). Use the price ID in checkout line_items." />
              <div className="space-y-6">
                <ParamTable params={[
                  { name: 'product', type: 'string', required: true, desc: 'Product ID this price belongs to (prod_xxx).' },
                  { name: 'unit_amount', type: 'integer', required: true, desc: 'Price in smallest currency unit. 10000 = ZK 100.00.' },
                  { name: 'currency', type: 'string', required: true, desc: 'ISO 4217 code — e.g., "zmw", "usd".' },
                  { name: 'recurring', type: 'object', desc: '{ interval: "month"|"week"|"year"|"day", interval_count: 1 }. Omit for one-time prices.' },
                  { name: 'nickname', type: 'string', desc: 'Internal label (e.g., "Monthly ZMW" or "Annual Discount").' },
                  { name: 'metadata', type: 'object', desc: 'Key-value pairs.' },
                ]} />
                <MultiLang id="prices" samples={{
                  curl: `# Monthly recurring at ZK 100/month
curl -X POST http://localhost:3005/v1/prices \\
  -H "Authorization: Bearer $FLAPAPAY_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "product": "prod_xxx",
    "unit_amount": 10000,
    "currency": "zmw",
    "recurring": { "interval": "month", "interval_count": 1 },
    "nickname": "Monthly ZMW"
  }'`,
                  node: `// Monthly recurring price at ZK 100/month
const price = await flapa.prices.create({
  product: 'prod_xxx',
  unit_amount: 10000,   // ZK 100.00
  currency: 'zmw',
  recurring: { interval: 'month', interval_count: 1 },
  nickname: 'Monthly ZMW',
});

// Use price.id in checkout:
// line_items: [{ price: price.id, quantity: 1 }]

// One-time price (no recurring):
const onetimePrice = await flapa.prices.create({
  product: 'prod_xxx',
  unit_amount: 50000,   // ZK 500.00
  currency: 'zmw',
});`,
                  python: `# Monthly recurring at ZK 100/month
price = flapapay.prices.create(
    product="prod_xxx",
    unit_amount=10000,
    currency="zmw",
    recurring={"interval": "month", "interval_count": 1},
    nickname="Monthly ZMW",
)
print("Price ID:", price["id"])`,
                  php: `$price = $flapa->prices->create([
  'product' => 'prod_xxx',
  'unit_amount' => 10000,
  'currency' => 'zmw',
  'recurring' => ['interval' => 'month', 'interval_count' => 1],
  'nickname' => 'Monthly ZMW',
]);`,
                }} response={`{
  "id": "price_monthly_zmw_xxx",
  "object": "price",
  "product": "prod_xxx",
  "unit_amount": 10000,
  "currency": "zmw",
  "recurring": { "interval": "month", "interval_count": 1 },
  "nickname": "Monthly ZMW",
  "active": true,
  "created": 1716000000
}`} />
              </div>
            </section>
          )}

          {/* ── WEBHOOK CONFIRMATION ────────────────────── */}
          {activeSection === 'webhook-confirm' && (
            <section>
              <SH tag="Guide" title="Webhook Confirmation" subtitle="Use webhooks as the authoritative payment confirmation — never rely solely on the redirect URL." />
              <div className="space-y-6">
                <Callout type="warn">
                  <strong>Always verify the signature.</strong> The <code className="bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded text-xs">flapapay-signature</code> header prevents replay attacks. Never skip this step in production.
                </Callout>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { event: 'checkout.session.completed', desc: 'Payment confirmed — fulfil the order.' },
                    { event: 'checkout.session.expired', desc: 'Session expired without payment.' },
                    { event: 'invoice.payment_succeeded', desc: 'Subscription payment collected.' },
                    { event: 'invoice.payment_failed', desc: 'Subscription payment failed — notify customer.' },
                    { event: 'payment_intent.succeeded', desc: 'Underlying payment intent confirmed.' },
                    { event: 'payment_intent.payment_failed', desc: 'Payment attempt failed.' },
                  ].map((e, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-950 border border-gray-800">
                      <code className="text-xs text-orange-400 font-mono">{e.event}</code>
                      <span className="text-xs text-gray-500">— {e.desc}</span>
                    </div>
                  ))}
                </div>
                <MultiLang id="webhook" samples={{
                  curl: `# Test your webhook with the FlapaPay CLI
flapapay listen --forward-to localhost:3000/webhook

# Or send a test event from Dashboard → Webhooks → Test Event`,
                  node: `import express from 'express';
import { WebhookVerifier } from '@flapapay/node';

const app = express();

// ⚠️  Must use raw body — don't parse JSON first
app.use('/webhook', express.raw({ type: 'application/json' }));

app.post('/webhook', (req, res) => {
  const sig = req.headers['flapapay-signature'] as string;

  let event;
  try {
    event = WebhookVerifier.constructEvent(
      req.body,                                   // Buffer — raw body
      sig,
      process.env.FLAPAPAY_WEBHOOK_SECRET!,
    );
  } catch (err) {
    return res.status(400).send('Signature verification failed');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (session.payment_status === 'paid') {
      const orderId = session.metadata.order_id;
      await fulfillOrder(orderId);  // ✅ safe to fulfil
    }
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    await activateSubscription(invoice.subscription);
  }

  res.json({ received: true });
});`,
                  python: `from flask import Flask, request, jsonify, abort
import flapapay, os, json

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    payload = request.get_data()          # raw bytes
    sig = request.headers.get('flapapay-signature', '')

    try:
        from flapapay import WebhookVerifier
        event = WebhookVerifier.construct_event(
            payload,
            sig,
            os.environ['FLAPAPAY_WEBHOOK_SECRET'],
        )
    except Exception as e:
        abort(400, str(e))

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        if session['payment_status'] == 'paid':
            fulfil_order(session['metadata']['order_id'])

    return jsonify(received=True)`,
                  php: `<?php
$payload = file_get_contents('php://input');
$sig = $_SERVER['HTTP_FLAPAPAY_SIGNATURE'] ?? '';
$secret = $_ENV['FLAPAPAY_WEBHOOK_SECRET'];

try {
    $event = \\FlapaPay\\Webhook::constructEvent($payload, $sig, $secret);
} catch (\\Exception $e) {
    http_response_code(400);
    exit("Signature verification failed: " . $e->getMessage());
}

if ($event->type === 'checkout.session.completed') {
    $session = $event->data->object;
    if ($session->payment_status === 'paid') {
        fulfil_order($session->metadata->order_id);
    }
}

http_response_code(200);
echo json_encode(['received' => true]);`,
                }} response={`{
  "id": "evt_xxx",
  "object": "event",
  "type": "checkout.session.completed",
  "created": 1716000000,
  "livemode": false,
  "data": {
    "object": {
      "id": "cs_live_a1B2c3D4e5F6",
      "payment_status": "paid",
      "amount_total": 100000,
      "currency": "ZMW",
      "customer_email": "buyer@example.com",
      "metadata": { "order_id": "ORD-1234" }
    }
  }
}`} />
              </div>
            </section>
          )}

          {/* ── ERRORS ──────────────────────────────────── */}
          {activeSection === 'errors' && (
            <section>
              <SH tag="Guide" title="Error Codes" subtitle="FlapaPay uses standard HTTP status codes. All errors return a JSON body with an error field." />
              <div className="space-y-6">
                <CodeBlock lang="json" code={`{
  "error": "No valid price found for ID: price_xxx",
  "code": "resource_not_found",
  "status": 404
}`} />
                <div className="rounded-2xl border border-gray-800 overflow-hidden">
                  {[
                    { code: '200', label: 'OK', color: 'text-emerald-400', desc: 'Request succeeded.' },
                    { code: '400', label: 'Bad Request', color: 'text-amber-400', desc: 'Invalid parameters. Check the error.message for details.' },
                    { code: '401', label: 'Unauthorized', color: 'text-red-400', desc: 'Missing or invalid API key. Ensure Authorization: Bearer sk_... is set.' },
                    { code: '402', label: 'Payment Required', color: 'text-amber-400', desc: 'Valid params but the request failed (e.g. card declined).' },
                    { code: '404', label: 'Not Found', color: 'text-amber-400', desc: 'Resource does not exist. Check the ID.' },
                    { code: '409', label: 'Conflict', color: 'text-amber-400', desc: 'Duplicate request — the resource already exists.' },
                    { code: '429', label: 'Too Many Requests', color: 'text-amber-400', desc: 'Rate limit exceeded. Back off and retry with exponential delay.' },
                    { code: '500', label: 'Server Error', color: 'text-red-400', desc: 'Something went wrong on FlapaPay\'s end. Retry after a short delay.' },
                  ].map((e, i) => (
                    <div key={e.code} className={`flex items-start gap-6 px-6 py-4 ${i % 2 === 0 ? 'bg-black/30' : ''} border-b border-gray-800/50 last:border-0`}>
                      <div className="shrink-0 w-20">
                        <span className={`text-sm font-black font-mono ${e.color}`}>{e.code}</span>
                        <p className="text-[10px] text-gray-600 font-bold">{e.label}</p>
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed">{e.desc}</p>
                    </div>
                  ))}
                </div>
                <Callout type="tip">
                  The Node.js SDK automatically retries on 5xx errors with exponential backoff (up to 2 retries). To disable: <code className="text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded text-xs">new FlapaPay({'{ '}apiKey, maxRetries: 0{' }'})</code>.
                </Callout>
              </div>
            </section>
          )}

          {/* ── PLAYGROUND (always visible at bottom) ── */}
          <section id="playground">
            <div className="mb-8 pb-6 border-b border-gray-800">
              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3 block">Interactive</span>
              <h2 className="text-2xl font-black text-white mb-2">API Playground</h2>
              <p className="text-gray-500 leading-relaxed">Make a live call to <code className="text-gray-300 bg-gray-800 px-2 py-0.5 rounded text-sm">POST /v1/checkout/sessions</code> against your local server. No mocking — real API, real response.</p>
            </div>
            <Playground />
          </section>

        </main>
      </div>

      <Footer />
    </div>
  );
};
