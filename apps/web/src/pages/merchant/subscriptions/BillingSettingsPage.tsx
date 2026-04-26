import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Settings, ArrowLeft, Save, Bell, RefreshCw, Mail } from 'lucide-react';
import { api } from '../../../lib/axios';
import { useAuth } from '../../../contexts/AuthContext';

interface BillingSettings {
    dunning_days: number[];
    max_attempts: number;
    trial_reminder_days: number;
    email_payment_failed: boolean;
    email_subscription_canceled: boolean;
    email_trial_ending: boolean;
    email_renewal_receipt: boolean;
}

const DEFAULTS: BillingSettings = {
    dunning_days: [0, 3, 7],
    max_attempts: 3,
    trial_reminder_days: 3,
    email_payment_failed: true,
    email_subscription_canceled: true,
    email_trial_ending: true,
    email_renewal_receipt: true,
};

export default function BillingSettingsPage() {
    const navigate = useNavigate();
    const { token } = useAuth();

    const [settings, setSettings] = useState<BillingSettings>(DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [dunningInput, setDunningInput] = useState('0, 3, 7');

    const headers = { 'Authorization': 'Bearer ' + token };

    useEffect(() => {
        api.get('/v1/billing/settings', { headers })
            .then(res => {
                const d = res.data?.data || res.data || {};
                const s: BillingSettings = { ...DEFAULTS, ...d };
                setSettings(s);
                setDunningInput((s.dunning_days || [0,3,7]).join(', '));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaved(false);
        try {
            // Parse dunning days from the text input
            const parsedDays = dunningInput
                .split(',')
                .map(s => parseInt(s.trim()))
                .filter(n => !isNaN(n) && n >= 0)
                .sort((a, b) => a - b);

            const payload = { ...settings, dunning_days: parsedDays };
            await api.put('/v1/billing/settings', payload, { headers });
            setSettings(payload);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const toggle = (key: keyof BillingSettings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const EmailToggle = ({ label, desc, field }: { label: string; desc: string; field: keyof BillingSettings }) => (
        <div className="flex items-start justify-between py-4 border-b border-gray-100 last:border-0">
            <div>
                <div className="text-sm font-bold text-gray-900">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
            </div>
            <button
                type="button"
                onClick={() => toggle(field)}
                className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ml-4 ${
                    settings[field] ? 'bg-orange-500' : 'bg-gray-200'
                }`}
            >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings[field] ? 'translate-x-5' : 'translate-x-0'
                }`} />
            </button>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F9FAFB] lg:pl-72 flex items-center justify-center">
                <p className="text-gray-400">Loading settings…</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] lg:pl-72 flex flex-col font-sans relative overflow-hidden text-gray-600">
            <Sidebar isOpen={false} />
            <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

            <main className="flex-1 p-8 lg:p-12 z-10 w-full max-w-3xl">
                {/* Header */}
                <header className="mb-10">
                    <button onClick={() => navigate('/merchant/subscriptions')} className="flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm font-bold mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Subscriptions
                    </button>
                    <div className="flex items-center gap-3">
                        <Settings className="w-9 h-9 text-purple-500" />
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Billing Settings</h1>
                            <p className="text-gray-500 text-sm">Configure dunning, retries, and email notifications</p>
                        </div>
                    </div>
                </header>

                <form onSubmit={handleSave} className="space-y-6">

                    {/* Dunning Engine */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <RefreshCw className="w-5 h-5 text-orange-500" />
                            <h2 className="text-base font-black text-gray-900">Dunning Engine</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            When a payment fails, FlapaPay automatically retries on the schedule below. After all retries are exhausted, the subscription is canceled.
                        </p>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                    Retry Days (comma-separated)
                                </label>
                                <input
                                    value={dunningInput}
                                    onChange={e => setDunningInput(e.target.value)}
                                    placeholder="0, 3, 7"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                />
                                <p className="text-xs text-gray-400 mt-1.5">
                                    Days after the initial failure to retry. Example: <code className="font-mono bg-gray-100 px-1 rounded">0, 3, 7</code> retries immediately, then at 3 days, then 7 days.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                        Max Attempts
                                    </label>
                                    <input
                                        type="number" min="1" max="10"
                                        value={settings.max_attempts}
                                        onChange={e => setSettings({ ...settings, max_attempts: parseInt(e.target.value) })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                        Trial Reminder (days before)
                                    </label>
                                    <input
                                        type="number" min="1" max="30"
                                        value={settings.trial_reminder_days}
                                        onChange={e => setSettings({ ...settings, trial_reminder_days: parseInt(e.target.value) })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                    />
                                    <p className="text-xs text-gray-400 mt-1.5">Days before trial ends to send reminder email.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Email Notifications */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <Bell className="w-5 h-5 text-blue-500" />
                            <h2 className="text-base font-black text-gray-900">Email Notifications</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Choose which transactional emails your customers receive. Requires{' '}
                            <code className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">RESEND_API_KEY</code> to be set.
                        </p>

                        <div>
                            <EmailToggle
                                label="Payment Failed"
                                desc="Sent to the customer when a charge attempt fails."
                                field="email_payment_failed"
                            />
                            <EmailToggle
                                label="Renewal Receipt"
                                desc="Sent after each successful billing cycle."
                                field="email_renewal_receipt"
                            />
                            <EmailToggle
                                label="Trial Ending Reminder"
                                desc="Sent X days before a trial period expires."
                                field="email_trial_ending"
                            />
                            <EmailToggle
                                label="Subscription Canceled"
                                desc="Sent when a subscription is permanently canceled."
                                field="email_subscription_canceled"
                            />
                        </div>
                    </div>

                    {/* Save */}
                    <div className="flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 bg-gray-900 hover:bg-orange-500 text-white font-black px-8 py-3 rounded-xl transition-all disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving…' : 'Save Settings'}
                        </button>
                        {saved && (
                            <span className="text-green-600 text-sm font-bold flex items-center gap-1.5">
                                <Mail className="w-4 h-4" /> Settings saved successfully
                            </span>
                        )}
                    </div>
                </form>
            </main>
        </div>
    );
}
