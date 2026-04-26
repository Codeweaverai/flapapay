import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { Search, Users, ShieldCheck, Clock, XCircle, CheckCircle, ChevronRight, RefreshCw } from 'lucide-react';

const KYC_FILTERS = [
    { value: 'all',            label: 'All',           color: 'text-gray-600 bg-gray-100 border-gray-200' },
    { value: 'pending_review', label: 'Pending Review', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { value: 'verified',       label: 'Verified',       color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { value: 'rejected',       label: 'Rejected',       color: 'text-red-600 bg-red-50 border-red-200' },
    { value: 'unverified',     label: 'Unverified',     color: 'text-gray-500 bg-gray-50 border-gray-200' },
];

const kycBadge = (status: string) => {
    switch (status) {
        case 'verified':       return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'pending_review': return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'rejected':       return 'bg-red-50 text-red-600 border-red-200';
        default:               return 'bg-gray-50 text-gray-400 border-gray-200';
    }
};

const kycLabel = (status: string) => {
    switch (status) {
        case 'verified':       return 'Verified';
        case 'pending_review': return 'Pending Review';
        case 'rejected':       return 'Rejected';
        default:               return 'Unverified';
    }
};

export function AdminSubMerchants() {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(t);
    }, [search]);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ status: filter, limit: '100' });
            if (debouncedSearch) params.set('search', debouncedSearch);
            const res = await api.get(`/admin/sub-merchants?${params}`);
            setAccounts(res.data.accounts || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAccounts(); }, [filter, debouncedSearch]);

    const pending = accounts.filter(a => a.kyc_status === 'pending_review').length;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Sub-merchant KYC</h1>
                    <p className="text-gray-500 mt-1">Review and approve sub-merchant identity verification across all platforms.</p>
                </div>
                {pending > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-black text-amber-700">{pending} Pending Review</span>
                    </div>
                )}
            </div>

            {/* Filters + Search */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 w-64"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or email…"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {KYC_FILTERS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide border transition-all ${
                                filter === f.value ? f.color : 'text-gray-400 bg-white border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <button onClick={fetchAccounts} className="ml-auto p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="w-6 h-6 animate-spin text-orange-400" />
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No sub-merchants found</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Sub-merchant</th>
                                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform</th>
                                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">KYC Status</th>
                                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Status</th>
                                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Submitted</th>
                                <th className="px-8 py-4" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {accounts.map(acc => (
                                <tr
                                    key={acc.id}
                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/admin/sub-merchants/${acc.id}`)}
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-sm">
                                                {(acc.display_name || acc.email)?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900 text-sm">{acc.display_name || acc.email}</p>
                                                {acc.display_name && <p className="text-xs text-gray-400 font-mono">{acc.email}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-semibold text-gray-700">{acc.platform_name}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${kycBadge(acc.kyc_status)}`}>
                                            {kycLabel(acc.kyc_status)}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${acc.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                            {acc.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-sm text-gray-400">
                                        {acc.kyc_submitted_at
                                            ? new Date(acc.kyc_submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                            : '—'}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <ChevronRight className="w-4 h-4 text-gray-300" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!loading && (
                    <div className="px-8 py-4 border-t border-gray-50 text-xs text-gray-400 font-medium">
                        {accounts.length} of {total} accounts
                    </div>
                )}
            </div>
        </div>
    );
}
