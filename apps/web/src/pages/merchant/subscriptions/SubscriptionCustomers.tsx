import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Users, Search, Plus, CreditCard, Clock, CheckCircle2, AlertTriangle, MoreHorizontal, Package } from 'lucide-react';
import { api } from '../../../lib/axios';
import { useAuth } from '../../../contexts/AuthContext';

export default function SubscriptionCustomers() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [customers, setCustomers] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [prices, setPrices] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);

    // New Subscription Form
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [mobileMoneyProvider, setMobileMoneyProvider] = useState('MTN');
    const [couponCode, setCouponCode] = useState('');
    const [selectedPriceId, setSelectedPriceId] = useState('');

    useEffect(() => {
        fetchData();
    }, [token]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const headers = { 'Authorization': 'Bearer ' + token };
            const [custRes, subRes, prodRes, priceRes] = await Promise.all([
                api.get('/v1/customers', { headers }).catch((err) => { console.error('Customers error:', err.response?.data || err.message); return { data: [] }; }),
                api.get('/v1/subscriptions', { headers }).catch((err) => { console.error('Subscriptions error:', err.response?.data || err.message); return { data: [] }; }),
                api.get('/v1/products', { headers }).catch((err) => { console.error('Products error:', err.response?.data || err.message); return { data: [] }; }),
                api.get('/v1/prices', { headers }).catch((err) => { console.error('Prices error:', err.response?.data || err.message); return { data: [] }; })
            ]);
            setCustomers(custRes.data?.data || custRes.data || []);
            setSubscriptions(subRes.data?.data || subRes.data || []);
            setProducts(prodRes.data?.data || prodRes.data || []);
            setPrices(priceRes.data?.data || priceRes.data || []);
            console.log('Loaded customers:', custRes.data?.data || custRes.data);
            console.log('Loaded subscriptions:', subRes.data?.data || subRes.data);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubscription = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const headers = { 'Authorization': 'Bearer ' + token };

            // 1. Create or upsert customer (with phone for PawaPay live billing)
            const custRes = await api.post('/v1/customers', { email, name }, { headers });
            const customerId = custRes.data?.data?.id || custRes.data?.id;

            // 2. Store mobile money details if provided
            if (phone) {
                await api.patch(`/v1/customers/${customerId}`, {
                    phone, mobile_money_provider: mobileMoneyProvider
                }, { headers }).catch(() => {});
            }

            // 3. Create subscription
            const subRes = await api.post('/v1/subscriptions', {
                customer_id: customerId,
                price_id: selectedPriceId
            }, { headers });
            const subscriptionId = subRes.data?.data?.id || subRes.data?.id;

            // 4. Apply coupon if provided
            if (couponCode.trim() && subscriptionId) {
                await api.post(`/v1/subscriptions/${subscriptionId}/discounts`, {
                    coupon_code: couponCode.trim()
                }, { headers }).catch((err: any) => {
                    console.warn('Coupon apply failed:', err.response?.data?.error || err.message);
                });
            }

            setCreateModalOpen(false);
            setEmail(''); setName(''); setPhone('');
            setMobileMoneyProvider('MTN'); setCouponCode(''); setSelectedPriceId('');
            fetchData();
        } catch (err: any) {
            console.error('Failed to create subscription', err);
            alert('Failed: ' + (err.response?.data?.error || err.message));
        }
    };

    // Helper to join customer + subscription data
    const activeSubscribers = subscriptions.map(sub => {
        const customer = customers.find(c => c.id === sub.customer_id) || {};
        const price = prices.find(p => p.id === sub.price_id) || {};
        const product = products.find(p => p.id === price.product_id) || {};
        return {
            ...sub,
            customer_email: customer.email,
            customer_name: customer.name,
            product_name: product.name,
            amount: price.amount,
            currency: price.currency,
            interval: price.interval
        };
    });

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
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-2 flex items-center gap-3">
                            <Users className="w-10 h-10 text-blue-500" />
                            Customers &amp; Subscribers
                        </h1>
                        <p className="text-gray-500">View your audience and manage their active recurring plans.</p>
                    </div>
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/30"
                    >
                        <Plus className="w-5 h-5" />
                        New Subscription
                    </button>
                </header>

                <div className="mb-6 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search customers by email..."
                        className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-gray-900 shadow-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                </div>

                <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest">Plan &amp; Amount</th>
                                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest">Next Invoice</th>
                                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-400 font-bold">Loading subscribers...</td></tr>
                                ) : activeSubscribers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-16 text-center">
                                            <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">No subscribers yet</h3>
                                            <p className="text-gray-500 max-w-sm mx-auto">Click "New Subscription" to enroll your first customer into a recurring plan.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    activeSubscribers.map((sub, i) => (
                                        <tr
                                            key={i}
                                            onClick={() => navigate(`/merchant/subscriptions/${sub.id}`)}
                                            className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            <td className="p-6">
                                                <p className="font-bold text-gray-900 text-base">{sub.customer_email}</p>
                                                <p className="text-sm text-gray-400">{sub.customer_name || 'No Name'}</p>
                                            </td>
                                            <td className="p-6 border-l border-gray-50">
                                                <p className="font-bold text-gray-900 flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-gray-400" />
                                                    {sub.product_name || 'Unknown Product'}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1 max-w-[200px] truncate">
                                                    {sub.amount} {sub.currency} / {sub.interval}
                                                </p>
                                            </td>
                                            <td className="p-6 border-l border-gray-50">
                                                <div className={"inline-flex items-center gap-2 px-3 py-1.5 rounded-full border " + getStatusColor(sub.status)}>
                                                    {getStatusIcon(sub.status)}
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{sub.status}</span>
                                                </div>
                                            </td>
                                            <td className="p-6 border-l border-gray-50 text-sm font-medium text-gray-500">
                                                {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'Pending'}
                                            </td>
                                            <td className="p-6 border-l border-gray-50 text-right">
                                                <button className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 transition-colors">
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Create Subscription Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-start justify-center p-4 overflow-y-auto pt-20">
                    <div className="bg-white border border-gray-100 rounded-3xl w-full max-w-xl overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] animate-in fade-in slide-in-from-top-10 duration-300">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Enroll Subscriber</h2>
                                <p className="text-sm text-gray-500">Add a new customer to a recurring pricing plan.</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                                <CreditCard className="w-5 h-5 text-blue-500" />
                            </div>
                        </div>
                        <form onSubmit={handleCreateSubscription} className="p-6 space-y-4">
                            {/* Customer info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Customer Email</label>
                                    <input required value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-sm" placeholder="jane@example.com" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Full Name</label>
                                    <input value={name} onChange={e => setName(e.target.value)} type="text" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-sm" placeholder="Jane Doe" />
                                </div>
                            </div>

                            {/* Mobile money — needed for live billing (PawaPay STK push) */}
                            <div className="pt-3 border-t border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Mobile Money (for live billing)</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">Phone (260...)</label>
                                        <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-sm" placeholder="260971234567" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">Network</label>
                                        <select value={mobileMoneyProvider} onChange={e => setMobileMoneyProvider(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-blue-500 appearance-none text-sm">
                                            <option value="MTN">MTN MoMo</option>
                                            <option value="AIRTEL">Airtel Money</option>
                                            <option value="ZAMTEL">Zamtel Kwacha</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Plan selection */}
                            <div className="pt-3 border-t border-gray-100">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Pricing Plan</label>
                                <select required value={selectedPriceId} onChange={e => setSelectedPriceId(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-blue-500 appearance-none text-sm">
                                    <option value="" disabled>Choose a plan...</option>
                                    {prices.map(price => {
                                        const prod = products.find((p: any) => p.id === price.product_id);
                                        return (
                                            <option key={price.id} value={price.id}>
                                                {prod ? prod.name : 'Unknown'} — {price.amount} {price.currency} / {price.interval}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Optional coupon */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Coupon Code (Optional)</label>
                                <input value={couponCode} onChange={e => setCouponCode(e.target.value)} type="text" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-blue-500 placeholder-gray-400 text-sm uppercase" placeholder="e.g. SAVE20" />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setCreateModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors text-sm">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg hover:shadow-blue-500/30 text-sm">Create Subscription</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
