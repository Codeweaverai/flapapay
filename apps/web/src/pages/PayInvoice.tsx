import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/axios';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import {
    Download, ShieldCheck, CreditCard,
    Smartphone, Mail, CheckCircle2, AlertCircle,
    ChevronRight, Zap,
    Lock, Loader2
} from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').catch(e => { console.warn('Stripe disabled:', e.message); return null; });

interface Invoice {
    id: string;
    invoice_number: string;
    client_name: string;
    client_email: string;
    client_address: string;
    invoice_date: string;
    due_date: string;
    subtotal: string;
    tax_amount: string;
    tax_rate: string;
    discount_amount: string;
    total_amount: string;
    total_paid: string;
    allows_installments: boolean;
    currency: string;
    status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
    items: any[];
    logo_url?: string;
    brand_color?: string;
    terms_conditions?: string;
    merchant: {
        business_name: string;
        email?: string;
    };
}

const CheckoutForm: React.FC<{
    invoice: Invoice;
    amount: number;
    onSuccess: () => void;
    onCancel: () => void;
}> = ({ invoice, amount, onSuccess, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsLoading(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.href,
            },
            redirect: 'if_required'
        });

        if (error) {
            setMessage(error.message || "An unexpected error occurred.");
            setIsLoading(false);
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            try {
                await api.post(`/v1/public/invoices/${invoice.id}/confirm`, {
                    paymentIntentId: paymentIntent.id,
                    amount: amount,
                    paymentMethod: 'card'
                });
                onSuccess();
            } catch (err: any) {
                setMessage(err.response?.data?.error || "Confirmation failed");
            }
            setIsLoading(false);
        }
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement id="payment-element" />
            <div className="flex flex-col gap-3 pt-4">
                <button
                    disabled={isLoading || !stripe || !elements}
                    id="submit"
                    className="w-full bg-black text-white py-6 rounded-[2rem] font-black text-lg uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-gray-900 transition-all shadow-2xl shadow-black/20 group active:scale-[0.98] disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5 opacity-40" />}
                    <span>Pay {invoice.currency} {amount.toLocaleString()}</span>
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="w-full py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-black transition-all"
                >
                    Change Method
                </button>
            </div>
            {message && <div id="payment-message" className="text-red-500 text-sm font-bold text-center bg-red-50 p-4 rounded-2xl border border-red-100">{message}</div>}
        </form>
    );
};

