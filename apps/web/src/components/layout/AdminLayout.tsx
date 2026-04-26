import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
    UserCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdminLayout: React.FC = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

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

    return (
        <div className="flex h-screen bg-white text-slate-900 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-80 border-r border-slate-200 bg-slate-100 flex flex-col">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-orange-500/20">
                            F
                        </div>
                        <span className="text-xl font-black tracking-tight tracking-[-0.04em] text-slate-900">
                            FlapaPay <span className="text-orange-500">Admin</span>
                        </span>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/admin'}
                                className={({ isActive }) => `
                                    flex items-center justify-between px-6 py-4 rounded-2xl transition-all group
                                    ${isActive
                                        ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20 font-black'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 font-bold'}
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </div>
                                <ChevronRight className={`w-4 h-4 transition-transform ${item.path === '/admin' ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-8 border-t border-slate-200">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 px-6 py-4 w-full rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
                {/* Header */}
                <header className="h-24 border-b border-slate-200 px-10 flex items-center justify-between">
                    <div className="relative w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search records, users, transactions..."
                            className="bg-slate-100 border-none rounded-xl pl-12 pr-6 py-3 w-full focus:ring-2 focus:ring-orange-500 transition-all text-sm font-medium text-slate-900"
                        />
                    </div>

                    <div className="flex items-center gap-8">
                        <NavLink to="/admin/notifications" className={({ isActive }) => `relative p-2 rounded-xl transition-all ${isActive ? 'text-orange-500 bg-orange-50' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}>
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
                        </NavLink>

                        <div className="flex items-center gap-4 pl-8 border-l border-slate-200">
                            <div className="text-right">
                                <p className="text-sm font-black text-slate-900">{user?.fullName}</p>
                                <p className="text-xs text-orange-500 font-bold uppercase tracking-wider">Super Admin</p>
                            </div>
                            {user?.avatarUrl ? (
                                <img src={`http://localhost:3005${user.avatarUrl}`} alt={user.fullName} className="w-10 h-10 rounded-full object-cover border-2 border-slate-200" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-yellow-400 border-2 border-slate-200 flex items-center justify-center font-black text-white text-lg">
                                    {user?.fullName?.charAt(0) || 'A'}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
