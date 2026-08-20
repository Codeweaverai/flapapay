import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';

export const Login: React.FC = () => {
    const { register, handleSubmit } = useForm();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [success, setSuccess] = React.useState('');
    const [step, setStep] = React.useState<'password' | 'pin'>('password');
    const [partialToken, setPartialToken] = React.useState('');
    const [pin, setPin] = React.useState('');

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', data);
            if (res.data.pinRequired) {
                setPartialToken(res.data.partialToken);
                setStep('pin');
                return;
            }
            setSuccess('Welcome back! Redirecting...');
            setTimeout(() => {
                login(res.data.token, res.data.user);
                navigate('/dashboard');
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    const onPinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/verify-pin', { partialToken, pin });
            setSuccess('Welcome back! Redirecting...');
            setTimeout(() => {
                login(res.data.token, res.data.user);
                navigate('/dashboard');
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid PIN');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 bg-orange-500 overflow-hidden font-sans">
            {/* Animated Background Layers */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-yellow-400/30 rounded-full mix-blend-overlay filter blur-3xl animate-blob opacity-80"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-400/30 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000 opacity-80"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-yellow-500/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000 opacity-80"></div>
                <div className="absolute inset-0 bg-mesh opacity-90 animate-pan-bg"></div>
            </div>

            {/* Back to Home Button */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-8 left-8 z-20 flex items-center gap-2 text-white/80 hover:text-white font-bold transition-all group"
            >
                <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Home</span>
            </button>

            <div className="relative z-10 w-full max-w-[480px]">
                {/* Branding */}
                <div className="mb-10 text-center">
                    <h1 className="text-6xl font-black text-white tracking-tightest mb-2 italic drop-shadow-2xl">
                        FlapaPay
                    </h1>
                    <p className="text-white/80 font-bold tracking-widest uppercase text-sm">Empowering Your Finances</p>
                </div>

                {/* Login Container */}
                <div className="bg-white/90 backdrop-blur-3xl border border-white/20 rounded-[40px] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.3)] p-10 md:p-12 relative overflow-hidden">
                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Sign In</h2>
                        <p className="text-gray-500 font-bold italic">Ready to move some money?</p>
                    </div>

                    <div className="space-y-8">
                        {step === 'pin' ? (
                            <form className="space-y-6" onSubmit={onPinSubmit}>
                                <div className="text-center">
                                    <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-7 h-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500 font-bold text-sm">Enter your 4-digit security PIN</p>
                                </div>
                                {error && (
                                    <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-bold py-3 px-4 rounded-2xl text-center">
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="bg-green-50 border border-green-100 text-green-600 text-sm font-bold py-3 px-4 rounded-2xl text-center">
                                        {success}
                                    </div>
                                )}
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={4}
                                    value={pin}
                                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="••••"
                                    className="w-full bg-gray-50 border-2 border-gray-50 focus:border-orange-500/20 focus:bg-white rounded-2xl px-5 py-4 text-gray-900 font-black text-center text-2xl tracking-[1rem] placeholder:text-gray-300 transition-all outline-none"
                                />
                                <Button
                                    type="submit"
                                    className="w-full py-5 bg-orange-500 text-white text-lg font-black rounded-2xl shadow-[0_20px_40px_-12px_rgba(249,115,22,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(249,115,22,0.5)] transform hover:-translate-y-1 transition-all duration-300 border-none"
                                    isLoading={isLoading}
                                >
                                    Verify PIN
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => { setStep('password'); setError(''); setPin(''); }}
                                    className="w-full text-center text-sm text-gray-400 font-bold hover:text-orange-500 transition-colors"
                                >
                                    Back to login
                                </button>
                            </form>
                        ) : (
                        <>
                        {/* Google Login Button - Repositioned to Top */}
                        <button
                            type="button"
                            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 py-4 rounded-2xl text-gray-700 font-bold hover:bg-gray-50 hover:border-orange-200 transition-all active:scale-95 group/google shadow-sm"
                        >
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt="Google"
                                className="w-6 h-6 transform group-hover/google:rotate-12 transition-transform"
                            />
                            <span>Continue with Google</span>
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-100"></span>
                            </div>
                            <div className="relative flex justify-center text-[10px]">
                                <span className="bg-white px-4 text-gray-400 font-black uppercase tracking-widest italic">Or use your email</span>
                            </div>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-bold py-3 px-4 rounded-2xl text-center">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="bg-green-50 border border-green-100 text-green-600 text-sm font-bold py-3 px-4 rounded-2xl text-center">
                                    {success}
                                </div>
                            )}

                            <div className="space-y-5">
                                <div className="relative">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                                    <input
                                        {...register('email', { required: true })}
                                        type="email"
                                        placeholder="your@email.com"
                                        className="w-full bg-gray-50 border-2 border-gray-50 focus:border-orange-500/20 focus:bg-white rounded-2xl px-5 py-4 text-gray-900 font-bold placeholder:text-gray-300 transition-all outline-none"
                                    />
                                </div>

                                <div className="relative">
                                    <div className="flex justify-between items-center mb-1.5 ml-1">
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Password</label>
                                        <a href="#" className="text-[10px] font-black text-orange-500 hover:text-orange-600 transition-colors uppercase">Forgot?</a>
                                    </div>
                                    <input
                                        {...register('password', { required: true })}
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-gray-50 border-2 border-gray-50 focus:border-orange-500/20 focus:bg-white rounded-2xl px-5 py-4 text-gray-900 font-bold placeholder:text-gray-300 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-5 bg-orange-500 text-white text-lg font-black rounded-2xl shadow-[0_20px_40px_-12px_rgba(249,115,22,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(249,115,22,0.5)] transform hover:-translate-y-1 transition-all duration-300 border-none"
                                isLoading={isLoading}
                            >
                                Let's Go
                            </Button>

                            <div className="text-center pt-2">
                                <p className="text-gray-400 font-bold text-sm">
                                    New to FlapaPay?{' '}
                                    <a href="/signup/individual" className="text-orange-500 hover:text-orange-600 font-black decoration-2 underline underline-offset-4">
                                        Join for free
                                    </a>
                                </p>
                            </div>
                        </form>
                        </>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Secure 256-bit SSL Encryption</p>
                </div>
            </div>
        </div>
    );
};
