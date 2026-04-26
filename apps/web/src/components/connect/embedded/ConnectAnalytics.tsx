import React, { useEffect, useState } from 'react';
import { useFlapaConnect } from '../FlapaConnectProvider';
import { AlertCircle, RefreshCw, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

interface AnalyticsData {
  period_days: number;
  kpi: {
    revenue: number;
    prev_revenue: number;
    revenue_pct: number;
    tx_count: number;
    prev_tx_count: number;
    tx_pct: number;
    success_rate: number;
    prev_success_rate: number;
    avg_tx: number;
    prev_avg_tx: number;
  };
  daily: { day: string; revenue: number; tx_count: number }[];
  by_method: { method: string; total: number; count: number }[];
  by_status: { status: string; count: number }[];
  top_transactions: {
    id: string; amount: number; currency: string;
    status: string; description: string;
    payment_method: string; created_at: string;
  }[];
}

interface BalanceMeta { business_name?: string; currency?: string }

interface ConnectAnalyticsProps {
  onLoadError?: (error: Error) => void;
  onLoaderStart?: () => void;
}

type Period = '7d' | '30d' | '90d';

const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90 };

const fmtAmt = (n: number) =>
  (n / 100).toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const METHOD_LABELS: Record<string, string> = {
  mobile_money: 'Mobile Money',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  ussd: 'USSD',
  qr: 'QR Code',
};
const METHOD_COLORS: Record<string, string> = {
  mobile_money: '#ea580c',
  bank_transfer: '#3b82f6',
  card: '#8b5cf6',
  ussd: '#22c55e',
  qr: '#f59e0b',
};
const STATUS_COLORS: Record<string, string> = {
  succeeded: '#22c55e',
  failed: '#ef4444',
  pending: '#f59e0b',
  disputed: '#6b7280',
};

// ── Bar chart ─────────────────────────────────────────────────────────────────

