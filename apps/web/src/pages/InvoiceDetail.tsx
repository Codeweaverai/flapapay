import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import {
    ArrowLeft, Download,
    Send, Edit, Copy, Check,
    ExternalLink,
    Mail, MapPin, Receipt, Clock,
    AlertCircle
} from 'lucide-react';

interface Payment {
    id: string;
    amount: string;
    currency: string;
    payment_method: string;
    status: string;
    transaction_reference: string;
    created_at: string;
}

interface Invoice {
    id: string;
    invoice_number: string;
    client_name: string;
    client_email: string;
    client_address: string;
    invoice_date: string;
    due_date: string;
    currency: string;
    subtotal: string;
    tax_amount: string;
    total_amount: string;
    total_paid: string;
    status: 'DRAFT' | 'APPROVED' | 'SENT' | 'PAID' | 'OVERDUE';
    terms_conditions: string;
    sender_name: string;
    sender_address: string;
    sender_phone: string;
    logo_url?: string;
    items: {
        description: string;
        quantity: number;
        price: string;
        amount: string;
    }[];
    payments: Payment[];
}

export const InvoiceDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    const fetchInvoice = async () => {
        try {
            const response = await api.get(`/v1/invoices/${id}`);
            setInvoice(response.data);
        } catch (error) {
            console.error('Failed to fetch invoice:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemind = async () => {
        if (!id) return;
        try {
            await api.post(`/v1/invoices/${id}/remind`);
            alert('Reminder sent successfully!');
        } catch (error) {
            console.error('Failed to send reminder:', error);
            alert('Failed to send reminder.');
        }
    };

    const handleCopyLink = () => {
        const link = `${window.location.origin}/pay/inv/${id}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'SENT': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'APPROVED': return 'bg-violet-50 text-violet-600 border-violet-100';
            case 'DRAFT': return 'bg-gray-50 text-gray-500 border-gray-100';
            case 'OVERDUE': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-gray-50 text-gray-500 border-gray-100';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Loading Invoice Intelligence...</p>
                </div>
            </div>
        );
    }

    if (!invoice) return <div>Invoice not found.</div>;

    const paymentLink = `${window.location.origin}/pay/inv/${id}`;

    return (
        <div className="min-h-screen bg-[#F8F9FC] flex overflow-x-hidden">
            <Sidebar />

            <div className="flex-1 md:ml-72 transition-all duration-300">
                <main className="p-8 lg:p-12 max-w-7xl mx-auto w-full">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate('/invoices')}
                                className="h-12 w-12 flex items-center justify-center bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-black transition-all active:scale-95"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-400" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Invoice Details</h1>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="font-mono font-bold text-gray-400">#{invoice.invoice_number}</span>
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(invoice.status)}`}>
                                        {invoice.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(`/invoices/${id}/edit`)}
                                className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-gray-600 hover:text-black hover:border-black transition-all shadow-sm active:scale-95"
                            >
                                <Edit className="w-4 h-4" />
                                Edit
                            </button>
                            <button
                                onClick={() => window.open(`http://localhost:3005/v1/invoices/${id}/pdf`, '_blank')}
                                className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-gray-600 hover:text-black hover:border-black transition-all shadow-sm active:scale-95"
                            >
                                <Download className="w-4 h-4" />
                                PDF
                            </button>
                            <button
                                onClick={() => navigate(`/invoices/${id}/send`)}
                                className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-2xl font-bold hover:bg-gray-900 transition-all shadow-xl shadow-black/10 active:scale-95"
                            >
                                <Send className="w-4 h-4" />
                                Send Invoice
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Payment Link Card */}
                            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm overflow-hidden relative group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <ExternalLink className="w-24 h-24 text-black" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Sharing & Payment</h3>
                                    <p className="text-xl font-bold text-gray-900 mb-6">Online Payment Link</p>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 font-mono text-sm text-gray-500 break-all">
                                            {paymentLink}
                                        </div>
                                        <button
                                            onClick={handleCopyLink}
                                            className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all shrink-0 ${copied ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white hover:bg-black'}`}
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4" />
                                                    Copy Link
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <p className="mt-4 text-xs font-medium text-gray-400 flex items-center gap-2">
                                        <AlertCircle className="w-3 h-3 text-amber-500" />
                                        Share this link with your client to accept mobile money and card payments.
                                    </p>
                                </div>
                            </div>

                            {/* Info Card */}
                            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                                <div className="border-b border-gray-50 p-8">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Customer Identity</h3>
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 bg-black/5 rounded-full flex items-center justify-center text-black font-black text-lg">
                                                        {invoice.client_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xl font-black text-gray-900">{invoice.client_name}</p>
                                                        <p className="font-bold text-gray-400">{invoice.client_email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <MapPin className="w-4 h-4" />
                                                <span className="text-sm font-medium">{invoice.client_address || 'No address provided'}</span>
                                            </div>
                                        </div>

                                        <div className="text-right space-y-4">
                                            <div>
                                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Issue Date</h3>
                                                <p className="font-bold text-gray-900">{new Date(invoice.invoice_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                            </div>
                                            <div>
                                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Due Date</h3>
                                                <p className="font-bold text-red-500">{new Date(invoice.due_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="p-0">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50/50">
                                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Qty</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Price</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {invoice.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-8 py-6">
                                                        <p className="font-bold text-gray-900">{item.description}</p>
                                                    </td>
                                                    <td className="px-8 py-6 text-center font-bold text-gray-600">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-8 py-6 text-right font-bold text-gray-600">
                                                        {invoice.currency} {parseFloat(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-8 py-6 text-right font-bold text-gray-900">
                                                        {invoice.currency} {parseFloat(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-8 bg-gray-50/30 border-t border-gray-50 flex justify-end">
                                    <div className="w-64 space-y-3">
                                        <div className="flex justify-between text-sm font-bold text-gray-500">
                                            <span>Subtotal</span>
                                            <span>{invoice.currency} {parseFloat(invoice.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold text-gray-500">
                                            <span>Tax</span>
                                            <span>{invoice.currency} {parseFloat(invoice.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold text-emerald-600 pt-2">
                                            <span>Amount Paid</span>
                                            <span>{invoice.currency} {parseFloat(invoice.total_paid || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-2xl font-black text-gray-900 pt-3 border-t border-gray-100">
                                            <span>Balance</span>
                                            <span>{invoice.currency} {(parseFloat(invoice.total_amount) - parseFloat(invoice.total_paid || '0')).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-8">
                            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-black"></div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Receipt className="w-4 h-4" />
                                    Merchant Details
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        {invoice.logo_url && (
                                            <div className="h-16 w-16 bg-gray-50 rounded-2xl p-2 flex items-center justify-center border border-gray-100">
                                                <img src={invoice.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-xl font-black text-gray-900">{invoice.sender_name || 'FlapaPay Merchant'}</p>
                                            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">Authorized Issuer</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium text-gray-500 leading-relaxed">{invoice.sender_address}</p>
                                        <p className="text-sm font-bold text-black flex items-center gap-2">
                                            <Mail className="w-3 h-3" />
                                            {invoice.sender_phone}
                                        </p>
                                    </div>
                                    <div className="pt-6 border-t border-gray-50">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Terms & Conditions</h4>
                                        <p className="text-xs font-medium text-gray-500 leading-relaxed italic">
                                            "{invoice.terms_conditions || 'Standard terms apply.'}"
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black rounded-[2rem] p-8 text-white shadow-xl shadow-black/20">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-widest">Audit Trail</h3>
                                </div>

                                <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-px before:bg-white/10">
                                    {invoice.payments && invoice.payments.length > 0 ? (
                                        invoice.payments.map((payment) => (
                                            <div className="relative pl-8" key={payment.id}>
                                                <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center z-10">
                                                    <Check className="w-3 h-3 text-emerald-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-xs font-black uppercase tracking-wider text-emerald-400">Payment Received</p>
                                                        <span className="text-[10px] font-bold opacity-40">{new Date(payment.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-lg font-black text-white">{payment.currency} {parseFloat(payment.amount).toLocaleString()}</p>
                                                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Via {payment.payment_method}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : null}

                                    <div className="relative pl-8">
                                        <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full bg-blue-500 border-2 border-blue-400/30 flex items-center justify-center z-10 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                                            <div className="h-2 w-2 rounded-full bg-white"></div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-start">
                                                <p className="text-xs font-black uppercase tracking-wider text-blue-400">Invoice Created</p>
                                                <span className="text-[10px] font-bold opacity-40">{new Date(invoice.invoice_date).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm font-bold text-white/80">Initialization complete. Status: {invoice.status}</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleRemind}
                                    className="w-full mt-10 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group"
                                >
                                    <Send className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    Send Automated Reminder
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
