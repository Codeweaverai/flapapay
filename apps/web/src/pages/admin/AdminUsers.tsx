import React, { useState, useEffect } from 'react';
import {
    Shield,
    User,
    Mail,
    Calendar,
    CheckCircle2,
    Wallet,
    X,
    Ban,
    Eye
} from 'lucide-react';
import { api } from '../../lib/axios';
import { Button } from '../../components/ui/Button';

interface UserWallet {
    currency: string;
    balance: string;
}

interface UserRecord {
    id: string;
    email: string;
    full_name: string;
    role: 'user' | 'admin';
    avatar_url?: string;
    status?: string;
    created_at: string;
    wallets: UserWallet[];
}

export const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    const updateRole = async (userId: string, newRole: string) => {
        try {
            await api.patch(`/admin/users/${userId}/role`, { role: newRole });
            fetchUsers();
            if (selectedUser && selectedUser.id === userId) {
                setSelectedUser({ ...selectedUser, role: newRole as 'user' | 'admin' });
            }
        } catch (err) {
            console.error('Failed to update role', err);
        }
    };

    const handleSuspend = async (userId: string) => {
        if (!confirm('Are you sure you want to update this user\'s status?')) return;
        try {
            const res = await api.patch(`/admin/users/${userId}/suspend`);
            alert(res.data.message);
            fetchUsers();
            setSelectedUser(null);
        } catch (err) {
            console.error('Failed to suspend user', err);
            alert('Failed to update user status');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    if (loading) return <div className="text-slate-500 font-bold text-center py-20">Accessing secure user ledger...</div>;

    return (
        <div className="space-y-12">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black mb-2 tracking-tight">Identity & Access</h1>
                    <p className="text-slate-500 font-bold">Manage global user credentials and administrative privileges.</p>
                </div>
                <div className="flex gap-4">
                    <button className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl font-bold transition-all border border-white/5">Export CSV</button>
                    <button className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-xl font-black text-slate-900 shadow-xl shadow-orange-500/20 active:scale-95 transition-all">Invite Admin</button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white shadow-sm border-slate-200 rounded-[40px] overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 text-slate-500 text-xs font-black uppercase tracking-widest text-left">
                            <th className="px-6 py-4">Identity</th>
                            <th className="px-6 py-4">Privileges</th>
                            <th className="px-6 py-4">Onboarding Date</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        {u.avatar_url ? (
                                            <img src={`http://localhost:3005${u.avatar_url}`} alt={u.full_name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 group-hover:border-orange-500 transition-all" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-700 to-gray-800 flex items-center justify-center font-black text-slate-900 group-hover:from-orange-500 group-hover:to-yellow-500 group-hover:text-black transition-all">
                                                {u.full_name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-black text-lg text-black">{u.full_name}</p>
                                            <p className="text-sm text-slate-500 font-bold flex items-center gap-2">
                                                <Mail className="w-3 h-3 text-orange-500" />
                                                {u.email}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-slate-200 group-hover:border-orange-500/30 transition-all">
                                        {u.role === 'admin' ? (
                                            <Shield className="w-3 h-3 text-orange-500 fill-orange-500/20" />
                                        ) : (
                                            <User className="w-3 h-3 text-blue-500" />
                                        )}
                                        <span className="text-xs font-black capitalize text-gray-300">{u.role}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3 opacity-50" />
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`inline-flex items-center gap-2 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full ${u.status === 'suspended' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                        {u.status === 'suspended' ? <Ban className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                        {u.status || 'Active'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => setSelectedUser(u)}
                                        className="p-2 bg-white/5 hover:bg-orange-500/10 hover:text-orange-500 rounded-lg transition-all"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {users.length === 0 && (
                    <div className="py-20 text-center text-slate-500 font-bold">No records found.</div>
                )}
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-white border-slate-200r-slate-200 rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 right-0 p-8">
                            <button onClick={() => setSelectedUser(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-10">
                            <div className="flex items-center gap-6 mb-10">
                                {selectedUser.avatar_url ? (
                                    <img src={`http://localhost:3005${selectedUser.avatar_url}`} alt={selectedUser.full_name} className="w-20 h-20 rounded-3xl object-cover border border-slate-200 shadow-2xl" />
                                ) : (
                                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-gray-800 to-gray-900 flex items-center justify-center text-3xl font-black text-slate-900 border border-slate-200">
                                        {selectedUser.full_name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-3xl font-black text-black mb-2">{selectedUser.full_name}</h2>
                                    <div className="flex items-center gap-4 text-gray-400">
                                        <span className="flex items-center gap-2 text-sm font-bold bg-white/5 px-3 py-1 rounded-full">
                                            <Mail className="w-3 h-3" /> {selectedUser.email}
                                        </span>
                                        <span className="flex items-center gap-2 text-sm font-bold bg-white/5 px-3 py-1 rounded-full">
                                            <User className="w-3 h-3" /> ID: {selectedUser.id.slice(0, 8)}...
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-10">
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                    <h3 className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-orange-500" /> Access Level
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <select
                                            value={selectedUser.role}
                                            onChange={(e) => updateRole(selectedUser.id, e.target.value)}
                                            className="bg-black border border-white/20 rounded-xl px-4 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none appearance-none"
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Administrator</option>
                                        </select>
                                        <div className="text-xs text-slate-500 max-w-[150px]">
                                            Admins have full access to global ledger and user controls.
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                    <h3 className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Wallet className="w-4 h-4 text-green-500" /> Wallet Balances
                                    </h3>
                                    <div className="space-y-3 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedUser.wallets && selectedUser.wallets.length > 0 ? (
                                            selectedUser.wallets.map((w, i) => (
                                                <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                                                    <span className="font-bold text-gray-300">{w.currency}</span>
                                                    <span className="font-mono text-slate-900">{parseFloat(w.balance).toLocaleString()}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-slate-500 text-sm font-bold italic">No active wallets</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-200 pt-8 flex justify-between items-center">
                                <button
                                    onClick={() => handleSuspend(selectedUser.id)}
                                    className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl transition-colors ${selectedUser.status === 'suspended' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'text-red-500 hover:text-red-400 hover:bg-red-500/10'}`}
                                >
                                    {selectedUser.status === 'suspended' ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                    {selectedUser.status === 'suspended' ? 'Re-activate Account' : 'Suspend User Account'}
                                </button>
                                <Button
                                    onClick={() => setSelectedUser(null)}
                                    className="bg-white text-black hover:bg-gray-200"
                                >
                                    Close Details
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
