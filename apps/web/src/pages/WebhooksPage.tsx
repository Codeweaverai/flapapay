import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import {
    Webhook, Plus, Trash2, X, Copy, Check, RefreshCw,
    ArrowLeft, CheckCircle, AlertCircle,
    ChevronDown, ChevronUp, Activity, Shield, Zap, ChevronRight
} from 'lucide-react';

interface WebhookEndpoint {
    id: string;
    url: string;
    events: string[];
    enabled: boolean;
    description: string;
    created_at: string;
    signing_secret?: string;
}

interface Delivery {
    id: string;
    event: string;
    response_status: number;
    delivered_at: string;
}

const ALL_EVENTS = [
    { value: 'account.created', label: 'Account Created', desc: 'A new sub-merchant account was registered' },
    { value: 'account.activated', label: 'Account Activated', desc: 'KYC approved — sub-merchant is active' },
    { value: 'account.suspended', label: 'Account Suspended', desc: 'Account suspended by platform' },
    { value: 'charge.succeeded', label: 'Charge Succeeded', desc: 'Charge completed with split' },
    { value: 'charge.failed', label: 'Charge Failed', desc: 'Charge failed' },
    { value: 'transfer.completed', label: 'Transfer Completed', desc: 'Funds routed to a connected account' },
    { value: 'payout.initiated', label: 'Payout Initiated', desc: 'Payout process has started' },
    { value: 'payout.completed', label: 'Payout Completed', desc: 'Mobile money / bank disbursement succeeded' },
    { value: 'payout.failed', label: 'Payout Failed', desc: 'Disbursement failed after all retries' },
    { value: 'kyc.approved', label: 'KYC Approved', desc: 'All documents approved for sub-merchant' },
    { value: 'kyc.rejected', label: 'KYC Rejected', desc: 'A document was rejected' },
    { value: 'dispute.opened', label: 'Dispute Opened', desc: 'Dispute raised on a charge' },
    { value: '*', label: 'All Events', desc: 'Subscribe to every Connect event' },
];

const SIM_DEFAULTS: Record<string, object> = {
    'account.created':   { account_id: 'ca_test_001', business_name: 'Test Merchant Ltd' },
    'account.activated': { account_id: 'ca_test_001', kyc_status: 'verified' },
    'account.suspended': { account_id: 'ca_test_001', reason: 'Policy violation' },
    'charge.succeeded':  { charge_id: 'ch_test_001', amount: 10000, currency: 'ZMW', account_id: 'ca_test_001' },
    'charge.failed':     { charge_id: 'ch_test_001', amount: 10000, currency: 'ZMW', reason: 'Insufficient funds' },
    'transfer.completed':{ transfer_id: 'tr_test_001', amount: 9750, currency: 'ZMW', account_id: 'ca_test_001' },
    'payout.initiated':  { payout_id: 'po_test_001', amount: 5000, currency: 'ZMW', account_id: 'ca_test_001' },
    'payout.completed':  { payout_id: 'po_test_001', amount: 5000, currency: 'ZMW', account_id: 'ca_test_001' },
    'payout.failed':     { payout_id: 'po_test_001', amount: 5000, reason: 'Bank rejected', account_id: 'ca_test_001' },
    'kyc.approved':      { account_id: 'ca_test_001', kyc_status: 'verified' },
    'kyc.rejected':      { account_id: 'ca_test_001', doc_id: 'doc_test_001', reason: 'Invalid document' },
    'dispute.opened':    { dispute_id: 'dp_test_001', amount: 10000, account_id: 'ca_test_001', charge_id: 'ch_test_001' },
};

