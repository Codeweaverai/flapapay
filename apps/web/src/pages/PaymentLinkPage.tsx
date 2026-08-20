import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { api } from '../lib/axios';
import ReactCountryFlag from 'react-country-flag';
import { startMobileMoneyStatusPolling } from '../lib/mobileMoneyPolling';

const FLEX_SCRIPT_URL = import.meta.env.VITE_CYBERSOURCE_ENVIRONMENT === 'production'
    ? 'https://flex.cybersource.com/microform/bundle/v2/flex-microform.min.js'
    : 'https://testflex.cybersource.com/microform/bundle/v2/flex-microform.min.js';

const loadFlexScript = (): Promise<void> => new Promise((resolve, reject) => {
    if ((window as any).Flex) { resolve(); return; }
    const script = document.createElement('script');
    script.src = FLEX_SCRIPT_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load secure card module'));
    document.head.appendChild(script);
});

const FLEX_STYLES = {
    input: { 'font-size': '14px', 'font-family': 'inherit', color: '#111827', 'letter-spacing': '0.02em' },
    ':focus': { color: '#111827' },
    valid: { color: '#1d4ed8' },
    invalid: { color: '#dc2626' },
};

const CARD_FIELD_HEIGHT = '52px';

interface LinkDetails {
    id: string;
    title: string;
    description: string;
    amount: string;
    currency: string;
    merchant_name: string;
    allows_mobile_money: boolean;
    allows_card: boolean;
}

interface LinkSavedCard {
    id: string;
    instrumentId: string;
    brand: string;
    last4: string;
    exp_month?: string;
    exp_year?: string;
    is_default?: boolean;
}

interface LinkSavedMethods {
    defaultMethodType: 'mobile_money' | 'card' | null;
    mobile_money: {
        phone: string;
        provider: string;
        provider_label: string;
        account_name?: string;
    } | null;
    cards: LinkSavedCard[];
}

const formatSavedCardLabel = (card: LinkSavedCard) => `${card.brand || 'Card'} •••• ${card.last4}`;

const CardPaymentForm: React.FC<{
    link: LinkDetails;
    captureContext: string;
    onSuccess: (reference?: string) => void;
    paymentAmount: number;
    paymentAmountText: string;
}> = ({ link, captureContext, onSuccess, paymentAmount, paymentAmountText }) => {
    const numberRef = useRef<HTMLDivElement>(null);
    const cvvRef = useRef<HTMLDivElement>(null);
    const microformRef = useRef<any>(null);

    const [expMonth, setExpMonth] = useState('');
    const [expYear, setExpYear] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [flexReady, setFlexReady] = useState(false);
    const detailsEntered = Boolean(expMonth && expYear && flexReady);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                await loadFlexScript();
                if (!mounted) return;
                const flex = new (window as any).Flex(captureContext);
                const microform = flex.microform({ styles: FLEX_STYLES });
                microformRef.current = microform;

                microform.createField('number', { placeholder: '1234 5678 9012 3456' }).load(numberRef.current!);
                microform.createField('securityCode', { placeholder: '•••' }).load(cvvRef.current!);
                if (mounted) setFlexReady(true);
            } catch (e: any) {
                if (mounted) setError(e.message || 'Failed to initialize secure card input.');
            }
        })();
        return () => { mounted = false; };
    }, [captureContext]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!microformRef.current) return;
        if (paymentAmount <= 0) {
            setError('Enter a valid amount before paying.');
            return;
        }
        if (!expMonth || !expYear) {
            setError('Please enter card expiry.');
            return;
        }

        setLoading(true);
        setError('');

        let transientToken: string;
        try {
            transientToken = await new Promise<string>((resolve, reject) => {
                microformRef.current.createToken(
                    { expirationMonth: expMonth, expirationYear: expYear },
                    (err: any, token: string) => (err ? reject(err) : resolve(token))
                );
            });
        } catch (err: any) {
            setError(err.message || 'Card validation failed');
            setLoading(false);
            return;
        }

        try {
            const res = await api.post(`/public/payment-links/${link.id}/confirm`, {
                amount: paymentAmount,
                payment_method: 'card',
                payment_details: {
                    transientToken,
                    expirationMonth: expMonth,
                    expirationYear: expYear,
                    billingDetails: {
                        country: link.currency === 'ZMW' ? 'ZM' : link.currency === 'NGN' ? 'NG' : 'US'
                    }
                }
            });
            onSuccess(String(res.data?.reference || '').replace(/\s+/g, '').trim());
        } catch (err: any) {
            setError(err.response?.data?.error || 'Payment failed. Please try again.');
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Card Number</label>
                <div
                    ref={numberRef}
                    className="px-4 bg-gray-50 border-2 border-gray-100 focus-within:border-black focus-within:bg-white rounded-2xl transition-all"
                    style={{ height: CARD_FIELD_HEIGHT, display: 'flex', alignItems: 'center' }}
                />
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Month</label>
                    <select
                        value={expMonth}
                        onChange={e => setExpMonth(e.target.value)}
                        className="w-full h-[52px] px-3 bg-gray-50 border-2 border-gray-100 focus:border-black rounded-2xl text-sm font-bold text-gray-900 outline-none transition-all"
                    >
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Year</label>
                    <select
                        value={expYear}
                        onChange={e => setExpYear(e.target.value)}
                        className="w-full h-[52px] px-3 bg-gray-50 border-2 border-gray-100 focus:border-black rounded-2xl text-sm font-bold text-gray-900 outline-none transition-all"
                    >
                        <option value="">YYYY</option>
                        {Array.from({ length: 12 }, (_, i) => String(new Date().getFullYear() + i)).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">CVV</label>
                    <div
                        ref={cvvRef}
                        className="px-4 bg-gray-50 border-2 border-gray-100 focus-within:border-black focus-within:bg-white rounded-2xl transition-all"
                        style={{ height: CARD_FIELD_HEIGHT, display: 'flex', alignItems: 'center' }}
                    />
                </div>
            </div>

            {error && <p className="text-red-500 text-sm font-bold bg-red-50 px-4 py-3 rounded-xl border border-red-100">{error}</p>}

            {detailsEntered ? (
                <button
                    type="submit"
                    disabled={!flexReady || loading || paymentAmount <= 0}
                    className="w-full py-4 bg-black text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Processing...' : `Pay ${link.currency} ${paymentAmountText}`}
                </button>
            ) : null}

            <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Secured by CyberSource · Visa-grade encryption
            </p>

        </form>
    );
};

