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
    const { } = useAuth();
    const [payoutMethod, setPayoutMethod] = useState<'mobile' | 'bank'>('mobile');
    const [recipients, setRecipients] = useState<Recipient[]>([
        { id: crypto.randomUUID(), phoneNumber: '', amount: '', provider: 'MTN_MOMO_ZMB' }
    ]);
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [isLoadingBalance, setIsLoadingBalance] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
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
            await api.post('/v1/payouts/bulk', payload);

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
        <div className="min-h-screen bg-white flex font-sans selection:bg-orange-100" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
            {/* Sidebar */}
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen z-40">
                <Sidebar isOpen={true} />
            </div>

            <main className="flex-1 min-h-screen p-6 md:p-8 relative overflow-x-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-100/20 via-emerald-100/10 to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Header */}
                    <header className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => navigate(-1)} 
                                className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 group"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-black transition-colors" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Bulk Remittance</h1>
                                <p className="text-gray-500 mt-1">Send multiple payouts in one click</p>
                            </div>
                        </div>
                    </header>

                    {error && (
                        <div className="mb-6 p-5 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {/* Top Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Wallet Balance */}
                        <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/20">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <Wallet className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium opacity-80">ZMW Funding Wallet</p>
                                    {isLoadingBalance ? (
                                        <div className="h-8 w-32 bg-white/20 rounded animate-pulse mt-1"></div>
                                    ) : (
                                        <p className="text-3xl font-bold mt-1">
                                            ZMW {walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Payout Summary */}
                        <div className="bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                        <Send className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium opacity-80">Total Remittance</p>
                                        <p className="text-3xl font-bold mt-1">
                                            ZMW {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-xs opacity-75 mt-1">{recipients.length} Recipient(s)</p>
                                    </div>
                                </div>
                                {totalAmount > walletBalance && (
                                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-xs font-bold">Insufficient</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Method Selector */}
                    <div className="bg-gray-50 p-1.5 rounded-2xl flex gap-2 mb-8 w-fit">
                        <button
                            onClick={() => setPayoutMethod('mobile')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                                payoutMethod === 'mobile' 
                                    ? 'bg-white text-orange-600 shadow-md' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Smartphone className="w-5 h-5" />
                            Mobile Money
                        </button>
                        <button
                            onClick={() => setPayoutMethod('bank')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                                payoutMethod === 'bank' 
                                    ? 'bg-white text-indigo-600 shadow-md' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Building2 className="w-5 h-5" />
                            Bank Upload
                            <span className="text-[9px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full ml-1">SOON</span>
                        </button>
                    </div>


                    {/* Dynamic Recipient Form Container */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {payoutMethod === 'bank' ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-6">
                                    <Building2 className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">Bank Bulk Payouts</h3>
                                <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                                    Direct to bank API mass uploads are currently in development. You will be notified when this feature goes live.
                                </p>
                            </div>
                        ) : (
                            <div className="p-6">
                                {/* Table Header */}
                                <div className="grid grid-cols-12 gap-4 pb-4 mb-4 border-b-2 border-gray-200">
                                    <p className="col-span-1 text-xs font-semibold text-gray-500 text-center">#</p>
                                    <p className="col-span-4 text-xs font-semibold text-gray-500">Phone Number</p>
                                    <p className="col-span-3 text-xs font-semibold text-gray-500">Provider</p>
                                    <p className="col-span-3 text-xs font-semibold text-gray-500 text-right">Amount (ZMW)</p>
                                    <p className="col-span-1"></p>
                                </div>

                                <div className="space-y-3">
                                    {recipients.map((recipient, i) => (
                                        <div key={recipient.id} className="grid grid-cols-12 gap-4 items-center bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-orange-200 transition-all group">
                                            <div className="col-span-1 flex items-center justify-center">
                                                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-xs font-bold text-gray-500">
                                                    {i + 1}
                                                </div>
                                            </div>
                                            <div className="col-span-4">
                                                <div className="relative">
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-gray-200 pr-2 pointer-events-none">
                                                        <ReactCountryFlag countryCode="ZM" svg className="w-4 h-4" />
                                                        <span className="font-semibold text-gray-500 text-xs">+260</span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="97 000 0000"
                                                        value={recipient.phoneNumber.replace(/^260/, '')}
                                                        onChange={(e) => handleUpdateRecipient(recipient.id, 'phoneNumber', e.target.value)}
                                                        className="w-full bg-white pl-[72px] pr-3 py-3 rounded-lg border border-gray-200 outline-none text-sm font-semibold text-gray-900 focus:border-orange-500 transition-colors placeholder:text-gray-300"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-span-3">
                                                <div className="relative">
                                                    <select
                                                        value={recipient.provider}
                                                        onChange={(e) => handleUpdateRecipient(recipient.id, 'provider', e.target.value)}
                                                        className="w-full bg-white px-4 py-3 rounded-lg border border-gray-200 outline-none text-sm font-semibold text-gray-900 focus:border-orange-500 transition-colors appearance-none cursor-pointer"
                                                    >
                                                        <option value="MTN_MOMO_ZMB">MTN Zambia</option>
                                                        <option value="AIRTEL_OAPI_ZMB">Airtel Zambia</option>
                                                        <option value="ZAMTEL_ZMB">Zamtel</option>
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
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
                                                    className="w-full bg-white px-4 py-3 rounded-lg border border-gray-200 outline-none text-sm font-semibold text-gray-900 focus:border-orange-500 transition-colors placeholder:text-gray-300 text-right font-mono"
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <button
                                                    onClick={() => handleRemoveRecipient(recipient.id)}
                                                    className={`p-2 rounded-lg hover:bg-rose-50 hover:text-rose-500 transition-colors ${
                                                        recipients.length === 1 ? 'opacity-30 cursor-not-allowed text-gray-300' : 'text-gray-400'
                                                    }`}
                                                    disabled={recipients.length === 1}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 flex items-center justify-between border-t border-gray-100 mt-6">
                                    <button
                                        onClick={handleAddRecipient}
                                        disabled={recipients.length >= 20}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                                            recipients.length >= 20
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white hover:shadow-lg'
                                        }`}
                                    >
                                        <Plus className="w-5 h-5" />
                                        Add Recipient
                                    </button>

                                    <p className="text-sm font-semibold text-gray-500">
                                        {recipients.length} / 20 Recipients
                                    </p>
                                </div>

                                <div className="pt-6 flex justify-end">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || totalAmount > walletBalance || recipients.some(r => !r.amount || !r.phoneNumber)}
                                        className={`flex items-center gap-3 px-8 py-4 rounded-xl text-sm font-bold transition-all ${
                                            (isSubmitting || totalAmount > walletBalance || recipients.some(r => !r.amount || !r.phoneNumber))
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg hover:-translate-y-0.5'
                                        }`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                Initiate Payout
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

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
