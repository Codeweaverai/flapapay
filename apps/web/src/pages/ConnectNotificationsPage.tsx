import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import {
    Bell, ArrowLeft, RefreshCw, CheckCheck, Trash2,
    ShieldCheck, AlertTriangle, DollarSign, Activity,
    UserCheck, X, Circle
} from 'lucide-react';

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string | null;
    metadata: Record<string, any>;
    read: boolean;
    livemode: boolean;
    created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: React.FC<any>; color: string; bg: string; dot: string }> = {
    kyc_approved:      { icon: UserCheck,     color: 'text-emerald-600', bg: 'bg-emerald-50',  dot: 'bg-emerald-400' },
    kyc_rejected:      { icon: ShieldCheck,   color: 'text-rose-600',    bg: 'bg-rose-50',     dot: 'bg-rose-400' },
    dispute_opened:    { icon: AlertTriangle, color: 'text-amber-600',   bg: 'bg-amber-50',    dot: 'bg-amber-400' },
    payout_completed:  { icon: DollarSign,    color: 'text-blue-600',    bg: 'bg-blue-50',     dot: 'bg-blue-400' },
    risk_event:        { icon: ShieldCheck,   color: 'text-rose-600',    bg: 'bg-rose-50',     dot: 'bg-rose-500' },
    account_suspended: { icon: X,             color: 'text-gray-600',    bg: 'bg-gray-100',    dot: 'bg-gray-400' },
    default:           { icon: Bell,          color: 'text-orange-600',  bg: 'bg-orange-50',   dot: 'bg-orange-400' },
};

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function ConnectNotificationsPage() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [total, setTotal] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);
    const [selected, setSelected] = useState<Notification | null>(null);

    const isTestMode = localStorage.getItem('connect_test_mode') === 'true';

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/v1/connect/notifications', {
                params: { limit: 50, unread_only: unreadOnly ? 'true' : undefined },
                headers: { 'x-flapapay-test-mode': isTestMode ? 'true' : 'false' },
            });
            setNotifications(res.data.notifications ?? []);
            setTotal(res.data.total ?? 0);
            setUnreadCount(res.data.unread_count ?? 0);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, [unreadOnly, isTestMode]);

    useEffect(() => { load(); }, [load]);

    async function markRead(id: string) {
        try {
            await api.patch(`/v1/connect/notifications/${id}/read`, {},
                { headers: { 'x-flapapay-test-mode': isTestMode ? 'true' : 'false' } }
            );
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(c => Math.max(0, c - 1));
        } catch { /* ignore */ }
    }

    async function markAllRead() {
        setMarkingAll(true);
        try {
            await api.patch('/v1/connect/notifications/read-all', {},
                { headers: { 'x-flapapay-test-mode': isTestMode ? 'true' : 'false' } }
            );
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch { /* ignore */ }
        finally { setMarkingAll(false); }
    }

    async function deleteNotification(id: string) {
        try {
            await api.delete(`/v1/connect/notifications/${id}`,
                { headers: { 'x-flapapay-test-mode': isTestMode ? 'true' : 'false' } }
            );
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (selected?.id === id) setSelected(null);
        } catch { /* ignore */ }
    }

    function handleClick(n: Notification) {
        setSelected(n);
        if (!n.read) markRead(n.id);
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex font-sans selection:bg-orange-100">
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>

            <main className="flex-1 flex overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-pink-100/20 via-orange-100/10 to-transparent rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>

                {/* Left — Notification list */}
                <div className="w-[420px] border-r border-gray-100 flex flex-col overflow-hidden bg-white">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                        <button onClick={() => navigate('/merchant/connect')} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-xs font-bold mb-4 transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Connect
                        </button>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center relative">
                                    <Bell className="w-4 h-4 text-white" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black text-white">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h2 className="font-extrabold text-gray-900">Notifications</h2>
                                    <p className="text-xs text-gray-400">{total} total · {unreadCount} unread</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={load} className="p-2 text-gray-400 hover:text-orange-500 transition-colors">
                                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                </button>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} disabled={markingAll}
                                        className="p-2 text-gray-400 hover:text-emerald-600 transition-colors disabled:opacity-50" title="Mark all read">
                                        <CheckCheck size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
                            <button onClick={() => setUnreadOnly(false)}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${!unreadOnly ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                                All
                            </button>
                            <button onClick={() => setUnreadOnly(true)}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${unreadOnly ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-gray-400 hover:text-gray-600'}`}>
                                Unread {unreadCount > 0 && `(${unreadCount})`}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="p-4 animate-pulse flex gap-3">
                                    <div className="w-9 h-9 bg-gray-100 rounded-2xl shrink-0"></div>
                                    <div className="flex-1">
                                        <div className="h-3.5 bg-gray-100 rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))
                        ) : notifications.length === 0 ? (
                            <div className="p-10 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Bell className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-gray-400 font-medium text-sm">No notifications yet</p>
                                <p className="text-gray-300 text-xs mt-1">Events like KYC approvals and payouts will appear here</p>
                            </div>
                        ) : (
                            notifications.map(n => {
                                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.default;
                                const Icon = cfg.icon;
                                return (
                                    <button key={n.id} onClick={() => handleClick(n)}
                                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex gap-3 items-start ${selected?.id === n.id ? 'bg-orange-50 border-r-2 border-orange-500' : ''} ${!n.read ? 'bg-blue-50/30' : ''}`}>
                                        <div className={`w-9 h-9 ${cfg.bg} rounded-2xl flex items-center justify-center shrink-0 relative`}>
                                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                                            {!n.read && <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${cfg.dot} border-2 border-white`}></span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm truncate ${!n.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</p>
                                            {n.body && <p className="text-xs text-gray-400 truncate mt-0.5">{n.body}</p>}
                                            <p className="text-[10px] text-gray-300 mt-1 font-medium">{timeAgo(n.created_at)}</p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right — Detail panel */}
                <div className="flex-1 overflow-y-auto p-8 relative z-10">
                    {!selected ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-rose-50 rounded-full flex items-center justify-center">
                                <Bell className="w-10 h-10 text-rose-300" />
                            </div>
                            <p className="font-bold text-sm text-gray-400">Select a notification to read</p>
                        </div>
                    ) : (() => {
                        const cfg = TYPE_CONFIG[selected.type] || TYPE_CONFIG.default;
                        const Icon = cfg.icon;
                        return (
                            <div className="max-w-xl mx-auto">
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-4">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 ${cfg.bg} rounded-2xl flex items-center justify-center`}>
                                                <Icon className={`w-6 h-6 ${cfg.color}`} />
                                            </div>
                                            <div>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>{selected.type.replace(/_/g, ' ')}</span>
                                                <h2 className="text-xl font-extrabold text-gray-900 mt-0.5">{selected.title}</h2>
                                            </div>
                                        </div>
                                        <button onClick={() => deleteNotification(selected.id)}
                                            className="p-2.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {selected.body && (
                                        <div className="bg-gray-50 rounded-2xl p-5 mb-4 border border-gray-100">
                                            <p className="text-sm text-gray-700 leading-relaxed font-medium">{selected.body}</p>
                                        </div>
                                    )}

                                    {Object.keys(selected.metadata).length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Details</p>
                                            {Object.entries(selected.metadata).map(([k, v]) => (
                                                <div key={k} className="flex items-center justify-between py-2 border-b border-gray-50">
                                                    <span className="text-xs text-gray-500 font-medium capitalize">{k.replace(/_/g, ' ')}</span>
                                                    <span className="text-xs font-bold text-gray-900 font-mono">{String(v)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-400 mt-5 font-medium">
                                        {new Date(selected.created_at).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}
                                        {selected.read && <span className="ml-3 text-emerald-500">· Read</span>}
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => setSelected(null)}
                                        className="flex-1 py-3 bg-white border border-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 shadow-sm transition-all active:scale-95">
                                        Close
                                    </button>
                                    <button onClick={() => deleteNotification(selected.id)}
                                        className="flex-1 py-3 bg-rose-50 border border-rose-100 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 shadow-sm transition-all active:scale-95">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </main>
        </div>
    );
}
