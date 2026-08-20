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
    pending_withdrawal_amount?: string;
    pending_withdrawal_count?: number;
}

interface LinkedBank {
    id: string;
    bank_name: string;
    account_name: string;
    account_number: string;
    bank_id: string;
    country: string;
}

interface WithdrawalRecord {
    id: string;
    provider: string;
    destination_type: string;
    destination_details: {
        accountName?: string;
        accountNumber?: string;
        bankId?: string;
        bankName?: string;
        country?: string;
        phoneNumber?: string;
        provider?: string;
        operator?: string;
    };
    amount: string;
    fee_amount?: string;
    total_debited?: string;
    currency: string;
    reference: string;
    provider_transfer_id?: string | null;
    provider_reference?: string | null;
    provider_status?: string | null;
    local_status: string;
    failure_reason?: string | null;
    created_at: string;
    updated_at: string;
}

interface WithdrawalQuote {
    amount: number;
    currency: string;
    destination_type: string;
    fee_amount: number;
    total_debited: number;
    fee_policy: string;
    fee_label: string;
}

const BANK_WITHDRAWAL_FEE_BANDS = [
    { minExclusive: 0, maxInclusive: 150, fee: 2.5 },
    { minExclusive: 150, maxInclusive: 300, fee: 3.5 },
    { minExclusive: 300, maxInclusive: 500, fee: 5.0 },
    { minExclusive: 500, maxInclusive: 1000, fee: 10.0 },
    { minExclusive: 1000, maxInclusive: 3000, fee: 20.0 },
    { minExclusive: 3000, maxInclusive: 5000, fee: 37.5 },
    { minExclusive: 5000, maxInclusive: 10000, fee: 75.0 },
    { minExclusive: 10000, maxInclusive: Number.POSITIVE_INFINITY, fee: 100.0 }
];

const getLocalWithdrawalQuote = (
    amountValue: number,
    destinationType: 'mobile_money' | 'bank_account',
    currency?: string
) => {
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
        return null;
    }

    if (destinationType === 'bank_account' && (currency === 'ZMW' || currency === 'USD')) {
        const band = BANK_WITHDRAWAL_FEE_BANDS.find(
            (item) => amountValue > item.minExclusive && amountValue <= item.maxInclusive
        );
        const feeAmount = band?.fee || 0;
        return {
            fee_amount: feeAmount,
            total_debited: amountValue + feeAmount
        };
    }

    if (destinationType === 'mobile_money' && currency === 'ZMW') {
        const feeAmount = Math.round(amountValue * 0.01 * 100) / 100;
        return {
            fee_amount: feeAmount,
            total_debited: amountValue + feeAmount
        };
    }

    return {
        fee_amount: 0,
        total_debited: amountValue
    };
};

const normalizeZambiaMobileNumber = (value: string) => {
    const cleanPhone = String(value || '').replace(/\D/g, '');
    const localPhone = cleanPhone.startsWith('260')
        ? cleanPhone.slice(3)
        : cleanPhone.replace(/^0+/, '');

    const fullPhone = cleanPhone.startsWith('260')
        ? cleanPhone
        : `260${cleanPhone.replace(/^0+/, '')}`;

    return { cleanPhone, localPhone, fullPhone };
};

