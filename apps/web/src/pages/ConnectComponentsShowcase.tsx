import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { loadFlapaConnect, type FlapaConnectInstance } from '../lib/flapaConnect';
import { FlapaConnectProvider } from '../components/connect/FlapaConnectProvider';
import { ConnectBalances } from '../components/connect/embedded/ConnectBalances';
import { ConnectPayments } from '../components/connect/embedded/ConnectPayments';
import { ConnectPayouts } from '../components/connect/embedded/ConnectPayouts';
import { ConnectDocuments } from '../components/connect/embedded/ConnectDocuments';
import { ConnectNotificationBanner } from '../components/connect/embedded/ConnectNotificationBanner';
import { ConnectAnalytics } from '../components/connect/embedded/ConnectAnalytics';
import { Sidebar } from '../components/layout/Sidebar';
import { Code, Layers, Zap, ChevronDown, Copy, Check, ExternalLink, Play, BookOpen, ArrowRight, Terminal, Shield, RefreshCw, ChevronLeft, Key, Eye, EyeOff } from 'lucide-react';

type PageTab = 'demo' | 'guide';
type TabId = 'balances' | 'payments' | 'payouts' | 'documents' | 'notifications' | 'analytics';

const TABS: { id: TabId; label: string }[] = [
  { id: 'notifications', label: 'Notification Banner' },
  { id: 'balances', label: 'Balances' },
  { id: 'payments', label: 'Payments' },
  { id: 'payouts', label: 'Payouts' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'documents', label: 'Documents' },
];

const CODE_SNIPPETS: Record<TabId, string> = {
  notifications: `// 1. Server: Create an AccountSession for the seller
const session = await api.post('/v1/connect/account_sessions', {
  account: 'ca_seller_id',
  components: { notifications: { enabled: true } }
});
const { client_secret } = session.data;

// 2. Client: Initialize FlapaConnect
const connectInstance = loadFlapaConnect({
  fetchClientSecret: async () => client_secret,
  appearance: { variables: { colorPrimary: '#ea580c' } }
});

// 3. Render in your seller-facing dashboard
<FlapaConnectProvider connectInstance={connectInstance}>
  <ConnectNotificationBanner maxVisible={3} />
</FlapaConnectProvider>`,

  balances: `// 1. Server: Create an AccountSession
const session = await api.post('/v1/connect/account_sessions', {
  account: 'ca_seller_id',
  components: { balances: { enabled: true } }
});

// 2. Initialize FlapaConnect
const connectInstance = loadFlapaConnect({
  fetchClientSecret: async () => session.data.client_secret,
});

// 3. Render
<FlapaConnectProvider connectInstance={connectInstance}>
  <ConnectBalances />
</FlapaConnectProvider>`,

  payments: `// Seller payments embedded in your marketplace dashboard

const connectInstance = loadFlapaConnect({
  fetchClientSecret: async () => {
    const res = await fetch('/api/account-session', { method: 'POST' });
    const { client_secret } = await res.json();
    return client_secret;
  },
  appearance: {
    variables: { colorPrimary: '#ea580c', borderRadius: '1rem' }
  }
});

<FlapaConnectProvider connectInstance={connectInstance}>
  <ConnectPayments
    onLoadError={(err) => console.error('Load failed:', err)}
  />
</FlapaConnectProvider>`,

  payouts: `// Sellers can view payouts and request new ones

<FlapaConnectProvider connectInstance={connectInstance}>
  <ConnectPayouts
    onLoaderStart={() => hideLoadingSpinner()}
    onLoadError={(err) => showError(err.message)}
  />
</FlapaConnectProvider>`,

  documents: `// KYC document upload embedded in your onboarding flow

<FlapaConnectProvider connectInstance={connectInstance}>
  <ConnectDocuments />
</FlapaConnectProvider>

// Supports: national_id, passport, business_registration,
//           tax_clearance, proof_of_address`,

  analytics: `// Revenue analytics embedded in your seller dashboard

import { ConnectAnalytics } from '@flapapay/react-connect';

// 1. Create session with analytics component enabled
const session = await api.post('/v1/connect/account_sessions', {
  account: 'ca_seller_id',
  components: {
    analytics: { enabled: true },
    payments:  { enabled: true },  // analytics reads charge data
  }
});

// 2. Render — includes KPI cards, revenue chart,
//    payment method breakdown, and top transactions
<FlapaConnectProvider connectInstance={connectInstance}>
  <ConnectAnalytics />
</FlapaConnectProvider>`,
};