export const PaymentLinkPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const isQrCheckout = location.pathname.startsWith('/qr-payments/');
    const [link, setLink] = useState<LinkDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile'>('card');
    const [success, setSuccess] = useState(false);
    const [receiptReference, setReceiptReference] = useState('');
    const [captureContext, setCaptureContext] = useState('');
    const [intentError, setIntentError] = useState('');
    const [customAmount, setCustomAmount] = useState('');

    // Mobile Money State
    const [mobileNumber, setMobileNumber] = useState('');
    const [provider, setProvider] = useState('MTN_MOMO_ZMB');
    const [isMobileProcessing, setIsMobileProcessing] = useState(false);
    const [mobileError, setMobileError] = useState('');
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [mobileStatusMessage, setMobileStatusMessage] = useState('');
    const pollStopRef = useRef<null | (() => void)>(null);

    const isOpenAmountLink = Boolean(isQrCheckout && link && parseFloat(link.amount) <= 0);
    const fixedLinkAmount = parseFloat(link?.amount || '0');
    const paymentAmount = Number.isFinite(isOpenAmountLink ? parseFloat(customAmount) : fixedLinkAmount)
        ? (isOpenAmountLink ? parseFloat(customAmount) : fixedLinkAmount)
        : 0;
    const displayAmount = paymentAmount > 0 ? paymentAmount : fixedLinkAmount;
    const paymentAmountText = paymentAmount > 0
        ? paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : (isOpenAmountLink ? 'Enter amount' : (link?.amount || '0.00'));

    useEffect(() => {
        const fetchLinkAndIntent = async () => {
            setLoading(true);
            setError('');
            setIntentError('');

            let fetchedLink: LinkDetails | null = null;
            try {
                const res = await api.get(`/public/payment-links/${id}`);
                fetchedLink = res.data;
                setLink(fetchedLink);
                if (!isQrCheckout && parseFloat(String(fetchedLink?.amount || '0')) <= 0) {
                    setError('This payment link is configured for QR checkout. Open it from the QR code or use the QR checkout route.');
                    setLoading(false);
                    return;
                }
            } catch {
                setError('Link not found or inactive');
                setLoading(false);
                return;
            }

            try {
                if (!fetchedLink) return;

                if (fetchedLink.allows_card) {
                    const intentRes = await api.post(`/public/payment-links/${id}/intent`, {});
                    setCaptureContext(intentRes.data.captureContext || '');
                    if (!intentRes.data.captureContext) {
                        throw new Error('Missing secure card context');
                    }
                } else if (fetchedLink.allows_mobile_money) {
                    setPaymentMethod('mobile');
                }

                if (fetchedLink.currency === 'ZMW') {
                    setProvider('MTN_MOMO_ZMB');
                } else if (fetchedLink.currency === 'NGN') {
                    setProvider('MTN_MOMO_NGA');
                }
            } catch {
                if (fetchedLink?.allows_card) {
                    setIntentError('Card checkout is temporarily unavailable. Please try mobile money or retry shortly.');
                    if (fetchedLink.allows_mobile_money) {
                        setPaymentMethod('mobile');
                    }
                }
            } finally {
                setLoading(false);
            }
        };
        fetchLinkAndIntent();
    }, [id, isQrCheckout]);

    const handleMobilePayment = async () => {
        if (!link || !mobileNumber) return;
        if (paymentAmount <= 0) {
            setMobileError('Enter a valid amount before paying.');
            return;
        }
        setIsMobileProcessing(true);
        setMobileError('');
        try {
            const res = await api.post(`/public/payment-links/${id}/initiate-mobile`, {
                amount: paymentAmount,
                phoneNumber: mobileNumber,
                provider: provider,
            });

            const depositId = res.data?.depositId || res.data?.provider_reference || res.data?.deposit_id;
            if (!depositId) {
                setMobileError('Missing mobile money reference. Please retry.');
                return;
            }

            const initStatus = String(res.data?.status || '').toLowerCase();
            if (res.data?.error || initStatus === 'failed') {
                setMobileError(res.data?.error || 'Mobile money initiation failed. Please check your number.');
                return;
            }

            setShowApprovalModal(true);
            setMobileStatusMessage('Payment request sent. Checking deposit status...');
            pollStopRef.current?.();
            pollStopRef.current = startMobileMoneyStatusPolling({
                fetchStatus: async () => {
                    const statusRes = await api.get(`/public/payment-links/${id}/mobile-status/${encodeURIComponent(depositId)}`);
                    return statusRes.data;
                },
                onPending: () => {
                    setMobileStatusMessage('Payment request sent. Waiting for mobile money authorization...');
                },
                onSuccess: async () => {
                    try {
                        const confirmRes = await api.post(`/public/payment-links/${id}/confirm`, {
                            amount: paymentAmount,
                            payment_method: 'mobile_money',
                            payment_details: {
                                provider: 'lenco',
                                depositId,
                                phoneNumber: mobileNumber,
                            },
                        });
                        setShowApprovalModal(false);
                        setMobileStatusMessage('');
                        setReceiptReference(String(confirmRes.data?.reference || depositId || '').replace(/\s+/g, '').trim());
                        setSuccess(true);
                        setIsMobileProcessing(false);
                    } catch (confirmErr: any) {
                        if (confirmErr.response?.status === 402) {
                            setShowApprovalModal(false);
                            setMobileStatusMessage('');
                            setMobileError(confirmErr.response?.data?.error || 'Mobile money payment failed.');
                            setIsMobileProcessing(false);
                            return;
                        }
                        throw confirmErr;
                    }
                },
                onFailure: (snapshot) => {
                    setShowApprovalModal(false);
                    setMobileStatusMessage('');
                    setMobileError(String(snapshot?.failureReason || 'Mobile money payment failed.'));
                    setIsMobileProcessing(false);
                },
                onError: (statusErr: any) => {
                    const apiErr = statusErr?.response?.data;
                    setShowApprovalModal(false);
                    setMobileStatusMessage('');
                    setMobileError(apiErr?.error || 'Failed to check mobile money status.');
                    setIsMobileProcessing(false);
                },
                onTimeout: () => {
                    setShowApprovalModal(false);
                    setMobileStatusMessage('');
                    setMobileError('Payment confirmation timed out. Please try again.');
                    setIsMobileProcessing(false);
                }
            });
        } catch (err: any) {
            console.error(err);
            const apiErr = err?.response?.data;
            const providerMsg = apiErr?.details?.failureReason?.failureMessage;
            setMobileError(providerMsg || apiErr?.error || 'Failed to initiate payment.');
        } finally {
            setIsMobileProcessing(false);
        }
    };

    useEffect(() => () => {
        pollStopRef.current?.();
        pollStopRef.current = null;
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
    );

    if (!link) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full border border-gray-100">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Payment Link</h2>
                <p className="text-gray-500 font-medium">{error || 'Link not found or inactive'}</p>
            </div>
        </div>
    );

    if (success) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 animate-fade-in font-sans">
            <div className="bg-white p-10 rounded-[40px] shadow-2xl text-center max-w-md w-full border border-gray-100">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Payment Complete!</h2>
                <p className="text-gray-500 text-lg mb-8">Successfully paid <span className="text-black font-bold">{link.currency} {displayAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> to {link.merchant_name}.</p>
                <div className="bg-gray-50 p-5 rounded-2xl mb-8 border border-gray-100">
                    <div className="flex justify-between mb-3">
                        <span className="text-gray-500 font-medium">Reference</span>
                        <span className="font-mono font-bold text-gray-900">{receiptReference || 'PENDING'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Date</span>
                        <span className="font-bold text-gray-900">{new Date().toLocaleDateString()}</span>
                    </div>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="w-full py-4 bg-black text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                    Return to Shop
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 flex flex-col items-center font-sans">
            <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 animate-slide-up">
                <div className="bg-black p-10 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-800 to-black opacity-30"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg mx-auto flex items-center justify-center mb-6">
                            <img src="/assets/images/flapapaylogoicon.png" alt="Logo" className="w-10 h-10 object-contain" />
                        </div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">Merchant Checkout</p>
                        <h1 className="text-2xl font-extrabold">{link.merchant_name}</h1>
                    </div>
                </div>

                <div className="p-10">
                    <div className="text-center mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{link.title}</h2>
                        {link.description && <p className="text-gray-500 text-sm mb-6 leading-relaxed">{link.description}</p>}

                        <div className="bg-gray-50 rounded-3xl border border-gray-100 p-6 mb-6 space-y-3">
                            {isOpenAmountLink ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Payment Amount</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Open amount</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        placeholder={`0.00 ${link.currency}`}
                                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-lg font-black text-gray-900 outline-none focus:border-black"
                                    />
                                    <p className="text-xs font-semibold text-gray-500">Enter the amount you want to pay before continuing.</p>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Payment Amount</span>
                                    <span className="font-black text-gray-900">{link.currency} {displayAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Processing Fee (1.8%)</span>
                                <span className="font-black text-orange-500">
                                    {link.currency} {(displayAmount * 0.018).toFixed(2)}
                                </span>
                            </div>
                            <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                                <span className="text-gray-900 font-black uppercase tracking-widest text-xs">Total to Pay</span>
                                <span className="text-2xl font-black text-gray-900">
                                    {link.currency} {displayAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {(link.allows_card && link.allows_mobile_money) && (
                        <div className="flex p-1.5 bg-gray-100 rounded-2xl mb-10">
                            <button
                                onClick={() => setPaymentMethod('card')}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${paymentMethod === 'card' ? 'bg-white shadow-md text-black' : 'text-gray-500 hover:text-black'}`}
                            >
                                Secure Card
                            </button>
                            <button
                                onClick={() => setPaymentMethod('mobile')}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${paymentMethod === 'mobile' ? 'bg-white shadow-md text-black' : 'text-gray-500 hover:text-black'}`}
                            >
                                Mobile Money
                            </button>
                        </div>
                    )}

                    {paymentMethod === 'card' ? (
                        <div className="space-y-6">
                            {intentError && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    {intentError}
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-4 px-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Accepted Cards</span>
                                <div className="flex gap-4 items-center">
                                    <img src="/assets/images/visa02.svg" className="h-8 object-contain" alt="Visa" />
                                    <img src="/assets/images/MASTERCARD02.svg" className="h-8 object-contain" alt="Mastercard" />
                                </div>
                            </div>

                            {captureContext ? (
                                <CardPaymentForm
                                    link={link}
                                    captureContext={captureContext}
                                    onSuccess={(reference) => {
                                        setReceiptReference(String(reference || '').replace(/\s+/g, '').trim());
                                        setSuccess(true);
                                    }}
                                    paymentAmount={paymentAmount}
                                    paymentAmountText={paymentAmountText}
                                />
                            ) : (
                                <div className="h-40 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                                    {intentError ? 'Card checkout unavailable right now' : 'Loading Secure Checkout...'}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Network</span>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {link.currency === 'ZMW' ? [
                                    { id: 'MTN_MOMO_ZMB', name: 'MTN', logo: '/assets/images/MTN_Logo.svg' },
                                    { id: 'AIRTEL_OAPI_ZMB', name: 'Airtel', logo: '/assets/images/Airtel_Africa_logo.svg' },
                                    { id: 'ZAMTEL_ZMB', name: 'Zamtel', logo: '/assets/images/zamtel.png' }
                                ].map((net) => (
                                    <button
                                        key={net.id}
                                        onClick={() => setProvider(net.id)}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${provider === net.id ? 'border-green-500 bg-green-50 shadow-sm' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                                    >
                                        <img src={net.logo} alt={net.name} className="h-8 w-8 object-contain" />
                                        <span className="text-[10px] font-bold text-gray-600">{net.name}</span>
                                    </button>
                                )) : link.currency === 'NGN' ? [
                                    { id: 'MTN_MOMO_NGA', name: 'MTN', logo: '/assets/images/MTN_Logo.svg' },
                                    { id: 'AIRTEL_NGA', name: 'Airtel', logo: '/assets/images/Airtel_Africa_logo.svg' }
                                ].map((net) => (
                                    <button
                                        key={net.id}
                                        onClick={() => setProvider(net.id)}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${provider === net.id ? 'border-green-500 bg-green-50 shadow-sm' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                                    >
                                        <img src={net.logo} alt={net.name} className="h-8 w-8 object-contain" />
                                        <span className="text-[10px] font-bold text-gray-600">{net.name}</span>
                                    </button>
                                )) : (
                                    <div className="col-span-3 text-center text-sm text-gray-500">Mobile money not available for {link.currency}</div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                                <div className="flex items-center bg-gray-50 border border-transparent focus-within:bg-white focus-within:ring-2 focus-within:ring-black rounded-2xl px-4 transition-all">
                                    <div className="flex items-center gap-2 border-r border-gray-200 pr-3 mr-3 py-4">
                                        {link.currency === 'ZMW' ? (
                                            <>
                                                <ReactCountryFlag countryCode="ZM" svg />
                                                <span className="font-bold text-gray-500 text-sm">260</span>
                                            </>
                                        ) : link.currency === 'NGN' ? (
                                            <>
                                                <ReactCountryFlag countryCode="NG" svg />
                                                <span className="font-bold text-gray-500 text-sm">234</span>
                                            </>
                                        ) : (
                                            <span className="font-bold text-gray-500 text-sm">Code</span>
                                        )}
                                    </div>
                                    <input
                                        type="tel"
                                        value={mobileNumber}
                                        onChange={(e) => {
                                            setMobileNumber(e.target.value);
                                        }}
                                        placeholder="96XXXXXXX"
                                        className="w-full py-4 bg-transparent outline-none font-bold text-lg text-gray-900"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleMobilePayment}
                                disabled={!mobileNumber || isMobileProcessing || paymentAmount <= 0}
                                className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:bg-green-700 active:scale-95 disabled:opacity-50"
                            >
                                {isMobileProcessing ? 'Processing...' : `Pay ${link.currency} ${paymentAmountText}`}
                            </button>
                            {mobileError && (
                                <p className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                                    {mobileError}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-10 text-center">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Secure Checkout by FlapaPay
                </p>
            </div>

            {showApprovalModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in font-sans">
                    <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-sm w-full text-center mx-4">
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <svg className="w-10 h-10 text-orange-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M12 12h.01M12 6h.01M12 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-black mb-4">Complete Payment</h3>
                        <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                            A prompt has been sent to <strong>{mobileNumber}</strong>. Please enter your PIN to confirm.
                        </p>
                        <div className="mb-6 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-left">
                            <p className="text-[11px] font-black uppercase tracking-widest text-orange-700/70">Wallet Details</p>
                            <p className="mt-1 text-sm font-bold text-orange-950">{mobileNumber}</p>
                            <p className="mt-1 text-xs font-semibold text-orange-800">Mobile money payment in progress</p>
                        </div>
                        {mobileStatusMessage && (
                            <p className="text-sm font-bold text-orange-600 mb-6">{mobileStatusMessage}</p>
                        )}
                        <div className="flex justify-center gap-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
