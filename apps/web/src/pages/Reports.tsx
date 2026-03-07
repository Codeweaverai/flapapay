import React, { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { Sidebar } from '../components/layout/Sidebar';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { StatementPDF } from '../components/StatementPDF';

interface Wallet {
    id: string;
    currency: string;
    balance: string;
}

interface SummaryData {
    dailyActivity: Array<{ date: string; inflow: number; outflow: number }>;
    assets: Wallet[];
    distribution: Array<{ name: string; value: number }>;
}

export const Reports: React.FC = () => {
    const [data, setData] = useState<SummaryData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWalletId, setSelectedWalletId] = useState<string>('');
    const [statementData, setStatementData] = useState<any>(null);
    const [isFetchingStatement, setIsFetchingStatement] = useState(false);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await api.get('/reports/summary');
                setData(res.data);
                if (res.data.assets.length > 0) {
                    setSelectedWalletId(res.data.assets[0].id);
                }
            } catch (err) {
                console.error('Failed to fetch reports', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSummary();
    }, []);

    useEffect(() => {
        if (selectedWalletId) {
            const fetchStatement = async () => {
                setIsFetchingStatement(true);
                try {
                    const res = await api.get(`/wallets/${selectedWalletId}/statement`);
                    setStatementData(res.data);
                } catch (err) {
                    console.error('Statement fetch failed', err);
                } finally {
                    setIsFetchingStatement(false);
                }
            };
            fetchStatement();
        }
    }, [selectedWalletId]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const handleCSVExport = (walletId?: string) => {
        const url = walletId
            ? `${api.defaults.baseURL}/reports/export/csv?walletId=${walletId}`
            : `${api.defaults.baseURL}/reports/export/csv`;
        window.open(url, '_blank');
    };

    if (isLoading) return <div className="flex items-center justify-center min-h-screen bg-gray-50">Loading Financial Insights...</div>;

    const selectedWallet = data?.assets.find(a => a.id === selectedWalletId);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <div className="hidden md:block w-72 shrink-0">
                <Sidebar />
            </div>

            <main className="flex-1 px-12 py-10 overflow-y-auto">
                <header className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
                        <p className="text-gray-500 mt-1">Detailed analysis of your financial health</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                    {/* Activity Chart */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Cash Flow (Last 30 Days)</h3>
                            <button
                                onClick={() => handleCSVExport()}
                                className="text-sm font-semibold text-black hover:underline"
                            >
                                Export Global CSV
                            </button>
                        </div>
                        <div className="h-80 min-h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data?.dailyActivity}>
                                    <defs>
                                        <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend verticalAlign="top" height={36} />
                                    <Area type="monotone" dataKey="inflow" name="Money In" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={3} />
                                    <Area type="monotone" dataKey="outflow" name="Money Out" stroke="#ef4444" fillOpacity={1} fill="url(#colorOut)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Distribution Chart */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Asset Distribution</h3>
                        <div className="h-80 min-h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data?.assets?.map(a => ({ name: a.currency, value: parseFloat(a.balance) }))}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data?.assets.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Statement Center</h2>
                            <p className="text-gray-500">Download bank-grade transaction statements</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <select
                                value={selectedWalletId}
                                onChange={(e) => setSelectedWalletId(e.target.value)}
                                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black transition-all"
                            >
                                {data?.assets.map(a => (
                                    <option key={a.id} value={a.id}>{a.currency} Wallet</option>
                                ))}
                            </select>

                            <button
                                onClick={() => handleCSVExport(selectedWalletId)}
                                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all active:scale-95"
                                title="Export Statement CSV"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </button>

                            {statementData && !isFetchingStatement && (
                                <PDFDownloadLink
                                    document={<StatementPDF data={statementData} />}
                                    fileName={`FlapaPay_Statement_${selectedWallet?.currency}_${new Date().toISOString().split('T')[0]}.pdf`}
                                >
                                    {({ loading }) => (
                                        <button
                                            disabled={loading}
                                            className="px-6 py-2.5 bg-black text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            {loading ? 'Generating...' : `Download ${selectedWallet?.currency} Statement`}
                                        </button>
                                    )}
                                </PDFDownloadLink>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="pb-4 font-semibold text-gray-400 text-sm">Date</th>
                                    <th className="pb-4 font-semibold text-gray-400 text-sm">Description</th>
                                    <th className="pb-4 font-semibold text-gray-400 text-sm text-right">Amount</th>
                                    <th className="pb-4 font-semibold text-gray-400 text-sm text-right">Reference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isFetchingStatement ? (
                                    <tr><td colSpan={4} className="py-8 text-center text-gray-400">Loading transactions...</td></tr>
                                ) : statementData?.transactions.length === 0 ? (
                                    <tr><td colSpan={4} className="py-8 text-center text-gray-400">No transactions found for this wallet.</td></tr>
                                ) : statementData?.transactions.map((tx: any) => (
                                    <tr key={tx.id} className="group hover:bg-gray-50 transition-colors">
                                        <td className="py-4 text-sm text-gray-600">
                                            {new Date(tx.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 font-medium text-gray-900">{tx.description}</td>
                                        <td className={`py-4 text-right font-bold ${tx.flow_type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {tx.flow_type === 'CREDIT' ? '+' : '-'}{tx.amount}
                                        </td>
                                        <td className="py-4 text-right text-xs text-gray-400 font-mono">{tx.transaction_reference}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};
