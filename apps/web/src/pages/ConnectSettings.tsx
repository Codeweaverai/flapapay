import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import {
    Settings,
    Percent,
    Clock,
    DollarSign,
    Save,
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    Info,
    Zap,
    RefreshCw,
    Shield,
    Plus,
    Trash2,
    Layers,
} from 'lucide-react';

interface FeeTier {
    id?: string;
    min_volume: number;
    max_volume: number | null;
    fee_percent: number;
}

interface ConnectConfig {
    platform_fee_percent: number;
    fee_collection_method: 'per_transaction' | 'monthly';
    settlement_delay_days: number;
    min_payout_threshold: number;
    auto_payout_enabled: boolean;
    auto_payout_schedule: 'daily' | 'weekly' | 'monthly';
    currency: string;
}

const DEFAULT_CONFIG: ConnectConfig = {
    platform_fee_percent: 2.5,
    fee_collection_method: 'per_transaction',
    settlement_delay_days: 1,
    min_payout_threshold: 50,
    auto_payout_enabled: false,
    auto_payout_schedule: 'daily',
    currency: 'ZMW',
};

export const ConnectSettings: React.FC = () => {
    const navigate = useNavigate();
    const [config, setConfig] = useState<ConnectConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    // Fee tiers
    const [tiers, setTiers] = useState<FeeTier[]>([]);
    const [savingTiers, setSavingTiers] = useState(false);
    const [tiersSaveStatus, setTiersSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        fetchConfig();
        fetchTiers();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await api.get('/v1/connect/config');
            setConfig({ ...DEFAULT_CONFIG, ...res.data });
        } catch (err: any) {
            // If no config yet, use defaults (404 is fine on first load)
            setConfig(DEFAULT_CONFIG);
        } finally {
            setLoading(false);
        }
    };

    const fetchTiers = async () => {
        try {
            const res = await api.get('/v1/connect/fee-tiers');
            setTiers(res.data.tiers ?? []);
        } catch {
            setTiers([]);
        }
    };

    const handleSaveTiers = async () => {
        setSavingTiers(true);
        setTiersSaveStatus('idle');
        try {
            await api.put('/v1/connect/fee-tiers', { tiers });
            setTiersSaveStatus('success');
            await fetchTiers();
            setTimeout(() => setTiersSaveStatus('idle'), 3000);
        } catch {
            setTiersSaveStatus('error');
        } finally {
            setSavingTiers(false);
        }
    };

    const addTier = () => {
        const lastMax = tiers.length > 0 ? (tiers[tiers.length - 1].max_volume ?? 0) : 0;
        setTiers([...tiers, { min_volume: lastMax, max_volume: null, fee_percent: 2.5 }]);
    };

    const updateTier = (idx: number, field: keyof FeeTier, value: any) => {
        setTiers(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
    };

    const removeTier = (idx: number) => {
        setTiers(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveStatus('idle');
        setErrorMsg('');
        try {
            await api.patch('/v1/connect/config', config);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err: any) {
            setSaveStatus('error');
            setErrorMsg(err?.response?.data?.error || 'Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const exampleRevenue = (1000 * config.platform_fee_percent) / 100;

    return (
        <div className="min-h-screen bg-gray-100 flex text-gray-900 font-['Inter']">
            <div className="hidden md:block w-72 shrink-0 border-r border-amber-100/50">
                <Sidebar />
            </div>

            <main className="flex-1 p-8 overflow-y-auto relative">
                {/* Ambient Glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-amber-200/20 to-orange-200/10 rounded-full blur-[150px] -z-10 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-orange-200/15 to-transparent rounded-full blur-[120px] -z-10 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <header className="mb-10">
                        <button
                            onClick={() => navigate('/merchant/connect')}
                            className="flex items-center gap-2 text-amber-600 hover:text-amber-700 text-sm font-bold mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Connect
                        </button>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-sm">
                                <Settings className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-black tracking-[0.3em] text-amber-600 uppercase">Marketplace Configuration</span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Connect Settings</h1>
                        <p className="text-gray-600 mt-2 font-medium">Configure platform fees, payout scheduling, and settlement rules for your marketplace.</p>
                    </header>

                    {loading ? (
                        <div className="flex items-center justify-center py-32">
                            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Platform Fee Section */}
                            <section className="bg-white border border-amber-100 rounded-[2.5rem] p-10 shadow-sm">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                                        <Percent className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900">Platform Fee</h2>
                                        <p className="text-gray-600 text-base">Percentage collected from every transaction processed by sub-merchants.</p>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-sm font-black text-gray-600 uppercase tracking-widest mb-3">
                                            Default Fee Percentage
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="20"
                                                step="0.1"
                                                value={config.platform_fee_percent}
                                                onChange={(e) => setConfig({ ...config, platform_fee_percent: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-5 py-4 pr-12 bg-gray-50 border border-amber-200 rounded-2xl text-gray-900 font-black text-xl outline-none focus:ring-4 focus:ring-amber-400/20 focus:border-amber-400 transition-all"
                                            />
                                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-amber-600 font-black text-xl">%</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">Recommended: 1.5% – 3.5% for African markets</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-black text-gray-600 uppercase tracking-widest mb-3">
                                            Fee Collection Method
                                        </label>
                                        <div className="space-y-3">
                                            {[
                                                { value: 'per_transaction', label: 'Per Transaction', desc: 'Collected automatically on each payment' },
                                                { value: 'monthly', label: 'Monthly Invoice', desc: 'Aggregated and invoiced monthly' },
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setConfig({ ...config, fee_collection_method: option.value as any })}
                                                    className={`w-full p-4 rounded-2xl border text-left transition-all ${config.fee_collection_method === option.value
                                                        ? 'bg-amber-50 border-amber-300 shadow-sm'
                                                        : 'bg-gray-50 border-gray-200 hover:border-amber-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className={`text-base font-black ${config.fee_collection_method === option.value ? 'text-amber-700' : 'text-gray-700'}`}>
                                                                {option.label}
                                                            </p>
                                                            <p className="text-sm text-gray-500 mt-0.5">{option.desc}</p>
                                                        </div>
                                                        <div className={`w-4 h-4 rounded-full border-2 transition-all ${config.fee_collection_method === option.value ? 'border-amber-500 bg-amber-500' : 'border-gray-300'}`}></div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Revenue Preview */}
                                <div className="mt-8 p-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Info className="w-4 h-4 text-amber-500" />
                                        <span className="text-xs font-black text-amber-700 uppercase tracking-widest">Revenue Preview</span>
                                    </div>
                                    <p className="text-gray-700 text-sm font-medium">
                                        On every <span className="font-black text-gray-900">ZK 1,000</span> transaction processed by a sub-merchant, you collect{' '}
                                        <span className="font-black text-amber-600">ZK {exampleRevenue.toFixed(2)}</span> as platform revenue.
                                    </p>
                                    <p className="text-gray-500 text-xs mt-1">
                                        At ZK 100,000 monthly GMV → <span className="font-bold text-gray-700">ZK {((100000 * config.platform_fee_percent) / 100).toFixed(2)} / month</span>
                                    </p>
                                </div>
                            </section>

                            {/* Tiered Fee Schedules */}
                            <section className="bg-white border border-amber-100 rounded-[2.5rem] p-10 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                                            <Layers className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900">Tiered Fee Schedule</h2>
                                            <p className="text-gray-600 text-base">Reward high-volume sub-merchants with lower fees. Overrides the default fee when matched.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={addTier}
                                        className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors"
                                    >
                                        <Plus size={14} /> Add Tier
                                    </button>
                                </div>

                                {tiers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-2xl border border-dashed border-amber-200">
                                        <Layers size={32} className="text-amber-300 mb-3" />
                                        <p className="text-sm text-gray-500">No fee tiers configured</p>
                                        <p className="text-xs text-gray-400 mt-1">The default platform fee applies to all sub-merchants</p>
                                        <button onClick={addTier} className="mt-3 text-sm text-amber-600 hover:underline">Add your first tier</button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-12 gap-3 px-1 pb-1 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                            <div className="col-span-4">Min Volume (ZK)</div>
                                            <div className="col-span-4">Max Volume (ZK)</div>
                                            <div className="col-span-3">Fee %</div>
                                            <div className="col-span-1" />
                                        </div>
                                        {tiers.map((tier, idx) => (
                                            <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-gray-50 rounded-2xl px-4 py-3">
                                                <div className="col-span-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="100"
                                                        value={tier.min_volume}
                                                        onChange={e => updateTier(idx, 'min_volume', parseFloat(e.target.value) || 0)}
                                                        className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                                    />
                                                </div>
                                                <div className="col-span-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="100"
                                                        value={tier.max_volume ?? ''}
                                                        placeholder="Unlimited"
                                                        onChange={e => updateTier(idx, 'max_volume', e.target.value === '' ? null : parseFloat(e.target.value))}
                                                        className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.1"
                                                            value={tier.fee_percent}
                                                            onChange={e => updateTier(idx, 'fee_percent', parseFloat(e.target.value) || 0)}
                                                            className="w-full border border-amber-200 rounded-xl px-3 py-2 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">%</span>
                                                    </div>
                                                </div>
                                                <div className="col-span-1 flex justify-center">
                                                    <button
                                                        onClick={() => removeTier(idx)}
                                                        className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="flex items-center justify-between pt-3">
                                            <div className="text-sm text-gray-500">
                                                Tiers are matched against the sub-merchant's <span className="font-semibold">cumulative processed volume</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {tiersSaveStatus === 'success' && (
                                                    <span className="text-sm text-amber-600 font-semibold flex items-center gap-1">
                                                        <CheckCircle size={12} /> Saved
                                                    </span>
                                                )}
                                                {tiersSaveStatus === 'error' && (
                                                    <span className="text-sm text-orange-600 font-semibold flex items-center gap-1">
                                                        <AlertCircle size={12} /> Failed to save
                                                    </span>
                                                )}
                                                <button
                                                    onClick={handleSaveTiers}
                                                    disabled={savingTiers}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 transition-all"
                                                >
                                                    {savingTiers ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                                                    Save Tiers
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Settlement & Payout Section */}
                            <section className="bg-white border border-amber-100 rounded-[2.5rem] p-10 shadow-sm">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                                        <Clock className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900">Settlement & Payouts</h2>
                                        <p className="text-gray-600 text-base">Control when funds become available and how sub-merchants get paid.</p>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8 mb-8">
                                    <div>
                                        <label className="block text-sm font-black text-gray-600 uppercase tracking-widest mb-3">
                                            Settlement Delay
                                        </label>
                                        <div className="space-y-3">
                                            {[
                                                { value: 0, label: 'T+0 (Instant)', desc: 'Funds available immediately after payment' },
                                                { value: 1, label: 'T+1 (Next Day)', desc: 'Standard settlement — most common' },
                                                { value: 2, label: 'T+2 (2 Days)', desc: 'Extended hold for risk management' },
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setConfig({ ...config, settlement_delay_days: option.value })}
                                                    className={`w-full p-4 rounded-2xl border text-left transition-all ${config.settlement_delay_days === option.value
                                                        ? 'bg-amber-50 border-amber-300 shadow-sm'
                                                        : 'bg-gray-50 border-gray-200 hover:border-amber-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className={`text-base font-black ${config.settlement_delay_days === option.value ? 'text-amber-700' : 'text-gray-700'}`}>
                                                                {option.label}
                                                            </p>
                                                            <p className="text-sm text-gray-500 mt-0.5">{option.desc}</p>
                                                        </div>
                                                        <div className={`w-4 h-4 rounded-full border-2 transition-all ${config.settlement_delay_days === option.value ? 'border-amber-500 bg-amber-500' : 'border-gray-300'}`}></div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-black text-gray-600 uppercase tracking-widest mb-3">
                                            Minimum Payout Threshold (ZK)
                                        </label>
                                        <div className="relative mb-6">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
                                            <input
                                                type="number"
                                                min="0"
                                                step="10"
                                                value={config.min_payout_threshold}
                                                onChange={(e) => setConfig({ ...config, min_payout_threshold: parseFloat(e.target.value) || 0 })}
                                                className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-amber-200 rounded-2xl text-gray-900 font-bold outline-none focus:ring-4 focus:ring-amber-400/20 focus:border-amber-400 transition-all"
                                            />
                                        </div>
                                        <p className="text-sm text-gray-500 mb-6">Sub-merchants must accumulate at least this amount before a payout is triggered.</p>

                                        <label className="block text-sm font-black text-gray-600 uppercase tracking-widest mb-3">
                                            Default Payout Currency
                                        </label>
                                        <select
                                            value={config.currency}
                                            onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border border-amber-200 rounded-2xl text-gray-900 font-bold outline-none focus:ring-4 focus:ring-amber-400/20 focus:border-amber-400 transition-all"
                                        >
                                            <option value="ZMW">ZMW — Zambian Kwacha</option>
                                            <option value="USD">USD — US Dollar</option>
                                            <option value="ZAR">ZAR — South African Rand</option>
                                            <option value="KES">KES — Kenyan Shilling</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Auto Payout Toggle */}
                                <div className="p-6 bg-amber-50/50 border border-amber-200 rounded-2xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <Zap className="w-5 h-5 text-amber-500" />
                                            <div>
                                                <p className="font-black text-gray-900 text-sm">Automatic Payouts</p>
                                                <p className="text-xs text-gray-500">Automatically disburse available funds to sub-merchants on a schedule</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setConfig({ ...config, auto_payout_enabled: !config.auto_payout_enabled })}
                                            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${config.auto_payout_enabled ? 'bg-amber-500' : 'bg-gray-300'}`}
                                        >
                                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${config.auto_payout_enabled ? 'left-6.5 translate-x-1' : 'left-0.5'}`}></span>
                                        </button>
                                    </div>

                                    {config.auto_payout_enabled && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <label className="block text-sm font-black text-gray-600 uppercase tracking-widest mb-3">Payout Schedule</label>
                                            <div className="flex gap-3">
                                                {(['daily', 'weekly', 'monthly'] as const).map((schedule) => (
                                                    <button
                                                        key={schedule}
                                                        onClick={() => setConfig({ ...config, auto_payout_schedule: schedule })}
                                                        className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${config.auto_payout_schedule === schedule
                                                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20'
                                                            : 'bg-white border border-gray-200 text-gray-500 hover:border-amber-200'
                                                            }`}
                                                    >
                                                        {schedule}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Security Note */}
                            <section className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-[2.5rem] p-8 text-white shadow-lg shadow-amber-500/20">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                        <Shield className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg mb-2">Compliance Note</h3>
                                        <p className="text-white/90 text-base leading-relaxed">
                                            Platform fees are automatically collected from each sub-merchant transaction and credited to your primary marketplace wallet. All fee transactions are recorded in the immutable double-entry ledger for BoZ audit compliance. Fee changes take effect on new transactions only — existing pending settlements are unaffected.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Save Button */}
                            <div className="flex items-center justify-between pt-4 pb-8">
                                <div className="flex items-center gap-3">
                                    {saveStatus === 'success' && (
                                        <div className="flex items-center gap-2 text-amber-600 font-bold text-base">
                                            <CheckCircle className="w-5 h-5" />
                                            Configuration saved successfully
                                        </div>
                                    )}
                                    {saveStatus === 'error' && (
                                        <div className="flex items-center gap-2 text-orange-600 font-bold text-base">
                                            <AlertCircle className="w-5 h-5" />
                                            {errorMsg}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black rounded-2xl shadow-xl shadow-amber-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Save className="w-5 h-5" />
                                    )}
                                    Save Configuration
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
