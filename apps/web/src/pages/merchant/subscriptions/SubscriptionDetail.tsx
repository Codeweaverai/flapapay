import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Users, ArrowLeft, Clock, CheckCircle2, AlertTriangle, FileText, Calendar, PauseCircle, PlayCircle, Tag, Trash2, CreditCard, CheckCircle, Link2, Copy } from 'lucide-react';
import { api } from '../../../lib/axios';
import { useAuth } from '../../../contexts/AuthContext';
import { format } from 'date-fns';

export default function SubscriptionDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [subscription, setSubscription] = useState<any>(null);
    const [customer, setCustomer] = useState<any>(null);
    const [product, setProduct] = useState<any>(null);
    const [price, setPrice] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [discounts, setDiscounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [couponInput, setCouponInput] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [pmPhone, setPmPhone] = useState('');
    const [pmProvider, setPmProvider] = useState('MTN');
    const [pmSaving, setPmSaving] = useState(false);
    const [pmSaved, setPmSaved] = useState(false);
    const [portalUrl, setPortalUrl] = useState('');
    const [portalLoading, setPortalLoading] = useState(false);
    const [portalCopied, setPortalCopied] = useState(false);

    useEffect(() => {
        fetchSubscriptionDetails();
    }, [id, token]);

    const fetchSubscriptionDetails = async () => {
        try {
            setLoading(true);
            const headers = { 'Authorization': 'Bearer ' + token };

            // 1. Get Subscription
            const subRes = await api.get(`/v1/subscriptions/${id}`, { headers });
            const subData = subRes.data?.data || subRes.data;
            console.log('[SubscriptionDetail] Subscription:', subData);
            setSubscription(subData);

            // 2. Fetch related entities
            if (subData) {
                const [custRes, priceRes, invRes, discRes] = await Promise.all([
                    api.get(`/v1/customers/${subData.customer_id}`, { headers }),
                    api.get(`/v1/prices/${subData.price_id}`, { headers }).catch(() => ({ data: null })),
                    api.get(`/v1/subscriptions/invoices?subscription_id=${subData.id}`, { headers }).catch(() => ({ data: [] })),
                    api.get(`/v1/subscriptions/${subData.id}/discounts`, { headers }).catch(() => ({ data: [] }))
                ]);

                console.log('[SubscriptionDetail] Invoices API Response:', invRes.data);
                console.log('[SubscriptionDetail] Invoices Extracted:', invRes.data?.data || invRes.data);

                const custData = custRes.data?.data || custRes.data;
                setCustomer(custData);
                if (custData?.phone) setPmPhone(custData.phone);
                if (custData?.mobile_money_provider) setPmProvider(custData.mobile_money_provider);
                setInvoices(invRes.data?.data || invRes.data || []);
                setDiscounts(discRes.data?.data || discRes.data || []);

                const matchedPrice = priceRes?.data?.data || priceRes?.data;
                setPrice(matchedPrice);

                if (matchedPrice?.product_id) {
                    const prodRes = await api.get(`/v1/products/${matchedPrice.product_id}`, { headers });
                    setProduct(prodRes.data?.data || prodRes.data);
                }
            }
        } catch (err: any) {
            console.error('Failed to fetch subscription details', err.response?.data || err.message);
            alert('Failed to load subscription details: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm('Are you sure you want to cancel this subscription?')) return;
        try {
            await api.post(`/v1/subscriptions/${id}/cancel`, {}, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            fetchSubscriptionDetails();
        } catch (err) {
            console.error('Failed to cancel subscription', err);
            alert('Failed to cancel subscription');
        }
    };

    const handlePause = async () => {
        try {
            await api.post(`/v1/subscriptions/${id}/pause`, {}, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            fetchSubscriptionDetails();
        } catch (err: any) {
            alert('Failed to pause: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleResume = async () => {
        try {
            await api.post(`/v1/subscriptions/${id}/resume`, {}, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            fetchSubscriptionDetails();
        } catch (err: any) {
            alert('Failed to resume: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;
        setCouponLoading(true);
        setCouponError('');
        try {
            await api.post(`/v1/subscriptions/${id}/discounts`, { coupon_code: couponInput.trim() }, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            setCouponInput('');
            fetchSubscriptionDetails();
        } catch (err: any) {
            setCouponError(err.response?.data?.error || 'Invalid coupon code');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveDiscount = async (discountId: string) => {
        try {
            await api.delete(`/v1/subscriptions/${id}/discounts/${discountId}`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            fetchSubscriptionDetails();
        } catch (err: any) {
            alert('Failed to remove discount: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleGeneratePortalLink = async () => {
        if (!customer?.id) return;
        setPortalLoading(true);
        try {
            const res = await api.post('/v1/customer-portal/sessions', { customer_id: customer.id }, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = res.data?.data || res.data;
            setPortalUrl(data.url || data.portal_url || '');
        } catch (err: any) {
            alert('Failed to generate portal link: ' + (err.response?.data?.error || err.message));
        } finally {
            setPortalLoading(false);
        }
    };

    const handleCopyPortalLink = () => {
        navigator.clipboard.writeText(portalUrl);
        setPortalCopied(true);
        setTimeout(() => setPortalCopied(false), 2500);
    };

    const handleUpdatePaymentMethod = async (e: React.FormEvent) => {
        e.preventDefault();
        setPmSaving(true);
        setPmSaved(false);
        try {
            await api.patch(`/v1/customers/${customer?.id}`, {
                phone: pmPhone.trim(),
                mobile_money_provider: pmProvider,
            }, { headers: { 'Authorization': 'Bearer ' + token } });
            setPmSaved(true);
            setTimeout(() => setPmSaved(false), 3000);
        } catch (err: any) {
            alert('Failed to update payment method: ' + (err.response?.data?.error || err.message));
        } finally {
            setPmSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F9FAFB] lg:pl-72 flex items-center justify-center">
                <p className="text-gray-400">Loading subscription details...</p>
            </div>
        );
    }

    if (!subscription) {
        return (
            <div className="min-h-screen bg-[#F9FAFB] lg:pl-72 flex flex-col items-center justify-center">
                <Users className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Subscription Not Found</h3>
                <button onClick={() => navigate('/merchant/subscriptions/customers')} className="mt-4 text-blue-600 hover:text-blue-700 font-medium">
                    &larr; Back to Customers
                </button>
            </div>
        );
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
            case 'past_due': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case 'incomplete': return <Clock className="w-4 h-4 text-yellow-500" />;
            default: return <Clock className="w-4 h-4 text-slate-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200';
            case 'past_due': return 'bg-red-100 text-red-700 border-red-200';
            case 'incomplete': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'canceled': return 'bg-gray-100 text-gray-500 border-gray-200';
            default: return 'bg-gray-100 text-gray-500 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] lg:pl-72 flex flex-col font-sans relative overflow-hidden text-gray-600">
            <Sidebar isOpen={false} />
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <main className="flex-1 p-8 lg:p-12 z-10 overflow-y-auto w-full relative">
                <div className="flex justify-between items-center mb-8">
                    <button
                        onClick={() => navigate('/merchant/subscriptions/customers')}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Customers
                    </button>

                    <div className="flex items-center gap-3 flex-wrap">
                        {subscription.status !== 'active' && subscription.status !== 'canceled' && (
                            <button
                                onClick={async () => {
                                    if (!window.confirm('Simulate successful payment for this subscription?')) return;
                                    try {
                                        await api.post(`/v1/subscriptions/${id}/activate`, {}, {
                                            headers: { 'Authorization': 'Bearer ' + token }
                                        });
                                        fetchSubscriptionDetails();
                                        alert('Payment simulated! Subscription is now active.');
                                    } catch (err) {
                                        alert('Failed to simulate payment');
                                    }
                                }}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl transition-colors font-bold text-sm shadow-sm"
                            >
                                Simulate Payment
                            </button>
                        )}

                        {subscription.status === 'active' && !subscription.pause_at && (
                            <button
                                onClick={handlePause}
                                className="flex items-center gap-1.5 text-yellow-600 hover:bg-yellow-50 px-4 py-2 rounded-xl transition-colors font-medium text-sm border border-transparent hover:border-yellow-200"
                            >
                                <PauseCircle className="w-4 h-4" /> Pause
                            </button>
                        )}

                        {subscription.pause_at && subscription.status !== 'canceled' && (
                            <button
                                onClick={handleResume}
                                className="flex items-center gap-1.5 text-green-600 hover:bg-green-50 px-4 py-2 rounded-xl transition-colors font-medium text-sm border border-transparent hover:border-green-200"
                            >
                                <PlayCircle className="w-4 h-4" /> Resume
                            </button>
                        )}

                        {subscription.status !== 'canceled' && (
                            <button
                                onClick={handleCancel}
                                className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors font-medium text-sm border border-transparent hover:border-red-100"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column: Core Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Header Card */}
                        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 border-b border-l border-blue-100 pointer-events-none"></div>

                            <div className="flex items-start justify-between relative z-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <h1 className="text-3xl font-black text-gray-900">{product?.name || 'Loading Product...'}</h1>
                                        <span className={`px-3 py-1 text-xs font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 border ${getStatusColor(subscription.status)}`}>
                                            {getStatusIcon(subscription.status)}
                                            {subscription.status}
                                        </span>
                                    </div>
                                    <div className="text-4xl font-black text-gray-900 mb-2">
                                        {price ? `${price.currency} ${parseFloat(price.amount).toLocaleString()}` : '---'}
                                        <span className="text-lg text-gray-400 font-medium ml-1">/ {price?.interval || 'month'}</span>
                                    </div>
                                    <p className="text-gray-500 font-medium flex items-center gap-2">
                                        Subscribed: {format(new Date(subscription.created_at), 'MMM dd, yyyy')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Invoices List */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-gray-400" />
                                Billing History
                            </h2>
                            <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
                                {invoices.length === 0 ? (
                                    <div className="text-center py-10">
                                        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No invoices generated yet.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice ID</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {invoices.map((inv) => (
                                                <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {format(new Date(inv.created_at), 'MMM dd, yyyy')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {inv.currency} {parseFloat(inv.amount).toLocaleString()}
                                                        {parseFloat(inv.discount_amount) > 0 && (
                                                            <span className="ml-2 text-green-600 text-xs">−{inv.currency} {parseFloat(inv.discount_amount).toFixed(2)} disc.</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={"px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider " + (
                                                            inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                        )}>
                                                            {inv.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                                                        {inv.id.substring(0, 8)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Customer Info */}
                    <div className="space-y-6">
                        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
                                <Users className="w-4 h-4 text-blue-500" />
                                Customer Details
                            </h3>
                            {customer ? (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Name</p>
                                        <p className="text-gray-900 font-semibold">{customer.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Email</p>
                                        <p className="text-gray-900 font-semibold truncate" title={customer.email}>{customer.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Stripe ID</p>
                                        <p className="text-gray-500 font-mono text-sm break-all">{customer.stripe_id || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Customer Since</p>
                                        <p className="text-gray-900 font-semibold">{format(new Date(customer.created_at), 'MMM dd, yyyy')}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">Loading customer...</p>
                            )}
                        </div>

                        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                Subscription Info
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Subscription ID</p>
                                    <p className="text-gray-500 font-mono text-xs break-all">{subscription.id}</p>
                                </div>
                                {subscription.current_period_start && (
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Current Period</p>
                                        <p className="text-gray-900 text-sm font-medium">
                                            {format(new Date(subscription.current_period_start), 'MMM dd')} – {subscription.current_period_end ? format(new Date(subscription.current_period_end), 'MMM dd, yyyy') : '...'}
                                        </p>
                                    </div>
                                )}
                                {subscription.pause_at && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                                        <p className="text-xs font-black text-yellow-700 uppercase tracking-widest mb-1">Paused</p>
                                        <p className="text-yellow-700 text-xs">Billing paused since {format(new Date(subscription.pause_at), 'MMM dd, yyyy')}</p>
                                    </div>
                                )}
                                {subscription.trial_end && subscription.status === 'trialing' && (
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                                        <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-1">Trial Active</p>
                                        <p className="text-blue-700 text-xs">Trial ends {format(new Date(subscription.trial_end), 'MMM dd, yyyy')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Discounts & Coupons */}
                        {subscription.status !== 'canceled' && (
                            <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-50 pb-4">
                                    <Tag className="w-4 h-4 text-orange-500" />
                                    Discounts
                                </h3>

                                {discounts.length > 0 ? (
                                    <div className="space-y-2 mb-4">
                                        {discounts.map((d: any) => (
                                            <div key={d.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-xl">
                                                <div>
                                                    <p className="text-xs font-black text-green-800 uppercase tracking-widest">{d.code}</p>
                                                    <p className="text-[10px] text-green-600 mt-0.5">
                                                        {d.amount_off ? `K ${d.amount_off} off` : `${d.percent_off}% off`} · {d.duration}
                                                    </p>
                                                </div>
                                                <button onClick={() => handleRemoveDiscount(d.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 mb-4">No discounts applied.</p>
                                )}

                                <div className="flex gap-2">
                                    <input
                                        value={couponInput}
                                        onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                                        type="text"
                                        placeholder="COUPON CODE"
                                        className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-gray-900 text-xs font-black uppercase focus:outline-none focus:border-orange-400 placeholder-gray-300"
                                    />
                                    <button
                                        onClick={handleApplyCoupon}
                                        disabled={couponLoading || !couponInput.trim()}
                                        className="px-4 py-2 bg-gray-900 text-white text-xs font-black rounded-xl hover:bg-orange-500 transition-colors disabled:opacity-40"
                                    >
                                        {couponLoading ? '...' : 'Apply'}
                                    </button>
                                </div>
                                {couponError && <p className="text-red-500 text-xs mt-2 font-medium">{couponError}</p>}
                            </div>
                        )}

                        {/* Customer Portal Link */}
                        {subscription.status !== 'canceled' && customer && (
                            <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-50 pb-4">
                                    <Link2 className="w-4 h-4 text-purple-500" />
                                    Customer Portal
                                </h3>
                                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                                    Generate a secure link to send to {customer.name || customer.email} so they can manage their own subscription.
                                </p>
                                {portalUrl ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2.5">
                                            <span className="text-xs text-purple-700 font-mono truncate flex-1">{portalUrl}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleCopyPortalLink}
                                                className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-purple-600 text-white text-xs font-bold py-2.5 rounded-xl transition-all"
                                            >
                                                {portalCopied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                {portalCopied ? 'Copied!' : 'Copy Link'}
                                            </button>
                                            <button
                                                onClick={() => setPortalUrl('')}
                                                className="px-3 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-500 hover:border-gray-300 transition-colors"
                                            >
                                                New
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleGeneratePortalLink}
                                        disabled={portalLoading}
                                        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all disabled:opacity-50"
                                    >
                                        <Link2 className="w-3.5 h-3.5" />
                                        {portalLoading ? 'Generating…' : 'Generate Portal Link'}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Payment Method */}
                        {subscription.status !== 'canceled' && customer && (
                            <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-50 pb-4">
                                    <CreditCard className="w-4 h-4 text-blue-500" />
                                    Payment Method
                                </h3>
                                <form onSubmit={handleUpdatePaymentMethod} className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Network</label>
                                        <select
                                            value={pmProvider}
                                            onChange={e => setPmProvider(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400"
                                        >
                                            <option value="MTN">MTN Mobile Money</option>
                                            <option value="Airtel">Airtel Money</option>
                                            <option value="Zamtel">Zamtel Kwacha</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={pmPhone}
                                            onChange={e => setPmPhone(e.target.value)}
                                            placeholder="260971234567"
                                            required
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={pmSaving}
                                        className="w-full bg-gray-900 hover:bg-orange-500 text-white font-black text-xs py-2.5 rounded-xl transition-all disabled:opacity-50"
                                    >
                                        {pmSaving ? 'Saving…' : 'Update Payment Method'}
                                    </button>
                                    {pmSaved && (
                                        <div className="flex items-center gap-1.5 text-green-600 text-xs font-bold">
                                            <CheckCircle className="w-3.5 h-3.5" /> Updated successfully
                                        </div>
                                    )}
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
