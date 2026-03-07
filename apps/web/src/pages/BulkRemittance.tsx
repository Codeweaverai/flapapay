import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { ArrowLeft, Plus, Trash2, Send, Building2, Smartphone, Wallet, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { PinApprovalModal } from '../components/ui/PinApprovalModal';
import { Button } from '../components/ui/Button';
import ReactCountryFlag from 'react-country-flag';

interface Recipient {
    id: string;
    phoneNumber: string;
    amount: string;
    provider: string;
}

export const BulkRemittance: React.FC = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [payoutMethod, setPayoutMethod] = useState<'mobile' | 'bank'>('mobile');
    const [recipients, setRecipients] = useState<Recipient[]>([
        { id: crypto.randomUUID(), phoneNumber: '', amount: '', provider: 'MTN_MOMO_ZMB' }
    ]);
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [isLoadingBalance, setIsLoadingBalance] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<any>(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [error, setError] = useState('');

    const fetchBalance = async () => {
        try {
            const response = await api.get('/v1/wallet/balance');
            const zmwWallet = response.data.wallets?.find((w: any) => w.currency === 'ZMW');
            setWalletBalance(zmwWallet ? parseFloat(zmwWallet.balance) : 0);
        } catch (error) {
            console.error('Failed to fetch balance', error);
            setWalletBalance(0);
        } finally {
            setIsLoadingBalance(false);
        }
    };

    // Fetch ZMW wallet balance
    useEffect(() => {
        fetchBalance();
    }, []);

    const handleAddRecipient = () => {
        if (recipients.length >= 20) {
            alert("Maximum of 20 recipients allowed per bulk request.");
            return;
        }
        setRecipients([...recipients, { id: crypto.randomUUID(), phoneNumber: '', amount: '', provider: 'MTN_MOMO_ZMB' }]);
    };

    const handleRemoveRecipient = (id: string) => {
        if (recipients.length === 1) return;
        setRecipients(recipients.filter(r => r.id !== id));
    };

    const handleUpdateRecipient = (id: string, field: keyof Recipient, value: string) => {
        setRecipients(recipients.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const totalAmount = recipients.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

    const handleSubmit = async () => {
        if (totalAmount > walletBalance) {
            setError('Insufficient funds in ZMW wallet.');
            return;
        }

        const emptyFields = recipients.some(r => !r.phoneNumber || !r.amount);
        if (emptyFields) {
            setError('Please fill out all recipient fields.');
            return;
        }

        setError('');
        setIsPinModalOpen(true);
    };

    const handlePinSuccess = async (pin: string) => {
        setIsPinModalOpen(false);
        setIsSubmitting(true);
        setSubmitResult(null);
        setError('');
        setShowApprovalModal(true);

        // Map to pawapay format exactly as specified
        const payload = recipients.map((r, index) => {
            const phoneNumber = r.phoneNumber.startsWith('260') ? r.phoneNumber : `260${r.phoneNumber.replace(/^0+/, '')}`;
            return {
                payoutId: crypto.randomUUID(),
                recipient: {
                    type: 'MMO',
                    accountDetails: {
                        phoneNumber: phoneNumber,
                        provider: r.provider
                    }
                },
                amount: parseFloat(r.amount).toString(), // String representation like "15" or "15.00"
                currency: 'ZMW',
                clientReferenceId: `BULK-INV-${Date.now().toString().slice(-6)}-${index}`,
                customerMessage: 'FlapaPay Bulk Remittance',
                metadata: [
                    {
                        orderId: `ORD-${Date.now()}`
                    }
                ]
            };
        });

        try {
            // Include pin for backend verification implicitly or ideally in headers if backend supported it
            console.log('PIN approved for bulk transfer:', pin);
            const res = await api.post('/v1/payouts/bulk', payload);
            setSubmitResult(res.data);

            setTimeout(async () => {
                setShowApprovalModal(false);
                setShowSuccessModal(true);
                setRecipients([{ id: crypto.randomUUID(), phoneNumber: '', amount: '', provider: 'MTN_MOMO_ZMB' }]);
                await fetchBalance();
                setIsSubmitting(false);
            }, 1000); // UI delay to show "Processing" state as standard practice
        } catch (error: any) {
            console.error('Payout failed:', error);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to initiate payouts.';
            setError('Error: ' + errorMessage);
            setShowApprovalModal(false);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex font-sans selection:bg-orange-100">
            {/* Sidebar */}
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen z-40">
                <Sidebar isOpen={true} />
            </div>

            <div className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden">
                {/* Ambient Glow Effects */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-orange-500/10 via-emerald-500/5 to-transparent rounded-full -mr-96 -mt-96 blur-3xl pointer-events-none z-0"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/5 via-transparent to-transparent rounded-full -ml-40 -mb-40 blur-3xl pointer-events-none z-0"></div>

                <div className="relative z-10 flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <header className="bg-white/60 backdrop-blur-xl border-b border-gray-100/50 flex items-center justify-between px-12 py-8 shrink-0 z-20 shadow-sm sticky top-0">
                        <div className="flex items-center gap-8">
                            <button onClick={() => navigate(-1)} className="p-3.5 hover:bg-gray-50 rounded-2xl transition-all text-gray-400 hover:text-black hover:scale-110 active:scale-95 border border-transparent hover:border-gray-100 shadow-sm">
                                <ArrowLeft className="w-6 h-6 stroke-[2.5px]" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                                    Bulk Remittance
                                </h1>
                                <p className="text-xs font-bold text-gray-400 mt-2 tracking-widest uppercase">
                                    Send multiple payouts in one click
                                </p>
                            </div>
                        </div>
                    </header>

                    {/* Scrollable Layout */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
                        {error && (
                            <div className="w-[95%] mx-auto mb-8 p-5 bg-red-50 border border-red-100 text-red-600 rounded-[24px] text-center font-black flex items-center justify-center gap-3 italic">
                                <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs">!</span>
                                {error}
                            </div>
                        )}
                        <div className="w-[95%] mx-auto space-y-12">

                            {/* Top Info Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Wallet Balance */}
                                <div className="bg-white rounded-[46px] p-12 relative overflow-hidden group shadow-xl shadow-gray-200/50 border border-gray-100 hover:border-orange-200 transition-colors">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full -mr-20 -mt-20 blur-[60px] group-hover:bg-orange-100 transition-colors"></div>
                                    <div className="relative z-10 flex items-center gap-8">
                                        <div className="h-20 w-20 bg-orange-50 rounded-[1.5rem] flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                                            <Wallet className="w-10 h-10" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">ZMW Funding Wallet</p>
                                            {isLoadingBalance ? (
                                                <div className="h-8 w-32 bg-gray-100 rounded animate-pulse"></div>
                                            ) : (
                                                <p className="text-4xl font-black text-gray-900 tracking-tighter">ZMW {walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Payout Summary */}
                                <div className="bg-white rounded-[46px] p-12 relative overflow-hidden group shadow-xl shadow-gray-200/50 border border-gray-100 hover:border-emerald-200 transition-colors">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-20 -mt-20 blur-[60px] group-hover:bg-emerald-100 transition-colors"></div>
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div>
                                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Total Remittance</p>
                                            <p className="text-4xl font-black text-gray-900 tracking-tighter text-emerald-600">ZMW {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-3 tracking-widest">{recipients.length} Recipient(s)</p>
                                        </div>
                                        {totalAmount > walletBalance && (
                                            <div className="flex items-center gap-2 text-rose-500 bg-rose-50 px-4 py-2 rounded-full">
                                                <AlertCircle className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">Insufficient Funds</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Method Selector */}
                            <div className="flex bg-gray-100/50 p-2 rounded-full w-fit">
                                <button
                                    onClick={() => setPayoutMethod('mobile')}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-full text-sm font-black uppercase tracking-widest transition-all ${payoutMethod === 'mobile' ? 'bg-white text-orange-600 shadow-md scale-105' : 'text-gray-400 hover:text-gray-900 hover:bg-white/50'
                                        }`}
                                >
                                    <Smartphone className="w-5 h-5" />
                                    Mobile Money (Zambia)
                                </button>
                                <button
                                    onClick={() => setPayoutMethod('bank')}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-full text-sm font-black uppercase tracking-widest transition-all ${payoutMethod === 'bank' ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-gray-400 hover:text-gray-900 hover:bg-white/50'
                                        }`}
                                >
                                    <Building2 className="w-5 h-5" />
                                    Bank Upload <span className="text-[9px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full ml-2">SOON</span>
                                </button>
                            </div>

                            {/* Dynamic Recipient Form Container */}
                            <div className="bg-[#1A1A1A] rounded-[48px] p-1 shadow-2xl shadow-gray-200 overflow-hidden text-white transition-all">
                                <div className="bg-white rounded-[46px] p-12 relative overflow-hidden">
                                    {payoutMethod === 'bank' ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                            <div className="h-24 w-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-8 border border-indigo-100">
                                                <Building2 className="w-12 h-12" />
                                            </div>
                                            <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-4">Bank Bulk Payouts</h3>
                                            <p className="text-sm font-bold text-gray-400 max-w-md mx-auto leading-relaxed">
                                                Direct to bank API mass uploads are currently in development. You will be notified when this feature goes live.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-8 relative z-10">
                                            <div className="flex items-center justify-between border-b border-gray-100 pb-8">
                                                <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.4em] flex items-center gap-4">
                                                    <div className="h-2.5 w-8 bg-orange-500 rounded-full shadow-[0_0_12px_rgba(249,115,22,0.3)]"></div>
                                                    Recipient Ledger
                                                </h2>
                                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-4 py-2 rounded-full">
                                                    Powered by FlapaPay
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-12 gap-6 pb-4 pt-4 border-b-[3px] border-black">
                                                <p className="col-span-1 text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] text-center">No.</p>
                                                <p className="col-span-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.4em]">Phone Number</p>
                                                <p className="col-span-3 text-[9px] font-black text-gray-400 uppercase tracking-[0.4em]">Provider</p>
                                                <p className="col-span-3 text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] text-right">Amount (ZMW)</p>
                                                <p className="col-span-1"></p>
                                            </div>

                                            <div className="space-y-4">
                                                {recipients.map((recipient, i) => (
                                                    <div key={recipient.id} className="grid grid-cols-12 gap-6 items-center bg-gray-50/50 p-4 rounded-3xl border border-transparent hover:border-orange-200 transition-colors group">
                                                        <div className="col-span-1 flex items-center justify-center">
                                                            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:text-orange-500">
                                                                {(i + 1).toString().padStart(2, '0')}
                                                            </div>
                                                        </div>
                                                        <div className="col-span-4">
                                                            <div className="relative group">
                                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-gray-100 pr-3 pointer-events-none">
                                                                    <ReactCountryFlag countryCode="ZM" svg />
                                                                    <span className="font-bold text-gray-400 text-xs">+260</span>
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    placeholder="971234567"
                                                                    value={recipient.phoneNumber.replace(/^260/, '')}
                                                                    onChange={(e) => handleUpdateRecipient(recipient.id, 'phoneNumber', e.target.value)}
                                                                    className="w-full bg-white pl-[88px] pr-4 py-4 rounded-2xl border border-gray-100 outline-none text-sm font-black text-gray-900 focus:border-orange-500 transition-colors placeholder:text-gray-300 placeholder:font-bold shadow-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-span-3">
                                                            <div className="relative">
                                                                <select
                                                                    value={recipient.provider}
                                                                    onChange={(e) => handleUpdateRecipient(recipient.id, 'provider', e.target.value)}
                                                                    className="w-full bg-white px-6 py-4 rounded-2xl border border-gray-100 outline-none text-sm font-black text-gray-900 focus:border-orange-500 transition-colors shadow-sm appearance-none cursor-pointer"
                                                                >
                                                                    <option value="MTN_MOMO_ZMB">MTN Zambia</option>
                                                                    <option value="AIRTEL_OAPI_ZMB">Airtel Zambia</option>
                                                                    <option value="ZAMTEL_ZMB">Zamtel</option>
                                                                </select>
                                                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-span-3">
                                                            <input
                                                                type="number"
                                                                placeholder="0.00"
                                                                value={recipient.amount}
                                                                onChange={(e) => handleUpdateRecipient(recipient.id, 'amount', e.target.value)}
                                                                className="w-full bg-white px-6 py-4 rounded-2xl border border-gray-100 outline-none text-sm font-black text-gray-900 focus:border-orange-500 transition-colors placeholder:text-gray-300 placeholder:font-bold shadow-sm text-right font-mono"
                                                            />
                                                        </div>
                                                        <div className="col-span-1 flex justify-center">
                                                            <button
                                                                onClick={() => handleRemoveRecipient(recipient.id)}
                                                                className={`p-3 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors ${recipients.length === 1 ? 'opacity-30 cursor-not-allowed text-gray-300' : 'text-gray-400'}`}
                                                                disabled={recipients.length === 1}
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="pt-6 flex items-center justify-between border-t border-gray-100">
                                                <button
                                                    onClick={handleAddRecipient}
                                                    disabled={recipients.length >= 20}
                                                    className={`flex items-center gap-3 px-8 py-4 rounded-full text-sm font-black uppercase tracking-widest transition-all ${recipients.length >= 20
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white hover:shadow-lg hover:shadow-orange-500/20'
                                                        }`}
                                                >
                                                    <Plus className="w-5 h-5" />
                                                    Add Recipient
                                                </button>

                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {recipients.length} / 20 Recipients
                                                </p>
                                            </div>

                                            <div className="pt-12 flex justify-end">
                                                <button
                                                    onClick={handleSubmit}
                                                    disabled={isSubmitting || totalAmount > walletBalance || recipients.some(r => !r.amount || !r.phoneNumber)}
                                                    className={`
                                                        flex items-center gap-4 px-12 py-6 rounded-full text-base font-black uppercase tracking-widest transition-all
                                                        ${(isSubmitting || totalAmount > walletBalance || recipients.some(r => !r.amount || !r.phoneNumber))
                                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-inner'
                                                            : 'bg-black text-white hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/20 hover:bg-neutral-900'
                                                        }
                                                    `}
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <Loader2 className="w-6 h-6 animate-spin" />
                                                            Processing Payouts...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="w-6 h-6" />
                                                            Initiate Bulk Payout
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Approval Modal (Processing) */}
            {showApprovalModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xl flex items-center justify-center z-[100] animate-in fade-in duration-300">
                    <div className="bg-white p-10 rounded-[48px] shadow-2xl max-w-sm w-full text-center mx-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-yellow-500 to-orange-500 animate-pulse"></div>

                        {/* Animated Check Icon */}
                        <div className="w-20 h-20 bg-orange-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-inner border border-orange-100 relative">
                            <div className="absolute inset-0 bg-orange-100 rounded-[32px] animate-ping opacity-20"></div>
                            <svg className="w-10 h-10 text-orange-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>

                        <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Processing Remittance</h3>

                        {/* Amount Display */}
                        <div className="my-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Total Payouts</p>
                            <p className="text-3xl font-black text-gray-900">{totalAmount.toLocaleString()} ZMW</p>
                        </div>

                        <p className="text-gray-500 font-medium mb-6 leading-relaxed text-xs uppercase tracking-widest">
                            Please wait while we verify your recipients and process the payload
                        </p>

                        {/* Loading Dots */}
                        <div className="flex justify-center gap-2">
                            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                            <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in zoom-in duration-300">
                    <div className="bg-white p-10 rounded-[56px] shadow-2xl max-w-sm w-full text-center mx-4 relative border border-white/50 overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500"></div>

                        {/* Success Icon */}
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-[40px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30 transform rotate-12">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Remittance Complete!</h3>
                        <p className="text-gray-500 font-bold mb-6 uppercase text-[10px] tracking-widest">
                            Your bulk payout was fully submitted
                        </p>

                        {/* Transaction Details Card */}
                        <div className="mb-8 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 text-left">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 font-semibold uppercase">Total Payouts</span>
                                    <span className="text-lg font-black text-gray-900">{totalAmount.toLocaleString()} ZMW</span>
                                </div>
                                <div className="pt-3 border-t border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-xs font-bold text-emerald-600">Status: PROCESSING BATCH</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 font-medium mb-6 leading-relaxed">
                            The funds are being distributed to your recipients.
                        </p>

                        <Button
                            onClick={() => {
                                setShowSuccessModal(false);
                            }}
                            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all"
                        >
                            Return to Remittances
                        </Button>
                    </div>
                </div>
            )}

            <PinApprovalModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                onSuccess={handlePinSuccess}
                description={`Approve bulk remittance of ${totalAmount.toLocaleString()} ZMW to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`}
            />
        </div>
    );
};
