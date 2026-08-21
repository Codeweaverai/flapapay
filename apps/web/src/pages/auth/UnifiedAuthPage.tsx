import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Navbar } from '../../components/layout/Navbar';

/* Platform signup: dark cube texture, white high-contrast type, and orange-to-yellow gradient actions. */
type Mode = 'login' | 'signup';
type BusinessType = 'business' | 'other';

interface RegistrationType {
    value: string;
    label: string;
}

const COUNTRY_CODES = [
    { code: 'ZM', dial: '+260', name: 'Zambia' },
    { code: 'NG', dial: '+234', name: 'Nigeria' },
    { code: 'KE', dial: '+254', name: 'Kenya' },
    { code: 'ZA', dial: '+27', name: 'South Africa' },
    { code: 'GH', dial: '+233', name: 'Ghana' },
    { code: 'US', dial: '+1', name: 'United States' },
    { code: 'GB', dial: '+44', name: 'United Kingdom' },
];

const BUSINESS_COUNTRIES = ['Zambia', 'Nigeria', 'Kenya', 'South Africa', 'Ghana'];
const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const UnifiedAuthPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [mode, setMode] = useState<Mode>('signup');
    const [isBusinessAccount, setIsBusinessAccount] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [partialToken, setPartialToken] = useState<string | null>(null);
    const [pinStep, setPinStep] = useState<'none' | 'verify'>('none');

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+260');
    const [password, setPassword] = useState('');
    const [pin, setPin] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [businessName, setBusinessName] = useState('');
    const [businessCountry, setBusinessCountry] = useState('Zambia');
    const [businessType, setBusinessType] = useState<BusinessType>('business');
    const [isIncorporated, setIsIncorporated] = useState<boolean | null>(null);
    const [registrationType, setRegistrationType] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [registrationTypes, setRegistrationTypes] = useState<RegistrationType[]>([]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        setMode(params.get('mode') === 'login' ? 'login' : 'signup');
        setIsBusinessAccount(params.get('account') === 'business');
    }, [location.search]);

    useEffect(() => {
        if (!isBusinessAccount || mode !== 'signup' || businessCountry !== 'Zambia' || registrationTypes.length > 0) return;
        api.get('/merchants/zambia/registration-types')
            .then((res) => setRegistrationTypes(res.data.registrationTypes || []))
            .catch(() => setRegistrationTypes([
                { value: 'sole-proprietorship', label: 'Sole Proprietorship' },
                { value: 'limited-liability', label: 'Private Limited Company (Ltd)' },
                { value: 'public-company', label: 'Public Limited Company (PLC)' },
                { value: 'partnership', label: 'Partnership' },
                { value: 'ngo', label: 'NGO / Non-Profit' },
            ]));
    }, [isBusinessAccount, mode, businessCountry, registrationTypes.length]);

    useEffect(() => {
        setError('');
        setSuccess('');
        setPartialToken(null);
        setPinStep('none');
    }, [mode]);

    const businessRegistrationOptions = useMemo(() => registrationTypes.length > 0 ? registrationTypes : [
        { value: 'sole-proprietorship', label: 'Sole Proprietorship' },
        { value: 'limited-liability', label: 'Private Limited Company (Ltd)' },
        { value: 'public-company', label: 'Public Limited Company (PLC)' },
        { value: 'partnership', label: 'Partnership' },
        { value: 'ngo', label: 'NGO / Non-Profit' },
    ], [registrationTypes]);

    const routeAfterLogin = async (token: string, user: any) => {
        login(token, user);
        try {
            const status = await api.get('/merchants/status');
            if (status.status === 200) {
                localStorage.setItem('merchantId', status.data?.merchant?.id || '');
                navigate('/merchant/dashboard');
                return;
            }
        } catch {
            // No merchant record: continue to the individual wallet dashboard.
        }
        navigate('/dashboard');
    };

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            const response = await api.post('/auth/login', { email: normalizeEmail(email), password });
            if (response.data.pinRequired) {
                setPartialToken(response.data.partialToken);
                setPinStep('verify');
                return;
            }
            await routeAfterLogin(response.data.token, response.data.user);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Unable to sign in.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePinVerification = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            const response = await api.post('/auth/verify-pin', { partialToken, pin });
            await routeAfterLogin(response.data.token, response.data.user);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid security PIN.');
            setPin('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSignup = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');
        try {
            if (isBusinessAccount) {
                const response = await api.post('/merchants/register', {
                    email: normalizeEmail(email),
                    password,
                    pin,
                    firstName,
                    lastName,
                    businessName,
                    country: businessCountry,
                    accountType: businessType,
                    isIncorporated,
                    registrationType,
                    agreedToTerms,
                });
                login(response.data.token, response.data.user);
                localStorage.setItem('merchantId', response.data.merchant.id);
                navigate('/merchant/dashboard');
                return;
            }

            const response = await api.post('/auth/register', {
                email: normalizeEmail(email),
                password,
                firstName,
                lastName,
                phone: `${countryCode}${phone.replace(/\D/g, '')}`,
                pin,
            });
            const credited = response.data.creditedPayments || 0;
            setSuccess(credited > 0 ? `Account created. ${credited} pending payment${credited > 1 ? 's have' : ' has'} been credited to your wallet.` : 'Account created successfully. You can sign in now.');
            setMode('login');
            setPin('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Unable to create your account.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForgotPassword = async () => {
        setIsSubmitting(true);
        setError('');
        setSuccess('');
        try {
            const response = await api.post('/auth/forgot-password', { email: normalizeEmail(email) });
            setSuccess(response.data.message || 'Password reset instructions have been sent.');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Unable to send reset instructions.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = 'w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:bg-white/[0.09] focus:ring-4 focus:ring-orange-400/10';
    const primaryButtonClass = 'w-full rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-slate-950 shadow-lg shadow-orange-500/25 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

    const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block space-y-2"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</span>{children}</label>;

    const renderPinVerification = () => (
        <form onSubmit={handlePinVerification} className="space-y-6">
            <div className="rounded-2xl border border-orange-400/20 bg-orange-400/5 p-5"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">Security check</p><h2 className="mt-2 text-2xl font-black text-white">Enter your 4-digit PIN</h2><p className="mt-2 text-sm leading-relaxed text-slate-400">Your password has been verified. Enter your PIN to complete sign in.</p></div>
            <Field label="Security PIN"><input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} className={`${inputClass} text-center text-xl tracking-[0.55em]`} placeholder="••••" required /></Field>
            <button type="submit" disabled={isSubmitting || pin.length !== 4} className={primaryButtonClass}>{isSubmitting ? 'Verifying…' : 'Verify PIN'}</button>
            <button type="button" onClick={() => { setPinStep('none'); setPin(''); setPartialToken(null); }} className="w-full text-center text-xs font-black uppercase tracking-[0.16em] text-slate-400 transition hover:text-white">Back to sign in</button>
        </form>
    );

    const renderLogin = () => pinStep === 'verify' ? renderPinVerification() : (
        <form onSubmit={handleLogin} className="space-y-5">
            <Field label="Email address"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="name@example.com" required /></Field>
            <Field label="Password"><div className="relative"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className={`${inputClass} pr-16`} placeholder="••••••••" required /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-4 text-xs font-black uppercase tracking-[0.1em] text-orange-300 hover:text-yellow-200">{showPassword ? 'Hide' : 'Show'}</button></div></Field>
            <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>{isSubmitting ? 'Signing in…' : 'Sign in'}</button>
            <button type="button" onClick={handleForgotPassword} disabled={isSubmitting || !email.trim()} className="w-full text-center text-xs font-black uppercase tracking-[0.16em] text-slate-400 transition hover:text-white disabled:opacity-40">Forgot password</button>
        </form>
    );

    const renderSignup = () => (
        <form onSubmit={handleSignup} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2"><Field label="First name"><input type="text" value={firstName} onChange={(event) => setFirstName(event.target.value)} className={inputClass} required /></Field><Field label="Last name"><input type="text" value={lastName} onChange={(event) => setLastName(event.target.value)} className={inputClass} required /></Field></div>
            <Field label="Email address"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} required /></Field>
            <Field label="Phone number"><div className="grid grid-cols-[120px_1fr] gap-3"><select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className={inputClass}>{COUNTRY_CODES.map((country) => <option key={country.code} value={country.dial} className="bg-slate-950">{country.code} {country.dial}</option>)}</select><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} placeholder="97XXXXXXX" required /></div></Field>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Password"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} minLength={8} required /></Field><Field label="4-digit security PIN"><input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} className={`${inputClass} text-center tracking-[0.35em]`} placeholder="••••" required /></Field></div>

            <label className={`block cursor-pointer rounded-2xl border p-4 transition ${isBusinessAccount ? 'border-orange-400/50 bg-orange-400/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'}`}><div className="flex items-start gap-3"><input type="checkbox" checked={isBusinessAccount} onChange={(event) => setIsBusinessAccount(event.target.checked)} className="mt-1 h-4 w-4 accent-orange-500" /><div><p className="font-bold text-white">I am registering this account for a business</p><p className="mt-1 text-sm leading-relaxed text-slate-400">Add business details now. Your business will start in Sandbox and unlock Live only after compliance approval.</p></div></div></label>

            {isBusinessAccount && <section className="space-y-5 rounded-2xl border border-orange-400/20 bg-black/20 p-5"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">Business setup</p><p className="mt-1 text-sm text-slate-400">These details create your Sandbox merchant workspace and start the guided Live verification journey.</p></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Country"><select value={businessCountry} onChange={(event) => setBusinessCountry(event.target.value)} className={inputClass}>{BUSINESS_COUNTRIES.map((country) => <option key={country} value={country} className="bg-slate-950">{country}</option>)}</select></Field><Field label="Entity type"><select value={businessType} onChange={(event) => setBusinessType(event.target.value as BusinessType)} className={inputClass}><option value="business" className="bg-slate-950">Business account</option><option value="other" className="bg-slate-950">Other entity</option></select></Field></div><Field label="Registered business name"><input type="text" value={businessName} onChange={(event) => setBusinessName(event.target.value)} className={inputClass} required={isBusinessAccount} /></Field><Field label="Is your business incorporated?"><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setIsIncorporated(true)} className={choiceButtonClass(isIncorporated === true)}>Yes</button><button type="button" onClick={() => setIsIncorporated(false)} className={choiceButtonClass(isIncorporated === false)}>No</button></div></Field><Field label="Registration type"><select value={registrationType} onChange={(event) => setRegistrationType(event.target.value)} className={inputClass} required={isBusinessAccount}><option value="" className="bg-slate-950">Select one</option>{businessRegistrationOptions.map((option) => <option key={option.value} value={option.value} className="bg-slate-950">{option.label}</option>)}</select></Field><label className="flex items-start gap-3 rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-slate-300"><input type="checkbox" checked={agreedToTerms} onChange={() => setAgreedToTerms((value) => !value)} className="mt-1 accent-orange-500" required={isBusinessAccount} />I agree to the merchant terms and understand that compliance approval is required before Live payment processing.</label></section>}
            <button type="submit" disabled={isSubmitting || pin.length !== 4} className={primaryButtonClass}>{isSubmitting ? 'Creating your account…' : isBusinessAccount ? 'Create account and open Sandbox' : 'Create your account'}</button>
        </form>
    );

    const choiceButtonClass = (active: boolean) => `rounded-xl border px-4 py-3 text-sm font-black transition ${active ? 'border-orange-400 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/25'}`;

    return <div className="min-h-screen bg-[#080a0f] text-white" style={{ backgroundImage: "linear-gradient(rgba(8,10,15,.88), rgba(8,10,15,.95)), url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
        <Navbar />
        <main className="mx-auto flex min-h-screen max-w-3xl items-center px-5 pb-16 pt-32 sm:px-8">
            <section className="relative w-full overflow-hidden rounded-[32px] border border-white/10 bg-[#11151d]/95 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-9"><div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300" /><div className="absolute -right-28 -top-28 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" /><div className="relative"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">Secure account access</p><h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{mode === 'signup' ? 'Create your FlapaPay account' : 'Sign in to FlapaPay'}</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">{mode === 'signup' ? 'One secure signup flow with password and PIN protection. Add your business details only when you need a Sandbox merchant workspace.' : 'Use your email, password, and security PIN to access your FlapaPay workspace.'}</p></div>{error && <Alert tone="error">{error}</Alert>}{success && <Alert tone="success">{success}</Alert>}<div className="relative mt-7">{mode === 'signup' ? renderSignup() : renderLogin()}</div><div className="relative mt-7 border-t border-white/10 pt-6 text-center text-sm font-semibold text-slate-400">{mode === 'signup' ? 'Already have an account?' : 'Need an account?'}<button type="button" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')} className="ml-2 font-black text-orange-300 transition hover:text-yellow-200">{mode === 'signup' ? 'Sign in' : 'Create one'}</button></div></section>
        </main>
    </div>;
};

const Alert: React.FC<{ tone: 'error' | 'success'; children: React.ReactNode }> = ({ tone, children }) => <div className={`relative mt-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${tone === 'error' ? 'border-red-400/30 bg-red-500/10 text-red-200' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'}`}>{children}</div>;