export const ConnectComponentsShowcase: React.FC = () => {
  const navigate = useNavigate();
  const [pageTab, setPageTab] = useState<PageTab>('demo');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [connectInstance, setConnectInstance] = useState<FlapaConnectInstance | null>(null);
  const [launching, setLaunching] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('balances');
  const [copied, setCopied] = useState(false);
  const [colorPrimary, setColorPrimary] = useState('#ea580c');
  const [borderRadius, setBorderRadius] = useState('1rem');
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('merchant_sk_test') || '');
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(!!localStorage.getItem('merchant_sk_test'));
  const [accountsError, setAccountsError] = useState('');
  const [creatingLink, setCreatingLink] = useState(false);
  const [newSellerUrl, setNewSellerUrl] = useState('');

  const loadAccounts = useCallback(() => {
    if (!localStorage.getItem('merchant_sk_test')) return;
    setAccountsError('');
    api.get('/v1/connect/accounts?limit=50')
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : (r.data.accounts || []);
        setAccounts(list);
        if (list.length === 0) setAccountsError('No connected sellers found for this API key.');
      })
      .catch(err => {
        setAccountsError(err.response?.data?.error || 'Failed to load accounts. Check your API key.');
      });
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const saveApiKey = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) return;
    localStorage.setItem('merchant_sk_test', trimmed);
    setKeySaved(true);
    setConnectInstance(null);
    setSelectedAccountId('');
    setAccounts([]);
    setNewSellerUrl('');
    loadAccounts();
  };

  const createNewSellerLink = async () => {
    setCreatingLink(true);
    setNewSellerUrl('');
    setAccountsError('');
    try {
      const res = await api.post('/v1/connect/onboarding_links', {
        return_url: `${window.location.origin}/merchant/connect/components`,
      });
      setNewSellerUrl(res.data.url || '');
    } catch (err: any) {
      setAccountsError(err.response?.data?.error || 'Failed to create onboarding link');
    } finally {
      setCreatingLink(false);
    }
  };

  const launchComponents = useCallback(async () => {
    if (!selectedAccountId) { setError('Please select a seller account'); return; }
    setError('');
    setLaunching(true);
    try {
      // Create account session (marketplace owner's server call)
      const sessionRes = await api.post('/v1/connect/account_sessions', {
        account: selectedAccountId,
        components: {
          balances: { enabled: true },
          payments: { enabled: true },
          payouts: { enabled: true, features: { request_payouts: true } },
          documents: { enabled: true },
          notifications: { enabled: true },
        },
      });
      const { client_secret } = sessionRes.data;

      // Initialize FlapaConnect instance (would run in seller-facing app)
      const instance = loadFlapaConnect({
        fetchClientSecret: async () => client_secret,
        appearance: {
          variables: { colorPrimary, borderRadius },
        },
      });

      setConnectInstance(instance);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create session');
    } finally {
      setLaunching(false);
    }
  }, [selectedAccountId, colorPrimary, borderRadius]);

  const copyCode = () => {
    navigator.clipboard.writeText(CODE_SNIPPETS[activeTab]).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Update appearance live
  useEffect(() => {
    if (connectInstance) {
      connectInstance.update({ appearance: { variables: { colorPrimary, borderRadius } } });
    }
  }, [colorPrimary, borderRadius, connectInstance]);

  return (
    <div className="min-h-screen bg-[#F8F9FB] lg:pl-64 font-sans">
      <Sidebar isOpen={false} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/merchant/connect')}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-orange-500 transition-colors mb-3"
          >
            <ChevronLeft className="w-3 h-3" /> Connect Dashboard
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center">
              <Layers className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-orange-500">FlapaPay Connect</p>
              <h1 className="text-2xl font-black text-gray-900">Embedded Components</h1>
            </div>
          </div>
          <p className="text-gray-500 max-w-2xl">
            Embed seller dashboard UI directly into your marketplace. Sellers see their balance, transactions, payouts and KYC status without ever leaving your platform.
          </p>

          {/* Page-level tabs */}
          <div className="flex gap-1 mt-5 p-1 bg-white border border-gray-100 rounded-2xl w-fit shadow-sm">
            <button
              onClick={() => setPageTab('demo')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${pageTab === 'demo' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <Play className="w-4 h-4" /> Live Demo
            </button>
            <button
              onClick={() => setPageTab('guide')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${pageTab === 'guide' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <BookOpen className="w-4 h-4" /> Integration Guide
            </button>
          </div>
        </div>

        {pageTab === 'guide' && <IntegrationGuide />}

        {pageTab === 'demo' && (
          <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
          {/* Left: Config Panel */}
          <div className="space-y-4">
            {/* Step 0: API Key */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                <Key className="w-3.5 h-3.5" /> Step 1 — Enter Your Test API Key
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={e => { setApiKey(e.target.value); setKeySaved(false); }}
                    placeholder="flp_test_sk_…"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-200 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={saveApiKey}
                  disabled={!apiKey.trim() || keySaved}
                  className="px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-xs font-black rounded-xl transition-all whitespace-nowrap"
                >
                  {keySaved ? <Check className="w-4 h-4" /> : 'Save'}
                </button>
              </div>
              {keySaved && (
                <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Key saved — accounts loaded below
                </p>
              )}
              <p className="text-[10px] text-gray-400 mt-2">Found in Merchant Dashboard → Settings → API Keys</p>
            </div>

            {/* Step 2: Select Seller */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Step 2 — Select Seller Account
                </p>
                <button onClick={loadAccounts} className="text-gray-400 hover:text-orange-500 transition-colors" title="Refresh accounts">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Seller dropdown */}
              <div className="relative">
                <select
                  value={selectedAccountId}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '__new__') { createNewSellerLink(); return; }
                    setSelectedAccountId(val);
                    setConnectInstance(null);
                    setError('');
                    setNewSellerUrl('');
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer"
                >
                  <option value="">Choose a connected seller…</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.businessName || a.business_name || a.email}
                      {a.kyc_status ? ` — ${a.kyc_status}` : a.status ? ` — ${a.status}` : ''}
                    </option>
                  ))}
                  <option value="__new__" disabled={!keySaved}>
                    {creatingLink ? '⏳ Creating link…' : '➕ New Seller — Generate Onboarding Link'}
                  </option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* New seller onboarding link */}
              {newSellerUrl && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-100 rounded-xl">
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1.5">New Seller Onboarding Link</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={newSellerUrl}
                      className="flex-1 text-xs font-mono bg-white border border-orange-100 rounded-lg px-2 py-1.5 text-gray-600 overflow-hidden text-ellipsis"
                    />
                    <button
                      onClick={() => { navigator.clipboard.writeText(newSellerUrl); }}
                      className="shrink-0 p-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      title="Copy link"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <a
                    href={newSellerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-orange-600 font-semibold hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> Open onboarding form
                  </a>
                  <p className="text-[10px] text-gray-400 mt-1">Share this link with the new seller. After they complete onboarding, refresh the dropdown.</p>
                </div>
              )}

              {accountsError && (
                <p className="text-xs text-red-500 font-medium mt-2">{accountsError}</p>
              )}
              {!accountsError && accounts.length === 0 && keySaved && !newSellerUrl && (
                <p className="text-xs text-gray-400 mt-2 font-medium">
                  No sellers yet. Select <em>"➕ New Seller"</em> above to generate an onboarding link.
                </p>
              )}
              {!keySaved && (
                <p className="text-xs text-gray-400 mt-2 font-medium">Enter and save your API key above first.</p>
              )}
            </div>

            {/* Step 3: Appearance */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                Step 3 — Customize Appearance
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={colorPrimary}
                      onChange={e => setColorPrimary(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-gray-100 cursor-pointer p-1"
                    />
                    <code className="text-sm font-mono text-gray-600 bg-gray-50 px-3 py-2 rounded-xl flex-1">{colorPrimary}</code>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Border Radius</label>
                  <select
                    value={borderRadius}
                    onChange={e => setBorderRadius(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-200"
                  >
                    <option value="0.5rem">Sharp (0.5rem)</option>
                    <option value="1rem">Default (1rem)</option>
                    <option value="1.5rem">Rounded (1.5rem)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 4: Launch */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                Step 4 — Launch Demo
              </p>
              {error && (
                <p className="text-sm text-red-500 font-medium mb-3 p-3 bg-red-50 rounded-xl">{error}</p>
              )}
              <button
                onClick={launchComponents}
                disabled={launching || !selectedAccountId || !keySaved}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white text-sm uppercase tracking-widest transition-all disabled:opacity-40"
                style={{ backgroundColor: colorPrimary }}
              >
                <Play className="w-4 h-4" />
                {launching ? 'Creating Session…' : connectInstance ? 'Reload Session' : 'Launch Components'}
              </button>
              {connectInstance && (
                <p className="text-xs text-green-600 font-medium mt-2 text-center">
                  Session active · Components rendering below
                </p>
              )}
            </div>

            {/* How It Works */}
            <div className="bg-orange-50 rounded-2xl border border-orange-100 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-orange-500 mb-3 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" /> How It Works
              </p>
              <ol className="space-y-2.5 text-sm text-gray-600">
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  Your server calls <code className="text-orange-600 font-mono text-xs">POST /v1/connect/account_sessions</code>
                </li>
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  Pass the <code className="text-orange-600 font-mono text-xs">client_secret</code> to your seller-facing frontend
                </li>
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <code className="text-orange-600 font-mono text-xs">FlapaConnectProvider</code> exchanges it for a scoped portal token
                </li>
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                  Components render the seller's live data — no API keys exposed
                </li>
              </ol>
            </div>
          </div>

          {/* Right: Live Demo + Code */}
          <div className="space-y-4">
            {/* Component Tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100 overflow-x-auto">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-3.5 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors flex-shrink-0 ${
                      activeTab === tab.id
                        ? 'border-b-2 text-orange-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    style={activeTab === tab.id ? { borderColor: colorPrimary, color: colorPrimary } : {}}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Live Preview */}
              <div className="p-6 bg-gray-50/50 min-h-[280px]">
                {!connectInstance ? (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-300">
                    <Layers className="w-10 h-10 mb-3" />
                    <p className="text-sm font-medium">Select a seller and launch to preview</p>
                  </div>
                ) : (
                  <FlapaConnectProvider connectInstance={connectInstance}>
                    {activeTab === 'notifications' && <ConnectNotificationBanner />}
                    {activeTab === 'balances' && <ConnectBalances />}
                    {activeTab === 'payments' && <ConnectPayments />}
                    {activeTab === 'payouts' && <ConnectPayouts />}
                    {activeTab === 'analytics' && <ConnectAnalytics />}
                    {activeTab === 'documents' && <ConnectDocuments />}
                  </FlapaConnectProvider>
                )}
              </div>
            </div>

            {/* Code Snippet */}
            <div className="bg-gray-900 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    {TABS.find(t => t.id === activeTab)?.label} — Integration Code
                  </span>
                </div>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="px-5 py-5 text-sm font-mono text-gray-300 overflow-x-auto leading-relaxed">
                <code>{CODE_SNIPPETS[activeTab]}</code>
              </pre>
            </div>

            {/* All Components Overview */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Available Components</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { name: 'ConnectBalances', desc: 'Account balance & status' },
                  { name: 'ConnectPayments', desc: 'Transactions with filters' },
                  { name: 'ConnectPayouts', desc: 'Payouts + instant payout modal' },
                  { name: 'ConnectAnalytics', desc: 'Revenue charts & KPIs' },
                  { name: 'ConnectDocuments', desc: 'KYC document upload' },
                  { name: 'ConnectNotificationBanner', desc: 'Account alerts' },
                ].map(c => (
                  <div key={c.name} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-xs font-black text-orange-600 font-mono">{c.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Integration Guide ────────────────────────────────────────────────────────

function GuideStep({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-5">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-black flex items-center justify-center mt-0.5">{n}</div>
      <div className="flex-1 pb-8 border-b border-gray-100 last:border-0 last:pb-0">
        <h3 className="font-black text-gray-900 text-lg mb-3">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function CodeSnippet({ lang, code, copyable = true }: { lang: string; code: string; copyable?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden bg-gray-900 text-sm font-mono mt-4">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang}</span>
        {copyable && (
          <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 text-gray-300 rounded text-[10px] font-bold transition-all">
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
      <pre className="px-4 py-4 text-gray-300 leading-relaxed overflow-x-auto whitespace-pre text-xs">{code}</pre>
    </div>
  );
}

function IntegrationGuide() {
  return (
    <div className="max-w-4xl space-y-0">
      {/* Intro */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-black text-gray-900 text-xl mb-1">Seller Dashboard Integration Guide</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              This guide walks you through embedding FlapaPay Connect components into your marketplace so sellers can view their balance, transactions, payouts, and KYC status without leaving your platform — in under 30 minutes.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              {['Account Sessions API', 'React Components', 'Server Endpoint', 'Appearance Customization'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-white border border-orange-200 rounded-full text-xs font-bold text-orange-600">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Architecture diagram */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Architecture Overview</p>
        <div className="space-y-2 font-mono text-xs text-gray-500 bg-gray-950 rounded-2xl p-5 overflow-x-auto">
          <div className="text-gray-300 font-bold">Marketplace Platform (Your Server)</div>
          <div className="text-orange-400 pl-4">├── POST /v1/connect/account_sessions  <span className="text-gray-500">← uses your secret API key</span></div>
          <div className="text-green-400 pl-4">└── Returns: {'{ client_secret: "cass_..." }'}</div>
          <div className="mt-3 text-gray-300 font-bold">Seller's Browser</div>
          <div className="text-blue-400 pl-4">├── loadFlapaConnect({'{ fetchClientSecret }'})</div>
          <div className="text-blue-400 pl-4">├── FlapaConnectProvider  <span className="text-gray-500">← exchanges secret for portal_token</span></div>
          <div className="text-emerald-400 pl-4">├── {'<ConnectBalances />'}  <span className="text-gray-500">← GET /v1/connect/portal/me</span></div>
          <div className="text-emerald-400 pl-4">├── {'<ConnectPayments />'}  <span className="text-gray-500">← GET /v1/connect/portal/charges</span></div>
          <div className="text-emerald-400 pl-4">├── {'<ConnectPayouts />'}   <span className="text-gray-500">← GET /v1/connect/portal/payouts</span></div>
          <div className="text-emerald-400 pl-4">└── {'<ConnectDocuments />'} <span className="text-gray-500">← GET /v1/connect/portal/kyc</span></div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[
            { icon: <Shield className="w-4 h-4" />, label: 'API keys stay server-side', color: 'text-green-600 bg-green-50' },
            { icon: <RefreshCw className="w-4 h-4" />, label: 'Sessions auto-refresh on expiry', color: 'text-blue-600 bg-blue-50' },
            { icon: <Zap className="w-4 h-4" />, label: 'One instance per seller session', color: 'text-orange-600 bg-orange-50' },
          ].map(item => (
            <div key={item.label} className={`flex items-center gap-2 p-3 rounded-xl ${item.color}`}>
              {item.icon}
              <span className="text-xs font-bold">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-0">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Step-by-Step Integration</p>

        <GuideStep n={1} title="Install the packages">
          <p className="text-sm text-gray-600">Add the FlapaPay Connect SDK to your React project.</p>
          <CodeSnippet lang="bash" code={`npm install @flapapay/connect @flapapay/react-connect
# or
yarn add @flapapay/connect @flapapay/react-connect`} />
          <p className="text-xs text-gray-400 mt-3 font-medium">
            Until the npm package is published, import directly from your local build:
          </p>
          <CodeSnippet lang="typescript" code={`import { loadFlapaConnect } from '../lib/flapaConnect';
import { FlapaConnectProvider } from '../components/connect/FlapaConnectProvider';
import { ConnectBalances } from '../components/connect/embedded/ConnectBalances';
import { ConnectPayments } from '../components/connect/embedded/ConnectPayments';
import { ConnectPayouts } from '../components/connect/embedded/ConnectPayouts';
import { ConnectDocuments } from '../components/connect/embedded/ConnectDocuments';
import { ConnectNotificationBanner } from '../components/connect/embedded/ConnectNotificationBanner';`} />
        </GuideStep>

        <GuideStep n={2} title="Create an /account-session endpoint on your server">
          <p className="text-sm text-gray-600 mb-2">
            Your server creates the session using your <strong>secret API key</strong>. The browser never touches your key — it only receives the short-lived <code className="bg-gray-100 px-1 py-0.5 rounded text-orange-600 font-mono text-xs">client_secret</code>.
          </p>
          <div className="flex gap-3 mb-1">
            {['Node.js / Express', 'Python / Django', 'PHP / Laravel'].map((lang, i) => (
              <span key={lang} className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${i === 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>{lang}</span>
            ))}
          </div>
          <CodeSnippet lang="Node.js (Express)" code={`// routes/flapapay.js
import express from 'express';
const router = express.Router();

router.post('/account-session', requireAuth, async (req, res) => {
  // Get the seller's FlapaPay account ID from your database
  const sellerId = req.user.flapaPayAccountId;

  const response = await fetch(
    '${import.meta.env.VITE_API_URL || 'http://localhost:3005'}/v1/connect/account_sessions',
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
  // ✅ Return ONLY the client_secret — never your API key
  res.json({ client_secret });
});

export default router;`} />
        </GuideStep>

        <GuideStep n={3} title="Initialise FlapaConnect in your seller dashboard">
          <p className="text-sm text-gray-600 mb-2">
            Create <strong>one instance per seller session</strong> — typically in a <code className="bg-gray-100 px-1 py-0.5 rounded text-orange-600 font-mono text-xs">useMemo</code> so it's not recreated on every render.
          </p>
          <CodeSnippet lang="React / TypeScript" code={`import { useMemo } from 'react';
import { loadFlapaConnect } from '../lib/flapaConnect';

// In your seller dashboard component or layout:
const connectInstance = useMemo(() => loadFlapaConnect({
  fetchClientSecret: async () => {
    // This is called on init AND when the session expires (auto-refresh)
    const res = await fetch('/api/account-session', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to create seller session');
    const { client_secret } = await res.json();
    return client_secret;
  },

  // Match your marketplace's brand colors
  appearance: {
    variables: {
      colorPrimary: '#ea580c',        // your brand color
      borderRadius: '1rem',           // card corner radius
      fontFamily:   '"Inter", sans-serif',
    },
  },
}), []); // [] = create once per mount`} />
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs font-bold text-amber-700">Important: Never call <code>loadFlapaConnect</code> inside a render loop or per-component. One instance serves all components.</p>
          </div>
        </GuideStep>

        <GuideStep n={4} title="Wrap your seller UI with FlapaConnectProvider">
          <p className="text-sm text-gray-600 mb-2">
            The provider handles the session exchange, authentication, and token refresh automatically. All components inside it share the same seller session.
          </p>
          <CodeSnippet lang="React / TypeScript" code={`import { FlapaConnectProvider } from '../components/connect/FlapaConnectProvider';
import { ConnectNotificationBanner } from '../components/connect/embedded/ConnectNotificationBanner';
import { ConnectBalances } from '../components/connect/embedded/ConnectBalances';
import { ConnectPayments } from '../components/connect/embedded/ConnectPayments';
import { ConnectPayouts } from '../components/connect/embedded/ConnectPayouts';
import { ConnectDocuments } from '../components/connect/embedded/ConnectDocuments';

export function SellerDashboard() {
  return (
    <FlapaConnectProvider connectInstance={connectInstance}>

      {/* ── Step 1: Alert banners (KYC status, balance alerts) ── */}
      <ConnectNotificationBanner maxVisible={2} />

      {/* ── Step 2: Balance & payouts side-by-side ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <ConnectBalances />
        <ConnectPayouts />
      </div>

      {/* ── Step 3: Transaction history ──────────────────────── */}
      <div className="mt-6">
        <ConnectPayments />
      </div>

      {/* ── Step 4: KYC documents (onboarding or settings) ───── */}
      <div className="mt-6">
        <ConnectDocuments />
      </div>

    </FlapaConnectProvider>
  );
}`} />
        </GuideStep>

        <GuideStep n={5} title="Handle errors and loading states">
          <p className="text-sm text-gray-600 mb-2">
            Each component accepts <code className="bg-gray-100 px-1 py-0.5 rounded text-orange-600 font-mono text-xs">onLoadError</code> and <code className="bg-gray-100 px-1 py-0.5 rounded text-orange-600 font-mono text-xs">onLoaderStart</code> props for your own analytics or UX.
          </p>
          <CodeSnippet lang="React / TypeScript" code={`<FlapaConnectProvider connectInstance={connectInstance}>
  <ConnectBalances
    onLoaderStart={() => {
      // Component has started rendering — hide your custom skeleton
      setShowSkeleton(false);
    }}
    onLoadError={(error) => {
      // Log to your error tracker (Sentry, Datadog, etc.)
      Sentry.captureException(error, { tags: { component: 'ConnectBalances' } });
      // Show a friendly error to the seller
      showToast('Could not load balance. Please refresh.', 'error');
    }}
  />

  <ConnectPayments
    onLoadError={(error) => trackError('connect_payments', error)}
  />

  <ConnectPayouts
    onLoadError={(error) => trackError('connect_payouts', error)}
  />
</FlapaConnectProvider>`} />
        </GuideStep>

        <GuideStep n={6} title="Logout and session management">
          <p className="text-sm text-gray-600 mb-2">
            When the seller logs out of your platform, call <code className="bg-gray-100 px-1 py-0.5 rounded text-orange-600 font-mono text-xs">connectInstance.logout()</code> to invalidate their portal session.
          </p>
          <CodeSnippet lang="React / TypeScript" code={`function SellerNavbar() {
  const handleLogout = async () => {
    // 1. Invalidate the FlapaPay portal session
    connectInstance.logout();

    // 2. Clear your own session (cookie, localStorage, etc.)
    await signOut();

    // 3. Redirect to login
    router.push('/login');
  };

  return <button onClick={handleLogout}>Log out</button>;
}

// Update appearance at runtime (e.g., dark mode toggle):
function onDarkModeToggle(isDark: boolean) {
  connectInstance.update({
    appearance: {
      variables: {
        colorPrimary:    isDark ? '#fb923c' : '#ea580c',
        colorBackground: isDark ? '#1e1e2e' : '#ffffff',
        colorText:       isDark ? '#e2e8f0' : '#111827',
      },
    },
  });
}`} />
        </GuideStep>
      </div>

      {/* Component quick-reference */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mt-6">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Component Quick Reference</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 pb-3 pr-6">Component</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 pb-3 pr-6">Session Permission</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 pb-3 pr-6">Portal Endpoint</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 pb-3">What sellers see</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { comp: 'ConnectNotificationBanner', perm: 'notifications: { enabled: true }', ep: 'GET /portal/me', desc: 'KYC alerts, balance reminders, account status' },
                { comp: 'ConnectBalances', perm: 'balances: { enabled: true }', ep: 'GET /portal/me', desc: 'Available & pending balance, KYC & account status' },
                { comp: 'ConnectPayments', perm: 'payments: { enabled: true }', ep: 'GET /portal/charges', desc: 'Rich table: Date, Status, From, Method, Amount + filter chips' },
                { comp: 'ConnectPayouts', perm: 'payouts: { enabled: true }', ep: 'GET /portal/payouts + POST /portal/payout-requests', desc: 'Balance, payout history, instant/standard payout modal' },
                { comp: 'ConnectAnalytics', perm: 'analytics: { enabled: true }', ep: 'GET /portal/charges + GET /portal/me', desc: 'KPI cards, revenue bar chart, method & status breakdown' },
                { comp: 'ConnectDocuments', perm: 'documents: { enabled: true }', ep: 'GET/POST /portal/kyc', desc: 'Upload identity docs, see approval/rejection status' },
              ].map(row => (
                <tr key={row.comp}>
                  <td className="py-3 pr-6"><code className="text-orange-600 font-mono text-xs font-bold">{row.comp}</code></td>
                  <td className="py-3 pr-6"><code className="text-gray-500 font-mono text-[11px]">{row.perm}</code></td>
                  <td className="py-3 pr-6"><code className="text-blue-500 font-mono text-[11px]">{row.ep}</code></td>
                  <td className="py-3 text-xs text-gray-500">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Next steps */}
      <div className="bg-gray-900 rounded-2xl p-6 mt-6">
        <p className="text-xs font-black uppercase tracking-widest text-orange-400 mb-4">Next Steps</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: <Terminal className="w-4 h-4" />, title: 'API Reference', desc: 'Full endpoint docs with Try It panels for account sessions, portal endpoints, and more.', href: '/merchant/connect/api-reference' },
            { icon: <Play className="w-4 h-4" />, title: 'Live Demo', desc: 'Select a real seller account and preview all components with live data.', href: '#demo' },
            { icon: <Layers className="w-4 h-4" />, title: 'Connect Dashboard', desc: 'Review KYC docs, approve payout requests, and manage your seller ecosystem.', href: '/merchant/connect' },
          ].map(item => (
            <a key={item.title} href={item.href}
              onClick={e => { if (item.href === '#demo') { e.preventDefault(); document.querySelector('[data-tab="demo"]')?.dispatchEvent(new MouseEvent('click')); } }}
              className="block p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group">
              <div className="flex items-center gap-2 text-orange-400 mb-2 group-hover:text-orange-300">
                {item.icon}
                <span className="text-sm font-black">{item.title}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
