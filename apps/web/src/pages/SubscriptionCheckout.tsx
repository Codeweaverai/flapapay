import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/axios';
import { Button } from '../components/ui/Button';

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

type SessionDetails = {
    id: string;
    amount_total: number;
    currency: string;
    success_url: string;
    merchant?: { name?: string };
    subscription_details?: {
        product_name?: string;
        product_description?: string;
        billing_interval?: string;
        interval_count?: number;
        trial_days?: number;
    };
};

const CardPaymentForm: React.FC<{ session: SessionDetails; captureContext: string; onSuccess: () => void }> = ({ session, captureContext, onSuccess }) => {
    const numberRef = useRef<HTMLDivElement>(null);
    const cvvRef = useRef<HTMLDivElement>(null);
    const microformRef = useRef<any>(null);

    const [expMonth, setExpMonth] = useState('');
    const [expYear, setExpYear] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [flexReady, setFlexReady] = useState(false);

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
            } catch (err: any) {
                if (mounted) setError(err.message || 'Failed to initialize secure card input.');
            }
        })();

        return () => {
            mounted = false;
        };
    }, [captureContext]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!microformRef.current) return;
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
            setError(err?.message || 'Card validation failed.');
            setLoading(false);
            return;
        }

        try {
            await api.post(`/v1/checkout/sessions/${session.id}/confirm`, {
                payment_method: 'card',
                payment_details: {
                    transientToken,
                    expirationMonth: expMonth,
                    expirationYear: expYear,
                },
            });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Subscription payment failed. Please try again.');
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

            {error && (
                <p className="text-red-500 text-sm font-bold bg-red-50 px-4 py-3 rounded-xl border border-red-100">{error}</p>
            )}

            <Button
                type="submit"
                disabled={!flexReady || loading}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Processing...' : `Subscribe for ${session.currency} ${session.amount_total}`}
            </Button>

            <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Secured by CyberSource · Recurring card billing only
            </p>
        </form>
    );
};

const SubscriptionCheckout: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [session, setSession] = useState<SessionDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'SUCCESS'>('IDLE');
    const [captureContext, setCaptureContext] = useState('');
    const [intentError, setIntentError] = useState('');

    useEffect(() => {
        const fetchSessionAndIntent = async () => {
            setLoading(true);
            setError('');
            setIntentError('');
            try {
                const sessionRes = await api.get(`/v1/checkout/sessions/${id}`);
                setSession(sessionRes.data);

                const intentRes = await api.post(`/v1/checkout/sessions/${id}/intent`);
                if (!intentRes.data.captureContext) {
                    throw new Error('Missing secure card context');
                }
                setCaptureContext(intentRes.data.captureContext);
            } catch (err: any) {
                const apiError = err.response?.data?.error;
                if (apiError) {
                    setIntentError(apiError);
                } else {
                    setError('Invalid or expired subscription session.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSessionAndIntent();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (error || !session) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

    if (status === 'SUCCESS') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
                <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md w-full">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-3xl font-black mb-2">Subscription Active!</h2>
                    <p className="text-slate-500 mb-8">Your {session.subscription_details?.product_name} plan is now active.</p>
                    <Button onClick={() => { window.location.href = session.success_url; }} className="w-full bg-black text-white">Go to Dashboard</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
            <div className="max-w-[1000px] w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                    <div className="inline-block p-4 bg-white rounded-3xl shadow-sm border border-slate-100">
                        <img src="/assets/images/flapapaylogoicon.png" alt="FlapaPay" className="h-8 w-auto" />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl font-black text-slate-900 leading-tight">
                            Subscribe to {session.subscription_details?.product_name || 'Premium Plan'}
                        </h1>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed">
                            {session.subscription_details?.product_description || 'Get full access to all professional features and priority support.'}
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-slate-950">{session.currency} {session.amount_total}</span>
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">
                                / {session.subscription_details?.billing_interval || 'month'}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-slate-600 font-medium">
                                <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-[10px] font-bold">✓</div>
                                Recurring billing on your saved card rail
                            </div>
                            <div className="flex items-center gap-3 text-slate-600 font-medium">
                                <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-[10px] font-bold">✓</div>
                                Powered by CyberSource secure card tokenization
                            </div>
                            {session.subscription_details?.trial_days && session.subscription_details.trial_days > 0 && (
                                <div className="flex items-center gap-3 text-indigo-600 font-bold">
                                    <div className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px]">★</div>
                                    {session.subscription_details.trial_days} days free trial
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.06)] border border-slate-100">
                    <div className="mb-10 text-center">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Secure Checkout</p>
                        <h2 className="text-xl font-bold text-slate-800">Card Subscription</h2>
                        <p className="mt-3 text-sm text-slate-500">
                            Subscription billing is processed on CyberSource only. Mobile money is not available for subscription renewals.
                        </p>
                    </div>

                    {intentError ? (
                        <div className="text-red-500 text-sm font-bold bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                            {intentError}
                        </div>
                    ) : captureContext ? (
                        <CardPaymentForm session={session} captureContext={captureContext} onSuccess={() => setStatus('SUCCESS')} />
                    ) : (
                        <div className="h-40 flex items-center justify-center text-slate-300 font-bold border-2 border-dashed border-slate-100 rounded-[2rem]">
                            Loading secure card form...
                        </div>
                    )}

                    <p className="mt-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Powered by FlapaPay Billing
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionCheckout;
