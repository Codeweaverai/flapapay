import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/axios';
import { QRCodeSVG } from 'qrcode.react';
import { useRef } from 'react';
import {
    ShieldCheck, Lock, Key
} from 'lucide-react';

interface PaymentMethod {
    id: string;
    card: {
        brand: string;
        last4: string;
        exp_month: number;
        exp_year: number;
    };
}

const BANK_LOGOS: Record<string, string> = {
    'zanaco': 'https://cdn.brandfetch.io/id8rWWhZ0S/w/768/h/226/theme/light/logo.png?c=1bxid64Mup7aczewSAYMX&t=1765290669363',
    'stanbic': 'https://cdn.brandfetch.io/idtBHsdHkP/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1764691523293',
    'absa': 'https://cdn.brandfetch.io/idIIZJY7QN/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1667792595017',
    'access': 'https://cdn.brandfetch.io/idPXJmyni4/w/400/h/400/theme/light/icon.png?c=1bxid64Mup7aczewSAYMX&t=1667560957752',
    'boc': 'https://cdn.brandfetch.io/ida3fnJjf9/w/1105/h/1105/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1677603041423',
    'citi': 'https://cdn.brandfetch.io/idr8xpMOko/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1761814355509',
    'ecobank': 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Ecobank_Logo_EN.png',
    'indo': '/assets/images/indozambiabank.png',
    'investrust': '/assets/images/zm-invest-logo-400x400.webp',
    'firstalliance': '/assets/images/firstalliance.svg',
    'firstcapital': 'https://cdn.brandfetch.io/idaj4d7B1e/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1771529890408',
    'fnb': 'https://cdn.brandfetch.io/idMm5AKGl0/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668184013589',
    'stanchart': 'https://cdn.brandfetch.io/idasTAHEfB/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1766383628158',
    'uba': 'https://cdn.brandfetch.io/idbEJ2XWew/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1718352485394',
    'zicb': 'https://cdn.brandfetch.io/idUnVed1lu/w/447/h/159/theme/dark/logo.png?c=1bxid64Mup7aczewSAYMX&t=1767416627446',
    'abbank': '/assets/images/AB_Bank_Logo-300x58.png',
    'natsave': 'https://cdn.brandfetch.io/id2RUtvBPh/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1763982236282',
    'bayport': 'https://cdn.brandfetch.io/idXmYQId4y/w/250/h/56/theme/dark/logo.png?c=1bxid64Mup7aczewSAYMX&t=1752223453132',
    'znbs': '/assets/images/about img.png'
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
    if (name.includes('indo')) return BANK_LOGOS.indo;
    if (name.includes('investrust')) return BANK_LOGOS.investrust;
    if (name.includes('first alliance')) return BANK_LOGOS.firstalliance;
    if (name.includes('first capital')) return BANK_LOGOS.firstcapital;
    if (name.includes('fnb') || name.includes('first national bank')) return BANK_LOGOS.fnb;
    if (name.includes('chartered') || name.includes('scb')) return BANK_LOGOS.stanchart;
    if (name.includes('uba') || name.includes('united bank')) return BANK_LOGOS.uba;
    if (name.includes('zicb')) return BANK_LOGOS.zicb;
    if (name.includes('ab bank')) return BANK_LOGOS.abbank;
    if (name.includes('natsave')) return BANK_LOGOS.natsave;
    if (name.includes('bayport')) return BANK_LOGOS.bayport;
    if (name.includes('building society') || name.includes('znbs')) return BANK_LOGOS.znbs;
    return null;
};

