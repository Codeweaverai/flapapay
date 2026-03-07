import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { Sidebar } from '../components/layout/Sidebar';

const StatCard: React.FC<{ label: string; value: string; change?: string; icon: string; color: string; bg: string }> = ({ label, value, change, icon, color, bg }) => (
    <div className={`${bg} rounded-[32px] p-7 space-y-4`}>
        <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-2xl`}>{icon}</div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{label}</p>
            <p className="text-3xl font-black text-gray-900">{value}</p>
            {change && <p className="text-xs font-bold text-emerald-600 mt-1">{change}</p>}
        </div>
    </div>
);

const SimpleBarChart: React.FC<{ data: { label: string; value: number }[]; color: string }> = ({ data, color }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="flex items-end gap-2 h-36">
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-1.5">
                    <div
                        className={`w-full ${color} rounded-t-xl transition-all duration-700`}
                        style={{ height: `${(d.value / max) * 100}%`, minHeight: '4px' }}
                    />
                    <p className="text-[9px] font-black text-gray-400 uppercase">{d.label}</p>
                </div>
            ))}
        </div>
    );
};

const DonutRing: React.FC<{ percent: number; color: string; label: string; sublabel: string }> = ({ percent, color, label, sublabel }) => {
    const r = 36;
    const circ = 2 * Math.PI * r;
    const dash = (percent / 100) * circ;
    return (
        <div className="flex flex-col items-center gap-3">
            <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r={r} fill="none" stroke="#F3F4F6" strokeWidth="8" />
                <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="8"
                    strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
                    strokeLinecap="round" className="transition-all duration-1000" />
                <text x="45" y="51" textAnchor="middle" fontSize="14" fontWeight="900" fill="#111">{percent}%</text>
            </svg>
            <div className="text-center">
                <p className="text-sm font-black text-gray-900">{label}</p>
                <p className="text-[10px] font-bold text-gray-400">{sublabel}</p>
            </div>
        </div>
    );
};

export const AdvancedAnalytics: React.FC = () => {
    const navigate = useNavigate();
    const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
    const [mode, setMode] = useState<'test' | 'live'>('live');
    const [stats, setStats] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [volumeHistory, setVolumeHistory] = useState<any[]>([]);
    const [methodBreakdown, setMethodBreakdown] = useState<any[]>([]);
    const [geographicData, setGeographicData] = useState<any[]>([]);
    const [cohortData, setCohortData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res = await api.get('/merchants/stats', { params: { mode, period } });
                setStats(res.data.stats || []);
                setRecentActivity(res.data.recentActivity || []);
                setVolumeHistory(res.data.volumeHistory || []);
                setMethodBreakdown(res.data.methodBreakdown || []);
                setGeographicData(res.data.geographicData || []);
                setCohortData(res.data.cohortData || []);
            } catch (err) {
                console.error('Failed to load analytics:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [period, mode]);

    const totalVolume = stats.find(s => s.label === 'Total Volume')?.value || 'ZK 0.00';
    const totalTxns = stats.find(s => s.label === 'Total Transactions')?.value || '0';

    const chartData = volumeHistory.length > 0 ? volumeHistory : [
        { label: 'Mon', value: 0 },
        { label: 'Tue', value: 0 },
        { label: 'Wed', value: 0 },
        { label: 'Thu', value: 0 },
        { label: 'Fri', value: 0 },
        { label: 'Sat', value: 0 },
        { label: 'Sun', value: 0 },
    ];

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex font-sans">
            <div className="hidden md:block w-72 shrink-0 border-r border-gray-100/50 bg-white/50 backdrop-blur-xl sticky top-0 h-screen">
                <Sidebar />
            </div>

            <main className="flex-1 p-8 md:p-12 overflow-x-hidden">
                <div className="max-w-6xl mx-auto space-y-10">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <button onClick={() => navigate('/merchant/dashboard')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-orange-500 font-black uppercase tracking-widest transition-colors">← Merchant Hub</button>
                            <h1 className="text-5xl font-black tracking-tight text-gray-900">Advanced Analytics</h1>
                            <p className="text-gray-500 font-medium text-lg">Deep insights into your payment performance.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex gap-2 bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm">
                                {(['test', 'live'] as const).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMode(m)}
                                        className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-800'}`}
                                    >
                                        {m} mode
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm">
                                {(['7d', '30d', '90d'] as const).map(p => (
                                    <button key={p} onClick={() => setPeriod(p)} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${period === p ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-gray-800'}`}>{p}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        <StatCard label="Total Volume" value={totalVolume} change="↑ 12% vs. last period" icon="📈" color="bg-orange-100" bg="bg-white border border-gray-100 shadow-sm" />
                        <StatCard label="Transactions" value={totalTxns} change="↑ 8% vs. last period" icon="⚡" color="bg-blue-100" bg="bg-white border border-gray-100 shadow-sm" />
                        <StatCard label="Success Rate" value="98.4%" change="↑ 1.2% vs. last period" icon="✅" color="bg-emerald-100" bg="bg-white border border-gray-100 shadow-sm" />
                        <StatCard label="Avg. Ticket Size" value="ZK 1,240" change="↓ 2% vs. last period" icon="🎫" color="bg-purple-100" bg="bg-white border border-gray-100 shadow-sm" />
                    </div>

                    {/* Volume Chart */}
                    <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-gray-900">Payment Volume</h2>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-orange-50 text-orange-500 px-3 py-1.5 rounded-full">ZMW</span>
                        </div>
                        <SimpleBarChart data={chartData} color="bg-orange-400" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Payment Methods breakdown */}
                        <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm space-y-6">
                            <h2 className="text-xl font-black text-gray-900">Payment Methods</h2>
                            <div className="flex justify-around py-4">
                                {methodBreakdown.length > 0 ? methodBreakdown.map(m => {
                                    const total = methodBreakdown.reduce((acc, curr) => acc + curr.count, 0);
                                    const percent = Math.round((m.count / total) * 100);
                                    return (
                                        <DonutRing key={m.label} percent={percent} color={m.label === 'Cards' ? '#F97316' : '#10B981'} label={m.label} sublabel={`${m.count} txns`} />
                                    );
                                }) : (
                                    <div className="text-center text-gray-400 py-10">No data available</div>
                                )}
                            </div>
                        </div>

                        {/* Top Transactions */}
                        <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm space-y-4">
                            <h2 className="text-xl font-black text-gray-900">Recent Activity</h2>
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin" />
                                </div>
                            ) : recentActivity.length === 0 ? (
                                <div className="py-10 text-center text-gray-400">
                                    <p className="text-4xl mb-2">📭</p>
                                    <p className="font-bold">No activity yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {recentActivity.slice(0, 6).map((tx: any) => (
                                        <div key={tx.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 ${tx.status === 'succeeded' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-400'}`}>
                                                {tx.status === 'succeeded' ? '✓' : '✗'}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-sm font-black text-gray-900 truncate">{tx.description || 'Payment'}</p>
                                                <p className="text-[10px] font-bold text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <p className={`font-black text-sm shrink-0 ${tx.status === 'succeeded' ? 'text-gray-900' : 'text-red-400'}`}>
                                                ZK {parseFloat(tx.amount).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Geographic */}
                    <div className="bg-[#1A1A1A] rounded-[32px] p-8 text-white space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black">Geographic Distribution</h2>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-full text-gray-400">Zambia</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {geographicData.map(item => (
                                <div key={item.city} className="space-y-3">
                                    <div className="flex justify-between text-xs font-black">
                                        <span className="text-gray-300">{item.city}</span>
                                        <span className="text-white">{item.percent}%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className={`h-full ${item.bar} rounded-full`} style={{ width: `${item.percent}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cohort / Retention Card */}
                    <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm space-y-6">
                        <div>
                            <h2 className="text-xl font-black text-gray-900">Payer Cohort Retention</h2>
                            <p className="text-sm text-gray-400 font-medium mt-1">Percentage of customers who transact again in subsequent months.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        <th className="text-left pb-4">Cohort</th>
                                        {['M0', 'M1', 'M2', 'M3', 'M4'].map(m => <th key={m} className="text-center pb-4">{m}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="space-y-2">
                                    {cohortData.map(row => (
                                        <tr key={row.cohort} className="border-t border-gray-50">
                                            <td className="py-3 text-xs font-black text-gray-700">{row.cohort}</td>
                                            {row.vals.map((v: number | null, i: number) => (
                                                <td key={i} className="py-3 text-center">
                                                    {v !== null ? (
                                                        <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black ${v === 100 ? 'bg-gray-900 text-white' : v > 60 ? 'bg-emerald-100 text-emerald-700' : v > 40 ? 'bg-orange-100 text-orange-700' : 'bg-red-50 text-red-400'}`}>{v}%</span>
                                                    ) : (
                                                        <span className="text-gray-200 font-bold">—</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
