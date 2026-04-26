import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Package, Search, Plus, MoreVertical } from 'lucide-react';
import { api } from '../../../lib/axios';
import { useAuth } from '../../../contexts/AuthContext';

export default function SubscriptionProducts() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);

    // New Product Form
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('ZMW');
    const [interval, setInterval] = useState('month');

    useEffect(() => {
        fetchProducts();
    }, [token]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await api.get('/v1/products', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            // Detailed app would also fetch /v1/prices for each, but we simplify for demo
            setProducts(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const prodRes = await api.post('/v1/products', {
                name,
                description: description || '',
                metadata: {}
            }, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const productId = prodRes.data.id;

            // Create default price
            if (amount) {
                await api.post('/v1/prices', {
                    product_id: productId,
                    amount: parseFloat(amount),
                    currency,
                    interval
                }, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
            }

            setCreateModalOpen(false);
            setName('');
            setDescription('');
            setAmount('');
            fetchProducts();
        } catch (err: any) {
            console.error('Failed to create product', err.response?.data || err.message);
            alert('Failed to create product: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] lg:pl-72 flex flex-col font-sans relative overflow-hidden text-gray-600">
            <Sidebar isOpen={false} />
            <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <main className="flex-1 p-8 lg:p-12 z-10 overflow-y-auto w-full relative">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-2 flex items-center gap-3">
                            <Package className="w-10 h-10 text-orange-500" />
                            Products &amp; Pricing
                        </h1>
                        <p className="text-gray-500">Manage your subscription tiers and billing models.</p>
                    </div>
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-orange-500/30"
                    >
                        <Plus className="w-5 h-5" />
                        Create Product
                    </button>
                </header>

                <div className="mb-6 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="w-full bg-white border border-gray-100 shadow-sm rounded-2xl py-4 pl-12 pr-4 text-gray-900 focus:outline-none focus:border-orange-500/50 transition-colors"
                    />
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <p className="text-gray-400 col-span-full">Loading products...</p>
                    ) : products.length === 0 ? (
                        <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">Create your first product to start accepting recurring payments from your customers.</p>
                        </div>
                    ) : (
                        products.map(product => (
                            <div
                                key={product.id}
                                onClick={() => navigate(`/merchant/subscriptions/products/${product.id}`)}
                                className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 hover:border-orange-500/30 hover:shadow-md transition-all group relative cursor-pointer"
                            >
                                <div className="absolute top-6 right-6 text-gray-300 hover:text-gray-900 cursor-pointer">
                                    <MoreVertical className="w-5 h-5" />
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4 border border-orange-100">
                                    <Package className="w-6 h-6 text-orange-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{product.name}</h3>
                                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{product.description || 'No description provided.'}</p>

                                <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                                    <span className={"px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full " + (
                                        product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                    )}>
                                        {product.status || 'Active'}
                                    </span>
                                    <span className="text-sm font-medium text-gray-400">
                                        ID: {product.id.substring(0, 8)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Create Product Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-start justify-center p-4 overflow-y-auto pt-20">
                    <div className="bg-white border border-gray-100 rounded-3xl w-full max-w-xl overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] animate-in fade-in slide-in-from-top-10 duration-300">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">New Product</h2>
                                <p className="text-sm text-gray-500">Define a service or physical good you want to bill for.</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center border border-orange-100">
                                <Package className="w-5 h-5 text-orange-500" />
                            </div>
                        </div>
                        <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Product Name</label>
                                <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500 placeholder-gray-400 text-sm" placeholder="e.g. Premium Plan" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Description (Optional)</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500 placeholder-gray-400 text-sm resize-none" placeholder="Product details..."></textarea>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                    Pricing Setup
                                </h3>
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Amount</label>
                                        <input required value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.01" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500 placeholder-gray-400 text-sm" placeholder="99.00" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Currency</label>
                                        <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500 appearance-none text-sm">
                                            <option value="ZMW">ZMW (K)</option>
                                            <option value="USD">USD ($)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Billing Interval</label>
                                        <select value={interval} onChange={e => setInterval(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500 appearance-none text-sm">
                                            <option value="month">Monthly</option>
                                            <option value="year">Yearly</option>
                                            <option value="week">Weekly</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <p className="text-[10px] text-gray-400 leading-tight">Prices are billed recurringly until canceled.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setCreateModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors text-sm">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl font-bold bg-orange-600 text-white hover:bg-orange-500 transition-colors shadow-lg hover:shadow-orange-500/30 text-sm">Save Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
