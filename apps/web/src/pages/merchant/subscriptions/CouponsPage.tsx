import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Tag, Plus, Trash2, ArrowLeft, Percent, DollarSign, Copy, CheckCircle } from 'lucide-react';
import { api } from '../../../lib/axios';
import { useAuth } from '../../../contexts/AuthContext';

interface Coupon {
    id: string;
    code: string;
    name: string;
    discount_type: 'percent_off' | 'amount_off';
    percent_off: number | null;
    amount_off: number | null;
    currency: string | null;
    duration: 'once' | 'repeating' | 'forever';
    duration_in_months: number | null;
    max_redemptions: number | null;
    times_redeemed: number;
    active: boolean;
    expires_at: string | null;
    created_at: string;
}

const EMPTY_FORM = {
    code: '',
    name: '',
    discount_type: 'percent_off' as 'percent_off' | 'amount_off',
    percent_off: '',
    amount_off: '',
    duration: 'once' as 'once' | 'repeating' | 'forever',
    duration_in_months: '',
    max_redemptions: '',
    expires_at: '',
};

export default function CouponsPage() {
    const navigate = useNavigate();
    const { token } = useAuth();

    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState<string | null>(null);

    const headers = { 'Authorization': 'Bearer ' + token };

    useEffect(() => { fetchCoupons(); }, [token]);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const res = await api.get('/v1/coupons', { headers });
            const data = res.data?.data || res.data || [];
            setCoupons(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch coupons', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload: any = {
                code: form.code.trim().toUpperCase(),
                name: form.name.trim() || undefined,
                discount_type: form.discount_type,
                duration: form.duration,
            };
            if (form.discount_type === 'percent_off') {
                payload.percent_off = parseFloat(form.percent_off);
            } else {
                payload.amount_off = parseFloat(form.amount_off);
                payload.currency = 'ZMW';
            }
            if (form.duration === 'repeating' && form.duration_in_months) {
                payload.duration_in_months = parseInt(form.duration_in_months);
            }
            if (form.max_redemptions) payload.max_redemptions = parseInt(form.max_redemptions);
            if (form.expires_at) payload.expires_at = new Date(form.expires_at).toISOString();

            await api.post('/v1/coupons', payload, { headers });
            setShowModal(false);
            setForm(EMPTY_FORM);
            fetchCoupons();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create coupon');
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (id: string) => {
        if (!window.confirm('Deactivate this coupon? It will no longer be redeemable.')) return;
        try {
            await api.patch(`/v1/coupons/${id}`, { active: false }, { headers });
            fetchCoupons();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to deactivate coupon');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Permanently delete this coupon?')) return;
        try {
            await api.delete(`/v1/coupons/${id}`, { headers });
            fetchCoupons();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete coupon');
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(code);
        setTimeout(() => setCopied(null), 1500);
    };

    const fmtDiscount = (c: Coupon) => {
        if (c.discount_type === 'percent_off') return `${c.percent_off}% off`;
        return `K${parseFloat(String(c.amount_off)).toLocaleString()} off`;
    };

    const fmtDuration = (c: Coupon) => {
        if (c.duration === 'once') return 'Once';
        if (c.duration === 'forever') return 'Forever';
        return `${c.duration_in_months}mo`;
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] lg:pl-72 flex flex-col font-sans relative overflow-hidden text-gray-600">
            <Sidebar isOpen={false} />
            <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />

            <main className="flex-1 p-8 lg:p-12 z-10 w-full">
                {/* Header */}
                <header className="mb-10">
                    <button onClick={() => navigate('/merchant/subscriptions')} className="flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm font-bold mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Subscriptions
                    </button>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Tag className="w-9 h-9 text-green-500" />
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Coupons</h1>
                                <p className="text-gray-500 text-sm">Discount codes for your subscribers</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setForm(EMPTY_FORM); setError(''); setShowModal(true); }}
                            className="flex items-center gap-2 bg-gray-900 hover:bg-orange-500 text-white font-black text-sm px-5 py-2.5 rounded-xl transition-all"
                        >
                            <Plus className="w-4 h-4" /> New Coupon
                        </button>
                    </div>
                </header>

                {/* Table */}
                <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400">Loading…</div>
                    ) : coupons.length === 0 ? (
                        <div className="p-12 text-center">
                            <Tag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 font-medium">No coupons yet. Create one to offer discounts.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-widest">Code</th>
                                    <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-widest">Discount</th>
                                    <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-widest">Duration</th>
                                    <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-widest">Redeemed</th>
                                    <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-widest">Expires</th>
                                    <th className="p-5" />
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map(c => (
                                    <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                        <td className="p-5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm font-black text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">{c.code}</span>
                                                <button onClick={() => copyCode(c.code)} className="text-gray-300 hover:text-orange-500 transition-colors">
                                                    {copied === c.code ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                            {c.name && <div className="text-xs text-gray-400 mt-1">{c.name}</div>}
                                        </td>
                                        <td className="p-5">
                                            <span className="flex items-center gap-1 font-black text-gray-900">
                                                {c.discount_type === 'percent_off' ? <Percent className="w-3.5 h-3.5 text-green-500" /> : <DollarSign className="w-3.5 h-3.5 text-blue-500" />}
                                                {fmtDiscount(c)}
                                            </span>
                                        </td>
                                        <td className="p-5 text-sm text-gray-600 font-medium">{fmtDuration(c)}</td>
                                        <td className="p-5">
                                            <span className="text-sm font-black text-gray-900">{c.times_redeemed}</span>
                                            {c.max_redemptions && (
                                                <span className="text-xs text-gray-400 ml-1">/ {c.max_redemptions}</span>
                                            )}
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                                                c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                            }`}>{c.active ? 'Active' : 'Inactive'}</span>
                                        </td>
                                        <td className="p-5 text-sm text-gray-400">
                                            {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2 justify-end">
                                                {c.active && (
                                                    <button
                                                        onClick={() => handleDeactivate(c.id)}
                                                        className="text-xs font-bold text-gray-400 hover:text-orange-500 transition-colors"
                                                    >
                                                        Deactivate
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>

            {/* Create Coupon Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
                        <div className="p-8 border-b border-gray-100">
                            <h2 className="text-xl font-black text-gray-900">Create Coupon</h2>
                            <p className="text-sm text-gray-500 mt-1">Discount codes applied at checkout or billing time</p>
                        </div>
                        <form onSubmit={handleCreate} className="p-8 space-y-5">
                            {error && (
                                <div className="bg-red-50 text-red-700 text-sm font-medium p-3 rounded-xl">{error}</div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Code *</label>
                                    <input
                                        value={form.code}
                                        onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        placeholder="SUMMER20"
                                        required
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Name</label>
                                    <input
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="Summer Promo"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Discount Type *</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['percent_off', 'amount_off'] as const).map(t => (
                                        <button
                                            type="button"
                                            key={t}
                                            onClick={() => setForm({ ...form, discount_type: t })}
                                            className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                                                form.discount_type === t
                                                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                        >
                                            {t === 'percent_off' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                                            {t === 'percent_off' ? 'Percentage' : 'Fixed Amount'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {form.discount_type === 'percent_off' ? (
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Percent Off *</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1" max="100" step="0.01"
                                                value={form.percent_off}
                                                onChange={e => setForm({ ...form, percent_off: e.target.value })}
                                                placeholder="20"
                                                required
                                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Amount Off (ZMW) *</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">K</span>
                                            <input
                                                type="number"
                                                min="1" step="0.01"
                                                value={form.amount_off}
                                                onChange={e => setForm({ ...form, amount_off: e.target.value })}
                                                placeholder="50"
                                                required
                                                className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Duration *</label>
                                    <select
                                        value={form.duration}
                                        onChange={e => setForm({ ...form, duration: e.target.value as any })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                    >
                                        <option value="once">Once</option>
                                        <option value="repeating">Repeating</option>
                                        <option value="forever">Forever</option>
                                    </select>
                                </div>
                            </div>

                            {form.duration === 'repeating' && (
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Months *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.duration_in_months}
                                        onChange={e => setForm({ ...form, duration_in_months: e.target.value })}
                                        placeholder="3"
                                        required
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Max Redemptions</label>
                                    <input
                                        type="number" min="1"
                                        value={form.max_redemptions}
                                        onChange={e => setForm({ ...form, max_redemptions: e.target.value })}
                                        placeholder="Unlimited"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Expires</label>
                                    <input
                                        type="date"
                                        value={form.expires_at}
                                        onChange={e => setForm({ ...form, expires_at: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-gray-900 hover:bg-orange-500 text-white font-black py-3 rounded-xl transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Creating…' : 'Create Coupon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
