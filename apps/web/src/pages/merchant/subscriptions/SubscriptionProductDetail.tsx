import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Package, ArrowLeft, Tag, Activity, Archive, Clock } from 'lucide-react';
import { api } from '../../../lib/axios';
import { useAuth } from '../../../contexts/AuthContext';

export default function SubscriptionProductDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [product, setProduct] = useState<any>(null);
    const [prices, setPrices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProductDetails();
    }, [id, token]);

    const fetchProductDetails = async () => {
        try {
            setLoading(true);
            const headers = { 'Authorization': 'Bearer ' + token };

            const [prodRes, priceRes] = await Promise.all([
                api.get(`/v1/products/${id}`, { headers }),
                api.get(`/v1/prices?product_id=${id}`, { headers })
            ]);

            setProduct(prodRes.data);
            setPrices(priceRes.data || []);
        } catch (err) {
            console.error('Failed to fetch product details', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F9FAFB] lg:pl-72 flex items-center justify-center">
                <p className="text-gray-400">Loading product details...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-[#F9FAFB] lg:pl-72 flex flex-col items-center justify-center">
                <Package className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h3>
                <button onClick={() => navigate('/merchant/subscriptions/products')} className="mt-4 text-orange-600 hover:text-orange-700 font-medium">
                    &larr; Back to Products
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] lg:pl-72 flex flex-col font-sans relative overflow-hidden text-gray-600">
            <Sidebar isOpen={false} />
            <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <main className="flex-1 p-8 lg:p-12 z-10 overflow-y-auto w-full relative">
                <button
                    onClick={() => navigate('/merchant/subscriptions/products')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Products
                </button>

                <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-8 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-16 -mt-16 border-b border-l border-orange-100"></div>

                    <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-start gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100 flex-shrink-0">
                                <Package className="w-10 h-10 text-orange-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 mb-2">{product.name}</h1>
                                <p className="text-gray-500 max-w-2xl mb-4">{product.description || 'No description provided.'}</p>
                                <div className="flex gap-4 items-center">
                                    <span className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 ${product.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                                        } border`}>
                                        {product.status === 'active' ? <Activity className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
                                        {product.status || 'Active'}
                                    </span>
                                    <span className="text-sm font-medium text-gray-400 font-mono bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                        ID: {product.id}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Tag className="w-6 h-6 text-gray-400" />
                        Pricing Plans
                    </h2>

                    {prices.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 border-dashed">
                            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No pricing plans have been added to this product yet.</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {prices.map(price => (
                                <div key={price.id} className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 relative group overflow-hidden">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-gray-50 rounded-full group-hover:bg-orange-50 transition-colors pointer-events-none"></div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                                                {price.currency}
                                            </span>
                                        </div>
                                        <div className="mb-6">
                                            <span className="text-4xl font-black text-gray-900 capitalize">${price.amount}</span>
                                            <span className="text-gray-500 font-medium">/{price.interval}</span>
                                        </div>

                                        <ul className="space-y-3 mb-6">
                                            <li className="flex items-center gap-3 text-sm text-gray-600">
                                                <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                                                Billed every {price.interval_count} {price.interval}(s)
                                            </li>
                                        </ul>

                                        <div className="pt-4 border-t border-gray-100">
                                            <span className="text-xs font-medium text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded-md border border-gray-100 break-all">
                                                Price ID: {price.id}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
