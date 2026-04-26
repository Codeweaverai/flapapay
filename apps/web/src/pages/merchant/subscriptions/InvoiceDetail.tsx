import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../../components/layout/Sidebar';
import { ArrowLeft, FileText, CheckCircle2, AlertCircle, Clock, Download, User, Package, CreditCard } from 'lucide-react';
import { api } from '../../../lib/axios';
import { useAuth } from '../../../contexts/AuthContext';
import { format } from 'date-fns';

export default function InvoiceDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [invoice, setInvoice] = useState<any>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const [customer, setCustomer] = useState<any>(null);
    const [product, setProduct] = useState<any>(null);
    const [price, setPrice] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvoiceDetails();
    }, [id, token]);

    const fetchInvoiceDetails = async () => {
        try {
            setLoading(true);
            const headers = { 'Authorization': 'Bearer ' + token };

            // Fetch invoice using dedicated subscription invoice endpoint
            const invRes = await api.get(`/v1/subscriptions/invoices/${id}`, { headers });
            const invoiceData = invRes.data?.data || invRes.data;

            if (!invoiceData) {
                alert('Invoice not found');
                navigate('/merchant/subscriptions/customers');
                return;
            }

            setInvoice(invoiceData);
            await fetchRelatedData(invoiceData, headers);
        } catch (err: any) {
            console.error('Failed to fetch invoice details', err.response?.data || err.message);
            alert('Failed to load invoice details: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchRelatedData = async (invoiceData: any, headers: any) => {
        try {
            // Fetch subscription
            if (invoiceData.subscription_id) {
                const subRes = await api.get(`/v1/subscriptions/${invoiceData.subscription_id}`, { headers });
                const subData = subRes.data?.data || subRes.data;
                setSubscription(subData);

                // Fetch customer
                if (invoiceData.customer_id) {
                    const custRes = await api.get(`/v1/customers/${invoiceData.customer_id}`, { headers });
                    setCustomer(custRes.data?.data || custRes.data);
                }

                // Fetch price and product
                if (invoiceData.price_id) {
                    const priceRes = await api.get(`/v1/prices/${invoiceData.price_id}`, { headers });
                    const priceData = priceRes.data?.data || priceRes.data;
                    setPrice(priceData);

                    if (invoiceData.product_id) {
                        const prodRes = await api.get(`/v1/products/${invoiceData.product_id}`, { headers });
                        setProduct(prodRes.data?.data || prodRes.data);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch related data', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F9FAFB] lg:pl-72 flex items-center justify-center">
                <p className="text-gray-400">Loading invoice details...</p>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="min-h-screen bg-[#F9FAFB] lg:pl-72 flex flex-col items-center justify-center">
                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</h3>
                <button onClick={() => navigate('/merchant/subscriptions/customers')} className="mt-4 text-orange-600 hover:text-orange-700 font-medium">
                    &larr; Back to Subscriptions
                </button>
            </div>
        );
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'failed': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'pending': return <Clock className="w-5 h-5 text-orange-500" />;
            default: return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700 border-green-200';
            case 'failed': return 'bg-red-100 text-red-700 border-red-200';
            case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-gray-100 text-gray-500 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] lg:pl-72 flex flex-col font-sans relative overflow-hidden text-gray-600">
            <Sidebar isOpen={false} />
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <main className="flex-1 p-8 lg:p-12 z-10 overflow-y-auto w-full relative">
                <div className="flex justify-between items-center mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    <button
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md"
                    >
                        <Download className="w-4 h-4" />
                        Download PDF
                    </button>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column: Invoice Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Invoice Header */}
                        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-16 -mt-16 border-b border-l border-orange-100 pointer-events-none"></div>

                            <div className="flex items-start justify-between relative z-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <FileText className="w-8 h-8 text-orange-500" />
                                        <h1 className="text-3xl font-black text-gray-900">Invoice</h1>
                                        <span className={`px-3 py-1 text-xs font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 border ${getStatusColor(invoice.status)}`}>
                                            {getStatusIcon(invoice.status)}
                                            {invoice.status}
                                        </span>
                                    </div>
                                    <div className="text-4xl font-black text-gray-900 mb-2">
                                        {invoice.currency} {parseFloat(invoice.amount || 0).toFixed(2)}
                                    </div>
                                    <p className="text-gray-500 font-mono text-sm">
                                        ID: {invoice.id}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500 mb-1">Created</p>
                                    <p className="text-gray-900 font-bold">{format(new Date(invoice.created_at), 'MMM dd, yyyy')}</p>
                                    {invoice.paid_at && (
                                        <>
                                            <p className="text-sm text-gray-500 mb-1 mt-3">Paid</p>
                                            <p className="text-gray-900 font-bold">{format(new Date(invoice.paid_at), 'MMM dd, yyyy')}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Invoice Details Table */}
                        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-gray-400" />
                                    Invoice Items
                                </h2>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-50">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900">{product?.name || 'Subscription'}</p>
                                            <p className="text-sm text-gray-500">
                                                {price?.interval ? `${price.currency} ${price.amount} / ${price.interval}` : invoice.currency} {invoice.amount}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                                            {invoice.currency} {parseFloat(invoice.amount || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-50">
                                        <td className="px-6 py-4 text-right font-black text-gray-900 uppercase">Total</td>
                                        <td className="px-6 py-4 text-right font-black text-gray-900 text-lg">
                                            {invoice.currency} {parseFloat(invoice.amount || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Right Column: Customer & Subscription Info */}
                    <div className="space-y-6">
                        {/* Customer Card */}
                        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
                                <User className="w-4 h-4 text-orange-500" />
                                Customer
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
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">Customer information not available</p>
                            )}
                        </div>

                        {/* Subscription Card */}
                        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
                                <CreditCard className="w-4 h-4 text-orange-500" />
                                Subscription
                            </h3>
                            {subscription ? (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Product</p>
                                        <p className="text-gray-900 font-semibold">{product?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Status</p>
                                        <span className={`inline-block px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded ${
                                            subscription.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {subscription.status}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Subscription ID</p>
                                        <p className="text-gray-500 font-mono text-xs break-all">{subscription.id}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">Subscription information not available</p>
                            )}
                        </div>

                        {/* Invoice Meta */}
                        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
                                <FileText className="w-4 h-4 text-orange-500" />
                                Invoice Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Invoice ID</p>
                                    <p className="text-gray-500 font-mono text-xs break-all">{invoice.id}</p>
                                </div>
                                {invoice.subscription_id && (
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Subscription ID</p>
                                        <p className="text-gray-500 font-mono text-xs break-all">{invoice.subscription_id}</p>
                                    </div>
                                )}
                                {invoice.customer_id && (
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Customer ID</p>
                                        <p className="text-gray-500 font-mono text-xs break-all">{invoice.customer_id}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