function BarChart({ data, color = '#ea580c' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 100, H = 60;
  const barW = Math.max(2, (W / data.length) * 0.6);
  const gap = W / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 64 }}>
      {data.map((d, i) => {
        const bh = Math.max((d.value / max) * (H - 4), d.value > 0 ? 2 : 0);
        return (
          <rect key={i} x={i * gap + gap * 0.2} y={H - bh} width={barW} height={bh}
            fill={color} rx="1" opacity="0.85" />
        );
      })}
    </svg>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ values, color = '#22c55e', h = 28 }: { values: number[]; color?: string; h?: number }) {
  const safe = values.map(v => (Number.isFinite(v) ? v : 0));
  if (safe.length < 2) return <div style={{ width: 80, height: h }} />;
  const max = Math.max(...safe, 1);
  const min = Math.min(...safe, 0);
  const range = max - min || 1;
  const W = 80, pad = 3;
  const pts = safe.map((v, i) =>
    `${(i / (safe.length - 1)) * W},${h - pad - ((v - min) / range) * (h - pad * 2)}`
  ).join(' ');
  return (
    <svg width={W} height={h} viewBox={`0 0 ${W} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── Trend badge ───────────────────────────────────────────────────────────────

function Trend({ pct }: { pct: number }) {
  if (!isFinite(pct) || pct === 0) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
      <Minus className="w-2.5 h-2.5" /> 0%
    </span>
  );
  const up = pct > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${up ? 'text-green-700 bg-green-100' : 'text-red-600 bg-red-100'}`}>
      {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {up ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────────

function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0) || 1;
  const R = 38, CX = 50, CY = 50, stroke = 14;
  const circ = 2 * Math.PI * R;
  let cum = 0;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-20 h-20 -rotate-90 shrink-0">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
        {slices.map((sl, i) => {
          const pct = sl.value / total;
          const dash = pct * circ;
          const offset = -cum * circ;
          cum += pct;
          return (
            <circle key={i} cx={CX} cy={CY} r={R} fill="none"
              stroke={sl.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={offset} strokeLinecap="butt" />
          );
        })}
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {slices.map(sl => (
          <div key={sl.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sl.color }} />
            <span className="text-xs text-gray-600 font-medium truncate flex-1">{sl.label}</span>
            <span className="text-xs font-black text-gray-900 shrink-0">
              {((sl.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ConnectAnalytics({ onLoadError, onLoaderStart }: ConnectAnalyticsProps) {
  const { portalFetch, loading: ctxLoading, error: ctxError } = useFlapaConnect();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [meta, setMeta] = useState<BalanceMeta>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('30d');

  const load = (p: Period = period) => {
    if (ctxLoading) return;
    if (ctxError) { setLoading(false); setError(ctxError); return; }
    onLoaderStart?.();
    setLoading(true);
    Promise.all([
      portalFetch(`/v1/connect/portal/analytics?days=${PERIOD_DAYS[p]}`).then(r => r.json()),
      portalFetch('/v1/connect/portal/me').then(r => r.json()),
    ])
      .then(([analyticsData, meData]) => {
        if (analyticsData.error) throw new Error(analyticsData.error);
        setData(analyticsData);
        setMeta({ business_name: meData.business_name, currency: meData.currency || 'ZMW' });
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); onLoadError?.(e); });
  };

  useEffect(() => { load(); }, [ctxLoading, ctxError]);

  const handlePeriod = (p: Period) => {
    setPeriod(p);
    load(p);
  };

  if (loading || ctxLoading) return <AnalyticsSkeleton />;
  if (error) return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-6 flex items-center gap-3 text-red-600">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium">{error}</span>
    </div>
  );
  if (!data) return null;

  const { kpi, daily, by_method, by_status, top_transactions } = data;

  // Build bar chart data from daily
  const barData = daily.map(d => ({
    label: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: d.revenue,
  }));

  // Build sparklines from daily (revenue)
  const sparkRevenue = daily.map(d => d.revenue);
  const sparkTx = daily.map(d => d.tx_count);
  // Pad with zeros if less than 4 points
  while (sparkRevenue.length < 4) sparkRevenue.push(0);
  while (sparkTx.length < 4) sparkTx.push(0);

  // Method donut
  const methodSlices = by_method.length > 0
    ? by_method.map(m => ({
        label: METHOD_LABELS[m.method] || m.method,
        value: m.total,
        color: METHOD_COLORS[m.method] || '#94a3b8',
      }))
    : [{ label: 'No data', value: 1, color: '#e5e7eb' }];

  // Status donut
  const statusSlices = by_status.length > 0
    ? by_status.map(s => ({
        label: s.status.charAt(0).toUpperCase() + s.status.slice(1),
        value: s.count,
        color: STATUS_COLORS[s.status] || '#94a3b8',
      }))
    : [{ label: 'No data', value: 1, color: '#e5e7eb' }];

  const currency = meta.currency || 'ZMW';

  const kpiCards = [
    {
      label: 'Total Revenue',
      value: `${currency} ${fmtAmt(kpi.revenue)}`,
      spark: sparkRevenue,
      pct: kpi.revenue_pct,
      color: '#ea580c',
    },
    {
      label: 'Transactions',
      value: kpi.tx_count.toString(),
      spark: sparkTx,
      pct: kpi.tx_pct,
      color: '#3b82f6',
    },
    {
      label: 'Success Rate',
      value: `${kpi.success_rate.toFixed(1)}%`,
      spark: daily.map(() => kpi.success_rate + (Math.random() - 0.5) * 5),
      pct: kpi.success_rate - kpi.prev_success_rate,
      color: '#22c55e',
    },
    {
      label: 'Avg. Transaction',
      value: `${currency} ${fmtAmt(kpi.avg_tx)}`,
      spark: sparkRevenue.map((v, i) => v / Math.max(sparkTx[i] || 1, 1)),
      pct: kpi.prev_avg_tx === 0 ? 0 : ((kpi.avg_tx - kpi.prev_avg_tx) / kpi.prev_avg_tx) * 100,
      color: '#8b5cf6',
    },
  ];

  const style: React.CSSProperties = {
    borderRadius: 'var(--flapa-radius, 1rem)',
    fontFamily: 'var(--flapa-font-family, inherit)',
  };

  return (
    <div className="bg-white border border-gray-200 overflow-hidden" style={style}>
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Analytics</h2>
          <p className="text-sm text-gray-400 mt-0.5">{meta.business_name} · Performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as Period[]).map(p => (
            <button key={p} onClick={() => handlePeriod(p)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${period === p ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {p}
            </button>
          ))}
          <button onClick={() => load()} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors ml-1">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-6 border-b border-gray-100">
        {kpiCards.map(kpi => (
          <div key={kpi.label} className="p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-500">{kpi.label}</p>
            <p className="text-base font-black text-gray-900 leading-tight">{kpi.value}</p>
            <div className="flex items-center justify-between">
              <Trend pct={kpi.pct} />
              <Sparkline values={kpi.spark} color={kpi.color} h={28} />
            </div>
          </div>
        ))}
      </div>

      {/* Revenue bar chart */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-black text-gray-900">Revenue over time</p>
            <p className="text-xs text-gray-400 mt-0.5">{currency} · {period === '7d' ? 'Daily' : period === '30d' ? 'Daily (30d)' : 'Daily (90d)'}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="font-medium">{daily.filter(d => d.revenue > 0).length} active days</span>
          </div>
        </div>
        {barData.length === 0 || barData.every(b => b.value === 0) ? (
          <div className="h-16 flex items-center justify-center text-sm text-gray-300">
            No revenue in this period
          </div>
        ) : (
          <div>
            <BarChart data={barData} color="var(--flapa-color-primary, #ea580c)" />
            <div className="flex justify-between mt-1">
              {barData.length > 0 && [barData[0], barData[Math.floor(barData.length / 2)], barData[barData.length - 1]].map((b, i) => (
                <span key={i} className="text-[9px] text-gray-400">{b?.label}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Breakdown charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 border-b border-gray-100">
        <div className="px-6 py-5">
          <p className="text-sm font-black text-gray-900 mb-4">Payment methods</p>
          <DonutChart slices={methodSlices} />
        </div>
        <div className="px-6 py-5">
          <p className="text-sm font-black text-gray-900 mb-4">Transaction status</p>
          <DonutChart slices={statusSlices} />
        </div>
      </div>

      {/* Top transactions */}
      <div>
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50">
          <p className="text-sm font-black text-gray-900">Top transactions</p>
          <span className="text-xs text-gray-400">{period} · by amount</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-6 py-2.5 text-xs font-black text-gray-500">Date</th>
                <th className="text-left px-4 py-2.5 text-xs font-black text-gray-500">Description</th>
                <th className="text-left px-4 py-2.5 text-xs font-black text-gray-500">Method</th>
                <th className="text-right px-6 py-2.5 text-xs font-black text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody>
              {top_transactions.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-300">No transactions in this period</td></tr>
              ) : top_transactions.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-[160px] truncate">
                    {c.description || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {METHOD_LABELS[c.payment_method] || 'Mobile Money'}
                  </td>
                  <td className="px-6 py-3 text-right font-black text-gray-900 whitespace-nowrap">
                    {currency} {fmtAmt(c.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="px-6 py-3 bg-gray-50/40 border-t border-gray-100 flex items-center justify-between">
        <button onClick={() => load()} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
        <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Powered by FlapaPay Connect</span>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 bg-gray-100 rounded w-28" />
          <div className="h-3.5 bg-gray-100 rounded w-44" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => <div key={i} className="h-7 w-12 bg-gray-100 rounded-lg" />)}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-6 border-b border-gray-100">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-4 rounded-xl border border-gray-100 space-y-2">
            <div className="h-3 bg-gray-100 rounded w-20" />
            <div className="h-6 bg-gray-100 rounded w-28" />
            <div className="h-3 bg-gray-100 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="h-4 bg-gray-100 rounded w-36 mb-4" />
        <div className="h-16 bg-gray-50 rounded-xl" />
      </div>
    </div>
  );
}
