import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface InviteInfo {
    email: string | null;
    business_name: string | null;
    platform_name: string;
    expires_at: string;
}

export default function InviteRegistrationPage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
    const [loadError, setLoadError] = useState('');
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        business_name: '',
        email: '',
        phone: '',
        country: 'ZM',
        password: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get(`/v1/connect/invite/${token}`);
                const inv = res.data;
                setInviteInfo(inv);
                setForm(f => ({
                    ...f,
                    email: inv.email || '',
                    business_name: inv.business_name || '',
                }));
            } catch (err: any) {
                setLoadError(err.response?.data?.error || 'This invite link is invalid or has expired.');
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.business_name || !form.email || !form.password) {
            setSubmitError('Please fill in all required fields.');
            return;
        }
        setSubmitting(true);
        setSubmitError('');
        try {
            await api.post(`/v1/connect/invite/${token}/register`, form);
            setSuccess(true);
        } catch (err: any) {
            setSubmitError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 size={28} className="animate-spin text-orange-500" />
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <AlertTriangle size={40} className="text-red-400 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-gray-800 mb-2">Invalid Invite</h2>
                    <p className="text-sm text-gray-500">{loadError}</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Account Created!</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Your sub-merchant account has been created successfully. You can now log in to start accepting payments.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-yellow-400 px-8 py-6">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-black text-xl tracking-tight">FlapaPay</span>
                    </div>
                    <h1 className="text-white text-lg font-bold">You've been invited!</h1>
                    <p className="text-orange-100 text-sm mt-1">
                        {inviteInfo?.platform_name
                            ? `${inviteInfo.platform_name} invites you to join as a sub-merchant`
                            : 'Create your sub-merchant account to start accepting payments'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Business Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={form.business_name}
                            onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
                            placeholder="Your business name"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            placeholder="you@example.com"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                            placeholder="+260 9X XXX XXXX"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <select
                            value={form.country}
                            onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        >
                            <option value="ZM">Zambia</option>
                            <option value="ZW">Zimbabwe</option>
                            <option value="KE">Kenya</option>
                            <option value="TZ">Tanzania</option>
                            <option value="UG">Uganda</option>
                            <option value="GH">Ghana</option>
                            <option value="NG">Nigeria</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="password"
                            required
                            minLength={8}
                            value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            placeholder="At least 8 characters"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>

                    {submitError && (
                        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                            {submitError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors mt-2"
                    >
                        {submitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 size={16} className="animate-spin" /> Creating account…
                            </span>
                        ) : 'Create My Account'}
                    </button>

                    <p className="text-center text-xs text-gray-400">
                        By registering you agree to FlapaPay's{' '}
                        <a href="/terms" className="text-orange-500 hover:underline">Terms of Service</a>
                    </p>
                </form>
            </div>
        </div>
    );
}