export const WebhooksPage: React.FC = () => {
    const navigate = useNavigate();
    const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [deliveries, setDeliveries] = useState<Record<string, Delivery[]>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<Record<string, any>>({});
    const [newSecret, setNewSecret] = useState<{ id: string; secret: string } | null>(null);

    // Simulator state (per-endpoint)
    const [simulatorId, setSimulatorId] = useState<string | null>(null);
    const [simEventType, setSimEventType] = useState<string>('account.created');
    const [simPayload, setSimPayload] = useState<string>('');
    const [simPayloadError, setSimPayloadError] = useState<string>('');

    // Create form state
    const [newUrl, setNewUrl] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newEvents, setNewEvents] = useState<string[]>(['*']);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    useEffect(() => { fetchEndpoints(); }, []);

    const fetchEndpoints = async () => {
        setLoading(true);
        try {
            const res = await api.get('/v1/webhooks');
            setEndpoints(res.data || []);
        } catch { /* no endpoints yet */ }
        finally { setLoading(false); }
    };

    const fetchDeliveries = async (id: string) => {
        try {
            const res = await api.get(`/v1/webhooks/${id}/events`);
            setDeliveries(prev => ({ ...prev, [id]: res.data }));
        } catch { /* silently fail */ }
    };

    const handleExpand = (id: string) => {
        if (expandedId === id) { setExpandedId(null); return; }
        setExpandedId(id);
        fetchDeliveries(id);
    };

    const handleCreate = async () => {
        if (!newUrl) return;
        setCreating(true);
        setCreateError('');
        try {
            const res = await api.post('/v1/webhooks', { url: newUrl, events: newEvents, description: newDesc });
            setNewSecret({ id: res.data.id, secret: res.data.signing_secret });
            setEndpoints(prev => [res.data, ...prev]);
            setNewUrl('');
            setNewDesc('');
            setNewEvents(['*']);
            setShowCreateModal(false);
        } catch (err: any) {
            setCreateError(err?.response?.data?.error || 'Failed to register webhook');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this webhook endpoint? This cannot be undone.')) return;
        try {
            await api.delete(`/v1/webhooks/${id}`);
            setEndpoints(prev => prev.filter(e => e.id !== id));
        } catch { /* noop */ }
    };

    const openSimulator = (id: string) => {
        if (simulatorId === id) { setSimulatorId(null); return; }
        setSimulatorId(id);
        setSimEventType('account.created');
        setSimPayload(JSON.stringify(SIM_DEFAULTS['account.created'], null, 2));
        setSimPayloadError('');
        setTestResults(prev => ({ ...prev, [id]: null }));
    };

    const handleSimEventChange = (eventType: string) => {
        setSimEventType(eventType);
        setSimPayload(JSON.stringify(SIM_DEFAULTS[eventType] || {}, null, 2));
        setSimPayloadError('');
    };

    const handleTest = async (id: string) => {
        // Validate JSON payload
        let parsed: object | undefined;
        if (simPayload.trim()) {
            try { parsed = JSON.parse(simPayload); }
            catch { setSimPayloadError('Invalid JSON — fix before sending'); return; }
        }
        setSimPayloadError('');
        setTestingId(id);
        setTestResults(prev => ({ ...prev, [id]: null }));
        try {
            const res = await api.post(`/v1/webhooks/${id}/test`, {
                event_type: simEventType,
                custom_payload: parsed,
            });
            setTestResults(prev => ({ ...prev, [id]: res.data }));
            fetchDeliveries(id);
        } catch (err: any) {
            setTestResults(prev => ({ ...prev, [id]: { success: false, error: err?.response?.data?.error || 'Request failed' } }));
        } finally {
            setTestingId(null);
        }
    };

    const copyText = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const toggleEvent = (val: string) => {
        if (val === '*') { setNewEvents(['*']); return; }
        setNewEvents(prev => {
            const without = prev.filter(e => e !== '*');
            return without.includes(val) ? without.filter(e => e !== val) : [...without, val];
        });
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex font-sans selection:bg-orange-100">
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>

            <main className="flex-1 p-8 overflow-y-auto relative">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-orange-100/30 via-purple-100/10 to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>

                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <header className="mb-10">
                        <button onClick={() => navigate('/merchant/connect')} className="flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm font-bold mb-6 transition-colors">
                            <ArrowLeft className="w-4 h-4" />Back to Connect
                        </button>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-orange-600/10 rounded-xl">
                                        <Webhook className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <span className="text-xs font-black tracking-[0.3em] text-orange-600 uppercase">Real-time Events</span>
                                </div>
                                <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Webhooks</h1>
                                <p className="text-gray-500 mt-2 font-medium">Receive live notifications for Connect events in your platform.</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-orange-600/20 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Add Endpoint
                            </button>
                        </div>
                    </header>

                    {/* New signing secret banner */}
                    {newSecret && (
                        <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Shield className="w-5 h-5 text-emerald-600" />
                                        <p className="font-black text-emerald-800 text-sm">Signing Secret — Save This Now</p>
                                    </div>
                                    <p className="text-xs text-emerald-600 mb-3">This secret is shown only once. Use it to verify webhook signatures (HMAC-SHA256).</p>
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs font-mono bg-white border border-emerald-200 px-3 py-2 rounded-lg text-emerald-800 select-all">{newSecret.secret}</code>
                                        <button onClick={() => copyText(newSecret.secret, 'secret')} className="p-2 text-emerald-600 hover:text-emerald-800 transition-colors">
                                            {copiedId === 'secret' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <button onClick={() => setNewSecret(null)} className="text-emerald-400 hover:text-emerald-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Event Reference */}
                    <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-2xl">
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Connect Event Types</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {ALL_EVENTS.filter(e => e.value !== '*').map(e => (
                                <div key={e.value} className="flex items-start gap-2 p-3 bg-white rounded-xl border border-gray-100">
                                    <code className="text-[10px] text-orange-500 font-mono font-black shrink-0">{e.value}</code>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Endpoints List */}
                    {loading ? (
                        <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 text-orange-500 animate-spin" /></div>
                    ) : endpoints.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <Webhook className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="font-black text-lg mb-2">No Webhook Endpoints</p>
                            <p className="text-sm">Add an endpoint to start receiving Connect events.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {endpoints.map(ep => (
                                <div key={ep.id} className="border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
                                    <div className="p-6 flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${ep.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-black text-gray-900 text-sm truncate">{ep.url}</p>
                                                <button onClick={() => copyText(ep.url, ep.id + '-url')} className="text-gray-400 hover:text-gray-600 shrink-0">
                                                    {copiedId === ep.id + '-url' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {(ep.events || []).map(ev => (
                                                    <span key={ev} className="text-[10px] font-black bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md border border-orange-100">{ev}</span>
                                                ))}
                                                {ep.description && <span className="text-xs text-gray-400 font-medium">· {ep.description}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => openSimulator(ep.id)}
                                                className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 ${simulatorId === ep.id ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                                            >
                                                <Zap className="w-3 h-3" />
                                                Simulate
                                            </button>
                                            <button onClick={() => handleExpand(ep.id)} className="px-4 py-2 text-xs font-black bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all flex items-center gap-1.5">
                                                {expandedId === ep.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                Events
                                            </button>
                                            <button onClick={() => handleDelete(ep.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* ── Event Simulator ─────────────────────────────── */}
                                    {simulatorId === ep.id && (
                                        <div className="mx-6 mb-5 p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Zap className="w-4 h-4 text-orange-500" />
                                                <p className="text-xs font-black text-gray-700 uppercase tracking-widest">Event Simulator</p>
                                            </div>

                                            {/* Event type selector */}
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Event Type</label>
                                                <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
                                                    {ALL_EVENTS.filter(e => e.value !== '*').map(ev => (
                                                        <button
                                                            key={ev.value}
                                                            type="button"
                                                            onClick={() => handleSimEventChange(ev.value)}
                                                            className={`px-2.5 py-2 rounded-xl text-left transition-all ${simEventType === ev.value ? 'bg-orange-100 border border-orange-300 text-orange-700' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                                        >
                                                            <code className={`text-[10px] font-black leading-tight ${simEventType === ev.value ? 'text-orange-600' : 'text-gray-600'}`}>{ev.value}</code>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Payload editor */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Custom Payload (JSON)</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSimPayload(JSON.stringify(SIM_DEFAULTS[simEventType] || {}, null, 2))}
                                                        className="text-[10px] text-orange-500 hover:text-orange-700 font-bold"
                                                    >
                                                        Reset to default
                                                    </button>
                                                </div>
                                                <textarea
                                                    value={simPayload}
                                                    onChange={e => { setSimPayload(e.target.value); setSimPayloadError(''); }}
                                                    rows={6}
                                                    spellCheck={false}
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-mono text-xs text-gray-800 outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 resize-none"
                                                />
                                                {simPayloadError && (
                                                    <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{simPayloadError}</p>
                                                )}
                                            </div>

                                            {/* Send button */}
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleTest(ep.id)}
                                                    disabled={testingId === ep.id}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-lg shadow-orange-600/20 transition-all disabled:opacity-60"
                                                >
                                                    {testingId === ep.id
                                                        ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Sending...</>
                                                        : <><ChevronRight className="w-3.5 h-3.5" />Send Event</>
                                                    }
                                                </button>

                                                {/* Delivery result */}
                                                {testResults[ep.id] && (
                                                    <div className={`flex-1 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${testResults[ep.id].success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                                                        {testResults[ep.id].success
                                                            ? <><CheckCircle className="w-3.5 h-3.5" />Delivered — HTTP {testResults[ep.id].response_status}</>
                                                            : <><AlertCircle className="w-3.5 h-3.5" />{testResults[ep.id].error || 'Failed — no response'}</>
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Delivery Log */}
                                    {expandedId === ep.id && (
                                        <div className="border-t border-gray-100 p-6 bg-gray-50/50">
                                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Recent Deliveries</p>
                                            {!deliveries[ep.id] ? (
                                                <div className="flex justify-center py-4"><RefreshCw className="w-5 h-5 text-gray-400 animate-spin" /></div>
                                            ) : deliveries[ep.id].length === 0 ? (
                                                <p className="text-sm text-gray-400 text-center py-4">No deliveries yet.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {deliveries[ep.id].map(d => (
                                                        <div key={d.id} className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-100 text-xs">
                                                            <span className={`font-black px-2 py-0.5 rounded-lg ${d.response_status >= 200 && d.response_status < 300 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                                                {d.response_status || 'ERR'}
                                                            </span>
                                                            <code className="text-orange-500 font-mono font-bold">{d.event}</code>
                                                            <span className="text-gray-400 ml-auto">{new Date(d.delivered_at).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* ── Create Modal ──────────────────────────────────────────────── */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl relative">
                        <button onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-2xl font-black text-gray-900 mb-6">Register Webhook Endpoint</h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Endpoint URL</label>
                                <input
                                    type="url"
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    placeholder="https://yourapp.com/webhooks/flapapay"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all text-sm"
                                />
                                <p className="text-xs text-gray-400 mt-1">Must use HTTPS. Use localhost for development.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Description (optional)</label>
                                <input
                                    type="text"
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    placeholder="e.g. Production payout listener"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Subscribe to Events</label>
                                <div className="space-y-2 max-h-56 overflow-y-auto">
                                    {ALL_EVENTS.map(ev => (
                                        <button
                                            key={ev.value}
                                            type="button"
                                            onClick={() => toggleEvent(ev.value)}
                                            className={`w-full p-3 rounded-xl border text-left transition-all ${newEvents.includes(ev.value) ? 'bg-orange-50 border-orange-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <code className={`text-xs font-black ${newEvents.includes(ev.value) ? 'text-orange-600' : 'text-gray-600'}`}>{ev.value}</code>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{ev.desc}</p>
                                                </div>
                                                <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${newEvents.includes(ev.value) ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}></div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {createError && <p className="text-red-500 text-sm font-bold">{createError}</p>}

                            <button
                                onClick={handleCreate}
                                disabled={creating || !newUrl || newEvents.length === 0}
                                className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl shadow-xl shadow-orange-600/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {creating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                {creating ? 'Registering...' : 'Register Endpoint'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
