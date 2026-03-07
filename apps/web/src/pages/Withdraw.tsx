import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Sidebar } from '../components/layout/Sidebar';
import ReactCountryFlag from 'react-country-flag';
import { PinApprovalModal } from '../components/ui/PinApprovalModal';

interface Wallet {
    id: string;
    currency: string;
    balance: string;
}

interface LinkedBank {
    id: string;
    bank_name: string;
    account_name: string;
    account_number: string;
    bank_id: string;
    country: string;
}

const BANK_LOGOS: Record<string, string> = {
    'zanaco': 'https://cdn.brandfetch.io/id8rWWhZ0S/w/768/h/226/theme/light/logo.png?c=1bxid64Mup7aczewSAYMX&t=1765290669363',
    'stanbic': 'https://cdn.brandfetch.io/idtBHsdHkP/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1764691523293',
    'absa': 'https://cdn.brandfetch.io/idIIZJY7QN/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1667792595017',
    'access': 'https://cdn.brandfetch.io/idPXJmyni4/w/400/h/400/theme/light/icon.png?c=1bxid64Mup7aczewSAYMX&t=1667560957752',
    'boc': 'https://cdn.brandfetch.io/ida3fnJjf9/w/1105/h/1105/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1677603041423',
    'citi': 'https://cdn.brandfetch.io/idr8xpMOko/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1761814355509',
    'ecobank': 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Ecobank_Logo_EN.png',
    'firstcapital': 'https://cdn.brandfetch.io/idaj4d7B1e/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1771529890408',
    'fnb': 'https://cdn.brandfetch.io/idMm5AKGl0/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668184013589',
    'stanchart': 'https://cdn.brandfetch.io/idasTAHEfB/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1766383628158',
    'uba': 'https://cdn.brandfetch.io/idbEJ2XWew/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1718352485394',
    'zicb': 'https://cdn.brandfetch.io/idUnVed1lu/w/447/h/159/theme/dark/logo.png?c=1bxid64Mup7aczewSAYMX&t=1767416627446',
    'natsave': 'https://cdn.brandfetch.io/id2RUtvBPh/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1763982236282',
    'bayport': 'https://cdn.brandfetch.io/idXmYQId4y/w/250/h/56/theme/dark/logo.png?c=1bxid64Mup7aczewSAYMX&t=1752223453132'
};

const getBankLogo = (bankName: string) => {
    const name = bankName.toLowerCase();
    if (name.includes('zanaco')) return BANK_LOGOS.zanaco;
    if (name.includes('stanbic')) return BANK_LOGOS.stanbic;
    if (name.includes('absa')) return BANK_LOGOS.absa;
    if (name.includes('access')) return BANK_LOGOS.access;
    if (name.includes('china')) return BANK_LOGOS.boc;
    if (name.includes('citi')) return BANK_LOGOS.citi;
    if (name.includes('eco')) return BANK_LOGOS.ecobank;
    if (name.includes('first capital')) return BANK_LOGOS.firstcapital;
    if (name.includes('fnb') || name.includes('first national bank')) return BANK_LOGOS.fnb;
    if (name.includes('chartered') || name.includes('scb')) return BANK_LOGOS.stanchart;
    if (name.includes('uba') || name.includes('united bank')) return BANK_LOGOS.uba;
    if (name.includes('zicb')) return BANK_LOGOS.zicb;
    if (name.includes('natsave')) return BANK_LOGOS.natsave;
    if (name.includes('bayport')) return BANK_LOGOS.bayport;
    return null;
};

