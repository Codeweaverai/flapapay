import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReactCountryFlag from 'react-country-flag';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/axios';
import { Button } from '../../components/ui/Button';
import { Navbar } from '../../components/layout/Navbar';

type AccountType = 'business' | 'other';

interface RegistrationType { value: string; label: string; description: string; }

export const MerchantAuth: React.FC<{ mode: 'login' | 'signup' }> = ({ mode }) => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [step, setStep] = useState(1);

    // Form State
    const country = 'Zambia';
    const [accountType, setAccountType] = useState<AccountType>('business');
    const [businessName, setBusinessName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [isIncorporated, setIsIncorporated] = useState<boolean | null>(null);
    const [registrationType, setRegistrationType] = useState('');
    const [password, setPassword] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [agreedToMarketing, setAgreedToMarketing] = useState(false);

    // API state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [registrationTypes, setRegistrationTypes] = useState<RegistrationType[]>([]);

    // Fetch Zambia-specific registration types when on step 2
    useEffect(() => {
        if (step === 2 && country === 'Zambia' && registrationTypes.length === 0) {
            api.get('/merchants/zambia/registration-types')
                .then(r => setRegistrationTypes(r.data.registrationTypes))
                .catch(() => {
                    // fallback static list
                    setRegistrationTypes([
                        { value: 'sole-proprietorship', label: 'Sole Proprietorship', description: '' },
                        { value: 'limited-liability', label: 'Private Limited Company (Ltd)', description: '' },
                        { value: 'public-company', label: 'Public Limited Company (PLC)', description: '' },
                        { value: 'partnership', label: 'Partnership', description: '' },
                    ]);
                });
        }
    }, [step, country]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'login') {
                const res = await api.post('/merchants/login', { email, password });
                login(res.data.token, res.data.user);
                localStorage.setItem('merchantId', res.data.merchant.id);
                navigate('/merchant/dashboard');
                return;
            }

            if (step === 1) {
                setStep(2);
                setLoading(false);
                return;
            }

            // Step 2: full registration
            const res = await api.post('/merchants/register', {
                email,
                password,
                firstName,
                lastName,
                businessName,
                country,
                accountType,
                isIncorporated,
                registrationType,
                agreedToTerms,
            });

            login(res.data.token, res.data.user);
            localStorage.setItem('merchantId', res.data.merchant.id);
            navigate('/merchant/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (mode === 'login') {
        return (
            <div
                className="min-h-screen bg-black text-white flex flex-col selection:bg-orange-200/30"
                style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}
            >
                <Navbar />
                <main className="flex-1 flex items-center justify-center p-6 pt-32">
                    <div className="relative w-full max-w-[480px] overflow-hidden rounded-[40px] bg-white p-10 shadow-2xl shadow-black/30 border border-white/10">
                        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-br from-orange-400/20 to-yellow-300/10 blur-3xl" />
                        <div className="mb-10 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-500 to-yellow-400 text-white text-2xl mb-6 shadow-lg shadow-orange-500/30">
                                🔑
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 mb-2">Merchant Login</h1>
                            <p className="text-gray-500 font-medium">Access your business dashboard and API keys.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none font-bold"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Password</label>
                                <input
                                    type="password"
                                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none font-bold"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {error && (
                                <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold">
                                    {error}
                                </div>
                            )}
                            <Button size="lg" disabled={loading} className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-black/10 hover:translate-y-[-2px] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>

                        <div className="mt-10 text-center space-y-4">
                            <p className="text-gray-500 font-bold">
                                Don't have a merchant account?
                                <Link to="/merchant/signup" className="ml-2 text-orange-500 hover:text-orange-600 transition-colors">
                                    Create one now
                                </Link>
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-black text-white flex flex-col selection:bg-orange-200/30"
            style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}
        >
            <Navbar />

            <main className="flex-1 flex items-center justify-center p-6 pt-32 pb-20">
                <div className="relative w-full max-w-[600px] overflow-hidden bg-white rounded-[40px] p-8 md:p-12 shadow-2xl shadow-black/30 border border-white/10 transition-all duration-500">
                    <div className="absolute -top-28 -right-24 h-56 w-56 rounded-full bg-gradient-to-br from-orange-400/15 via-yellow-300/10 to-transparent blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-28 -left-24 h-56 w-56 rounded-full bg-gradient-to-tr from-amber-200/10 via-orange-300/10 to-transparent blur-3xl pointer-events-none" />

                    {step === 1 ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-10 text-center">
                                <h1 className="text-3xl font-black text-gray-900 mb-4">What type of account would you like to create?</h1>
                                <p className="text-gray-500 font-medium text-lg">Choose the option that fits your organization.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-sm font-black text-gray-700 uppercase tracking-widest flex justify-between">
                                        <span>Country</span>
                                    </label>
                                    <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-yellow-50 px-5 py-4 shadow-sm">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm border border-orange-100">
                                                    <ReactCountryFlag countryCode="ZM" svg style={{ width: '1.35em', height: '1.35em' }} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">Enabled country</p>
                                                    <p className="text-sm font-black text-gray-900">Zambia</p>
                                                </div>
                                            </div>
                                            <div className="rounded-full bg-green-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-white shadow-sm">
                                                Active
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium">
                                        Merchant signup is currently available for Zambia only.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-black text-gray-700 uppercase tracking-widest">I'm creating an account for:</label>

                                    <div
                                        onClick={() => setAccountType('business')}
                                        className={`group cursor-pointer p-6 rounded-3xl border-2 transition-all duration-300 ${accountType === 'business' ? 'border-orange-500 bg-orange-50/30' : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 ${accountType === 'business' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white text-gray-400 border border-gray-100 group-hover:bg-gray-100'}`}>
                                                💼
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={`font-black text-lg transition-colors ${accountType === 'business' ? 'text-gray-900' : 'text-gray-600'}`}>Business account</h3>
                                                <p className="text-gray-500 text-sm leading-relaxed mt-1">For freelancers, sole traders, startups, small-to-medium businesses and enterprises.</p>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${accountType === 'business' ? 'border-orange-500' : 'border-gray-200'}`}>
                                                {accountType === 'business' && <div className="w-3 h-3 rounded-full bg-orange-500 scale-100 animate-in zoom-in"></div>}
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setAccountType('other')}
                                        className={`group cursor-pointer p-6 rounded-3xl border-2 transition-all duration-300 ${accountType === 'other' ? 'border-orange-500 bg-orange-50/30' : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 ${accountType === 'other' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white text-gray-400 border border-gray-100 group-hover:bg-gray-100'}`}>
                                                🏛️
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={`font-black text-lg transition-colors ${accountType === 'other' ? 'text-gray-900' : 'text-gray-600'}`}>Other entities</h3>
                                                <p className="text-gray-500 text-sm leading-relaxed mt-1">For charities, non-profits & religious institutions.</p>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${accountType === 'other' ? 'border-orange-500' : 'border-gray-200'}`}>
                                                {accountType === 'other' && <div className="w-3 h-3 rounded-full bg-orange-500 scale-100 animate-in zoom-in"></div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button size="lg" className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-yellow-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-orange-500/20 hover:translate-y-[-2px] transition-all">
                                    Next: Basic Info
                                </Button>

                                <div className="text-center pt-4">
                                    <p className="text-gray-500 font-bold">
                                        Already have an account? <Link to="/merchant/signup" className="text-orange-500 hover:text-orange-600 transition-colors">Continue here</Link>
                                    </p>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <button
                                onClick={() => setStep(1)}
                                className="mb-8 flex items-center text-gray-400 hover:text-gray-900 font-black transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
                                Back
                            </button>

                            <div className="mb-10">
                                <h1 className="text-3xl font-black text-gray-900 mb-2">Let's get to know you</h1>
                                <p className="text-gray-500 font-medium">Create your merchant account now. You will complete the existing onboarding and compliance flow after signup.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Registered business name</label>
                                    <input
                                        type="text"
                                        className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none font-bold"
                                        placeholder="e.g. Nosa Inc."
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        required
                                    />
                                    <p className="text-xs text-gray-400 font-medium ml-1">Ensure this name matches the name on your registration certificate.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">First name</label>
                                        <input
                                            type="text"
                                            className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none font-bold"
                                            placeholder="John"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Last name</label>
                                        <input
                                            type="text"
                                            className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none font-bold"
                                            placeholder="Doe"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <p className="col-span-2 text-xs text-gray-400 font-medium ml-1">Enter your first and last name as they appear on your government ID.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Email address</label>
                                    <input
                                        type="email"
                                        className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none font-bold"
                                        placeholder="name@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <p className="text-xs text-gray-400 font-medium ml-1">Use the email you want tied to your merchant dashboard and onboarding updates.</p>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Is your business incorporated with the CAC / PACRA?</label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsIncorporated(true)}
                                            className={`flex-1 py-4 rounded-2xl font-black transition-all border-2 ${isIncorporated === true ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'}`}
                                        >
                                            Yes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsIncorporated(false)}
                                            className={`flex-1 py-4 rounded-2xl font-black transition-all border-2 ${isIncorporated === false ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'}`}
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-black text-gray-900 uppercase tracking-widest ml-1">Select business registration type</label>
                                    <div className="relative">
                                        <select
                                            className="w-full px-6 py-4 rounded-2xl border border-gray-200 bg-white focus:bg-white focus:ring-4 focus:ring-orange-500/15 focus:border-orange-500 appearance-none font-bold text-gray-900 outline-none cursor-pointer shadow-sm shadow-gray-100"
                                            value={registrationType}
                                            onChange={(e) => setRegistrationType(e.target.value)}
                                            required
                                        >
                                            <option value="">Select a registration type</option>
                                            {registrationTypes.length > 0
                                                ? registrationTypes.map(rt => (
                                                    <option key={rt.value} value={rt.value}>{rt.label}</option>
                                                ))
                                                : (
                                                    <>
                                                        <option value="sole-proprietorship">Sole Proprietorship</option>
                                                        <option value="limited-liability">Private Limited Company (Ltd)</option>
                                                        <option value="public-company">Public Limited Company (PLC)</option>
                                                        <option value="partnership">Partnership</option>
                                                        <option value="cooperative">Cooperative Society</option>
                                                        <option value="ngo">NGO / Non-Profit</option>
                                                    </>
                                                )
                                            }
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium ml-1">
                                        Pick the registration type that matches your Zambian business structure.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Choose a password</label>
                                    <input
                                        type="password"
                                        className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none font-bold"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-4 pt-4">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative mt-1">
                                            <input
                                                type="checkbox"
                                                className="peer sr-only"
                                                checked={agreedToTerms}
                                                onChange={() => setAgreedToTerms(!agreedToTerms)}
                                                required
                                            />
                                            <div className="w-6 h-6 rounded-lg border-2 border-gray-200 peer-checked:border-orange-500 peer-checked:bg-orange-500 transition-all"></div>
                                            <svg className="w-4 h-4 absolute top-1 left-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                        </div>
                                        <span className="text-sm text-gray-600 font-medium leading-relaxed">
                                            I acknowledge that I have read, understood, and agree to be bound by FlapaPay's{' '}
                                            <Link to="/merchant-service-agreement" className="font-bold text-gray-900 underline decoration-orange-400 decoration-2 underline-offset-4 hover:text-orange-600 transition-colors">
                                                Merchant Services Agreement (MSA)
                                            </Link>
                                            ,{' '}
                                            <Link to="/terms" className="font-bold text-gray-900 underline decoration-orange-400 decoration-2 underline-offset-4 hover:text-orange-600 transition-colors">
                                                Terms and Conditions
                                            </Link>
                                            {' '}and{' '}
                                            <Link to="/privacy" className="font-bold text-gray-900 underline decoration-orange-400 decoration-2 underline-offset-4 hover:text-orange-600 transition-colors">
                                                Privacy Notice
                                            </Link>
                                            .
                                        </span>
                                    </label>

                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative mt-1">
                                            <input
                                                type="checkbox"
                                                className="peer sr-only"
                                                checked={agreedToMarketing}
                                                onChange={() => setAgreedToMarketing(!agreedToMarketing)}
                                            />
                                            <div className="w-6 h-6 rounded-lg border-2 border-gray-200 peer-checked:border-orange-500 peer-checked:bg-orange-500 transition-all"></div>
                                            <svg className="w-4 h-4 absolute top-1 left-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                        </div>
                                        <span className="text-sm text-gray-500 font-medium leading-relaxed">
                                            I agree to receive updates and promotional offers from FlapaPay.
                                        </span>
                                    </label>
                                </div>

                                {error && (
                                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold">
                                        {error}
                                    </div>
                                )}
                                <Button size="lg" disabled={loading} className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-yellow-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-orange-500/20 hover:translate-y-[-2px] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                    {loading ? 'Creating Account...' : 'Create My Account'}
                                </Button>
                            </form>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