export const PayInvoice: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'MOBILE_MONEY' | null>(null);
    const [customAmount, setCustomAmount] = useState<string>('');
    const [clientSecret, setClientSecret] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Mobile Money State
    const [mobileNumber, setMobileNumber] = useState('');
    const [provider, setProvider] = useState('MTN_MOMO_ZMB');
    const [countryCode, setCountryCode] = useState('260');
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [lastPaidAmount, setLastPaidAmount] = useState<string>('');

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    const fetchInvoice = async () => {
        try {
            const response = await api.get(`/v1/public/invoices/${id}`);
            const data = response.data;
            setInvoice(data);
            setCustomAmount((parseFloat(data.total_amount) - parseFloat(data.total_paid || '0')).toString());
            if (data.status === 'PAID') setIsSuccess(true);

            // Set default provider/country based on currency
            if (data.currency === 'ZMW') {
                setProvider('MTN_MOMO_ZMB');
                setCountryCode('260');
            } else if (data.currency === 'NGN') {
                setProvider('MTN_MOMO_NGA');
                setCountryCode('234');
            }
        } catch (err) {
            console.error(err);
            setError('Invoice not found or expired.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        if (!invoice) return;
        window.open(`http://localhost:3005/v1/invoices/${invoice.id}/pdf`, '_blank');
    };

    const handleInitiateCard = async () => {
        if (!invoice) return;
        setIsProcessing(true);
        try {
            const res = await api.post(`/v1/public/invoices/${id}/intent`, {
                amount: parseFloat(customAmount),
                email: invoice.client_email
            });
            setClientSecret(res.data.clientSecret);
            setPaymentMethod('CARD');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to initiate payment');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMobilePayment = async () => {
        if (!invoice || !mobileNumber) return;
        setIsProcessing(true);
        try {
            const countryCodeStr = invoice.currency === 'NGN' ? '234' : '260';
            const cleanPhone = mobileNumber.replace(/^\+/, '').replace(/^0/, '').replace(/\s+/g, '');
            const fullPhone = `${countryCodeStr}${cleanPhone}`;

            const res = await api.post(`/v1/public/invoices/${id}/initiate-mobile`, {
                amount: parseFloat(customAmount),
                phoneNumber: fullPhone,
                provider: provider
            });

            if (res.data.status === 'ACCEPTED') {
                setShowApprovalModal(true);
                // Poll for success
                setTimeout(async () => {
                    try {
                        await api.post(`/v1/public/invoices/${id}/confirm`, {
                            amount: parseFloat(customAmount),
                            paymentMethod: 'mobile_money',
                            payment_details: {
                                phone: fullPhone,
                                provider: provider,
                                reference: res.data.depositId
                            }
                        });
                        setShowApprovalModal(false);
                        setLastPaidAmount(customAmount);
                        setIsSuccess(true);
                        fetchInvoice();
                    } catch (err) {
                        console.error(err);
                        setShowApprovalModal(false);
                        alert('Confirmation failed. Please check your transaction status.');
                    }
                }, 5000);
            } else {
                alert('Mobile Money initiation failed. Please check your number.');
            }
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.details && err.response.data.details.failureReason) {
                alert(err.response.data.details.failureReason.failureMessage || 'Payment failed. Please try again.');
            } else if (err.response && err.response.status === 401) {
                alert('Unauthorized: Please ensure VITE_PAWAPAY_TOKEN is set accurately.');
            } else {
                alert(err.response?.data?.error || 'Payment failed. Please check details and try again.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-gray-100 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-black border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-8 text-black font-black uppercase tracking-[0.2em] text-xs">Securing Invoice</p>
        </div>
    );

    if (isSuccess) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
            <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mb-8 shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] animate-in zoom-in duration-500">
                <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-5xl font-black text-gray-900 mb-4 tracking-tighter">Payment Received</h2>
            <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px] mb-12">Transaction ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 max-w-sm w-full text-center space-y-8">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Amount Paid</p>
                    <p className="text-4xl font-black text-gray-900 tracking-tight">{invoice?.currency} {lastPaidAmount ? parseFloat(lastPaidAmount).toLocaleString() : invoice?.total_amount}</p>
                    {lastPaidAmount && invoice?.total_amount && parseFloat(lastPaidAmount) < parseFloat(invoice.total_amount) && (
                        <p className="text-xs font-bold text-gray-500 mt-3 pt-3 border-t border-gray-100 uppercase tracking-widest">
                            out of {invoice.currency} {parseFloat(invoice.total_amount).toLocaleString()} due
                        </p>
                    )}
                </div>
                <button onClick={() => window.location.reload()} className="w-full bg-black text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all shadow-xl shadow-black/10">
                    View Updated Statement
                </button>
            </div>
        </div>
    );

    if (error || !invoice) return (
        // ... (Error UI same as before)
        <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center p-6">
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md w-full text-center border border-gray-100">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-sm">
                    <AlertCircle className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Access Denied</h2>
                <p className="text-gray-500 font-medium leading-relaxed mb-10">
                    {error || 'This invoice link is invalid, expired, or has been revoked by the merchant.'}
                </p>
                <div className="space-y-3">
                    <button onClick={() => window.location.reload()} className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-900 transition-all shadow-xl shadow-black/10">
                        Try Accessing Again
                    </button>
                </div>
            </div>
        </div>
    );

    const brandColor = invoice.brand_color || '#000000';
    const totalAmountNum = parseFloat(invoice.total_amount);
    const totalPaidNum = parseFloat(invoice.total_paid || '0');
    const remainingBalance = totalAmountNum - totalPaidNum;

    return (
        <div className="min-h-screen bg-[#F8F9FC] text-gray-900 selection:bg-black selection:text-white pb-20">
            {/* Merchant Branding Bar */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-xl bg-white/80">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {invoice.logo_url ? (
                            <img src={invoice.logo_url.startsWith('http') ? invoice.logo_url : `http://localhost:3005${invoice.logo_url}`} alt="Logo" className="h-10 object-contain" />
                        ) : (
                            <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center font-black">
                                {invoice.merchant.business_name.charAt(0)}
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Payment for</p>
                            <p className="text-sm font-black text-gray-900">{invoice.merchant.business_name}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all text-xs font-black uppercase tracking-widest"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Download PDF</span>
                    </button>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                    {/* Invoice Visual */}
                    <div className="lg:col-span-7">
                        <div className="bg-white rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden relative">
                            {/* Color Accent */}
                            <div className="h-2 w-full" style={{ backgroundColor: brandColor }}></div>

                            <div className="p-10 md:p-16">
                                <div className="flex flex-col md:flex-row justify-between gap-10 mb-16">
                                    <div className="space-y-6">
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                                            <div className={`h-2 w-2 rounded-full ${invoice.status === 'PAID' ? 'bg-emerald-400' : 'bg-orange-400 animate-pulse'}`}></div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{invoice.status === 'PAID' ? 'COMPLETED' : remainingBalance < totalAmountNum ? 'PARTIAL' : invoice.status}</span>
                                        </div>
                                        <div>
                                            <h1 className="text-6xl font-black tracking-tighter text-gray-900 leading-none">
                                                Invoice
                                            </h1>
                                            <p className="text-gray-400 font-mono mt-2 tracking-tight">#{invoice.invoice_number}</p>
                                        </div>
                                    </div>
                                    <div className="text-left md:text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Due Date</p>
                                        <p className="text-xl font-black text-gray-900">{new Date(invoice.due_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-10 mb-16 p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Customer</p>
                                        <p className="text-lg font-black text-gray-900">{invoice.client_name}</p>
                                        <p className="text-sm font-bold text-gray-500 mt-1">{invoice.client_email}</p>
                                    </div>
                                    <div className="md:text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Merchant</p>
                                        <p className="text-lg font-black text-gray-900">{invoice.merchant.business_name}</p>
                                        <p className="text-sm font-bold text-gray-500 mt-1">{invoice.merchant.email}</p>
                                    </div>
                                </div>

                                {/* Items table omitted for brevity in this mock but should be present in real impl */}
                                <div className="space-y-10">
                                    <div className="flex flex-col md:flex-row justify-between gap-12 pt-10 border-t border-gray-100">
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Payment Notes</p>
                                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                                <p className="text-sm text-gray-500 font-medium leading-relaxed italic">
                                                    {invoice.terms_conditions || 'Thank you for your business.'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="w-full md:w-72 space-y-4">
                                            <div className="flex justify-between items-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                                                <span>Grand Total</span>
                                                <span className="text-gray-900">{invoice.currency} {totalAmountNum.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-bold text-emerald-500 uppercase tracking-widest">
                                                <span>Paid to Date</span>
                                                <span>{invoice.currency} {totalPaidNum.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-6 border-t-2 border-gray-100">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Balance Owed</span>
                                                <span className="text-4xl font-black text-gray-900 tracking-tighter">
                                                    {invoice.currency} {remainingBalance.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Checkout Sidebar */}
                    <div className="lg:col-span-5 space-y-6 sticky top-24">
                        <div className="bg-white p-10 rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)] border border-gray-100">
                            <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight flex items-center gap-3">
                                <ShieldCheck className="w-8 h-8 text-black" />
                                {paymentMethod === 'CARD' && clientSecret ? 'Secure Checkout' : 'Pay Now'}
                            </h3>

                            {!paymentMethod ? (
                                <div className="space-y-8">
                                    {invoice.allows_installments && (
                                        <div className="p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100 space-y-4">
                                            <div className="flex items-center gap-3 text-indigo-600">
                                                <Zap className="w-5 h-5" />
                                                <p className="text-xs font-black uppercase tracking-widest">Installment Plan Available</p>
                                            </div>
                                            <p className="text-xs text-indigo-400 font-bold uppercase tracking-wide leading-relaxed">
                                                You can pay the full balance or a custom amount below.
                                            </p>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-black text-indigo-300">{invoice.currency}</span>
                                                <input
                                                    type="number"
                                                    value={customAmount}
                                                    onChange={(e) => setCustomAmount(e.target.value)}
                                                    className="w-full pl-16 pr-8 py-5 rounded-2xl bg-white border-2 border-indigo-200 outline-none focus:border-indigo-500 font-black text-xl transition-all"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <button
                                            onClick={handleInitiateCard}
                                            disabled={isProcessing}
                                            className="w-full flex items-center gap-5 p-6 rounded-3xl border-2 border-gray-100 hover:border-black hover:bg-gray-50 transition-all group"
                                        >
                                            <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
                                                <CreditCard className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="text-sm font-black text-gray-900">Pay with Card</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Visa, Mastercard, Amex</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-transform" />
                                        </button>

                                        <button
                                            onClick={() => setPaymentMethod('MOBILE_MONEY')}
                                            disabled={isProcessing}
                                            className="w-full flex items-center gap-5 p-6 rounded-3xl border-2 border-gray-100 hover:border-black hover:bg-gray-50 transition-all group"
                                        >
                                            <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                                                <Smartphone className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="text-sm font-black text-gray-900">Mobile Money</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Airtel, MTN, Zamtel</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>

                                    {isProcessing && (
                                        <div className="flex justify-center items-center gap-2 text-gray-400">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Contacting Processor</p>
                                        </div>
                                    )}
                                </div>
                            ) : paymentMethod === 'CARD' && clientSecret ? (
                                <Elements stripe={stripePromise} options={{ clientSecret }}>
                                    <CheckoutForm
                                        invoice={invoice}
                                        amount={parseFloat(customAmount)}
                                        onSuccess={() => { setLastPaidAmount(customAmount); setIsSuccess(true); fetchInvoice(); }}
                                        onCancel={() => { setPaymentMethod(null); setClientSecret(''); }}
                                    />
                                </Elements>
                            ) : paymentMethod === 'MOBILE_MONEY' ? (
                                <div className="space-y-8 animate-in slide-in-from-right duration-500">
                                    <div className="space-y-6">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-2">Select Network Operator</p>
                                        <div className="grid grid-cols-3 gap-3">
                                            {invoice.currency === 'ZMW' ? [
                                                { id: 'MTN_MOMO_ZMB', name: 'MTN', logo: '/assets/images/MTN_Logo.svg' },
                                                { id: 'AIRTEL_OAPI_ZMB', name: 'Airtel', logo: '/assets/images/Airtel_Africa_logo.svg' },
                                                { id: 'ZAMTEL_ZMB', name: 'Zamtel', logo: '/assets/images/zamtel.png' }
                                            ].map((net) => (
                                                <button
                                                    key={net.id}
                                                    onClick={() => setProvider(net.id)}
                                                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${provider === net.id
                                                        ? 'border-black bg-gray-50 scale-[1.02]'
                                                        : 'border-gray-50 hover:border-gray-100 bg-white'
                                                        }`}
                                                >
                                                    <img src={net.logo} alt={net.name} className="h-8 w-8 object-contain" />
                                                    <span className="text-[9px] font-black text-gray-900 uppercase tracking-tighter">{net.name}</span>
                                                </button>
                                            )) : invoice.currency === 'NGN' ? [
                                                { id: 'MTN_MOMO_NGA', name: 'MTN', logo: '/assets/images/MTN_Logo.svg' },
                                                { id: 'AIRTEL_NGA', name: 'Airtel', logo: '/assets/images/Airtel_Africa_logo.svg' }
                                            ].map((net) => (
                                                <button
                                                    key={net.id}
                                                    onClick={() => setProvider(net.id)}
                                                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${provider === net.id
                                                        ? 'border-black bg-gray-50'
                                                        : 'border-gray-50 hover:border-gray-100 bg-white'
                                                        }`}
                                                >
                                                    <img src={net.logo} alt={net.name} className="h-8 w-8 object-contain" />
                                                    <span className="text-[9px] font-black text-gray-900 uppercase tracking-tighter">{net.name}</span>
                                                </button>
                                            )) : (
                                                <div className="col-span-3 text-center py-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile money node unavailable for {invoice.currency}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-2">Phone Number</p>
                                            <div className="flex items-center bg-gray-50 border-2 border-transparent focus-within:border-black focus-within:bg-white rounded-[2rem] px-6 py-1.5 transition-all shadow-inner">
                                                <div className="flex items-center gap-3 border-r border-gray-200 pr-4 mr-4 py-4">
                                                    {invoice.currency === 'ZMW' ? (
                                                        <>
                                                            <ReactCountryFlag countryCode="ZM" svg style={{ width: '1.2em', height: '1.2em' }} />
                                                            <span className="font-black text-gray-900 text-sm">260</span>
                                                        </>
                                                    ) : invoice.currency === 'NGN' ? (
                                                        <>
                                                            <ReactCountryFlag countryCode="NG" svg style={{ width: '1.2em', height: '1.2em' }} />
                                                            <span className="font-black text-gray-900 text-sm">234</span>
                                                        </>
                                                    ) : (
                                                        <CheckCircle2 className="w-4 h-4 text-gray-300" />
                                                    )}
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={mobileNumber}
                                                    onChange={(e) => setMobileNumber(e.target.value)}
                                                    placeholder="96XXXXXXX"
                                                    className="w-full bg-transparent outline-none font-black text-xl text-gray-900 placeholder:text-gray-200"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <button
                                            onClick={handleMobilePayment}
                                            disabled={!mobileNumber || isProcessing}
                                            className="w-full py-7 bg-black text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-black/20 hover:bg-gray-900 transition-all active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {isProcessing ? 'Processing Dispatch...' : `Authorize ${invoice.currency} ${parseFloat(customAmount).toLocaleString()}`}
                                        </button>
                                        <button
                                            onClick={() => setPaymentMethod(null)}
                                            className="w-full py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-black transition-all"
                                        >
                                            Back to Method Selector
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            <div className="mt-10 flex flex-col items-center gap-4 text-center">
                                <div className="flex items-center gap-2 text-emerald-500">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Piped by 256-bit encryption</span>
                                </div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                                    SECURED BY <span className="text-gray-900">FLAPAPAY GLOBAL</span>
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex items-center gap-6">
                            <div className="h-14 w-14 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center text-gray-300">
                                <Mail className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Need help?</p>
                                <p className="text-sm font-black text-gray-900">support@flapapay.com</p>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* Approval Modal */}
            {showApprovalModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[100] animate-in fade-in duration-500">
                    <div className="bg-white p-12 rounded-[4rem] shadow-3xl max-w-md w-full text-center mx-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 animate-pulse"></div>
                        <div className="w-24 h-24 bg-orange-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                            <Smartphone className="w-12 h-12 text-orange-500 animate-bounce" />
                        </div>
                        <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">Complete Payment</h3>
                        <p className="text-gray-500 font-bold text-sm mb-10 leading-relaxed uppercase tracking-wide">
                            A secure prompt has been dispatched to <span className="text-black">+{countryCode} {mobileNumber}</span>. Please authorize the transaction on your device.
                        </p>
                        <div className="flex justify-center gap-3">
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
