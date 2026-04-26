import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/axios';
import { RefreshCw, FileText, CreditCard, XCircle, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';

interface PortalData {
    customer: any;
    subscriptions: any[];
    merchant: any;
}

export default function SubscriptionPortal() {
    const { token } = useParams<{ token: string }>();

    const [data, setData] = useState<PortalData | null>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tab, setTab] = useState<'overview' | 'invoices' | 'payment'>('overview');
    const [phone, setPhone] = useState('');
    const [provider, setProvider] = useState('MTN');
    const [pmSaving, setPmSaving] = useState(false);
    const [pmSaved, setPmSaved] = useState(false);
    const [canceling, setCanceling] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        Promise.all([
            api.get(`/v1/portal/${token}`),
            api.get(`/v1/portal/${token}/invoices`),
        ])
            .then(([portalRes, invRes]) => {
                const d = portalRes.data?.data || portalRes.data;
                setData(d);
                if (d?.customer?.phone) setPhone(d.customer.phone);
                if (d?.customer?.mobile_money_provider) setProvider(d.customer.mobile_money_provider);
                const invs = invRes.data?.data || invRes.data || [];
                setInvoices(Array.isArray(invs) ? invs : []);
            })
            .catch(err => {
                const msg = err.response?.data?.error || 'Invalid or expired portal link.';
                setError(msg);
            })
            .finally(() => setLoading(false));
    }, [token]);

    const handleUpdatePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setPmSaving(true);
        setPmSaved(false);
        try {
            await api.put(`/v1/portal/${token}/payment-method`, { phone, mobile_money_provider: provider });
            setPmSaved(true);
            setTimeout(() => setPmSaved(false), 3000);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to update payment method');
        } finally {
            setPmSaving(false);
        }
    };

    const handleCancel = async (subId: string) => {
        if (!window.confirm('Cancel this subscription? This cannot be undone.')) return;
        setCanceling(subId);
        try {
            await api.post(`/v1/portal/${token}/subscriptions/${subId}/cancel`, {});
            // refresh
            const res = await api.get(`/v1/portal/${token}`);
            setData(res.data?.data || res.data);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to cancel subscription');
        } finally {
            setCanceling(null);
        }
    };

    const statusColor = (s: string) => {
        if (s === 'active') return 'bg-green-100 text-green-700';
        if (s === 'past_due') return 'bg-orange-100 text-orange-700';
        if (s === 'canceled') return 'bg-gray-100 text-gray-500';
        if (s === 'trialing') return 'bg-blue-100 text-blue-700';
        return 'bg-gray-100 text-gray-600';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h1 className="text-2xl font-black text-white mb-2">Link Invalid or Expired</h1>
                <p className="text-gray-400">{error}</p>
                <p className="text-gray-600 text-sm mt-4">Please contact the merchant for a new portal link.</p>
            </div>
        );
    }

    if (!data) return null;

    const { customer, subscriptions, merchant } = data;

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans">
            {/* Header */}
            <div className="bg-gray-900 border-b border-gray-800">
                <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div>
                        <div className="text-orange-500 font-black text-lg tracking-tight">FlapaPay</div>
                        <div className="text-gray-400 text-xs mt-0.5">Customer Portal</div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-bold text-white">{customer?.name || customer?.email}</div>
                        {customer?.name && <div className="text-xs text-gray-400">{customer.email}</div>}
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 py-8">
                {/* Merchant banner */}
                {merchant?.business_name && (
                    <div className="bg-gray-900 rounded-2xl p-5 mb-6 border border-gray-800">
                        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Your subscriptions with</div>
                        <div className="text-lg font-black text-white">{merchant.business_name}</div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-900 rounded-xl p-1 mb-6">
                    {([
                        { key: 'overview', label: 'Subscriptions', icon: <RefreshCw className="w-4 h-4" /> },
                        { key: 'invoices', label: 'Invoices', icon: <FileText className="w-4 h-4" /> },
                        { key: 'payment', label: 'Payment Method', icon: <CreditCard className="w-4 h-4" /> },
                    ] as const).map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2 flex-1 justify-center text-sm font-bold py-2.5 rounded-lg transition-all ${
                                tab === t.key
                                    ? 'bg-orange-500 text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {/* Overview tab */}
                {tab === 'overview' && (
                    <div className="space-y-4">
                        {subscriptions.length === 0 ? (
                            <div className="bg-gray-900 rounded-2xl p-8 text-center border border-gray-800">
                                <RefreshCw className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400">No active subscriptions found.</p>
                            </div>
                        ) : subscriptions.map((sub: any) => (
                            <div key={sub.id} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="font-black text-white text-base">{sub.product_name || 'Subscription'}</div>
                                        <div className="text-sm text-gray-400 mt-0.5">
                                            {sub.currency} {parseFloat(sub.amount || 0).toLocaleString()} / {sub.interval}
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${statusColor(sub.status)}`}>
                                        {sub.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                    {sub.current_period_start && (
                                        <div>
                                            <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Billing Period</div>
                                            <div className="text-gray-300">
                                                {new Date(sub.current_period_start).toLocaleDateString()} –{' '}
                                                {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : '…'}
                                            </div>
                                        </div>
                                    )}
                                    {sub.trial_end && new Date(sub.trial_end) > new Date() && (
                                        <div>
                                            <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Trial Ends</div>
                                            <div className="text-blue-400">{new Date(sub.trial_end).toLocaleDateString()}</div>
                                        </div>
                                    )}
                                </div>

                                {sub.status !== 'canceled' && (
                                    <button
                                        onClick={() => handleCancel(sub.id)}
                                        disabled={canceling === sub.id}
                                        className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                                    >
                                        <XCircle className="w-3.5 h-3.5" />
                                        {canceling === sub.id ? 'Canceling…' : 'Cancel subscription'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Invoices tab */}
                {tab === 'invoices' && (
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                        {invoices.length === 0 ? (
                            <div className="p-8 text-center">
                                <FileText className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400">No invoices yet.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-800">
                                        <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-widest">Invoice</th>
                                        <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-widest">Amount</th>
                                        <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-widest">Status</th>
                                        <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-widest">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((inv: any) => (
                                        <tr key={inv.id} className="border-b border-gray-800 last:border-0">
                                            <td className="p-4 font-mono text-xs text-gray-400">{inv.invoice_number || inv.id.slice(0, 8)}</td>
                                            <td className="p-4 font-black text-white">
                                                {inv.currency} {parseFloat(inv.amount || 0).toLocaleString()}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                                                    inv.status === 'paid' ? 'bg-green-900 text-green-400' :
                                                    inv.status === 'failed' ? 'bg-red-900 text-red-400' :
                                                    'bg-gray-800 text-gray-400'
                                                }`}>{inv.status}</span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">
                                                {new Date(inv.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Payment Method tab */}
                {tab === 'payment' && (
                    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                        <h2 className="text-base font-black text-white mb-2">Mobile Money Details</h2>
                        <p className="text-sm text-gray-400 mb-6">
                            Update the mobile number used for subscription billing. Changes take effect on the next billing cycle.
                        </p>
                        <form onSubmit={handleUpdatePayment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Network</label>
                                <select
                                    value={provider}
                                    onChange={e => setProvider(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                                >
                                    <option value="MTN">MTN Mobile Money</option>
                                    <option value="Airtel">Airtel Money</option>
                                    <option value="Zamtel">Zamtel Kwacha</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="260971234567"
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                                />
                                <p className="text-xs text-gray-600 mt-1.5">Zambia format: 260 + 9-digit number</p>
                            </div>
                            <button
                                type="submit"
                                disabled={pmSaving}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-3 rounded-xl transition-all disabled:opacity-50"
                            >
                                {pmSaving ? 'Updating…' : 'Update Payment Method'}
                            </button>
                            {pmSaved && (
                                <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                                    <CheckCircle className="w-4 h-4" /> Payment method updated successfully
                                </div>
                            )}
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