export const Settings = () => {
    const { user, token, updateUser } = useAuth();
    const [cards, setCards] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [defaultCardId, setDefaultCardId] = useState<string | null>(user?.defaultPaymentMethodId || null);

    // Avatar states
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [showQrModal, setShowQrModal] = useState(false);
    const qrRef = useRef<SVGSVGElement>(null);

    // Lenco Bank States
    const [banks, setBanks] = useState<any[]>([]);
    const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
    const [showBankModal, setShowBankModal] = useState(false);
    const [bankSearch, setBankSearch] = useState('');
    const [bankForm, setBankForm] = useState({
        bankId: '',
        bankName: '',
        accountNumber: '',
        country: 'zm'
    });
    const [resolvedAccount, setResolvedAccount] = useState<any>(null);
    const [isResolving, setIsResolving] = useState(false);

    // PIN change states
    const [showChangePinModal, setShowChangePinModal] = useState(false);
    const [pinForm, setPinForm] = useState({ oldPin: '', newPin: '', confirmPin: '' });
    const [isPinChanging, setIsPinChanging] = useState(false);
    const [pinError, setPinError] = useState('');
    const [pinSuccess, setPinSuccess] = useState('');

    useEffect(() => {
        if (token) {
            fetchCards();
            fetchLinkedAccounts();
            fetchBanks();
        }
    }, [token]);

    const fetchCards = async () => {
        setLoading(true);
        try {
            const res = await api.get('/payments/methods');
            setCards(res.data.methods || []);
        } catch (error) {
            console.error('Failed to load cards:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSetDefault = async (methodId: string) => {
        try {
            await api.post('/user/settings/default-card', { paymentMethodId: methodId });
            setDefaultCardId(methodId);
        } catch (error) {
            console.error('Failed to set default', error);
        }
    };

    const fetchBanks = async () => {
        try {
            const res = await api.get('/merchants/lenco/banks?country=zm');
            if (res.data.status) setBanks(res.data.data);
        } catch (err) {
            console.error('Failed to fetch banks', err);
        }
    };

    const fetchLinkedAccounts = async () => {
        try {
            const res = await api.get('/merchants/lenco/accounts');
            setLinkedAccounts(res.data);
        } catch (err) {
            console.error('Failed to fetch linked accounts', err);
        }
    };

    const handleResolveAccount = async () => {
        if (!bankForm.bankId || !bankForm.accountNumber) return;
        setIsResolving(true);
        try {
            const res = await api.post('/merchants/lenco/resolve', bankForm);
            if (res.data.status) {
                setResolvedAccount(res.data.data);
            } else {
                alert(res.data.message || 'Could not resolve account');
            }
        } catch (err) {
            alert('Error resolving account');
        } finally {
            setIsResolving(false);
        }
    };

    const handleLinkAccount = async () => {
        if (!resolvedAccount) return;
        try {
            await api.post('/merchants/lenco/accounts', {
                accountName: resolvedAccount.accountName,
                accountNumber: resolvedAccount.accountNumber,
                bankId: resolvedAccount.bank.id,
                bankName: resolvedAccount.bank.name,
                country: resolvedAccount.bank.country
            });
            setShowBankModal(false);
            setResolvedAccount(null);
            setBankForm({ bankId: '', bankName: '', accountNumber: '', country: 'zm' });
            fetchLinkedAccounts();
        } catch (err) {
            alert('Failed to link account');
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadError(null);

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const res = await api.post('/v1/user/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            updateUser({ avatarUrl: res.data.avatarUrl });
        } catch (err: any) {
            setUploadError(err.response?.data?.error || 'Failed to upload avatar');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteAccount = async (id: string) => {
        if (!confirm('Are you sure you want to remove this bank account?')) return;
        try {
            await api.delete(`/merchants/lenco/accounts/${id}`);
            fetchLinkedAccounts();
        } catch (err) {
            alert('Failed to delete account');
        }
    };

    const filteredBanks = useMemo(() => {
        return banks.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()));
    }, [banks, bankSearch]);

    const handleDownloadQr = () => {
        const svg = qrRef.current;
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `${user?.fullName.replace(/\s+/g, '_')}_FlapaPay_QR.png`;
            downloadLink.href = `${pngFile}`;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    const handlePrintQr = () => {
        const printContent = document.getElementById('qr-print-area');
        const windowUrl = 'about:blank';
        const uniqueName = new Date();
        const windowName = 'Print' + uniqueName.getTime();
        const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');
        if (!printWindow) return;
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print QR Code - FlapaPay</title>
                    <style>
                        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                        .container { text-align: center; border: 2px solid #eee; padding: 40px; border-radius: 40px; }
                        h1 { font-size: 24px; font-weight: 900; margin-bottom: 30px; }
                        p { color: #888; margin-top: 20px; font-weight: bold; }
                        .brand { color: #f97316; font-weight: 900; font-size: 32px; margin-bottom: 40px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="brand">FlapaPay</div>
                        <div class="qr-label" style="font-weight: 900; margin-bottom: 20px;">PAY ME BY SCANNING MY QR CODE</div>
                        ${printContent?.innerHTML}
                        <h1>${user?.fullName}</h1>
                        <p>${user?.email}</p>
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
    };

    const handleChangePin = async (e: React.FormEvent) => {
        e.preventDefault();
        setPinError('');
        setPinSuccess('');
        setIsPinChanging(true);

        const { oldPin, newPin, confirmPin } = pinForm;

        if (newPin.length !== 4 || confirmPin.length !== 4) {
            setPinError('PIN must be 4 digits.');
            setIsPinChanging(false);
            return;
        }

        if (newPin !== confirmPin) {
            setPinError('New PIN and Confirm PIN do not match.');
            setIsPinChanging(false);
            return;
        }

        try {
            const payload: { oldPin?: string; newPin: string } = { newPin };
            if (user?.hasPin) {
                if (oldPin.length !== 4) {
                    setPinError('Current PIN must be 4 digits.');
                    setIsPinChanging(false);
                    return;
                }
                payload.oldPin = oldPin;
            }

            await api.post('/auth/change-pin', payload);
            setPinSuccess('PIN updated successfully!');
            setPinForm({ oldPin: '', newPin: '', confirmPin: '' });
            updateUser({ hasPin: true }); // Update user context to reflect PIN is set
            setTimeout(() => setShowChangePinModal(false), 2000);
        } catch (err: any) {
            setPinError(err.response?.data?.error || 'Failed to change PIN.');
        } finally {
            setIsPinChanging(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex font-sans selection:bg-orange-100">
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>

            <main className="flex-1 min-h-screen p-8 md:p-12 relative overflow-x-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-100/20 via-emerald-100/10 to-transparent rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none"></div>

                <div className="max-w-5xl mx-auto space-y-10 relative">
                    <header className="space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1">
                                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Business Settings</h1>
                                <p className="text-gray-500 font-medium text-lg leading-tight">Personalize & secure your FlapaPay experience</p>
                            </div>
                            <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                                <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse ml-3"></span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 pr-3">Verified Merchant</span>
                            </div>
                        </div>
                    </header>

                    {/* Profile Section - Orange Theme */}
                    <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-[40px] p-1 shadow-2xl shadow-orange-500/10 overflow-hidden transform hover:scale-[1.005] transition-transform duration-500">
                        <div className="bg-white rounded-[38px] p-8 md:p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110"></div>

                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-10 border-b border-gray-50">
                                    <div className="relative group/avatar">
                                        <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl overflow-hidden border-4 border-white transition-transform duration-500 group-hover/avatar:scale-[1.02]">
                                            {user?.avatarUrl ? (
                                                <img
                                                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:3005'}${user.avatarUrl}`}
                                                    alt={user.fullName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                user?.fullName?.charAt(0) || 'U'
                                            )}
                                        </div>
                                        <label className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center cursor-pointer hover:bg-orange-500 hover:text-white transition-all duration-300 group/btn">
                                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                                            {isUploading ? (
                                                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin group-hover/btn:border-white group-hover/btn:border-t-transparent transition-colors"></div>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            )}
                                        </label>
                                    </div>
                                    <div className="space-y-1 text-center md:text-left">
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Profile Identity</h2>
                                        <p className="text-gray-500 font-medium">Manage your public appearance and business details</p>
                                        {uploadError && <p className="text-xs font-bold text-red-500 mt-2">Error: {uploadError}</p>}
                                    </div>
                                    <div className="md:ml-auto">
                                        <button
                                            onClick={() => setShowQrModal(true)}
                                            className="bg-white border-2 border-orange-100 p-4 rounded-3xl shadow-sm hover:shadow-xl hover:border-orange-500 transition-all group/qr"
                                            title="Show my payment QR code"
                                        >
                                            <div className="flex items-center gap-3">
                                                <svg className="w-8 h-8 text-orange-500 group-hover/qr:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                                </svg>
                                                <div className="text-left">
                                                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Receive Payments</p>
                                                    <p className="text-sm font-black text-gray-900">My QR Code</p>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-orange-600 tracking-[0.2em] ml-1">Full Business Name</label>
                                        <div className="p-5 bg-orange-50/30 rounded-3xl text-gray-900 font-black border border-orange-100/50 text-lg transition-all hover:bg-orange-50/50">
                                            {user?.fullName}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-orange-600 tracking-[0.2em] ml-1">Primary Email Address</label>
                                        <div className="p-5 bg-orange-50/30 rounded-3xl text-gray-900 font-black border border-orange-100/50 text-lg transition-all hover:bg-orange-50/50">
                                            {user?.email}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Saved Cards Section - Black Theme */}
                    <div className="bg-[#1A1A1A] rounded-[48px] p-10 text-white relative shadow-2xl shadow-gray-200 overflow-hidden group">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500 rounded-full -mr-32 -mt-32 blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity"></div>

                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                        Payment Methods
                                        <span className="text-orange-500">💳</span>
                                    </h2>
                                    <p className="text-gray-400 font-medium text-sm">Preferred cards for platform billing and transfers.</p>
                                </div>
                                <a href="/link-card" className="bg-white hover:bg-gray-100 text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105 inline-flex items-center gap-2">
                                    <span className="text-lg">＋</span> Add New Card
                                </a>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="w-12 h-12 border-4 border-gray-800 border-t-orange-500 rounded-full animate-spin"></div>
                                </div>
                            ) : cards.length === 0 ? (
                                <div className="py-16 text-center bg-white/5 rounded-[40px] border-2 border-dashed border-white/10 group-hover:border-white/20 transition-colors">
                                    <p className="text-gray-500 font-black uppercase tracking-widest text-[11px]">No cards linked to your account yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {cards.map((card) => {
                                        const isDefault = card.id === defaultCardId;
                                        return (
                                            <div key={card.id} className={`p-8 rounded-[40px] border-2 transition-all duration-500 group relative ${isDefault ? 'border-orange-500 bg-gradient-to-br from-gray-800 to-black shadow-2xl' : 'border-white/5 bg-white/5 hover:border-white/20'}`}>
                                                <div className="flex justify-between items-start mb-12">
                                                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${isDefault ? 'bg-orange-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                                                        {card.card.brand}
                                                    </div>
                                                    {isDefault && <div className="flex items-center gap-2 text-orange-500 text-[10px] font-black uppercase tracking-widest">
                                                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                                                        PRIMARY
                                                    </div>}
                                                </div>
                                                <div className="space-y-6">
                                                    <p className="text-3xl font-black tracking-widest tabular-nums">•••• {card.card.last4}</p>
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-xs font-bold text-gray-500 mono">{card.card.exp_month}/{card.card.exp_year.toString().slice(-2)}</p>
                                                        {!isDefault && (
                                                            <button
                                                                onClick={() => handleSetDefault(card.id)}
                                                                className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-orange-500 hover:scale-105 transition-all"
                                                            >
                                                                Make Default
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Withdrawal Section - Green Theme */}
                    <div className="bg-emerald-600 rounded-[48px] p-1 shadow-2xl shadow-emerald-500/10">
                        <div className="bg-white rounded-[46px] p-8 md:p-12 relative overflow-hidden group">
                            <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-50 rounded-full -mr-32 -mb-32 transition-transform duration-700 group-hover:scale-110"></div>

                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                            Withdrawal Network
                                            <span className="text-emerald-500">🏦</span>
                                        </h2>
                                        <p className="text-gray-500 font-medium text-sm">Your connected bank accounts for lightning-fast payouts.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowBankModal(true)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all hover:scale-105"
                                    >
                                        ＋ Link New Bank
                                    </button>
                                </div>

                                {linkedAccounts.length === 0 ? (
                                    <div className="py-16 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100">
                                        <p className="text-gray-400 font-black uppercase tracking-widest text-[11px]">No withdrawal accounts configured.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {linkedAccounts.map((acc) => {
                                            const logo = getBankLogo(acc.bank_name);
                                            return (
                                                <div key={acc.id} className="p-8 rounded-[40px] bg-gray-50 border border-gray-100 hover:border-emerald-500 hover:shadow-xl hover:bg-white transition-all duration-500 flex flex-col justify-between relative group">
                                                    <div className="space-y-6">
                                                        <div className="w-16 h-16 rounded-[24px] bg-white shadow-sm p-3 flex items-center justify-center overflow-hidden border border-gray-50 group-hover:scale-110 transition-transform duration-500 font-black text-2xl">
                                                            {logo ? <img src={logo} alt={acc.bank_name} className="w-full h-full object-contain" /> : (acc.country === 'zm' ? '🇿🇲' : '🇳🇬')}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">{acc.bank_name}</p>
                                                            <p className="text-xl font-black text-gray-900 leading-tight">{acc.account_name}</p>
                                                        </div>
                                                        <div className="inline-block px-4 py-2 bg-white rounded-2xl border border-gray-100 font-black tabular-nums text-sm text-gray-600">
                                                            {acc.account_number}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteAccount(acc.id)}
                                                        className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center rounded-2xl bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all duration-300"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Section - Blue Theme */}
                <div className="bg-blue-600 rounded-[48px] p-1 shadow-2xl shadow-blue-500/10 mt-16">
                    <div className="bg-white rounded-[46px] p-8 md:p-12 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50 rounded-full -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110"></div>

                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                        Security & PIN
                                        <ShieldCheck className="text-blue-500 w-8 h-8" />
                                    </h2>
                                    <p className="text-gray-500 font-medium text-sm">Protect your account and authorize transactions.</p>
                                </div>
                                <button
                                    onClick={() => setShowChangePinModal(true)}
                                    className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105 flex items-center gap-2"
                                >
                                    <Key size={16} />
                                    Change Security PIN
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 rounded-3xl bg-blue-50/50 border border-blue-100/50 flex flex-col gap-3">
                                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                                        <Lock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest leading-none mb-1">Transaction Security</p>
                                        <p className="text-sm font-bold text-gray-900">Mandatory PIN for all transfers and card reveals.</p>
                                    </div>
                                </div>
                                <div className="p-6 rounded-3xl bg-emerald-50/50 border border-emerald-100/50 flex flex-col gap-3">
                                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest leading-none mb-1">Status</p>
                                        <p className="text-sm font-bold text-gray-900">{user?.hasPin ? 'PIN Setup Complete' : 'PIN Setup Required'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Change PIN Modal */}
            {showChangePinModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
                    <div className="bg-white rounded-[48px] w-full max-w-md shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
                        <div className="p-10 text-center">
                            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Key size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900">Change Security PIN</h2>
                            <p className="text-gray-500 font-medium text-sm mt-2">Update your 4-digit security code</p>

                            <form onSubmit={handleChangePin} className="mt-10 space-y-6 text-left">
                                {user?.hasPin && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Current PIN</label>
                                        <input
                                            type="password"
                                            maxLength={4}
                                            className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-6 py-4 font-black outline-none focus:border-blue-500 focus:bg-white transition-all text-2xl tracking-[1em]"
                                            value={pinForm.oldPin}
                                            onChange={e => setPinForm({ ...pinForm, oldPin: e.target.value.replace(/\D/g, '') })}
                                            required
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">New 4-Digit PIN</label>
                                    <input
                                        type="password"
                                        maxLength={4}
                                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-6 py-4 font-black outline-none focus:border-blue-500 focus:bg-white transition-all text-2xl tracking-[1em]"
                                        value={pinForm.newPin}
                                        onChange={e => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '') })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Confirm New PIN</label>
                                    <input
                                        type="password"
                                        maxLength={4}
                                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-6 py-4 font-black outline-none focus:border-blue-500 focus:bg-white transition-all text-2xl tracking-[1em]"
                                        value={pinForm.confirmPin}
                                        onChange={e => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '') })}
                                        required
                                    />
                                </div>

                                {pinError && <p className="text-xs font-bold text-red-500 text-center">{pinError}</p>}
                                {pinSuccess && <p className="text-xs font-bold text-emerald-500 text-center">{pinSuccess}</p>}

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowChangePinModal(false)}
                                        className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-400 font-black rounded-2xl py-5 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isPinChanging}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl py-5 shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                                    >
                                        {isPinChanging ? 'Updating...' : 'Update PIN'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Bank Modal */}
            {showBankModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
                    <div className="bg-white rounded-[48px] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-[0_25px_100px_rgba(0,0,0,0.3)] flex flex-col animate-in fade-in zoom-in duration-300">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Select Your Bank</h2>
                                <p className="text-gray-400 font-medium mt-1">Choose your provider to continue</p>
                            </div>
                            <button onClick={() => { setShowBankModal(false); setResolvedAccount(null); }} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-8">
                            {!resolvedAccount ? (
                                <>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search banks..."
                                            className="w-full bg-gray-50 border-2 border-gray-50 rounded-3xl px-12 py-5 font-bold outline-none focus:border-black focus:bg-white transition-all text-lg"
                                            value={bankSearch}
                                            onChange={e => setBankSearch(e.target.value)}
                                        />
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {filteredBanks.map(b => {
                                            const logo = getBankLogo(b.name);
                                            const isSelected = bankForm.bankId === b.id;
                                            return (
                                                <button
                                                    key={b.id}
                                                    onClick={() => {
                                                        setBankForm({ ...bankForm, bankId: b.id, bankName: b.name });
                                                    }}
                                                    className={`p-6 rounded-[32px] border-2 transition-all duration-300 flex flex-col items-center gap-4 text-center group ${isSelected ? 'border-black bg-black shadow-xl ring-4 ring-black/5' : 'border-gray-50 bg-gray-50 hover:border-gray-200 hover:bg-white'}`}
                                                >
                                                    <div className={`w-16 h-16 rounded-2xl p-3 flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-110 ${isSelected ? 'bg-white' : 'bg-white shadow-sm'}`}>
                                                        {logo ? (
                                                            <img src={logo} alt={b.name} className="w-full h-full object-contain" />
                                                        ) : (
                                                            <span className="text-xl font-black text-gray-300">{b.name.charAt(0)}</span>
                                                        )}
                                                    </div>
                                                    <span className={`text-[11px] font-black uppercase leading-tight tracking-tight ${isSelected ? 'text-white' : 'text-gray-500'}`}>{b.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {bankForm.bankId && (
                                        <div className="space-y-4 pt-4 border-t border-gray-100 animate-in slide-in-from-bottom-5">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Account Number</label>
                                                <div className="flex gap-3">
                                                    <input
                                                        type="text"
                                                        className="flex-1 bg-gray-50 border-2 border-gray-50 rounded-2xl px-6 py-4 font-black outline-none focus:border-black focus:bg-white transition-all text-xl"
                                                        placeholder="0000000000"
                                                        value={bankForm.accountNumber}
                                                        onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                                                    />
                                                    <button
                                                        onClick={handleResolveAccount}
                                                        disabled={isResolving || !bankForm.accountNumber}
                                                        className="px-8 bg-black text-white font-black rounded-2xl hover:scale-105 transition-all shadow-xl disabled:opacity-20"
                                                    >
                                                        {isResolving ? '...' : 'Verify'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-10 py-6 text-center animate-in zoom-in duration-500">
                                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner border-2 border-emerald-100">
                                        ✓
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Verified Account Details</p>
                                        <h3 className="text-4xl font-black text-gray-900 tracking-tight">{resolvedAccount.accountName}</h3>
                                        <p className="text-gray-400 font-bold text-lg">{resolvedAccount.accountNumber} • {bankForm.bankName}</p>
                                    </div>
                                    <div className="flex gap-4 pt-10">
                                        <button
                                            onClick={() => setResolvedAccount(null)}
                                            className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-400 font-black rounded-[24px] py-5 transition-all"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            onClick={handleLinkAccount}
                                            className="flex-1 bg-black hover:bg-gray-900 text-white font-black rounded-[24px] py-5 shadow-2xl hover:scale-[1.02] transition-all"
                                        >
                                            Confirm & Link
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQrModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden p-10 items-center flex flex-col text-center animate-slide-up">
                        <div className="flex justify-between w-full mb-8">
                            <h3 className="text-xl font-bold text-gray-900">Payment QR Code</h3>
                            <button onClick={() => setShowQrModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-10 bg-orange-50 rounded-[4rem] border-8 border-white shadow-inner mb-6 relative group">
                            <div id="qr-print-area" className="bg-white p-6 rounded-[3rem]">
                                <QRCodeSVG
                                    ref={qrRef}
                                    value={`flapapay://pay?recipientId=${user?.id}`}
                                    size={180}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>
                        </div>

                        <div className="mb-8">
                            <h4 className="text-xs font-black text-orange-600 uppercase tracking-[0.3em] mb-2 text-center">PAY ME BY SCANNING MY QR CODE</h4>
                            <h4 className="text-2xl font-black text-gray-900 leading-tight">{user?.fullName}</h4>
                            <p className="text-gray-500 font-medium text-sm mt-1">{user?.email}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full pt-6 border-t border-gray-50">
                            <button
                                onClick={handlePrintQr}
                                className="flex items-center justify-center gap-2 py-4 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 01-2-2H9a2 2 0 01-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                Print
                            </button>
                            <button
                                onClick={handleDownloadQr}
                                className="flex items-center justify-center gap-2 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
