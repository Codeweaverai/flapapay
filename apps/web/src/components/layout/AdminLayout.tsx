import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Receipt,
    FileText,
    LogOut,
    ChevronRight,
    Search,
    Bell,
    Building2,
    ShieldCheck,
    UserCheck,
    ChevronLeft,
    Menu,
    X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdminLayout: React.FC = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/signin');
    };

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
        { name: 'User Management', icon: Users, path: '/admin/users' },
        { name: 'Transactions', icon: Receipt, path: '/admin/transactions' },
        { name: 'Merchants', icon: Building2, path: '/admin/merchants' },
        { name: 'Sub-merchant KYC', icon: UserCheck, path: '/admin/sub-merchants' },
        { name: 'Escrows', icon: ShieldCheck, path: '/admin/escrows' },
        { name: 'Content (CMS)', icon: FileText, path: '/admin/cms' },
    ];

    const activeItem = useMemo(
        () => navItems.find((item) => item.path === '/admin'
            ? location.pathname === '/admin'
            : location.pathname.startsWith(item.path)),
        [location.pathname]
    );

    return (
        <div
            className="min-h-screen bg-white text-slate-900 font-sans"
            style={{
                backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')",
                backgroundAttachment: 'fixed'
            }}
        >
            <div className="relative flex min-h-screen overflow-hidden">
                <div className="pointer-events-none absolute right-[-12rem] top-[-10rem] h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-orange-100/60 via-amber-100/35 to-transparent blur-3xl" />
                <div className="pointer-events-none absolute bottom-[-10rem] left-[-8rem] h-[24rem] w-[24rem] rounded-full bg-gradient-to-tr from-emerald-100/60 via-white/30 to-transparent blur-3xl" />

                {mobileNavOpen && (
                    <button
                        type="button"
                        aria-label="Close navigation"
                        className="fixed inset-0 z-30 bg-slate-950/35 backdrop-blur-sm md:hidden"
                        onClick={() => setMobileNavOpen(false)}
                    />
                )}

                <aside className={`fixed inset-y-0 left-0 z-40 flex w-80 max-w-[86vw] flex-col border-r border-gray-100/80 bg-white/80 backdrop-blur-xl transition-transform duration-300 md:sticky md:max-w-none ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                    <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-orange-500/5 blur-[80px]" />
                    <div className="absolute bottom-32 left-0 h-24 w-24 rounded-full bg-emerald-500/5 blur-[60px]" />

                    <div className="relative flex items-center justify-between px-8 pb-8 pt-10">
                        <button
                            type="button"
                            onClick={() => navigate('/admin')}
                            className="group flex items-center gap-4"
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-[22px] border border-gray-100 bg-white shadow-lg shadow-orange-100/40 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-orange-200">
                                <img
                                    src="/assets/images/flapapaylogoicon.png"
                                    alt="FlapaPay"
                                    className="h-8 w-auto object-contain"
                                />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">Control Room</p>
                                <p className="text-xl font-black tracking-[-0.04em] text-slate-900">
                                    FlapaPay <span className="text-orange-500">Admin</span>
                                </p>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMobileNavOpen(false)}
                            className="rounded-2xl border border-gray-100 bg-white p-3 text-slate-500 shadow-sm md:hidden"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="px-8 py-6">
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    </div>

                    <nav className="relative flex-1 space-y-2 overflow-y-auto px-6 pb-6">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/admin'}
                                onClick={() => setMobileNavOpen(false)}
                                className={({ isActive }) => `
                                    group relative flex items-center gap-4 rounded-[22px] px-5 py-4 transition-all duration-300
                                    ${isActive
                                        ? 'border border-gray-100 bg-white text-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.06)]'
                                        : 'text-slate-400 hover:bg-white/80 hover:text-slate-900'}
                                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.35)]" />
                                        )}
                                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all ${isActive ? 'bg-orange-50 text-orange-500' : 'bg-transparent text-slate-300 group-hover:bg-slate-50 group-hover:text-slate-900'}`}>
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`truncate text-[11px] font-black uppercase tracking-[0.18em] ${isActive ? 'text-slate-900' : ''}`}>{item.name}</p>
                                        </div>
                                        <ChevronRight className={`h-4 w-4 transition-all ${isActive ? 'text-orange-500' : 'group-hover:translate-x-1 group-hover:text-slate-500'}`} />
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="relative mt-auto p-6">
                        <div className="rounded-[26px] border border-gray-100 bg-white/85 p-4 shadow-sm">
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center justify-between rounded-[18px] px-4 py-4 text-left text-red-500 transition-all hover:bg-red-50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50">
                                        <LogOut className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black">Sign Out</p>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">End admin session</p>
                                    </div>
                                </div>
                                <ChevronLeft className="h-4 w-4 rotate-180" />
                            </button>
                        </div>
                    </div>
                </aside>

                <main className="relative flex min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-20 border-b border-gray-100/80 bg-white/70 px-4 py-4 backdrop-blur-xl md:px-8 lg:px-10">
                        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                            <div className="flex items-center gap-3 md:flex-1">
                                <button
                                    type="button"
                                    onClick={() => setMobileNavOpen(true)}
                                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-white text-slate-600 shadow-sm md:hidden"
                                >
                                    <Menu className="h-5 w-5" />
                                </button>

                                <div className="hidden min-w-0 md:block">
                                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-400">Admin Navigation</p>
                                    <h1 className="truncate text-xl font-black tracking-[-0.04em] text-slate-900">
                                        {activeItem?.name || 'Dashboard'}
                                    </h1>
                                </div>
                            </div>

                            <div className="relative hidden w-full max-w-md flex-1 md:block">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search users, merchants, transactions..."
                                    className="w-full rounded-2xl border border-gray-100 bg-white/90 py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-200 focus:ring-4 focus:ring-orange-100"
                                />
                            </div>

                            <div className="flex items-center gap-3 md:gap-4">
                                <NavLink
                                    to="/admin/notifications"
                                    className={({ isActive }) => `relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm transition-all ${isActive ? 'text-orange-500' : 'text-slate-500 hover:-translate-y-0.5 hover:text-slate-900'}`}
                                >
                                    <Bell className="h-5 w-5" />
                                    <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full border-2 border-white bg-orange-500" />
                                </NavLink>

                                <div className="hidden items-center gap-3 rounded-[22px] border border-gray-100 bg-white/90 px-3 py-2 shadow-sm sm:flex">
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-900">{user?.fullName}</p>
                                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-500">Super Admin</p>
                                    </div>
                                    {user?.avatarUrl ? (
                                        <img src={`http://localhost:3005${user.avatarUrl}`} alt={user.fullName} className="h-11 w-11 rounded-2xl border border-gray-100 object-cover" />
                                    ) : (
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-base font-black text-white shadow-lg shadow-orange-200/60">
                                            {user?.fullName?.charAt(0) || 'A'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 lg:px-10">
                        <div className="mx-auto max-w-7xl">
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
