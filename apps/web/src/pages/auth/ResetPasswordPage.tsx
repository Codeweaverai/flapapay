import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Lock,
    Eye,
    EyeOff,
    Loader2,
    ArrowLeft,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { api } from '../../lib/axios';

// Re-using styles/components from SignInPage for consistency
const Input = ({ className = '', ...props }: any) => (
    <input
        className={`w-full bg-white/[0.03] border border-white/10 rounded-2xl h-14 px-6 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 font-medium ${className}`}
        {...props}
    />
);

const Button = ({ className = '', children, ...props }: any) => (
    <button
        className={`bg-white text-black rounded-2xl font-black text-sm transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:shadow-[0_20px_40px_rgba(255,255,255,0.2)] ${className}`}
        {...props}
    >
        {children}
    </button>
);

const Label = ({ className = '', children, ...props }: any) => (
    <label className={`text-white/70 font-bold text-[10px] uppercase tracking-widest pl-1 ${className}`} {...props}>
        {children}
    </label>
);

export const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const togglePasswordVisibility = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (!token) {
            setError('Invalid or missing reset token');
            return;
        }

        setIsSubmitting(true);

        try {
            await api.post('/auth/reset-password', {
                token,
                newPassword: password
            });
            setSuccess(true);
            setTimeout(() => navigate('/signin'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to reset password. The link may have expired.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8 relative overflow-hidden font-sans selection:bg-orange-500/30">
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/5 rounded-full blur-[120px] animate-pulse delay-700"></div>

            <div className="w-full max-w-lg z-20">
                <div className="mb-14 text-center">
                    <div className="inline-block mb-6 relative group cursor-pointer" onClick={() => navigate('/signin')}>
                        <h1 className="text-6xl font-black mb-3 tracking-tighter flex items-center justify-center">
                            <span className="text-white">Flapa</span>
                            <span className="text-orange-600">Pay</span>
                        </h1>
                        <div className="h-0.5 w-0 group-hover:w-full bg-orange-600 transition-all duration-700 mx-auto"></div>
                        <p className="mt-4 text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">
                            Security Department
                        </p>
                    </div>
                </div>

                <div className="bg-[#0A0A0A]/40 backdrop-blur-3xl border border-white/[0.05] rounded-[40px] p-10 lg:p-14 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-600/20 to-transparent"></div>

                    {success ? (
                        <div className="text-center space-y-8 animate-in zoom-in duration-500">
                            <div className="flex justify-center">
                                <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-3xl font-black text-white tracking-tight">Password Reset</h3>
                                <p className="text-white/40 text-sm font-medium">Your security credentials have been successfully updated. Redirecting you to login...</p>
                            </div>
                            <Button className="w-full h-14 uppercase tracking-widest text-[10px]" onClick={() => navigate('/signin')}>
                                Go to Login Now
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="text-center space-y-3 mb-10">
                                <h3 className="text-3xl font-black text-white tracking-tight">Create New Password</h3>
                                <p className="text-white/40 text-sm font-medium">Secure your account with a new strong password.</p>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-500 text-[11px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-3">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/20 h-5 w-5 transition-colors group-focus-within:text-orange-500" />
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e: any) => setPassword(e.target.value)}
                                            required
                                            className="pl-12 pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={togglePasswordVisibility}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/20 h-5 w-5 transition-colors group-focus-within:text-orange-500" />
                                        <Input
                                            id="confirmPassword"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e: any) => setConfirmPassword(e.target.value)}
                                            required
                                            className="pl-12 pr-12"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-6 pt-4">
                                <Button
                                    type="submit"
                                    className="w-full h-14 uppercase tracking-[0.2em] font-black"
                                    disabled={isSubmitting || !token}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Password'
                                    )}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => navigate('/signin')}
                                    className="text-white/40 hover:text-white text-[11px] font-black uppercase tracking-[0.2em] transition-colors flex items-center gap-2"
                                >
                                    <ArrowLeft className="h-3 w-3" />
                                    Cancel & Return
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <p className="mt-12 text-center text-white/10 text-[10px] font-black uppercase tracking-[0.3em]">
                    Elite Financial Infrastructure &middot; Multi-Factor Security
                </p>
            </div>
        </div>
    );
};
