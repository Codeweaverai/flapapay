import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import {
    Activity, ArrowLeft, RefreshCw, CheckCircle, XCircle,
    RotateCcw, ChevronDown, ChevronRight, Filter
} from 'lucide-react';

interface Delivery {
    id: string;
    endpoint_id: string;
    endpoint_url: string;
    endpoint_name: string | null;
    event: string;
    payload: string;
    response_status: number | null;
    response_body: string | null;
    delivered_at: string;
}

interface Endpoint {
    id: string;
    url: string;
    description: string | null;
}

function statusColor(code: number | null) {
    if (code == null || code === 0) return 'bg-gray-100 text-gray-500';
    if (code >= 200 && code < 300) return 'bg-emerald-50 text-emerald-700';
    if (code >= 400) return 'bg-red-50 text-red-600';
    return 'bg-yellow-50 text-yellow-700';
}

function isSuccess(code: number | null) {
    return code != null && code >= 200 && code < 300;
}

export default function WebhookDeliveriesPage() {
    const navigate = useNavigate();
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [endpoints, setEndpoints] = useState<Endpoint[]>([]);

    const [eventFilter, setEventFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [endpointFilter, setEndpointFilter] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 30;

    const [expanded, setExpanded] = useState<string | null>(null);
    const [retrying, setRetrying] = useState<string | null>(null);
    const [retryResults, setRetryResults] = useState<Record<string, { success: boolean; status: number }>>({});

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = {
                limit: PAGE_SIZE,
                offset: (page - 1) * PAGE_SIZE,
            };
            if (eventFilter) params.event_type = eventFilter;
            if (statusFilter) params.status = statusFilter;
            if (endpointFilter) params.endpoint_id = endpointFilter;
            const res = await api.get('/v1/webhooks/deliveries', { params });
            setDeliveries(res.data.deliveries ?? []);
            setTotal(res.data.total ?? 0);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, [eventFilter, statusFilter, endpointFilter, page]);

    const loadEndpoints = useCallback(async () => {
        try {
            const res = await api.get('/v1/webhooks/endpoints');
            setEndpoints(res.data.endpoints ?? []);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { loadEndpoints(); }, [loadEndpoints]);
    useEffect(() => { load(); }, [load]);

    async function handleRetry(delivery: Delivery) {
        setRetrying(delivery.id);
        try {
            const res = await api.post(`/v1/webhooks/deliveries/${delivery.id}/retry`, {});
            setRetryResults(prev => ({ ...prev, [delivery.id]: { success: res.data.success, status: res.data.response_status } }));
            await load();
        } catch {
            setRetryResults(prev => ({ ...prev, [delivery.id]: { success: false, status: 0 } }));
        } finally {
            setRetrying(null);
        }
    }

    function formatPayload(raw: string) {
        try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; }
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex font-sans selection:bg-orange-100">
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>
            <main className="flex-1 overflow-y-auto relative">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100/20 via-purple-100/10 to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>
                <div className="max-w-5xl mx-auto px-6 py-8 relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-orange-500 hover:border-orange-200 shadow-sm transition-all active:scale-95">
                            <ArrowLeft size={18} />
                        </button>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                                    <Activity className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase">Event Delivery Log</span>
                            </div>
                            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Webhook Deliveries</h1>
                            <p className="text-sm text-gray-500">Delivery log for all webhook events — retry failed deliveries inline</p>
                        </div>
                        <button onClick={load} className="p-2.5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-orange-500 shadow-sm transition-all active:scale-95">
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mb-5 items-end">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Event Type</label>
                            <input
                                type="text"
                                value={eventFilter}
                                onChange={e => { setEventFilter(e.target.value); setPage(1); }}
                                placeholder="e.g. charge.succeeded"
                                className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                            <select
                                value={statusFilter}
                                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                            >
                                <option value="">All</option>
                                <option value="success">Success (2xx)</option>
                                <option value="failed">Failed (4xx/5xx)</option>
                            </select>
                        </div>
                        {endpoints.length > 0 && (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Endpoint</label>
                                <select
                                    value={endpointFilter}
                                    onChange={e => { setEndpointFilter(e.target.value); setPage(1); }}
                                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 max-w-xs"
                                >
                                    <option value="">All Endpoints</option>
                                    {endpoints.map(ep => (
                                        <option key={ep.id} value={ep.id}>{ep.description || ep.url}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Deliveries list */}
                    {loading ? (
                        <div className="flex items-center justify-center h-48 text-gray-400">
                            <RefreshCw size={20} className="animate-spin mr-2" /> Loading…
                        </div>
                    ) : deliveries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <Activity size={36} className="mb-3 opacity-20" />
                            <p className="text-sm">No webhook deliveries found</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50">
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-8" />
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Event</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Endpoint</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Delivered</th>
                                            <th className="px-5 py-3 w-24" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deliveries.map(d => {
                                            const success = isSuccess(d.response_status);
                                            const isExpanded = expanded === d.id;
                                            const retryResult = retryResults[d.id];
                                            return (
                                                <React.Fragment key={d.id}>
                                                    <tr
                                                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                                                        onClick={() => setExpanded(isExpanded ? null : d.id)}
                                                    >
                                                        <td className="px-3 py-3 text-gray-400">
                                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded-lg text-gray-700">
                                                                {d.event}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <div className="text-xs text-gray-500 truncate max-w-[180px]" title={d.endpoint_url}>
                                                                {d.endpoint_name || d.endpoint_url}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <div className="flex items-center gap-1.5">
                                                                {success
                                                                    ? <CheckCircle size={13} className="text-emerald-500" />
                                                                    : <XCircle size={13} className="text-red-400" />
                                                                }
                                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(d.response_status)}`}>
                                                                    {d.response_status ?? 'N/A'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                                                            {new Date(d.delivered_at).toLocaleString()}
                                                        </td>
                                                        <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                                                            {!success && (
                                                                <button
                                                                    onClick={() => handleRetry(d)}
                                                                    disabled={retrying === d.id}
                                                                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                                                    title="Retry delivery"
                                                                >
                                                                    {retrying === d.id
                                                                        ? <RefreshCw size={11} className="animate-spin" />
                                                                        : <RotateCcw size={11} />
                                                                    }
                                                                    {retrying === d.id ? 'Retrying…' : 'Retry'}
                                                                </button>
                                                            )}
                                                            {retryResult && (
                                                                <span className={`text-xs font-semibold ml-1 ${retryResult.success ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                    {retryResult.success ? `✓ ${retryResult.status}` : `✗ ${retryResult.status || 'failed'}`}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr className="bg-gray-50 border-b border-gray-100">
                                                            <td colSpan={6} className="px-5 py-4">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Request Payload</p>
                                                                        <pre className="bg-gray-900 text-green-300 text-xs p-3 rounded-xl overflow-x-auto max-h-48 font-mono leading-relaxed">
                                                                            {formatPayload(d.payload)}
                                                                        </pre>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Response Body</p>
                                                                        <pre className="bg-gray-900 text-gray-300 text-xs p-3 rounded-xl overflow-x-auto max-h-48 font-mono leading-relaxed">
                                                                            {d.response_body || '(empty)'}
                                                                        </pre>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-3 flex gap-4 text-xs text-gray-400">
                                                                    <span>Delivery ID: <span className="font-mono">{d.id}</span></span>
                                                                    <span>Endpoint ID: <span className="font-mono">{d.endpoint_id}</span></span>
                                                                    <span>URL: <span className="font-mono">{d.endpoint_url}</span></span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                                <span>{total} total deliveries</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                                    >
                                        ← Prev
                                    </button>
                                    <span className="px-3 py-1.5">Page {page}</span>
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={deliveries.length < PAGE_SIZE}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