const BANK_BRANDS = [
    {
        logo: 'https://www.zanaco.co.zm/wp-content/uploads/2025/05/cropped-Zanaco-cog_Copper-270x270.jpg',
        aliases: ['zanaco', 'zambia national commercial bank']
    },
    {
        logo: '/assets/images/stanbic-zambia.png',
        aliases: ['stanbic']
    },
    {
        logo: 'https://cdn.brandfetch.io/idIIZJY7QN/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1667792595017',
        aliases: ['absa']
    },
    {
        logo: 'https://cdn.brandfetch.io/idPXJmyni4/w/400/h/400/theme/light/icon.png?c=1bxid64Mup7aczewSAYMX&t=1667560957752',
        aliases: ['access']
    },
    {
        logo: 'https://cdn.brandfetch.io/ida3fnJjf9/w/1105/h/1105/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1677603041423',
        aliases: ['bank of china', 'china']
    },
    {
        logo: 'https://cdn.brandfetch.io/idr8xpMOko/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1761814355509',
        aliases: ['citi', 'citibank']
    },
    {
        logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Ecobank_Logo_EN.png',
        aliases: ['ecobank', 'eco']
    },
    {
        logo: 'https://cdn.brandfetch.io/idaj4d7B1e/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1771529890408',
        aliases: ['first capital']
    },
    {
        logo: 'https://cdn.brandfetch.io/idMm5AKGl0/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668184013589',
        aliases: ['fnb', 'first national bank']
    },
    {
        logo: '/assets/images/STANCHART.svg',
        aliases: ['standard chartered', 'stanchart', 'scb', 'chartered']
    },
    {
        logo: 'https://cdn.brandfetch.io/idbEJ2XWew/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1718352485394',
        aliases: ['uba', 'united bank']
    },
    {
        logo: 'https://cdn.brandfetch.io/idUnVed1lu/w/447/h/159/theme/dark/logo.png?c=1bxid64Mup7aczewSAYMX&t=1767416627446',
        aliases: ['zicb']
    },
    {
        logo: 'https://cdn.brandfetch.io/id2RUtvBPh/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1763982236282',
        aliases: ['natsave', 'national savings']
    },
    {
        logo: '/assets/images/AB_Bank_Logo-300x58.png',
        aliases: ['ab bank', 'abank']
    },
    {
        logo: '/assets/images/firstalliance.svg',
        aliases: ['first alliance']
    },
    {
        logo: '/assets/images/indozambiabank.png',
        aliases: ['indo zambia', 'indozambia']
    },
    {
        logo: '/assets/images/zm-invest-logo-400x400.webp',
        aliases: ['bayport']
    }
];

const BANK_ID_TO_NAME: Record<string, string> = {
    '002': 'Absa Bank',
    '003': 'Access Bank',
    '005': 'Access Bank',
    '008': 'Ecobank',
    '014': 'FNB',
    '016': 'Stanbic Bank',
    '017': 'Standard Chartered Bank',
    '023': 'Zanaco'
};

const normalizeBankName = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

const getBankLogoImageClass = (bankName?: string) => {
    const normalized = normalizeBankName(String(bankName || ''));
    if (normalized.includes('stanbic')) {
        return 'w-full h-full object-contain scale-[1.12]';
    }
    if (normalized.includes('standard chartered') || normalized.includes('stanchart')) {
        return 'w-[90%] h-[90%] object-contain';
    }
    if (normalized.includes('ab bank')) {
        return 'w-[112%] h-[112%] object-contain';
    }
    return 'max-w-full max-h-full object-contain';
};

const getBankLogo = (bankName: string) => {
    const normalized = normalizeBankName(bankName);
    const match = BANK_BRANDS.find(brand =>
        brand.aliases.some(alias => normalized.includes(normalizeBankName(alias)))
    );
    return match?.logo || null;
};

