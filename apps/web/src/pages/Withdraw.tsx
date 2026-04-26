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
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);

    useEffect(() => {
        if (token) {
            // Fetch User Data - Only ZMW, USD wallets
            api.get('/auth/me').then(res => {
                if (res.data.wallets) {
                    const supportedWallets = res.data.wallets.filter((w: Wallet) => 
                        ['ZMW', 'USD'].includes(w.currency)
                    );
                    setWallets(supportedWallets);
                    if (supportedWallets.length > 0) {
                        setSelectedWallet(supportedWallets[0].id);
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

    // Auto-switch to ZMW when mobile money is selected
    useEffect(() => {
        if (withdrawMethod === 'mobile_money' && wallet && wallet.currency !== 'ZMW') {
            const zmwWallet = wallets.find(w => w.currency === 'ZMW');
            if (zmwWallet) {
                setSelectedWallet(zmwWallet.id);
            }
        }
    }, [withdrawMethod, wallet, wallets]);

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
        <div className="min-h-screen bg-white flex font-sans selection:bg-orange-100" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
            {/* Sidebar (Desktop) */}
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>

            <main className="flex-1 p-6 md:p-8 relative overflow-x-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-100/20 via-orange-100/10 to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <header className="flex items-center justify-between mb-10">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Withdraw Funds</h1>
                            <p className="text-gray-500 mt-1">Settle your earnings to your personal account</p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 group"
                        >
                            <svg className="w-6 h-6 text-gray-400 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </header>

                    {wallets.length === 0 ? (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No Wallets Available</h3>
                            <p className="text-gray-500 mb-6">You need a ZMW or USD wallet to withdraw funds</p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-colors"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Form Area */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Method Tabs */}
                            <div className="bg-gray-50 p-1.5 rounded-2xl flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setWithdrawMethod('mobile_money')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all ${
                                        withdrawMethod === 'mobile_money' 
                                            ? 'bg-white text-gray-900 shadow-md' 
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    Mobile Money
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWithdrawMethod('bank_account')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all ${
                                        withdrawMethod === 'bank_account' 
                                            ? 'bg-white text-gray-900 shadow-md' 
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    Bank Account
                                </button>
                            </div>

                            <form onSubmit={handleWithdraw} className="space-y-6">
                                {error && (
                                    <div className="p-5 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-medium">{error}</span>
                                    </div>
                                )}

                                {/* Wallet & Amount Section */}
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 mb-2 block">
                                                Select Wallet 
                                                {withdrawMethod === 'mobile_money' && (
                                                    <span className="text-emerald-600 ml-1">(ZMW only)</span>
                                                )}
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {wallets
                                                    .filter(w => withdrawMethod === 'mobile_money' ? w.currency === 'ZMW' : true)
                                                    .map(w => (
                                                        <button
                                                            key={w.id}
                                                            type="button"
                                                            onClick={() => setSelectedWallet(w.id)}
                                                            className={`p-4 rounded-xl border-2 transition-all ${
                                                                selectedWallet === w.id 
                                                                    ? 'border-emerald-500 bg-emerald-50' 
                                                                    : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <ReactCountryFlag 
                                                                    countryCode={w.currency === 'ZMW' ? 'ZM' : 'US'} 
                                                                    svg 
                                                                    className="w-5 h-5" 
                                                                />
                                                                <span className="font-bold text-sm">{w.currency}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-500">
                                                                Balance: {parseFloat(w.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                            </p>
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 mb-2 block">Withdrawal Amount</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">
                                                    {wallet?.currency === 'ZMW' ? 'K' : '$'}
                                                </span>
                                                <input
                                                    type="number"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-4 text-3xl font-bold text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {withdrawMethod === 'mobile_money' ? (
                                    <div className="space-y-6">
                                        {/* Network Selector */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 mb-3 block">Select Provider</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {providers.map(p => (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => setProvider(p.id)}
                                                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                                            provider === p.id 
                                                                ? 'border-emerald-500 bg-emerald-50 shadow-sm' 
                                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                        }`}
                                                    >
                                                        <div className="w-12 h-12 rounded-lg bg-white shadow-sm p-2 flex items-center justify-center">
                                                            <img src={p.logo} alt={p.name} className="w-full h-full object-contain" onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                            }} />
                                                        </div>
                                                        <span className={`text-xs font-bold ${provider === p.id ? 'text-emerald-600' : 'text-gray-600'}`}>{p.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Phone Number */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 mb-2 block">Phone Number</label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-gray-200 pr-4">
                                                    <ReactCountryFlag countryCode="ZM" svg className="w-5 h-5" />
                                                    <span className="font-semibold text-gray-600 text-sm">+260</span>
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={mobileNumber}
                                                    onChange={(e) => setMobileNumber(e.target.value)}
                                                    placeholder="97 000 0000"
                                                    className="w-full bg-white border border-gray-200 rounded-xl pl-28 pr-4 py-4 text-lg font-semibold text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-xs font-semibold text-gray-500">Select Bank Account</label>
                                            <button
                                                type="button"
                                                onClick={() => navigate('/settings')}
                                                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                                            >
                                                + Add Bank
                                            </button>
                                        </div>
                                        {linkedBanks.length === 0 ? (
                                            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                    </svg>
                                                </div>
                                                <p className="text-gray-500 font-semibold mb-4">No bank accounts linked yet</p>
                                                <Button onClick={() => navigate('/settings')} className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-emerald-600">
                                                    Link Account
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {linkedBanks.map(b => {
                                                    const isSelected = selectedBankId === b.id;
                                                    const logo = getBankLogo(b.bank_name);
                                                    return (
                                                        <button
                                                            key={b.id}
                                                            type="button"
                                                            onClick={() => setSelectedBankId(b.id)}
                                                            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left ${
                                                                isSelected 
                                                                    ? 'border-emerald-500 bg-emerald-50' 
                                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                                            }`}
                                                        >
                                                            <div className={`w-12 h-12 rounded-lg p-2 flex items-center justify-center ${
                                                                isSelected ? 'bg-white' : 'bg-gray-50'
                                                            }`}>
                                                                {logo ? (
                                                                    <img src={logo} alt={b.bank_name} className="w-full h-full object-contain" onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                    }} />
                                                                ) : (
                                                                    <span className="text-lg font-bold text-gray-400 capitalize">{b.bank_name.charAt(0)}</span>
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-xs font-semibold text-gray-500 uppercase">{b.bank_name}</p>
                                                                <p className="font-bold text-gray-900">{b.account_name}</p>
                                                                <p className="text-sm font-mono text-gray-500">{b.account_number}</p>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full py-4 bg-emerald-500 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-emerald-600 transform hover:-translate-y-0.5 active:scale-95 transition-all"
                                    isLoading={isLoading}
                                    disabled={!amount || (withdrawMethod === 'mobile_money' ? !mobileNumber : !selectedBankId)}
                                >
                                    Withdraw Funds
                                </Button>
                            </form>
                        </div>

                        {/* Sidebar / Info Area */}
                        <div className="space-y-6">
                            {/* Summary Card */}
                            {amount && parseFloat(amount) > 0 && (
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-8">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>

                                    <div className="space-y-3 mb-4">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-500">Amount</span>
                                            <span className="font-bold text-gray-900">{parseFloat(amount).toLocaleString()} {wallet?.currency}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-500">Fee (3.5%)</span>
                                            <span className="font-bold text-gray-900">{(parseFloat(amount) * 0.035).toFixed(2)} {wallet?.currency}</span>
                                        </div>
                                        <div className="pt-3 border-t border-gray-100">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-semibold text-gray-900">Total</span>
                                                <span className="text-xl font-bold text-emerald-600">{(parseFloat(amount) * 1.035).toFixed(2)} {wallet?.currency}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-50 rounded-xl flex gap-3 items-start border border-blue-100">
                                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-xs text-blue-700">
                                            {withdrawMethod === 'mobile_money'
                                                ? "Mobile money payouts are usually instant. Some networks may take up to 2 hours."
                                                : "Bank transfers typically settle within 30 minutes during clearing hours."}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Help Section */}
                            <div className="bg-gray-900 rounded-2xl p-6 text-white">
                                <h4 className="text-sm font-bold mb-2">Need Help?</h4>
                                <p className="text-xs text-gray-300 mb-4">
                                    Our settlement team is available 24/7 if you encounter any issues.
                                </p>
                                <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition-all border border-white/20">
                                    Contact Support
                                </button>
                            </div>
                        </div>
                    </div>
                    )}
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
                                    <span className="text-sm font-bold text-gray-700">{(parseFloat(amount) * 0.035).toFixed(2)} {wallet?.currency}</span>
                                </div>
                                <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                                    <span className="text-xs text-gray-500 font-semibold uppercase">Total Debited</span>
                                    <span className="text-xl font-black text-emerald-600">{(parseFloat(amount) * 1.035).toFixed(2)} {wallet?.currency}</span>
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
