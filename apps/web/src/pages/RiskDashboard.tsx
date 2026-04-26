import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import {
    Shield, Plus, Trash2, RefreshCw, AlertTriangle, CheckCircle,
    XCircle, Clock, ArrowLeft, ToggleLeft, ToggleRight, Edit2, X, TrendingUp
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type RuleType = 'max_transaction_amount' | 'velocity_count' | 'velocity_amount' | 'block_country' | 'require_kyc';
type Operator = 'block' | 'flag' | 'review';
type EventStatus = 'open' | 'reviewed' | 'cleared' | 'confirmed_fraud';

interface RiskRule {
    id: string;
    name: string;
    rule_type: RuleType;
    operator: Operator;
    parameters: Record<string, any>;
    applies_to: string;
    enabled: boolean;
    created_at: string;
}

interface RiskEvent {
    id: string;
    rule_id: string | null;
    rule_name: string | null;
    charge_id: string | null;
    account_id: string | null;
    business_name: string | null;
    event_type: string;
    operator: Operator;
    status: EventStatus;
    risk_score: number | null;
    description: string | null;
    metadata: Record<string, any>;
    reviewed_at: string | null;
    review_note: string | null;
    created_at: string;
}

interface RiskSummary {
    open_events: number;
    total_blocked: number;
    events_last_24h: number;
    active_rules: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RULE_TYPE_META: Record<RuleType, { label: string; desc: string; paramFields: Array<{ key: string; label: string; type: 'number' | 'text' | 'array' }> }> = {
    max_transaction_amount: {
        label: 'Max Transaction Amount',
        desc: 'Block or flag charges above a threshold',
        paramFields: [{ key: 'amount', label: 'Max Amount', type: 'number' }],
    },
    velocity_count: {
        label: 'Velocity — Count',
        desc: 'Trigger if N+ charges occur in a time window',
        paramFields: [
            { key: 'count', label: 'Max Charges', type: 'number' },
            { key: 'window_minutes', label: 'Window (minutes)', type: 'number' },
        ],
    },
    velocity_amount: {
        label: 'Velocity — Volume',
        desc: 'Trigger if cumulative charge volume exceeds threshold in a window',
        paramFields: [
            { key: 'amount', label: 'Max Volume (ZMW)', type: 'number' },
            { key: 'window_minutes', label: 'Window (minutes)', type: 'number' },
        ],
    },
    block_country: {
        label: 'Block Country',
        desc: 'Block charges from specified country codes',
        paramFields: [{ key: 'countries', label: 'Country Codes (comma-separated)', type: 'array' }],
    },
    require_kyc: {
        label: 'Require KYC Verification',
        desc: 'Block charges from sub-merchants who have not completed KYC',
        paramFields: [],
    },
};

const OPERATOR_CFG: Record<Operator, { label: string; color: string }> = {
    block:  { label: 'Block',  color: 'bg-red-50 text-red-700 border-red-200' },
    flag:   { label: 'Flag',   color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    review: { label: 'Review', color: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const EVENT_STATUS_CFG: Record<EventStatus, { label: string; color: string; Icon: React.FC<any> }> = {
    open:            { label: 'Open',            color: 'bg-red-50 text-red-600 border-red-200',       Icon: AlertTriangle },
    reviewed:        { label: 'Reviewed',        color: 'bg-blue-50 text-blue-700 border-blue-200',    Icon: Clock },
    cleared:         { label: 'Cleared',         color: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle },
    confirmed_fraud: { label: 'Confirmed Fraud', color: 'bg-gray-800 text-white border-gray-800',       Icon: XCircle },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RiskDashboard() {
    const navigate = useNavigate();
    const [tab, setTab] = useState<'events' | 'rules'>('events');
    const [summary, setSummary] = useState<RiskSummary | null>(null);
    const [rules, setRules] = useState<RiskRule[]>([]);
    const [events, setEvents] = useState<RiskEvent[]>([]);
    const [eventsTotal, setEventsTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [eventStatusFilter, setEventStatusFilter] = useState<string>('open');

    // Rule editor state
    const [showRuleEditor, setShowRuleEditor] = useState(false);
    const [editingRule, setEditingRule] = useState<Partial<RiskRule> | null>(null);
    const [ruleParams, setRuleParams] = useState<Record<string, string>>({});
    const [savingRule, setSavingRule] = useState(false);
    const [ruleError, setRuleError] = useState('');

    // Event review state
    const [reviewTarget, setReviewTarget] = useState<RiskEvent | null>(null);
    const [reviewStatus, setReviewStatus] = useState<EventStatus>('reviewed');
    const [reviewNote, setReviewNote] = useState('');
    const [reviewing, setReviewing] = useState(false);

    const loadSummary = useCallback(async () => {
        try {
            const r = await api.get('/v1/connect/risk/summary');
            setSummary(r.data);
        } catch { /* ignore */ }
    }, []);

    const loadRules = useCallback(async () => {
        try {
            const r = await api.get('/v1/connect/risk/rules');
            setRules(r.data.rules ?? []);
        } catch { /* ignore */ }
    }, []);

    const loadEvents = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get('/v1/connect/risk/events', { params: { status: eventStatusFilter, limit: 50 } });
            setEvents(r.data.events ?? []);
            setEventsTotal(r.data.total ?? 0);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, [eventStatusFilter]);

    useEffect(() => {
        loadSummary();
        loadRules();
    }, [loadSummary, loadRules]);

    useEffect(() => { loadEvents(); }, [loadEvents]);

    // ── Rule editor ────────────────────────────────────────────────────────────
    function openRuleEditor(rule?: RiskRule) {
        if (rule) {
            setEditingRule({ ...rule });
            const p: Record<string, string> = {};
            const meta = RULE_TYPE_META[rule.rule_type];
            meta?.paramFields.forEach(f => {
                const val = rule.parameters[f.key];
                p[f.key] = Array.isArray(val) ? val.join(', ') : String(val ?? '');
            });
            setRuleParams(p);
        } else {
            setEditingRule({ rule_type: 'max_transaction_amount', operator: 'block', applies_to: 'all', enabled: true });
            setRuleParams({});
        }
        setRuleError('');
        setShowRuleEditor(true);
    }

    async function handleSaveRule() {
        if (!editingRule?.name || !editingRule.rule_type) { setRuleError('Name and rule type are required'); return; }
        setSavingRule(true);
        setRuleError('');
        try {
            const meta = RULE_TYPE_META[editingRule.rule_type as RuleType];
            const parameters: Record<string, any> = {};
            meta?.paramFields.forEach(f => {
                if (f.type === 'array') {
                    parameters[f.key] = (ruleParams[f.key] || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
                } else if (f.type === 'number') {
                    parameters[f.key] = parseFloat(ruleParams[f.key] || '0');
                } else {
                    parameters[f.key] = ruleParams[f.key];
                }
            });
            if (editingRule.id) {
                await api.patch(`/v1/connect/risk/rules/${editingRule.id}`, { ...editingRule, parameters });
            } else {
                await api.post('/v1/connect/risk/rules', { ...editingRule, parameters });
            }
            setShowRuleEditor(false);
            await loadRules();
            await loadSummary();
        } catch (err: any) {
            setRuleError(err.response?.data?.error || 'Failed to save rule');
        } finally {
            setSavingRule(false); }
    }

    async function toggleRule(rule: RiskRule) {
        try {
            await api.patch(`/v1/connect/risk/rules/${rule.id}`, { enabled: !rule.enabled });
            setRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r));
        } catch { /* ignore */ }
    }

    async function deleteRule(id: string) {
        if (!confirm('Delete this risk rule?')) return;
        try {
            await api.delete(`/v1/connect/risk/rules/${id}`);
            await loadRules();
            await loadSummary();
        } catch { /* ignore */ }
    }

    // ── Event review ────────────────────────────────────────────────────────────
    async function handleReview() {
        if (!reviewTarget) return;
        setReviewing(true);
        try {
            await api.patch(`/v1/connect/risk/events/${reviewTarget.id}`, { status: reviewStatus, review_note: reviewNote || undefined });
            setReviewTarget(null);
            setReviewNote('');
            await loadEvents();
            await loadSummary();
        } catch { /* ignore */ }
        finally { setReviewing(false); }
    }

    const currentRuleTypeMeta = editingRule?.rule_type ? RULE_TYPE_META[editingRule.rule_type as RuleType] : null;

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex font-sans selection:bg-orange-100">
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>
            <main className="flex-1 overflow-y-auto relative">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-rose-100/20 via-amber-100/10 to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>
                <div className="max-w-5xl mx-auto px-6 py-8 relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-orange-500 hover:border-orange-200 shadow-sm transition-all active:scale-95">
                            <ArrowLeft size={18} />
                        </button>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center">
                                    <Shield className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-[10px] font-bold tracking-widest text-rose-500 uppercase">Fraud Prevention</span>
                            </div>
                            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Risk &amp; Fraud Engine</h1>
                            <p className="text-sm text-gray-500">Configurable rules to detect and block suspicious transactions</p>
                        </div>
                        <button onClick={() => { loadSummary(); loadRules(); loadEvents(); }} className="p-2.5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-orange-500 shadow-sm transition-all active:scale-95">
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    {/* KPI cards */}
                    {summary && (
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            {[
                                { label: 'Open Events',       value: summary.open_events,       color: 'text-rose-600',    bg: 'bg-rose-50', border: 'hover:border-rose-200' },
                                { label: 'Events (24h)',      value: summary.events_last_24h,   color: 'text-amber-600', bg: 'bg-amber-50', border: 'hover:border-amber-200' },
                                { label: 'Total Blocked',     value: summary.total_blocked,     color: 'text-gray-900',   bg: 'bg-gray-100', border: 'hover:border-gray-300' },
                                { label: 'Active Rules',      value: summary.active_rules,      color: 'text-emerald-700',bg: 'bg-emerald-50', border: 'hover:border-emerald-200' },
                            ].map(kpi => (
                                <div key={kpi.label} className={`bg-white rounded-3xl border border-gray-100 shadow-sm p-6 transition-all ${kpi.border}`}>
                                    <div className={`w-9 h-9 ${kpi.bg} rounded-2xl flex items-center justify-center mb-3`}>
                                        <Shield className={`w-4 h-4 ${kpi.color}`} />
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{kpi.label}</p>
                                    <p className={`text-3xl font-extrabold tracking-tight ${kpi.color}`}>{kpi.value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-1 bg-white border border-gray-100 p-1 rounded-2xl mb-6 w-fit shadow-sm">
                        {(['events', 'rules'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${tab === t ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                            >
                                {t === 'events' ? `Risk Events${summary?.open_events ? ` (${summary.open_events})` : ''}` : 'Rules'}
                            </button>
                        ))}
                    </div>

                    {/* ── Events tab ── */}
                    {tab === 'events' && (
                        <div>
                            {/* Status filter */}
                            <div className="flex gap-2 mb-4">
                                {(['open', 'reviewed', 'cleared', 'confirmed_fraud', 'all'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setEventStatusFilter(s)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors capitalize ${eventStatusFilter === s ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                    >
                                        {s.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>

                            {/* Review modal */}
                            {reviewTarget && (
                                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-lg font-bold text-gray-900">Review Risk Event</h2>
                                            <button onClick={() => setReviewTarget(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
                                            <p className="font-semibold text-gray-800">{reviewTarget.description}</p>
                                            {reviewTarget.charge_id && <p className="text-xs text-gray-400 mt-1">Charge: {reviewTarget.charge_id}</p>}
                                            {reviewTarget.business_name && <p className="text-xs text-gray-400">Account: {reviewTarget.business_name}</p>}
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Mark as</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(['reviewed', 'cleared', 'confirmed_fraud'] as const).map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => setReviewStatus(s)}
                                                        className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${reviewStatus === s ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                                    >
                                                        {s.replace('_', ' ')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Review Note (optional)</label>
                                            <textarea
                                                rows={2}
                                                value={reviewNote}
                                                onChange={e => setReviewNote(e.target.value)}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => setReviewTarget(null)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
                                            <button onClick={handleReview} disabled={reviewing} className="flex-1 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">
                                                {reviewing ? 'Saving…' : 'Save Review'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {loading ? (
                                <div className="flex items-center justify-center h-40 text-gray-400"><RefreshCw size={18} className="animate-spin mr-2" /> Loading…</div>
                            ) : events.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                    <Shield size={36} className="mb-3 opacity-20" />
                                    <p className="text-sm">No {eventStatusFilter !== 'all' ? eventStatusFilter : ''} risk events</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {events.map(ev => {
                                        const cfg = EVENT_STATUS_CFG[ev.status];
                                        const opCfg = OPERATOR_CFG[ev.operator];
                                        const { Icon } = cfg;
                                        return (
                                            <div key={ev.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5">
                                                        <Icon size={16} className={ev.operator === 'block' ? 'text-red-500' : 'text-yellow-500'} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${opCfg.color}`}>
                                                                {opCfg.label}
                                                            </span>
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
                                                                <Icon size={10} />{cfg.label}
                                                            </span>
                                                            {ev.risk_score != null && (
                                                                <span className="text-xs text-gray-400">Score: <span className="font-bold text-gray-700">{ev.risk_score}</span>/100</span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-800">{ev.description}</p>
                                                        <div className="flex gap-3 mt-1 text-xs text-gray-400">
                                                            {ev.charge_id && <span>Charge: {ev.charge_id.slice(0, 16)}…</span>}
                                                            {ev.business_name && <span>Account: {ev.business_name}</span>}
                                                            {ev.rule_name && <span>Rule: {ev.rule_name}</span>}
                                                            <span>{new Date(ev.created_at).toLocaleString()}</span>
                                                        </div>
                                                        {ev.review_note && <p className="text-xs text-gray-400 italic mt-1">"{ev.review_note}"</p>}
                                                    </div>
                                                    {ev.status === 'open' && (
                                                        <button
                                                            onClick={() => { setReviewTarget(ev); setReviewStatus('reviewed'); setReviewNote(''); }}
                                                            className="shrink-0 px-3 py-1.5 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 rounded-xl text-xs font-semibold text-gray-600 transition-colors"
                                                        >
                                                            Review
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <p className="text-center text-xs text-gray-400">{eventsTotal} total event{eventsTotal !== 1 ? 's' : ''}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Rules tab ── */}
                    {tab === 'rules' && (
                        <div>
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={() => openRuleEditor()}
                                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
                                >
                                    <Plus size={15} /> Add Rule
                                </button>
                            </div>

                            {/* Rule editor modal */}
                            {showRuleEditor && editingRule && (
                                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                                        <div className="flex items-center justify-between mb-5">
                                            <h2 className="text-lg font-bold text-gray-900">{editingRule.id ? 'Edit Rule' : 'Add Risk Rule'}</h2>
                                            <button onClick={() => setShowRuleEditor(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                                                <input
                                                    type="text"
                                                    value={editingRule.name || ''}
                                                    onChange={e => setEditingRule(r => ({ ...r, name: e.target.value }))}
                                                    placeholder="e.g. Block high-value transactions"
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Type</label>
                                                <select
                                                    value={editingRule.rule_type || ''}
                                                    onChange={e => { setEditingRule(r => ({ ...r, rule_type: e.target.value as RuleType })); setRuleParams({}); }}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                    disabled={!!editingRule.id}
                                                >
                                                    {Object.entries(RULE_TYPE_META).map(([k, v]) => (
                                                        <option key={k} value={k}>{v.label}</option>
                                                    ))}
                                                </select>
                                                {currentRuleTypeMeta && <p className="text-xs text-gray-400 mt-1">{currentRuleTypeMeta.desc}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                                                <div className="flex gap-2">
                                                    {(['block', 'flag', 'review'] as const).map(op => (
                                                        <button
                                                            key={op}
                                                            onClick={() => setEditingRule(r => ({ ...r, operator: op }))}
                                                            className={`flex-1 py-2 rounded-xl text-xs font-semibold border capitalize transition-colors ${editingRule.operator === op ? `${OPERATOR_CFG[op].color} border-current` : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                                        >
                                                            {op}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            {currentRuleTypeMeta?.paramFields.map(f => (
                                                <div key={f.key}>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                                                    <input
                                                        type={f.type === 'number' ? 'number' : 'text'}
                                                        value={ruleParams[f.key] || ''}
                                                        onChange={e => setRuleParams(p => ({ ...p, [f.key]: e.target.value }))}
                                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                        placeholder={f.type === 'array' ? 'NG, ZW, KE' : ''}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        {ruleError && <p className="text-sm text-red-500 mt-3">{ruleError}</p>}
                                        <div className="flex gap-3 mt-5">
                                            <button onClick={() => setShowRuleEditor(false)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
                                            <button onClick={handleSaveRule} disabled={savingRule} className="flex-1 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">
                                                {savingRule ? 'Saving…' : editingRule.id ? 'Update Rule' : 'Create Rule'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {rules.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
                                    <Shield size={36} className="mb-3 opacity-20" />
                                    <p className="text-sm">No risk rules configured</p>
                                    <button onClick={() => openRuleEditor()} className="mt-2 text-sm text-orange-500 hover:underline">Add your first rule</button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {rules.map(rule => {
                                        const meta = RULE_TYPE_META[rule.rule_type];
                                        const opCfg = OPERATOR_CFG[rule.operator];
                                        return (
                                            <div key={rule.id} className={`bg-white rounded-2xl border shadow-sm px-5 py-4 transition-opacity ${rule.enabled ? 'border-gray-100' : 'border-gray-100 opacity-50'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-semibold text-gray-800">{rule.name}</span>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${opCfg.color}`}>{opCfg.label}</span>
                                                            {!rule.enabled && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-400">Disabled</span>}
                                                        </div>
                                                        <p className="text-xs text-gray-400">{meta?.label}</p>
                                                        <div className="flex gap-2 mt-1 flex-wrap">
                                                            {Object.entries(rule.parameters).map(([k, v]) => (
                                                                <span key={k} className="text-xs bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg text-gray-600">
                                                                    {k}: <span className="font-semibold">{Array.isArray(v) ? v.join(', ') : String(v)}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button onClick={() => toggleRule(rule)} className="text-gray-300 hover:text-orange-500 transition-colors" title={rule.enabled ? 'Disable rule' : 'Enable rule'}>
                                                            {rule.enabled ? <ToggleRight size={22} className="text-orange-500" /> : <ToggleLeft size={22} />}
                                                        </button>
                                                        <button onClick={() => openRuleEditor(rule)} className="p-1.5 text-gray-300 hover:text-blue-500 transition-colors" title="Edit"><Edit2 size={14} /></button>
                                                        <button onClick={() => deleteRule(rule.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors" title="Delete"><Trash2 size={14} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