const BankLogo = ({
    bankName,
    className = 'w-12 h-12 rounded-lg p-2'
}: {
    bankName: string;
    className?: string;
}) => {
    const [failed, setFailed] = useState(false);
    const logo = failed ? null : getBankLogo(bankName);
    const normalized = normalizeBankName(bankName);
    const isStandardChartered = normalized.includes('standard chartered') || normalized.includes('stanchart') || normalized.includes('scb');
    const isWideWordmark =
        isStandardChartered ||
        normalized.includes('bank of china');
    const initials = bankName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join('') || 'B';

    return (
        <div className={`${className} relative bg-white flex items-center justify-center overflow-hidden font-black text-lg text-gray-400`}>
            {logo ? (
                <img
                    src={logo}
                    alt={bankName}
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none ${
                        isStandardChartered
                            ? 'w-[92%] h-[92%]'
                            : isWideWordmark
                                ? 'w-[135%] h-[135%]'
                                : getBankLogoImageClass(bankName)
                    }`}
                    onError={() => setFailed(true)}
                />
            ) : (
                <span>{initials}</span>
            )}
        </div>
    );
};

const MOBILE_MONEY_PROVIDERS = {
    MTN_MOMO_ZMB: { name: 'MTN', logo: '/assets/images/MTN_Logo.svg' },
    MTN: { name: 'MTN', logo: '/assets/images/MTN_Logo.svg' },
    AIRTEL_OAPI_ZMB: { name: 'Airtel', logo: '/assets/images/Airtel_Africa_logo.svg' },
    AIRTEL: { name: 'Airtel', logo: '/assets/images/Airtel_Africa_logo.svg' },
    ZAMTEL_ZMB: { name: 'Zamtel', logo: '/assets/images/zamtel.png' },
    ZAMTEL: { name: 'Zamtel', logo: '/assets/images/zamtel.png' }
} as const;

const MobileMoneyLogo = ({
    provider,
    className = 'w-11 h-11 rounded-xl p-2.5'
}: {
    provider?: string;
    className?: string;
}) => {
    const providerKey = String(provider || '').trim().toUpperCase() as keyof typeof MOBILE_MONEY_PROVIDERS;
    const brand = MOBILE_MONEY_PROVIDERS[providerKey];

    if (!brand) {
        return (
            <div className={`${className} shrink-0 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            </div>
        );
    }

    return (
        <div className={`${className} relative bg-white shrink-0 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden`}>
            <img src={brand.logo} alt={brand.name} className="max-w-full max-h-full object-contain" />
        </div>
    );
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
    const [recentWithdrawals, setRecentWithdrawals] = useState<WithdrawalRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [lastWithdrawal, setLastWithdrawal] = useState<{
        reference: string;
        amount: number;
        feeAmount: number;
        totalDebited: number;
        currency: string;
        status: string;
        providerStatus?: string;
    } | null>(null);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [quote, setQuote] = useState<WithdrawalQuote | null>(null);
    const [resolvedAccountName, setResolvedAccountName] = useState<string>('');
    const [isResolvingAccount, setIsResolvingAccount] = useState(false);
    const [resolveError, setResolveError] = useState<string>('');
    const [pollingReference, setPollingReference] = useState<string>('');
    const [pollingMessage, setPollingMessage] = useState<string>('Payment request sent. Checking withdrawal status...');

    const loadWithdrawalHistory = async () => {
        setIsHistoryLoading(true);
        try {
            const res = await api.get('/v1/wallet-withdrawals?limit=5');
            setRecentWithdrawals(res.data || []);
        } catch (err) {
            console.error('Failed to load withdrawal history', err);
        } finally {
            setIsHistoryLoading(false);
        }
    };

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

            loadWithdrawalHistory();
        }
    }, [token]);

    useEffect(() => {
        const requestedAmount = Number(amount);
        if (!token || !selectedWallet || !Number.isFinite(requestedAmount) || requestedAmount <= 0) {
            setQuote(null);
            return;
        }

        let cancelled = false;
        api.post('/wallets/withdraw/quote', {
            walletId: selectedWallet,
            amount: requestedAmount,
            destinationType: withdrawMethod
        }).then((res) => {
            if (!cancelled) {
                setQuote(res.data);
            }
        }).catch(() => {
            if (!cancelled) {
                setQuote(null);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [token, selectedWallet, amount, withdrawMethod]);

    const wallet = useMemo(() => wallets.find(w => w.id === selectedWallet), [wallets, selectedWallet]);
    const pendingReserved = Number(wallet?.pending_withdrawal_amount || 0);
    const localQuote = useMemo(
        () => getLocalWithdrawalQuote(Number(amount), withdrawMethod, wallet?.currency),
        [amount, withdrawMethod, wallet?.currency]
    );
    const feeAmount = quote?.fee_amount ?? localQuote?.fee_amount ?? 0;
    const totalDebited = quote?.total_debited ?? localQuote?.total_debited ?? (Number(amount) > 0 ? Number(amount) : 0);

    // Auto-switch to a supported wallet when the selected rail has currency limits
    useEffect(() => {
        if (withdrawMethod === 'mobile_money' && wallet && wallet.currency !== 'ZMW') {
            const zmwWallet = wallets.find(w => w.currency === 'ZMW');
            if (zmwWallet) {
                setSelectedWallet(zmwWallet.id);
            }
        }

        if (withdrawMethod === 'bank_account' && wallet && !['ZMW', 'USD'].includes(wallet.currency)) {
            const supportedWallet = wallets.find(w => ['ZMW', 'USD'].includes(w.currency));
            if (supportedWallet) {
                setSelectedWallet(supportedWallet.id);
            }
        }
    }, [withdrawMethod, wallet, wallets]);

    useEffect(() => {
        if (withdrawMethod !== 'mobile_money') {
            setResolvedAccountName('');
            setResolveError('');
            setIsResolvingAccount(false);
            return;
        }

        const { localPhone, fullPhone } = normalizeZambiaMobileNumber(mobileNumber);
        if (localPhone.length < 9) {
            setResolvedAccountName('');
            setResolveError('');
            setIsResolvingAccount(false);
            return;
        }

        let cancelled = false;
        const timer = window.setTimeout(async () => {
            setIsResolvingAccount(true);
            try {
                const res = await api.post('/lenco/mobile-money/resolve', {
                    phoneNumber: fullPhone,
                    operator: provider,
                    country: 'zm'
                });
                if (cancelled) return;
                setResolvedAccountName(String(res.data?.accountName || '').trim());
                setResolveError('');
            } catch (err: any) {
                if (cancelled) return;
                setResolvedAccountName('');
                setResolveError(err?.response?.data?.error || 'Unable to resolve account name');
            } finally {
                if (!cancelled) {
                    setIsResolvingAccount(false);
                }
            }
        }, 450);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [mobileNumber, provider, withdrawMethod]);

    useEffect(() => {
        if (!pollingReference) return;

        let cancelled = false;
        const interval = window.setInterval(async () => {
            try {
                const res = await api.get(`/v1/wallet-withdrawals/${pollingReference}/status`);
                if (cancelled) return;

                const data = res.data || {};
                const localStatus = String(data.local_status || data.localStatus || data.status || '').trim().toUpperCase();
                const providerStatus = String(data.provider_status || data.providerStatus || '').trim().toUpperCase();
                setLastWithdrawal({
                    reference: data.reference || pollingReference,
                    amount: Number(data.amount || amount || 0),
                    feeAmount: Number(data.fee_amount || 0),
                    totalDebited: Number(data.total_debited || Number(data.amount || 0) + Number(data.fee_amount || 0)),
                    currency: data.currency || wallet?.currency || 'ZMW',
                    status: localStatus || 'PENDING',
                    providerStatus: providerStatus || data.provider_status || 'PENDING'
                });

                if (localStatus === 'COMPLETED') {
                    window.clearInterval(interval);
                    setPollingReference('');
                    setShowStatusModal(false);
                    setShowSuccessModal(true);
                    loadWithdrawalHistory();
                    setTimeout(() => navigate('/dashboard'), 3000);
                    return;
                }

                if (localStatus === 'FAILED') {
                    window.clearInterval(interval);
                    setPollingReference('');
                    setShowStatusModal(false);
                    setError(data.failure_reason || data.failureReason || 'Withdrawal failed');
                    loadWithdrawalHistory();
                    return;
                }

                setPollingMessage(
                    providerStatus
                        ? `Payment request sent. Checking withdrawal status... (${providerStatus.toLowerCase()})`
                        : 'Payment request sent. Checking withdrawal status...'
                );
            } catch (err) {
                if (!cancelled) {
                    setPollingMessage('Payment request sent. Checking withdrawal status...');
                }
            }
        }, 4000);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [pollingReference, amount, navigate, wallet?.currency]);

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

        if (withdrawMethod === 'mobile_money') {
            const { localPhone } = normalizeZambiaMobileNumber(mobileNumber);
            if (localPhone.length < 9) {
                setError('Please enter a valid Zambia mobile number');
                return;
            }
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
                const { localPhone, fullPhone } = normalizeZambiaMobileNumber(mobileNumber);
                if (localPhone.length < 9) {
                    setError('Please enter a valid Zambia mobile number');
                    setIsLoading(false);
                    return;
                }

                const res = await api.post('/wallets/withdraw', {
                    walletId: selectedWallet,
                    amount: parseFloat(amount),
                    destinationType: 'mobile_money',
                    destinationDetails: {
                        phoneNumber: fullPhone,
                        provider,
                        country: 'zm',
                        accountName: resolvedAccountName || undefined
                    },
                    pin
                });

                if (res.data.success) {
                    const reference = res.data.reference || '';
                    const status = String(res.data.status || 'pending').trim().toUpperCase();
                    setLastWithdrawal({
                        reference,
                        amount: parseFloat(amount),
                        feeAmount: Number(res.data.fee_amount || feeAmount || 0),
                        totalDebited: Number(res.data.total_debited || totalDebited || parseFloat(amount)),
                        currency: wallet?.currency || 'ZMW',
                        status,
                        providerStatus: res.data.provider_status || status
                    });
                    loadWithdrawalHistory();
                    if (status === 'COMPLETED' || status === 'SUCCESSFUL') {
                        setShowStatusModal(false);
                        setShowSuccessModal(true);
                        setTimeout(() => navigate('/dashboard'), 3000);
                    } else {
                        setPollingMessage('Payment request sent. Checking withdrawal status...');
                        setShowSuccessModal(false);
                        setShowStatusModal(true);
                        setPollingReference(reference);
                    }
                } else {
                    setError('Failed to initiate mobile money withdrawal');
                }
            } catch (err: any) {
                const message =
                    err?.response?.data?.error ||
                    err?.response?.data?.details?.message ||
                    err?.message ||
                    'Failed to initiate mobile money withdrawal';
                setError(message);
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
                    setLastWithdrawal({
                        reference: res.data.reference,
                        amount: parseFloat(amount),
                        feeAmount: Number(res.data.fee_amount || feeAmount || 0),
                        totalDebited: Number(res.data.total_debited || totalDebited || parseFloat(amount)),
                        currency: wallet?.currency || 'ZMW',
                        status: String(res.data.status || 'PENDING').toUpperCase(),
                        providerStatus: res.data.provider_status
                    });
                    setShowSuccessModal(true);
                    loadWithdrawalHistory();
                    setTimeout(() => navigate('/dashboard'), 3000);
                }
            } catch (err: any) {
                const message =
                    err?.response?.data?.error ||
                    err?.response?.data?.details?.message ||
                    err?.message ||
                    'Failed to process bank withdrawal';
                setError(message);
            } finally {
                setIsLoading(false);
            }
        }
        setIsLoading(false);
    };

    const providers = [
        { id: 'MTN_MOMO_ZMB', name: 'MTN', logo: '/assets/images/MTN_Logo.svg' },
        { id: 'AIRTEL_OAPI_ZMB', name: 'Airtel', logo: '/assets/images/Airtel_Africa_logo.svg' },
        { id: 'ZAMTEL_ZMB', name: 'Zamtel', logo: '/assets/images/zamtel.png' }
    ];

    const formatDateTime = (value: string) =>
        new Date(value).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

    const statusTone = (status?: string | null) => {
        const normalized = String(status || '').toUpperCase();
        if (normalized === 'COMPLETED' || normalized === 'SUCCESSFUL') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (normalized === 'FAILED') return 'bg-rose-50 text-rose-700 border-rose-100';
        return 'bg-amber-50 text-amber-700 border-amber-100';
    };

    const getWithdrawalBankName = (withdrawal: WithdrawalRecord) => {
        const directName = withdrawal.destination_details.bankName?.trim();
        if (directName) return directName;
        const bankId = String(withdrawal.destination_details.bankId || '').trim();
        return BANK_ID_TO_NAME[bankId] || null;
    };

    const summarizeDestination = (withdrawal: WithdrawalRecord) => {
        if (withdrawal.destination_type === 'bank_account') {
            return getWithdrawalBankName(withdrawal)
                || linkedBanks.find(bank => bank.bank_id === withdrawal.destination_details.bankId)?.bank_name
                || 'Bank account';
        }
        return withdrawal.destination_details.accountName
            || withdrawal.destination_details.phoneNumber
            || 'Mobile money';
    };

    const getRecentTransactionBrand = (withdrawal: WithdrawalRecord) => {
        if (withdrawal.destination_type === 'bank_account') {
            return {
                type: 'bank' as const,
                name: summarizeDestination(withdrawal)
            };
        }

        const providerKey = String(
            withdrawal.destination_details?.operator
            || withdrawal.destination_details?.provider
            || withdrawal.provider
            || ''
        ).trim().toUpperCase() as keyof typeof MOBILE_MONEY_PROVIDERS;

        return {
            type: 'mobile' as const,
            provider: providerKey
        };
    };

    const getRecentTransactionLabel = (withdrawal: WithdrawalRecord) =>
        withdrawal.destination_type === 'bank_account' ? 'Bank withdrawal' : 'Mobile money withdrawal';

    const getRecentTransactionNote = (withdrawal: WithdrawalRecord) => {
        if (withdrawal.destination_type === 'bank_account') {
            const accountName = withdrawal.destination_details.accountName?.trim();
            return accountName
                ? `${summarizeDestination(withdrawal)} • ${accountName}`
                : summarizeDestination(withdrawal);
        }

        const mobileBrand = MOBILE_MONEY_PROVIDERS[
            String(
                withdrawal.destination_details?.operator
                || withdrawal.destination_details?.provider
                || withdrawal.provider
                || ''
            ).trim().toUpperCase() as keyof typeof MOBILE_MONEY_PROVIDERS
        ];
        const phone = withdrawal.destination_details.phoneNumber?.trim();
        return [mobileBrand?.name || 'Mobile money', phone].filter(Boolean).join(' • ');
    };

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
                                                {withdrawMethod === 'bank_account' && (
                                                    <span className="text-blue-600 ml-1">(ZMW and USD)</span>
                                                )}
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {wallets
                                                    .filter(w => {
                                                        if (withdrawMethod === 'mobile_money') return w.currency === 'ZMW';
                                                        if (withdrawMethod === 'bank_account') return ['ZMW', 'USD'].includes(w.currency);
                                                        return true;
                                                    })
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
                                                            {Number(w.pending_withdrawal_amount || 0) > 0 && (
                                                                <p className="mt-1 text-[11px] font-semibold text-amber-600">
                                                                    {Number(w.pending_withdrawal_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} reserved
                                                                </p>
                                                            )}
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
                                            <div className="mt-2 text-xs font-semibold">
                                                {isResolvingAccount ? (
                                                    <span className="text-amber-700">Resolving account name...</span>
                                                ) : resolvedAccountName ? (
                                                    <span className="text-emerald-700">Account name: {resolvedAccountName}</span>
                                                ) : resolveError ? (
                                                    <span className="text-rose-600">{resolveError}</span>
                                                ) : (
                                                    <span className="text-gray-400">Account name will appear after resolution.</span>
                                                )}
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
                                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden ${
                                                                isSelected ? 'bg-white' : 'bg-gray-50'
                                                            }`}>
                                                                <BankLogo bankName={b.bank_name} className="w-12 h-12 rounded-lg p-2" />
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
                                            <span className="text-sm text-gray-500">Fee</span>
                                            <span className="font-bold text-gray-900">{feeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {wallet?.currency}</span>
                                        </div>
                                        <div className="pt-3 border-t border-gray-100">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-semibold text-gray-900">Total Debited</span>
                                                <span className="text-xl font-bold text-emerald-600">{totalDebited.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {wallet?.currency}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-50 rounded-xl flex gap-3 items-start border border-blue-100">
                                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="text-xs text-blue-700 space-y-1">
                                            <p>
                                                {withdrawMethod === 'mobile_money'
                                                    ? "Mobile money payouts are usually instant. Some networks may take up to 2 hours."
                                                    : "Bank transfers typically settle within 30 minutes during clearing hours."}
                                            </p>
                                            {withdrawMethod === 'bank_account' && (
                                                <p className="font-semibold text-blue-700">
                                                    Bank withdrawal fees follow Airtel-style transfer bands.
                                                </p>
                                            )}
                                            {pendingReserved > 0 && (
                                                <p className="font-semibold text-amber-700">
                                                    {pendingReserved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {wallet?.currency} is currently reserved in pending withdrawals.
                                                </p>
                                            )}
                                        </div>
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

                            <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)]">
                                <div className="flex items-start justify-between gap-4 mb-5">
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Recent Transactions</p>
                                        <h3 className="mt-2 text-xl font-black text-slate-900">Latest withdrawals</h3>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">Bank and mobile money payouts with live provider branding.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={loadWithdrawalHistory}
                                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                    >
                                        Refresh
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {isHistoryLoading ? (
                                        <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-10 text-center text-sm font-medium text-slate-400">
                                            Loading withdrawal history...
                                        </div>
                                    ) : recentWithdrawals.length === 0 ? (
                                        <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
                                            <p className="text-sm font-semibold text-slate-500">No withdrawals yet</p>
                                            <p className="mt-1 text-xs text-slate-400">Recent bank and mobile money payouts will appear here.</p>
                                        </div>
                                    ) : (
                                        recentWithdrawals.map(withdrawal => {
                                            const brand = getRecentTransactionBrand(withdrawal);
                                            return (
                                                <button
                                                    key={withdrawal.id}
                                                    type="button"
                                                    onClick={() => navigate('/transactions')}
                                                    className="group w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-[0_16px_45px_-38px_rgba(15,23,42,0.7)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_20px_50px_-34px_rgba(16,185,129,0.25)]"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex min-w-0 items-start gap-3">
                                                            {brand.type === 'bank' ? (
                                                                <BankLogo
                                                                    bankName={brand.name}
                                                                    className="h-14 w-14 shrink-0 rounded-2xl border border-slate-100 p-2.5 shadow-sm"
                                                                />
                                                            ) : (
                                                                <MobileMoneyLogo
                                                                    provider={brand.provider}
                                                                    className="h-14 w-14 rounded-2xl border border-slate-100 p-2.5 shadow-sm"
                                                                />
                                                            )}
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <p className="text-sm font-black text-slate-900">
                                                                        {getRecentTransactionLabel(withdrawal)}
                                                                    </p>
                                                                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusTone(withdrawal.local_status)}`}>
                                                                        {withdrawal.local_status}
                                                                    </span>
                                                                </div>
                                                                <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                                                                    {getRecentTransactionNote(withdrawal)}
                                                                </p>
                                                                <p className="mt-2 text-[11px] text-slate-400">
                                                                    {formatDateTime(withdrawal.created_at)} • Ref {withdrawal.reference}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="text-right">
                                                            <p className="text-base font-black text-slate-900">
                                                                {Number(withdrawal.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </p>
                                                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                                                                {withdrawal.currency}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 grid grid-cols-3 gap-3 rounded-[20px] bg-slate-50 px-3 py-3 text-[11px]">
                                                        <div>
                                                            <span className="block uppercase tracking-[0.16em] text-slate-400">Provider</span>
                                                            <span className="mt-1 block font-semibold text-slate-700">
                                                                {String(withdrawal.provider || 'settlement').replace(/_/g, ' ')}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="block uppercase tracking-[0.16em] text-slate-400">Fee</span>
                                                            <span className="mt-1 block font-semibold text-slate-700">
                                                                {Number(withdrawal.fee_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {withdrawal.currency}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="block uppercase tracking-[0.16em] text-slate-400">Total</span>
                                                            <span className="mt-1 block font-semibold text-slate-700">
                                                                {Number(withdrawal.total_debited || withdrawal.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {withdrawal.currency}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {withdrawal.failure_reason && (
                                                        <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                                                            {withdrawal.failure_reason}
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => navigate('/transactions')}
                                    className="mt-5 inline-flex w-full items-center justify-center rounded-[20px] bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-[0.24em] text-white transition hover:bg-slate-800"
                                >
                                    View More
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

                        <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
                            {withdrawMethod === 'mobile_money'
                                ? (lastWithdrawal?.status === 'COMPLETED' || lastWithdrawal?.status === 'SUCCESSFUL'
                                    ? 'Withdrawal Completed!'
                                    : 'Withdrawal In Progress')
                                : 'Transaction Completed!'}
                        </h3>
                        <p className="text-gray-500 font-bold mb-6 uppercase text-[10px] tracking-widest">
                            {withdrawMethod === 'mobile_money'
                                ? (lastWithdrawal?.status === 'COMPLETED' || lastWithdrawal?.status === 'SUCCESSFUL'
                                    ? 'Your withdrawal was successful'
                                    : 'Checking withdrawal status with Lenco')
                                : 'Your withdrawal was successful'}
                        </p>

                        {/* Transaction Details Card */}
                        <div className="mb-8 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 text-left">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 font-semibold uppercase">Amount</span>
                                    <span className="text-lg font-black text-gray-900">
                                        {lastWithdrawal ? `${lastWithdrawal.amount.toFixed(2)} ${lastWithdrawal.currency}` : `${amount} ${wallet?.currency}`}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 font-semibold uppercase">Fee</span>
                                    <span className="text-sm font-bold text-gray-700">
                                        {lastWithdrawal ? `${lastWithdrawal.feeAmount.toFixed(2)} ${lastWithdrawal.currency}` : `${feeAmount.toFixed(2)} ${wallet?.currency}`}
                                    </span>
                                </div>
                                <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                                    <span className="text-xs text-gray-500 font-semibold uppercase">Total Debited</span>
                                    <span className="text-xl font-black text-emerald-600">
                                        {lastWithdrawal ? `${lastWithdrawal.totalDebited.toFixed(2)} ${lastWithdrawal.currency}` : `${totalDebited.toFixed(2)} ${wallet?.currency}`}
                                    </span>
                                </div>
                                {lastWithdrawal && (
                                    <div className="pt-3 border-t border-gray-200">
                                        <span className="text-xs text-gray-500 font-semibold uppercase">Settlement Reference</span>
                                        <p className="mt-1 text-sm font-black text-gray-900 break-all">{lastWithdrawal.reference}</p>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-xs font-bold text-emerald-600">
                                            Status: {lastWithdrawal?.providerStatus || lastWithdrawal?.status || 'COMPLETED'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 font-medium mb-6 leading-relaxed">
                            {withdrawMethod === 'bank_account'
                                ? 'Your bank payout has been submitted to the settlement rail. You can track its final provider reference in recent withdrawals.'
                                : 'The transfer is being processed by Lenco. The modal will close once the withdrawal is confirmed.'}
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

            {showStatusModal && (
                <div className="fixed inset-0 bg-gray-900/35 backdrop-blur-md flex items-center justify-center z-[95] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full mx-4 p-8 border border-gray-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center text-orange-700 shadow-sm">
                                <svg className="w-7 h-7 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m5-3a8 8 0 11-16 0 8 8 0 0116 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">Processing withdrawal</h3>
                                <p className="text-sm text-gray-500 font-medium">{pollingMessage}</p>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-5 mb-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="block text-[10px] uppercase tracking-[0.18em] text-gray-500">Amount</span>
                                    <span className="block mt-1 text-gray-900 font-black">
                                        {lastWithdrawal ? `${lastWithdrawal.amount.toFixed(2)} ${lastWithdrawal.currency}` : `${amount} ${wallet?.currency}`}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase tracking-[0.18em] text-gray-500">Fee</span>
                                    <span className="block mt-1 text-gray-900 font-black">
                                        {lastWithdrawal ? `${lastWithdrawal.feeAmount.toFixed(2)} ${lastWithdrawal.currency}` : `${feeAmount.toFixed(2)} ${wallet?.currency}`}
                                    </span>
                                </div>
                                <div className="col-span-2 pt-3 border-t border-amber-100 flex items-center justify-between">
                                    <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Total Debited</span>
                                    <span className="text-lg text-orange-700 font-black">
                                        {lastWithdrawal ? `${lastWithdrawal.totalDebited.toFixed(2)} ${lastWithdrawal.currency}` : `${totalDebited.toFixed(2)} ${wallet?.currency}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500">
                            Lenco is processing the mobile money withdrawal. This modal will close automatically when the transfer status updates.
                        </p>
                    </div>
                </div>
            )}

            <PinApprovalModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                onSuccess={handlePinSuccess}
                description={`Approve withdrawal of ${wallet?.currency} ${amount} to your ${withdrawMethod === 'mobile_money' ? (resolvedAccountName || 'mobile wallet') : 'bank account'} `}
            />
        </div>
    );
};