export const Withdraw: React.FC = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [linkedBanks, setLinkedBanks] = useState<LinkedBank[]>([]);
    const [selectedWallet, setSelectedWallet] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [mobileNumber, setMobileNumber] = useState<string>('');
    const [provider, setProvider] = useState<string>('MTN_MOMO_ZMB');
    const [selectedBankId, setSelectedBankId] = useState<string>('');
    const [withdrawMethod, setWithdrawMethod] = useState<'mobile_money' | 'bank_account'>('mobile_money');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);

    useEffect(() => {
        if (token) {
            // Fetch User Data
            api.get('/auth/me').then(res => {
                if (res.data.wallets) {
                    setWallets(res.data.wallets);
                    if (res.data.wallets.length > 0) {
                        setSelectedWallet(res.data.wallets[0].id);
                    }
                }
            });

            // Fetch Linked Banks
            api.get('/merchants/lenco/accounts').then(res => {
                setLinkedBanks(res.data);
                if (res.data.length > 0) {
                    setSelectedBankId(res.data[0].id);
                }
            });
        }
    }, [token]);

    const wallet = useMemo(() => wallets.find(w => w.id === selectedWallet), [wallets, selectedWallet]);

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (withdrawMethod === 'bank_account' && !selectedBankId) {
            setError('Please select a bank account');
            return;
        }

        if (withdrawMethod === 'mobile_money' && !mobileNumber) {
            setError('Please enter a mobile number');
            return;
        }

        setIsPinModalOpen(true);
    };

    const handlePinSuccess = async (pin: string) => {
        setIsLoading(true);
        setError('');

        if (withdrawMethod === 'mobile_money') {
            try {
                let formattedNumber = mobileNumber.replace(/\D/g, '');
                if (formattedNumber.startsWith('09') || formattedNumber.startsWith('07')) {
                    formattedNumber = '26' + formattedNumber;
                } else if (formattedNumber.startsWith('9') || formattedNumber.startsWith('7')) {
                    formattedNumber = '260' + formattedNumber;
                }

                const res = await api.post('/pawapay/payout', {
                    amount: parseFloat(amount),
                    phoneNumber: formattedNumber,
                    provider: provider,
                    currency: wallet?.currency || 'ZMW',
                    walletId: selectedWallet,
                    customerMessage: 'FlapaPay Withdrawal',
                    pin
                });

                if (res.data.status === 'ACCEPTED' || res.data.status === 'ENQUEUED' || res.data.status === 'COMPLETED') {
                    // Skip polling and immediately open the "Completed" modal
                    setShowSuccessModal(true);
                    setIsLoading(false);
                    setTimeout(() => navigate('/dashboard'), 3000);

                } else {
                    setError(`Withdrawal failed: ${res.data.status} `);
                    setIsLoading(false);
                }
            } catch (err: any) {
                setIsLoading(false);
                throw err;
            }
        } else {
            // Bank Account Withdrawal
            const bank = linkedBanks.find(b => b.id === selectedBankId);
            if (!bank) {
                setError('Please select a bank account');
                setIsLoading(false);
                return;
            }

            try {
                const res = await api.post('/wallets/withdraw', {
                    walletId: selectedWallet,
                    amount: parseFloat(amount),
                    destinationType: 'bank_account',
                    destinationDetails: {
                        accountNumber: bank.account_number,
                        bankId: bank.bank_id,
                        accountName: bank.account_name,
                        country: bank.country
                    },
                    pin
                });

                if (res.data.success) {
                    setShowSuccessModal(true);
                    setTimeout(() => navigate('/dashboard'), 3000);
                }
            } catch (err: any) {
                throw err;
            } finally {
                setIsLoading(false);
            }
        }
    };

    const providers = [
        { id: 'MTN_MOMO_ZMB', name: 'MTN', logo: '/assets/images/MTN_Logo.svg' },
        { id: 'AIRTEL_OAPI_ZMB', name: 'Airtel', logo: '/assets/images/Airtel_Africa_logo.svg' },
        { id: 'ZAMTEL_ZMB', name: 'Zamtel', logo: '/assets/images/zamtel.png' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex">
            {/* Sidebar (Desktop) */}
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100 bg-white shadow-sm">
                <Sidebar />
            </div>

            <main className="flex-1 p-8 md:p-12 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    <header className="mb-12 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-2 h-8 bg-black rounded-full"></span>
                                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Withdraw Funds</h1>
                            </div>
                            <p className="text-gray-500 font-bold ml-5 uppercase text-xs tracking-widest">Settle your earnings to your personal account</p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-12 h-12 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center group"
                        >
                            <svg className="w-6 h-6 text-gray-400 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Main Form Area */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Method Tabs */}
                            <div className="bg-gray-100/50 p-2 rounded-[28px] flex gap-2 border border-gray-200/50">
                                <button
                                    onClick={() => setWithdrawMethod('mobile_money')}
                                    className={`flex - 1 flex items - center justify - center gap - 3 py - 4 rounded - [22px] font - black transition - all duration - 300 ${withdrawMethod === 'mobile_money' ? 'bg-white text-gray-900 shadow-xl shadow-black/5' : 'text-gray-400 hover:text-gray-600'} `}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    Mobile Money
                                </button>
                                <button
                                    onClick={() => setWithdrawMethod('bank_account')}
                                    className={`flex - 1 flex items - center justify - center gap - 3 py - 4 rounded - [22px] font - black transition - all duration - 300 ${withdrawMethod === 'bank_account' ? 'bg-white text-gray-900 shadow-xl shadow-black/5' : 'text-gray-400 hover:text-gray-600'} `}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    Bank Account
                                </button>
                            </div>

                            <form onSubmit={handleWithdraw} className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                                {error && (
                                    <div className="p-5 bg-red-50 border border-red-100 text-red-600 rounded-[24px] text-center font-black flex items-center justify-center gap-3 italic">
                                        <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs">!</span>
                                        {error}
                                    </div>
                                )}

                                {/* Amount Section */}
                                <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Withdrawal Amount</label>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-4xl font-black text-gray-300">
                                                        {wallet?.currency === 'ZMW' ? 'K' : wallet?.currency || '$'}
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={amount}
                                                        onChange={(e) => setAmount(e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full bg-transparent text-6xl font-black text-gray-900 placeholder:text-gray-100 outline-none p-0"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="pb-4">
                                                <select
                                                    value={selectedWallet}
                                                    onChange={(e) => setSelectedWallet(e.target.value)}
                                                    className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl font-bold text-sm outline-none focus:border-black transition-all"
                                                >
                                                    {wallets.map(w => (
                                                        <option key={w.id} value={w.id}>{w.currency}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="pt-6 border-t border-gray-50 flex items-center gap-2">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Balance:</span>
                                            <span className="text-sm font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-lg">
                                                {wallet?.currency} {wallet?.balance}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {withdrawMethod === 'mobile_money' ? (
                                    <div className="space-y-8 animate-in fade-in duration-300">
                                        {/* Network Selector */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Select Provider</label>
                                            <div className="grid grid-cols-3 gap-4">
                                                {providers.map(p => (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => setProvider(p.id)}
                                                        className={`p - 6 rounded - [32px] border - 2 transition - all duration - 300 flex flex - col items - center gap - 3 group ${provider === p.id ? 'border-orange-500 bg-orange-50/50 shadow-xl shadow-orange-500/10 scale-[1.05]' : 'border-gray-50 bg-gray-50 hover:border-gray-200 hover:bg-white'} `}
                                                    >
                                                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm p-3 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110">
                                                            <img src={p.logo} alt={p.name} className="w-full h-full object-contain" />
                                                        </div>
                                                        <span className={`text - [11px] font - black uppercase tracking - tight ${provider === p.id ? 'text-orange-600' : 'text-gray-400'} `}>{p.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Phone Number */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Phone Number</label>
                                            <div className="relative group">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-3 border-r border-gray-100 pr-5">
                                                    <ReactCountryFlag countryCode="ZM" svg />
                                                    <span className="font-bold text-gray-400">+260</span>
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={mobileNumber}
                                                    onChange={(e) => setMobileNumber(e.target.value)}
                                                    placeholder="970000000"
                                                    className="w-full bg-white border-2 border-gray-100 rounded-[28px] px-32 py-6 text-xl font-black text-gray-900 placeholder:text-gray-200 outline-none focus:border-black transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8 animate-in fade-in duration-300">
                                        {/* Linked Banks Selector */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Select Bank Account</label>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/settings')}
                                                    className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline"
                                                >
                                                    ＋ Add Bank
                                                </button>
                                            </div>
                                            {linkedBanks.length === 0 ? (
                                                <div className="p-10 border-2 border-dashed border-gray-100 rounded-[40px] text-center space-y-4">
                                                    <p className="text-gray-400 font-bold">No bank accounts linked yet</p>
                                                    <Button onClick={() => navigate('/settings')} className="bg-black text-white px-8">Link Account</Button>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {linkedBanks.map(b => {
                                                        const isSelected = selectedBankId === b.id;
                                                        const logo = getBankLogo(b.bank_name);
                                                        return (
                                                            <button
                                                                key={b.id}
                                                                type="button"
                                                                onClick={() => setSelectedBankId(b.id)}
                                                                className={`p - 6 rounded - [32px] border - 2 text - left transition - all duration - 300 flex items - center gap - 5 group ${isSelected ? 'border-black bg-black shadow-xl scale-[1.02]' : 'border-gray-50 bg-gray-50 hover:border-gray-200 hover:bg-white'} `}
                                                            >
                                                                <div className={`w - 14 h - 14 rounded - 2xl p - 2 flex items - center justify - center overflow - hidden transition - transform group - hover: scale - 110 ${isSelected ? 'bg-white' : 'bg-white shadow-sm'} `}>
                                                                    {logo ? (
                                                                        <img src={logo} alt={b.bank_name} className="w-full h-full object-contain" />
                                                                    ) : (
                                                                        <span className="text-lg font-black text-gray-300 capitalize">{b.bank_name.charAt(0)}</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 overflow-hidden">
                                                                    <p className={`text - [10px] font - black uppercase tracking - widest truncate ${isSelected ? 'text-white/40' : 'text-gray-400'} `}>{b.bank_name}</p>
                                                                    <p className={`font - black truncate ${isSelected ? 'text-white' : 'text-gray-900'} `}>{b.account_name}</p>
                                                                    <p className={`text - [11px] font - mono mt - 0.5 ${isSelected ? 'text-white/60' : 'text-gray-400'} `}>{b.account_number}</p>
                                                                </div>
                                                                {isSelected && <span className="text-emerald-500 text-xl font-black">✓</span>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full py-8 bg-emerald-500 text-white text-2xl font-black rounded-[32px] shadow-[0_24px_48px_-12px_rgba(16,185,129,0.35)] hover:shadow-[0_32px_64px_-12px_rgba(16,185,129,0.45)] transform hover:-translate-y-1 active:scale-95 transition-all duration-300 border-none mt-4"
                                    isLoading={isLoading}
                                    disabled={!amount || (withdrawMethod === 'mobile_money' ? !mobileNumber : !selectedBankId)}
                                >
                                    Initiate Withdrawal
                                </Button>
                            </form>
                        </div>

                        {/* Sidebar / Info Area */}
                        <div className="space-y-8">
                            {/* Summary Card */}
                            {amount && parseFloat(amount) > 0 && (
                                <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-[0_20px_40px_rgba(0,0,0,0.03)] space-y-6 sticky top-8 animate-in fade-in zoom-in duration-500">
                                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 italic">
                                        Summary
                                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Net Amount</span>
                                            <span className="font-black text-gray-900">{parseFloat(amount).toLocaleString()} {wallet?.currency}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Processing Fee (3.5%)</span>
                                            <span className="font-black text-gray-900">{(parseFloat(amount) * 0.035).toLocaleString()} {wallet?.currency}</span>
                                        </div>
                                        <div className="pt-4 border-t border-gray-50 flex justify-between items-end">
                                            <span className="text-[10px] font-black uppercase text-gray-900 tracking-widest">To be debited</span>
                                            <span className="text-3xl font-black text-gray-900">{(parseFloat(amount) * 1.035).toLocaleString()} {wallet?.currency}</span>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-orange-50 rounded-2xl flex gap-3 items-start border border-orange-100/50">
                                        <div className="shrink-0 w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-[10px] text-orange-700 font-black">!</div>
                                        <p className="text-[11px] font-bold text-orange-700 leading-relaxed italic">
                                            {withdrawMethod === 'mobile_money'
                                                ? "Mobile money payouts are usually instant however some networks may take up to 2 hours."
                                                : "Bank transfers typically settle within 30 minutes during clearing hours."}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Help Section */}
                            <div className="p-8 bg-gray-900 rounded-[40px] text-white space-y-4">
                                <h4 className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
                                    Need Help?
                                    <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                                </h4>
                                <p className="text-xs text-white/60 font-medium leading-relaxed">
                                    Our settlement team is available 24/7 if you encounter any issues with your withdrawal.
                                </p>
                                <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black transition-all border border-white/10">
                                    Contact Support
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>



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

                        <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Transaction Completed!</h3>
                        <p className="text-gray-500 font-bold mb-6 uppercase text-[10px] tracking-widest">
                            Your withdrawal was successful
                        </p>

                        {/* Transaction Details Card */}
                        <div className="mb-8 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 text-left">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 font-semibold uppercase">Amount</span>
                                    <span className="text-lg font-black text-gray-900">{amount} {wallet?.currency}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 font-semibold uppercase">Fee (3.5%)</span>
                                    <span className="text-sm font-bold text-gray-700">{(parseFloat(amount || 0) * 0.035).toFixed(2)} {wallet?.currency}</span>
                                </div>
                                <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                                    <span className="text-xs text-gray-500 font-semibold uppercase">Total Debited</span>
                                    <span className="text-xl font-black text-emerald-600">{(parseFloat(amount || 0) * 1.035).toFixed(2)} {wallet?.currency}</span>
                                </div>
                                <div className="pt-3 border-t border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-xs font-bold text-emerald-600">Status: COMPLETED</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 font-medium mb-6 leading-relaxed">
                            Funds have been sent to your mobile wallet. You should receive them shortly.
                        </p>

                        <Button
                            onClick={() => navigate('/dashboard')}
                            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all"
                        >
                            Return to Dashboard
                        </Button>
                    </div>
                </div>
            )}

            <PinApprovalModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                onSuccess={handlePinSuccess}
                description={`Approve withdrawal of ${wallet?.currency} ${amount} to your ${withdrawMethod === 'mobile_money' ? 'mobile wallet' : 'bank account'} `}
            />
        </div>
    );
};
