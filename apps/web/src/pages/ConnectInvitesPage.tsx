import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import { Link2, Plus, Copy, Trash2, CheckCircle, Clock, XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

type InviteStatus = 'pending' | 'used' | 'revoked' | 'expired';

interface Invite {
    id: string;
    token: string;
    email: string | null;
    business_name: string | null;
    status: InviteStatus;
    used_by: string | null;
    used_at: string | null;
    expires_at: string;
    created_at: string;
    invite_url?: string;
}

const STATUS_CFG: Record<InviteStatus, { label: string; color: string; Icon: React.FC<any> }> = {
    pending: { label: 'Pending',  color: 'bg-yellow-50 text-yellow-700 border-yellow-200', Icon: Clock },
    used:    { label: 'Used',     color: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle },
    revoked: { label: 'Revoked',  color: 'bg-red-50 text-red-600 border-red-200', Icon: XCircle },
    expired: { label: 'Expired',  color: 'bg-gray-100 text-gray-400 border-gray-200', Icon: XCircle },
};

function StatusBadge({ status }: { status: InviteStatus }) {
    const cfg = STATUS_CFG[status] ?? STATUS_CFG.expired;
    const { Icon } = cfg;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
            <Icon size={11} />
            {cfg.label}
        </span>
    );
}

export default function ConnectInvitesPage() {
    const navigate = useNavigate();
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [createEmail, setCreateEmail] = useState('');
    const [createBizName, setCreateBizName] = useState('');
    const [createExpiry, setCreateExpiry] = useState('7');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/v1/connect/invites');
            setInvites(res.data.invites ?? []);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setCreating(true);
        setCreateError('');
        try {
            await api.post('/v1/connect/invites', {
                email: createEmail || undefined,
                business_name: createBizName || undefined,
                expires_in_days: parseInt(createExpiry) || 7,
            });
            setCreateEmail('');
            setCreateBizName('');
            setCreateExpiry('7');
            setShowCreate(false);
            await load();
        } catch (err: any) {
            setCreateError(err.response?.data?.error || 'Failed to create invite');
        } finally {
            setCreating(false);
        }
    }

    async function handleRevoke(id: string) {
        if (!confirm('Revoke this invite link? It will no longer be usable.')) return;
        try {
            await api.delete(`/v1/connect/invites/${id}`);
            setInvites(prev => prev.map(i => i.id === id ? { ...i, status: 'revoked' } : i));
        } catch {
            // ignore
        }
    }

    function copyLink(invite: Invite) {
        const url = invite.invite_url || `${window.location.origin}/connect/invite/${invite.token}`;
        navigator.clipboard.writeText(url);
        setCopiedId(invite.id);
        setTimeout(() => setCopiedId(null), 2000);
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex font-sans selection:bg-orange-100">
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>
            <main className="flex-1 overflow-y-auto relative">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-orange-100/30 via-amber-100/10 to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>
                <div className="max-w-4xl mx-auto px-6 py-8 relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-orange-500 shadow-sm transition-all active:scale-95">
                            <ArrowLeft size={18} />
                        </button>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                                    <Link2 className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-[10px] font-bold tracking-widest text-orange-500 uppercase">Onboarding</span>
                            </div>
                            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Sub-Merchant Invites</h1>
                            <p className="text-sm text-gray-500">Generate invite links for sub-merchants to self-register</p>
                        </div>
                        <button onClick={load} className="p-2.5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-orange-500 shadow-sm transition-all active:scale-95">
                            <RefreshCw size={16} />
                        </button>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-2xl text-sm font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/25 hover:-translate-y-0.5 active:scale-95 transition-all"
                        >
                            <Plus size={15} />
                            New Invite
                        </button>
                    </div>

                    {/* Create modal */}
                    {showCreate && (
                        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Create Invite Link</h2>
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pre-fill Email (optional)</label>
                                        <input
                                            type="email"
                                            value={createEmail}
                                            onChange={e => setCreateEmail(e.target.value)}
                                            placeholder="sub-merchant@example.com"
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pre-fill Business Name (optional)</label>
                                        <input
                                            type="text"
                                            value={createBizName}
                                            onChange={e => setCreateBizName(e.target.value)}
                                            placeholder="Acme Corp"
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Expires In (days)</label>
                                        <select
                                            value={createExpiry}
                                            onChange={e => setCreateExpiry(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                        >
                                            <option value="1">1 day</option>
                                            <option value="3">3 days</option>
                                            <option value="7">7 days</option>
                                            <option value="14">14 days</option>
                                            <option value="30">30 days</option>
                                        </select>
                                    </div>
                                    {createError && <p className="text-sm text-red-500">{createError}</p>}
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => { setShowCreate(false); setCreateError(''); }}
                                            className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={creating}
                                            className="flex-1 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
                                        >
                                            {creating ? 'Creating…' : 'Create Link'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Invites table */}
                    {loading ? (
                        <div className="flex items-center justify-center h-48 text-gray-400">
                            <RefreshCw size={20} className="animate-spin mr-2" /> Loading…
                        </div>
                    ) : invites.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <Link2 size={36} className="mb-3 opacity-30" />
                            <p className="text-sm">No invite links yet</p>
                            <button
                                onClick={() => setShowCreate(true)}
                                className="mt-3 text-sm text-orange-500 hover:underline"
                            >
                                Create your first invite
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50">
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Business / Email</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expires</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                                        <th className="px-5 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {invites.map(inv => (
                                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="font-medium text-gray-800">{inv.business_name || '—'}</div>
                                                <div className="text-xs text-gray-400">{inv.email || 'No email pre-filled'}</div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <StatusBadge status={inv.status} />
                                                {inv.used_at && (
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        Used {new Date(inv.used_at).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-500 text-xs">
                                                {new Date(inv.expires_at) < new Date()
                                                    ? <span className="text-red-400">Expired</span>
                                                    : new Date(inv.expires_at).toLocaleDateString()
                                                }
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-400 text-xs">
                                                {new Date(inv.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2 justify-end">
                                                    {inv.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => copyLink(inv)}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                                                    copiedId === inv.id
                                                                        ? 'bg-emerald-50 text-emerald-600'
                                                                        : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                                                }`}
                                                            >
                                                                {copiedId === inv.id ? (
                                                                    <><CheckCircle size={12} /> Copied!</>
                                                                ) : (
                                                                    <><Copy size={12} /> Copy Link</>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleRevoke(inv.id)}
                                                                className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                                                                title="Revoke invite"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
