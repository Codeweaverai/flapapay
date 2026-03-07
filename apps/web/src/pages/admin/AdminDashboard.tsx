import React, { useState, useEffect } from 'react';
import {
    Users,
    CreditCard,
    ArrowUpRight,
    Zap,
    TrendingUp
} from 'lucide-react';
import { api } from '../../lib/axios';

interface DashboardStats {
    users: number;
    transactions: number;
    volumes: Array<{ currency: string; total: string }>;
    revenue: Array<{ currency: string; total: string }>;
    growth: {
        year: Array<{ label: string; total: number }>;
        month: Array<{ label: string; total: number }>;
        week: Array<{ label: string; total: number }>;
    };
}

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('year');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats');
                setStats(res.data.stats);
            } catch (err) {
                console.error('Failed to fetch stats', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="text-gray-500 font-bold">Loading insights...</div>;

    const cards = [
        {
            label: 'Total Users',
            value: stats?.users.toLocaleString(),
            trend: '+12.5%',
            icon: Users,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            label: 'Total Volume (USD)',
            value: `$${(parseFloat(stats?.volumes.find(v => v.currency === 'USD')?.total || '0')).toLocaleString()}`,
            trend: '+8.2%',
            icon: TrendingUp,
            color: 'text-green-500',
            bg: 'bg-green-500/10'
        },
        {
            label: 'Total Transactions',
            value: stats?.transactions.toLocaleString(),
            trend: '+4.1%',
            icon: CreditCard,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        },
        {
            label: 'Platform Revenue (USD)',
            value: `$${(parseFloat(stats?.revenue?.find(v => v.currency === 'USD')?.total || '0')).toLocaleString()}`,
            trend: '+12.4%',
            icon: Zap,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10'
        },
    ];

    return (
        <div className="space-y-12">
            <div>
                <h1 className="text-4xl font-black mb-2 tracking-tight">System Overview</h1>
                <p className="text-gray-500 font-bold">Monitor your platform's health and growth in real-time.</p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {cards.map((card, i) => (
                    <div key={i} className="bg-white border border-slate-200 p-8 rounded-[32px] hover:border-orange-500/50 hover:shadow-lg transition-all group relative overflow-hidden">
                        <div className={`absolute -right-8 -top-8 w-32 h-32 ${card.bg} rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className={`${card.bg} ${card.color} p-4 rounded-xl`}>
                                <card.icon className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 text-xs font-black">
                                <ArrowUpRight className="w-3 h-3" />
                                {card.trend}
                            </div>
                        </div>

                        <div className="relative z-10">
                            <p className="text-slate-500 font-bold text-sm mb-2 uppercase tracking-widest">{card.label}</p>
                            <h3 className="text-4xl font-black text-slate-900">{card.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Activity Chart */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[40px] p-10 shadow-sm">
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-2xl font-black text-slate-900">Growth Velocity</h2>
                        <select
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value as any)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none"
                        >
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                            <option value="year">Last 12 Months</option>
                        </select>
                    </div>

                    <div className="h-64 flex items-end justify-between gap-px md:gap-1 relative pt-10 border-b border-slate-100 pb-2">
                        {(() => {
                            const data = stats?.growth?.[timeframe] || [];
                            if (data.length === 0) {
                                return <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold italic">No data flow recorded for this period</div>;
                            }
                            const maxVal = Math.max(...data.map(x => x.total || 0), 1);

                            return data.map((d, i) => {
                                const h = ((d.total || 0) / maxVal) * 100;
                                return (
                                    <div key={i} className="flex-1 group relative h-full flex flex-col justify-end items-center">
                                        <div
                                            className="w-full bg-orange-100 group-hover:bg-orange-500 transition-all rounded-t-sm"
                                            style={{ height: `${Math.max(h, 2)}%`, minHeight: '4px' }}
                                        ></div>
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg pointer-events-none">
                                            {d.label}: {d.total.toLocaleString()}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                    <div className="flex justify-between mt-6 text-slate-400 font-bold text-[8px] uppercase tracking-tighter overflow-hidden">
                        {(stats?.growth?.[timeframe] || []).map((d, i) => (
                            <span key={i} className="flex-1 text-center truncate px-0.5">{d.label}</span>
                        ))}
                    </div>
                </div>

                {/* Sub Stats */}
                <div className="space-y-10">
                    <div className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-sm">
                        <h2 className="text-xl font-black mb-8 text-orange-500 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Platform Revenue
                        </h2>
                        <div className="space-y-6">
                            {stats?.revenue && stats.revenue.length > 0 ? (
                                stats.revenue.map((v, i) => {
                                    const maxRev = Math.max(...stats.revenue.map(r => parseFloat(r.total)), 1);
                                    const pct = (parseFloat(v.total) / maxRev) * 100;
                                    return (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center font-black text-orange-500">
                                                {v.currency}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm font-bold text-slate-500">{v.currency} Revenue</span>
                                                    <span className="text-sm font-black text-slate-900">{parseFloat(v.total).toLocaleString()}</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" style={{ width: `${pct}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-slate-500 text-sm font-bold italic">No revenue recorded yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-sm">
                        <h2 className="text-xl font-black mb-8 text-slate-900">Currency Distribution</h2>
                        <div className="space-y-6">
                            {stats?.volumes?.length ? stats.volumes.map((v, i) => {
                                const totalVolume = stats.volumes.reduce((acc, curr) => acc + parseFloat(curr.total), 0) || 1;
                                const pct = (parseFloat(v.total) / totalVolume) * 100;
                                return (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-orange-500">
                                            {v.currency}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-bold text-slate-500">{v.currency} Volume</span>
                                                <span className="text-sm font-black text-slate-900">{parseFloat(v.total).toLocaleString()}</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-orange-500" style={{ width: `${pct}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <p className="text-slate-500 text-sm font-bold italic">No volume recorded yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-yellow-500 rounded-[40px] p-10 text-black">
                        <Zap className="w-8 h-8 mb-6" />
                        <h2 className="text-2xl font-black mb-4">System Status</h2>
                        <p className="font-bold opacity-80 mb-8 leading-relaxed">All core services are performing at peak efficiency.</p>
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                            <span className="font-black uppercase tracking-widest text-sm">Online & Secure</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
