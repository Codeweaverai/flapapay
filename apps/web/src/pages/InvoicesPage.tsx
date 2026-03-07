import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import {
    Plus, Search, FileText,
    Download, Eye, Trash2, Clock,
    CheckCircle2, AlertCircle, FileStack
} from 'lucide-react';

interface Invoice {
    id: string;
    invoice_number: string;
    client_name: string;
    client_email: string;
    invoice_date: string;
    total_amount: string;
    currency: string;
    status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'APPROVED';
}

export const InvoicesPage: React.FC = () => {
    const navigate = useNavigate();
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'APPROVED'>('ALL');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionMenuId && !(event.target as Element).closest('.action-menu-trigger')) {
                setActionMenuId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [actionMenuId]);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const response = await api.get('/v1/invoices');
            setInvoices(response.data);
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        total: invoices.length,
        paid: invoices.filter(i => i.status === 'PAID').length,
        pending: invoices.filter(i => i.status === 'SENT' || i.status === 'APPROVED').length,
        overdue: invoices.filter(i => i.status === 'OVERDUE').length,
        totalAmount: invoices.reduce((sum, i) => sum + parseFloat(i.total_amount), 0)
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesStatus = filterStatus === 'ALL' || inv.status === filterStatus;
        const matchesSearch = inv.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'SENT': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'DRAFT': return 'bg-gray-50 text-gray-500 border-gray-100';
            case 'APPROVED': return 'bg-violet-50 text-violet-600 border-violet-100';
            case 'OVERDUE': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-gray-50 text-gray-500 border-gray-100';
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FC]">
            <Sidebar />

            <div className="md:ml-72 transition-all duration-300">
                <main className="p-6 md:p-8 lg:p-12 max-w-7xl mx-auto w-full flex-1">
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Invoices</h1>
                            <p className="text-gray-500 mt-2 font-medium">Create, manage, and track your business billing</p>
                        </div>
                        <button
                            onClick={() => navigate('/invoices/create')}
                            className="bg-black text-white px-8 py-4 rounded-[1.5rem] font-bold hover:bg-gray-900 transition-all flex items-center justify-center shadow-xl shadow-black/10 transform hover:-translate-y-0.5 active:scale-95 group"
                        >
                            <Plus className="w-5 h-5 mr-2 stroke-[3px] group-hover:rotate-90 transition-transform" />
                            Create New Invoice
                        </button>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {[
                            { label: 'Total Invoices', value: stats.total, icon: FileStack, color: 'gray', bg: 'bg-gradient-to-br from-gray-800 to-gray-950', text: 'text-white' },
                            { label: 'Paid', value: stats.paid, icon: CheckCircle2, color: 'emerald', bg: 'bg-gradient-to-br from-emerald-400 to-emerald-600', text: 'text-white' },
                            { label: 'Pending', value: stats.pending, icon: Clock, color: 'blue', bg: 'bg-gradient-to-br from-blue-500 to-indigo-600', text: 'text-white' },
                            { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'red', bg: 'bg-gradient-to-br from-red-500 to-rose-600', text: 'text-white' },
                        ].map((stat, idx) => (
                            <div key={idx} className={`${stat.bg} p-6 rounded-[2rem] shadow-lg flex items-center gap-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative overflow-hidden group`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[20px] -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors"></div>
                                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center bg-white/10 ${stat.text} backdrop-blur-sm border border-white/10 shadow-inner`}>
                                    <stat.icon className="w-7 h-7" />
                                </div>
                                <div className="relative z-10">
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 text-white/70`}>{stat.label}</p>
                                    <p className={`text-3xl font-black ${stat.text} tracking-tight`}>{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filters & Search */}
                    <div className="flex flex-col lg:flex-row gap-6 justify-between items-center mb-10">
                        <div className="relative w-full lg:w-96 order-2 lg:order-1">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                            <input
                                type="text"
                                placeholder="Search client or invoice #"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] bg-white border border-gray-100 shadow-sm focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                            />
                        </div>

                        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto w-full lg:w-auto order-1 lg:order-2">
                            {['ALL', 'DRAFT', 'APPROVED', 'SENT', 'PAID', 'OVERDUE'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status as any)}
                                    className={`px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === status ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-gray-400 hover:text-gray-900'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-50 bg-gray-50/30">
                                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Invoice Details</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Client</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Date</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Amount</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-32 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="h-12 w-12 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
                                                    <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Syncing Galactic Ledger...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredInvoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-32 text-center">
                                                <div className="max-w-xs mx-auto flex flex-col items-center gap-6">
                                                    <div className="h-24 w-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200">
                                                        <FileText className="w-12 h-12" />
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-900 font-black text-xl tracking-tight">No invoices found</p>
                                                        <p className="text-gray-400 text-sm font-bold mt-2 leading-relaxed">Try adjusting your filters or create your first invoice today.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredInvoices.map((inv) => (
                                            <tr key={inv.id} className="group hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => navigate(inv.status === 'DRAFT' ? `/invoices/${inv.id}/edit` : `/invoices/${inv.id}`)}>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-5">
                                                        <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-900 shadow-sm border border-gray-100 group-hover:bg-white transition-colors">
                                                            <FileText className="w-7 h-7 opacity-20" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-gray-900 font-mono tracking-tight text-lg">#{inv.invoice_number}</p>
                                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-1">Ref ID: {inv.id.slice(0, 8)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 bg-black/5 rounded-full flex items-center justify-center text-black font-black text-xs uppercase">
                                                            {inv.client_name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-gray-900 leading-none mb-1">{inv.client_name}</p>
                                                            <p className="text-[10px] font-bold text-gray-400 truncate max-w-[120px]">{inv.client_email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-gray-500 font-black text-sm">{new Date(inv.invoice_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="font-black text-gray-900 text-lg tracking-tight">{inv.currency} {parseFloat(inv.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border ${getStatusStyles(inv.status)}`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right pr-6">
                                                    <div className="flex justify-end gap-2 transition-all duration-300">
                                                        {inv.status === 'DRAFT' && (
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (confirm('Approve this invoice? It will be ready for dispatch.')) {
                                                                        try {
                                                                            await api.post(`/v1/invoices/${inv.id}/approve`);
                                                                            fetchInvoices();
                                                                        } catch (error) {
                                                                            console.error('Approval failed', error);
                                                                        }
                                                                    }
                                                                }}
                                                                className="h-10 w-10 flex items-center justify-center text-emerald-500 bg-emerald-50 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm border border-emerald-100"
                                                                title="Approve Invoice"
                                                            >
                                                                <CheckCircle2 className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); navigate(inv.status === 'DRAFT' ? `/invoices/${inv.id}/edit` : `/invoices/${inv.id}`); }}
                                                            className="h-10 w-10 flex items-center justify-center text-indigo-500 bg-indigo-50 hover:bg-indigo-500 hover:text-white rounded-xl transition-all shadow-sm border border-indigo-100"
                                                            title="View Detail"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                        {(inv.status === 'APPROVED' || inv.status === 'SENT' || inv.status === 'PAID') && (
                                                            <>
                                                                <button
                                                                    className="h-10 w-10 flex items-center justify-center text-blue-500 bg-blue-50 hover:bg-blue-500 hover:text-white rounded-xl transition-all shadow-sm border border-blue-100"
                                                                    title="Download PDF"
                                                                    onClick={(e) => { e.stopPropagation(); window.open(`http://localhost:3005/v1/invoices/${inv.id}/pdf`, '_blank'); }}
                                                                >
                                                                    <Download className="w-5 h-5" />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            className="h-10 w-10 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm border border-rose-100"
                                                            title="Delete"
                                                            onClick={(e) => { e.stopPropagation(); if (confirm('Are you sure?')) {/* Handle delete */ } }}
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
