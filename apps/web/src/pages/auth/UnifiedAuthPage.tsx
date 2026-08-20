import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Navbar } from '../../components/layout/Navbar';

type Audience = 'individual' | 'business';
type Mode = 'login' | 'signup';
type BusinessType = 'business' | 'other';

interface RegistrationType {
    value: string;
    label: string;
    description: string;
}

const INDIVIDUAL_COUNTRY_CODES = [
    { code: 'ZM', dial: '+260', name: 'Zambia' },
    { code: 'NG', dial: '+234', name: 'Nigeria' },
    { code: 'KE', dial: '+254', name: 'Kenya' },
    { code: 'ZA', dial: '+27', name: 'South Africa' },
    { code: 'GH', dial: '+233', name: 'Ghana' },
    { code: 'US', dial: '+1', name: 'United States' },
    { code: 'GB', dial: '+44', name: 'United Kingdom' },
];

const MERCHANT_COUNTRIES = ['Zambia', 'Nigeria', 'Kenya', 'South Africa', 'Ghana'];

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const UnifiedAuthPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [audience, setAudience] = useState<Audience>('individual');
    const [mode, setMode] = useState<Mode>('login');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Shared PIN/login state for individuals
    const [partialToken, setPartialToken] = useState<string | null>(null);
    const [pinStep, setPinStep] = useState<'none' | 'verify' | 'setup'>('none');
    const [pin, setPin] = useState('');

    // Individual auth state
    const [individualEmail, setIndividualEmail] = useState('');
    const [individualPassword, setIndividualPassword] = useState('');
    const [individualFirstName, setIndividualFirstName] = useState('');
    const [individualLastName, setIndividualLastName] = useState('');
    const [individualPhone, setIndividualPhone] = useState('');
    const [individualCountryCode, setIndividualCountryCode] = useState('+260');
    const [showPassword, setShowPassword] = useState(false);

    // Merchant auth state
    const [merchantEmail, setMerchantEmail] = useState('');
    const [merchantPassword, setMerchantPassword] = useState('');
    const [merchantFirstName, setMerchantFirstName] = useState('');
    const [merchantLastName, setMerchantLastName] = useState('');
    const [merchantBusinessName, setMerchantBusinessName] = useState('');
    const [merchantCountry, setMerchantCountry] = useState('Zambia');
    const [merchantAccountType, setMerchantAccountType] = useState<BusinessType>('business');
    const [merchantIsIncorporated, setMerchantIsIncorporated] = useState<boolean | null>(null);
    const [merchantRegistrationType, setMerchantRegistrationType] = useState('');
    const [merchantAgreedToTerms, setMerchantAgreedToTerms] = useState(false);
    const [registrationTypes, setRegistrationTypes] = useState<RegistrationType[]>([]);

    useEffect(() => {
        if (audience !== 'business' || mode !== 'signup' || merchantCountry !== 'Zambia') return;
        if (registrationTypes.length > 0) return;

        api.get('/merchants/zambia/registration-types')
            .then((res) => setRegistrationTypes(res.data.registrationTypes || []))
            .catch(() => {
                setRegistrationTypes([
                    { value: 'sole-proprietorship', label: 'Sole Proprietorship', description: '' },
                    { value: 'limited-liability', label: 'Private Limited Company (Ltd)', description: '' },
                    { value: 'public-company', label: 'Public Limited Company (PLC)', description: '' },
                    { value: 'partnership', label: 'Partnership', description: '' },
                    { value: 'ngo', label: 'NGO / Non-Profit', description: '' },
                ]);
            });
    }, [audience, mode, merchantCountry, registrationTypes.length]);

    useEffect(() => {
        setError('');
        setSuccess('');
        setPin('');
        setPinStep('none');
        setPartialToken(null);
    }, [audience, mode]);

    const merchantRegistrationOptions = useMemo(() => {
        if (registrationTypes.length > 0) return registrationTypes;
        return [
            { value: 'sole-proprietorship', label: 'Sole Proprietorship', description: '' },
            { value: 'limited-liability', label: 'Private Limited Company (Ltd)', description: '' },
            { value: 'public-company', label: 'Public Limited Company (PLC)', description: '' },
            { value: 'partnership', label: 'Partnership', description: '' },
            { value: 'ngo', label: 'NGO / Non-Profit', description: '' },
        ];
    }, [registrationTypes]);

    const handleIndividualLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');
        try {
            const res = await api.post('/auth/login', {
                email: normalizeEmail(individualEmail),
                password: individualPassword,
            });

            if (res.data.pinRequired) {
                setPartialToken(res.data.partialToken);
                setPinStep('verify');
                return;
            }

            if (res.data.setupPinRequired) {
                setPartialToken(res.data.partialToken);
                setPinStep('setup');
                return;
            }

            login(res.data.token, res.data.user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to sign in.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleIndividualSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');
        try {
            const phone = `${individualCountryCode}${individualPhone.replace(/\D/g, '')}`;
            const res = await api.post('/auth/register', {
                email: normalizeEmail(individualEmail),
                password: individualPassword,
                firstName: individualFirstName,
                lastName: individualLastName,
                phone,
                pin,
            });
            const credited = res.data.creditedPayments || 0;
            setSuccess(
                credited > 0
                    ? `Account created. ${credited} pending payment${credited > 1 ? 's have' : ' has'} been credited to your wallet.`
                    : 'Account created successfully. You can sign in now.'
            );
            setMode('login');
            setPin('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create account.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            const res = await api.post('/auth/verify-pin', { partialToken, pin });
            login(res.data.token, res.data.user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid PIN.');
            setPin('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetupPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            const res = await api.post('/auth/setup-pin', { partialToken, pin });
            login(res.data.token, res.data.user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to setup PIN.');
            setPin('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMerchantLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');
        try {
            const res = await api.post('/merchants/login', {
                email: normalizeEmail(merchantEmail),
                password: merchantPassword,
            });
            login(res.data.token, res.data.user);
            localStorage.setItem('merchantId', res.data.merchant.id);
            navigate('/merchant/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to sign in.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMerchantSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');
        try {
            const res = await api.post('/merchants/register', {
                email: normalizeEmail(merchantEmail),
                password: merchantPassword,
                firstName: merchantFirstName,
                lastName: merchantLastName,
                businessName: merchantBusinessName,
                country: merchantCountry,
                accountType: merchantAccountType,
                isIncorporated: merchantIsIncorporated,
                registrationType: merchantRegistrationType,
                agreedToTerms: merchantAgreedToTerms,
            });
            login(res.data.token, res.data.user);
            localStorage.setItem('merchantId', res.data.merchant.id);
            navigate('/merchant/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create merchant account.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForgotPassword = async () => {
        setIsSubmitting(true);
        setError('');
        setSuccess('');
        try {
            const res = await api.post('/auth/forgot-password', { email: normalizeEmail(individualEmail) });
            setSuccess(res.data.message || 'Reset instructions sent.');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send recovery email.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderPinStep = () => (
        <form onSubmit={pinStep === 'verify' ? handleVerifyPin : handleSetupPin} className="space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900">{pinStep === 'verify' ? 'Enter your PIN' : 'Create your PIN'}</h2>
                <p className="mt-2 text-slate-500 font-medium">
                    {pinStep === 'verify'
                        ? 'Your password is correct. Complete login with your 4-digit security PIN.'
                        : 'Secure your individual account with a 4-digit PIN.'}
                </p>
            </div>
            <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full px-6 py-5 rounded-3xl border border-slate-200 bg-slate-50 text-center tracking-[0.6em] text-2xl font-black outline-none focus:border-orange-500 focus:bg-white"
                placeholder="••••"
                required
            />
            <button
                type="submit"
                disabled={isSubmitting || pin.length !== 4}
                className="w-full rounded-3xl bg-slate-950 text-white py-4 font-black text-sm uppercase tracking-[0.18em] disabled:opacity-50"
            >
                {isSubmitting ? 'Processing...' : pinStep === 'verify' ? 'Verify PIN' : 'Save PIN'}
            </button>
            <button
                type="button"
                onClick={() => {
                    setPinStep('none');
                    setPin('');
                    setPartialToken(null);
                }}
                className="w-full text-center text-xs font-black uppercase tracking-[0.16em] text-slate-400 hover:text-slate-700 transition-colors"
            >
                Back
            </button>
        </form>
    );

    const renderIndividualForm = () => {
        if (pinStep !== 'none') return renderPinStep();

        return mode === 'login' ? (
            <form onSubmit={handleIndividualLogin} className="space-y-5">
                <Field label="Email address">
                    <input
                        type="email"
                        value={individualEmail}
                        onChange={(e) => setIndividualEmail(e.target.value)}
                        className={inputClass}
                        placeholder="name@example.com"
                        required
                    />
                </Field>
                <Field label="Password">
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={individualPassword}
                            onChange={(e) => setIndividualPassword(e.target.value)}
                            className={`${inputClass} pr-12`}
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-4 text-sm font-bold text-slate-400 hover:text-slate-900"
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </Field>
                <div className="space-y-3 pt-2">
                    <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
                        {isSubmitting ? 'Signing in...' : 'Sign in'}
                    </button>
                    <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={isSubmitting || !individualEmail.trim()}
                        className="w-full text-center text-xs font-black uppercase tracking-[0.16em] text-slate-400 hover:text-orange-500 transition-colors disabled:opacity-40"
                    >
                        Forgot password
                    </button>
                </div>
            </form>
        ) : (
            <form onSubmit={handleIndividualSignup} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="First name">
                        <input type="text" value={individualFirstName} onChange={(e) => setIndividualFirstName(e.target.value)} className={inputClass} required />
                    </Field>
                    <Field label="Last name">
                        <input type="text" value={individualLastName} onChange={(e) => setIndividualLastName(e.target.value)} className={inputClass} required />
                    </Field>
                </div>
                <Field label="Email address">
                    <input type="email" value={individualEmail} onChange={(e) => setIndividualEmail(e.target.value)} className={inputClass} required />
                </Field>
                <Field label="Phone number">
                    <div className="grid grid-cols-[130px_1fr] gap-3">
                        <select value={individualCountryCode} onChange={(e) => setIndividualCountryCode(e.target.value)} className={inputClass}>
                            {INDIVIDUAL_COUNTRY_CODES.map((country) => (
                                <option key={country.code} value={country.dial}>
                                    {country.code} {country.dial}
                                </option>
                            ))}
                        </select>
                        <input
                            type="tel"
                            value={individualPhone}
                            onChange={(e) => setIndividualPhone(e.target.value)}
                            className={inputClass}
                            placeholder="97XXXXXXX"
                            required
                        />
                    </div>
                </Field>
                <Field label="Password">
                    <input type="password" value={individualPassword} onChange={(e) => setIndividualPassword(e.target.value)} className={inputClass} minLength={8} required />
                </Field>
                <Field label="4-digit account PIN">
                    <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className={`${inputClass} text-center tracking-[0.45em]`}
                        placeholder="••••"
                        required
                    />
                </Field>
                <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
                    {isSubmitting ? 'Creating account...' : 'Create individual account'}
                </button>
            </form>
        );
    };

    const renderBusinessForm = () => (
        mode === 'login' ? (
            <form onSubmit={handleMerchantLogin} className="space-y-5">
                <Field label="Business email">
                    <input type="email" value={merchantEmail} onChange={(e) => setMerchantEmail(e.target.value)} className={inputClass} placeholder="name@company.com" required />
                </Field>
                <Field label="Password">
                    <input type="password" value={merchantPassword} onChange={(e) => setMerchantPassword(e.target.value)} className={inputClass} placeholder="••••••••" required />
                </Field>
                <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
                    {isSubmitting ? 'Signing in...' : 'Sign in to business account'}
                </button>
            </form>
        ) : (
            <form onSubmit={handleMerchantSignup} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Country">
                        <select value={merchantCountry} onChange={(e) => setMerchantCountry(e.target.value)} className={inputClass}>
                            {MERCHANT_COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
                        </select>
                    </Field>
                    <Field label="Entity type">
                        <select value={merchantAccountType} onChange={(e) => setMerchantAccountType(e.target.value as BusinessType)} className={inputClass}>
                            <option value="business">Business account</option>
                            <option value="other">Other entity</option>
                        </select>
                    </Field>
                </div>
                <Field label="Registered business name">
                    <input type="text" value={merchantBusinessName} onChange={(e) => setMerchantBusinessName(e.target.value)} className={inputClass} required />
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="First name">
                        <input type="text" value={merchantFirstName} onChange={(e) => setMerchantFirstName(e.target.value)} className={inputClass} required />
                    </Field>
                    <Field label="Last name">
                        <input type="text" value={merchantLastName} onChange={(e) => setMerchantLastName(e.target.value)} className={inputClass} required />
                    </Field>
                </div>
                <Field label="Business email">
                    <input type="email" value={merchantEmail} onChange={(e) => setMerchantEmail(e.target.value)} className={inputClass} required />
                </Field>
                <Field label="Password">
                    <input type="password" value={merchantPassword} onChange={(e) => setMerchantPassword(e.target.value)} className={inputClass} minLength={8} required />
                </Field>
                <Field label="Is your business incorporated?">
                    <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => setMerchantIsIncorporated(true)} className={choiceButtonClass(merchantIsIncorporated === true)}>
                            Yes
                        </button>
                        <button type="button" onClick={() => setMerchantIsIncorporated(false)} className={choiceButtonClass(merchantIsIncorporated === false)}>
                            No
                        </button>
                    </div>
                </Field>
                <Field label="Registration type">
                    <select value={merchantRegistrationType} onChange={(e) => setMerchantRegistrationType(e.target.value)} className={inputClass} required>
                        <option value="">Select one</option>
                        {merchantRegistrationOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </Field>
                <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <input
                        type="checkbox"
                        checked={merchantAgreedToTerms}
                        onChange={() => setMerchantAgreedToTerms((prev) => !prev)}
                        className="mt-1"
                        required
                    />
                    <span className="text-sm font-medium text-slate-600">
                        I agree to FlapaPay&apos;s merchant terms and understand onboarding continues after account creation.
                    </span>
                </label>
                <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
                    {isSubmitting ? 'Creating account...' : 'Create business account'}
                </button>
            </form>
        )
    );

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center p-6 pt-32 pb-20">
                <div className="w-full max-w-5xl grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-start">
                    <section className="rounded-[40px] bg-slate-950 text-white p-8 md:p-12 shadow-2xl shadow-slate-900/25">
                        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-orange-400">Access FlapaPay</p>
                        <h1 className="mt-6 text-4xl md:text-5xl font-black tracking-tight leading-[1.02]">
                            One login surface for wallets and business accounts
                        </h1>
                        <p className="mt-5 text-slate-300 text-lg font-medium leading-relaxed">
                            Switch between personal wallet access and merchant operations without losing the existing security PIN flow or merchant onboarding journey.
                        </p>
                        <div className="mt-10 space-y-4">
                            <Feature text="Individuals still sign in with password + 4-digit PIN." />
                            <Feature text="Businesses still continue to the existing onboarding flow after account creation." />
                            <Feature text="Signup and login are both available directly on this page." />
                        </div>
                    </section>

                    <section className="rounded-[40px] bg-white border border-slate-100 p-6 md:p-8 shadow-2xl shadow-slate-200/50">
                        <div className="grid grid-cols-2 gap-2 rounded-[24px] bg-slate-100 p-1.5">
                            <AuthSwitch active={audience === 'individual'} onClick={() => setAudience('individual')}>Individual</AuthSwitch>
                            <AuthSwitch active={audience === 'business'} onClick={() => setAudience('business')}>Business</AuthSwitch>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-2 rounded-[22px] border border-slate-100 bg-slate-50 p-1.5">
                            <AuthModeSwitch active={mode === 'login'} onClick={() => setMode('login')}>Sign in</AuthModeSwitch>
                            <AuthModeSwitch active={mode === 'signup'} onClick={() => setMode('signup')}>Sign up</AuthModeSwitch>
                        </div>

                        <div className="mt-8">
                            <h2 className="text-3xl font-black text-slate-900">
                                {audience === 'individual'
                                    ? mode === 'login' ? 'Individual login' : 'Create your individual account'
                                    : mode === 'login' ? 'Business login' : 'Create your business account'}
                            </h2>
                            <p className="mt-2 text-slate-500 font-medium">
                                {audience === 'individual'
                                    ? mode === 'login'
                                        ? 'Use your wallet account credentials. PIN verification remains required where configured.'
                                        : 'Open a personal FlapaPay wallet and set your 4-digit account PIN during signup.'
                                    : mode === 'login'
                                        ? 'Access your merchant dashboard and resume onboarding or operations.'
                                        : 'Create the merchant account here, then continue to your existing onboarding flow.'}
                            </p>
                        </div>

                        {error && <Alert tone="error">{error}</Alert>}
                        {success && <Alert tone="success">{success}</Alert>}

                        <div className="mt-6">
                            {audience === 'individual' ? renderIndividualForm() : renderBusinessForm()}
                        </div>

                        <div className="mt-8 text-center text-sm font-bold text-slate-500">
                            {mode === 'login' ? 'Need to create an account?' : 'Already have an account?'}
                            <button
                                type="button"
                                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                                className="ml-2 text-orange-500 hover:text-orange-600 transition-colors"
                            >
                                {mode === 'login' ? 'Go to sign up' : 'Go to sign in'}
                            </button>
                        </div>

                        <div className="mt-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                            Legacy routes still work:
                            <Link to="/signup/individual" className="ml-2 text-slate-600 hover:text-orange-500 normal-case tracking-normal">individual signup</Link>
                            <span className="mx-2">|</span>
                            <Link to="/merchant/signup" className="text-slate-600 hover:text-orange-500 normal-case tracking-normal">merchant signup</Link>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

const inputClass = 'w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-900 outline-none transition-all focus:border-orange-500 focus:bg-white';
const primaryButtonClass = 'w-full rounded-3xl bg-slate-950 text-white py-4 font-black text-sm uppercase tracking-[0.18em] hover:bg-slate-900 transition-colors disabled:opacity-50';

const choiceButtonClass = (active: boolean) =>
    `rounded-2xl border px-4 py-3 font-black transition-all ${active ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`;

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-2">
        <label className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">{label}</label>
        {children}
    </div>
);

const Feature: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex items-start gap-3">
        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400" />
        <p className="text-sm font-medium text-slate-300">{text}</p>
    </div>
);

const AuthSwitch: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`rounded-[18px] px-4 py-3 text-sm font-black transition-all ${active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
    >
        {children}
    </button>
);

const AuthModeSwitch: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`rounded-[16px] px-4 py-3 text-sm font-black transition-all ${active ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
    >
        {children}
    </button>
);

const Alert: React.FC<{ tone: 'error' | 'success'; children: React.ReactNode }> = ({ tone, children }) => (
    <div className={`mt-6 rounded-3xl border px-4 py-4 text-sm font-bold ${tone === 'error' ? 'border-red-100 bg-red-50 text-red-600' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
        {children}
    </div>
);
