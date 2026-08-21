import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Public navigation alignment: primary links follow the left viewport rail while account actions remain anchored to the right rail.
export const Navbar: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/signup?mode=login');
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black shadow-xl shadow-black/50 border-b border-white/10 py-3' : 'bg-black py-5'}`}>
            <div className="w-full px-4 sm:px-6 lg:px-10 2xl:px-14">
                <div className="flex h-12 items-center justify-between">

                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2 flex-shrink-0 font-black text-2xl tracking-tight transition-colors hover:opacity-80">
                            <img src="/assets/images/flapapaylogoicon.png" alt="FlapaPay" className="w-8 h-8 object-contain" />
                            <div>
                                <span className="text-orange-500">Flapa</span><span className="text-white">Pay</span>
                            </div>
                        </Link>
                        <div className="hidden md:ml-10 md:flex md:space-x-8">
                            <Link to="/products" className="text-sm font-medium text-white hover:text-orange-400 transition-colors">Products</Link>
                            <Link to="/solutions" className="text-sm font-medium text-white hover:text-orange-400 transition-colors">Solutions</Link>
                            <Link to="/developers" className="text-sm font-medium text-white hover:text-orange-400 transition-colors">Developers</Link>
                            <Link to="/pricing" className="text-sm font-medium text-white hover:text-orange-400 transition-colors">Pricing</Link>
                            <Link to="/fx-liquidity" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">FX Liquidity <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span></Link>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold overflow-hidden border border-orange-500/50">
                                        {user?.avatarUrl ? (
                                            <img
                                                src={`${import.meta.env.VITE_API_URL || 'http://localhost:3005'}${user.avatarUrl}`}
                                                alt={user.fullName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            user?.fullName?.charAt(0)
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-white">{user?.fullName?.split(' ')[0]}</span>
                                </div>
                                <Button size="sm" variant="ghost" className="text-sm !text-white hover:!text-orange-400 hover:bg-white/10 transition-colors" onClick={handleLogout}>Log out</Button>
                                <Link to="/dashboard">
                                    <Button size="sm" className="rounded-full px-5 bg-orange-500 hover:bg-orange-600 text-white border-none">Dashboard</Button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                <Link to="/signup?mode=login" className="text-sm font-medium text-white hover:text-orange-400 transition-colors">
                                    Sign in
                                </Link>
                                <Link to="/signup">
                                    <Button size="sm" className="rounded-full px-5 shadow-sm bg-orange-500 hover:bg-orange-600 text-white border-none">Sign Up</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};
