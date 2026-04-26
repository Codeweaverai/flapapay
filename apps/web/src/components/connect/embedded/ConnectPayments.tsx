import React, { useEffect, useState } from 'react';
import { useFlapaConnect } from '../FlapaConnectProvider';
import { AlertCircle, RefreshCw, Download } from 'lucide-react';

interface Charge {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  customer_email?: string;
  payment_method_type?: string;
  created_at: string;
}

interface ConnectPaymentsProps {
  onLoadError?: (error: Error) => void;
  onLoaderStart?: () => void;
}

const fmtAmt = (n: number) =>
  (n / 100).toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: string) => {
  const dt = new Date(d);
  return (
    dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ', ' +
    dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
};

const STATUS_STYLE: Record<string, string> = {
  succeeded: 'bg-green-50 text-green-700 border-green-200',
  failed:    'bg-red-50 text-red-600 border-red-200',
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  disputed:  'bg-gray-100 text-gray-600 border-gray-300',
  refunded:  'bg-purple-50 text-purple-600 border-purple-200',
};
const STATUS_LABEL: Record<string, string> = {
  succeeded: 'Succeeded', failed: 'Failed',
  pending: 'Pending', disputed: 'Disputed', refunded: 'Refunded',
};

function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${STATUS_STYLE[s] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
      {STATUS_LABEL[s] || status}
    </span>
  );
}

function Sparkline({ values, color = '#22c55e' }: { values: number[]; color?: string }) {
  const safe = values.map(v => (Number.isFinite(v) ? v : 0));
  if (safe.length < 2) return <div className="w-28 h-10" />;
  const max = Math.max(...safe, 0);
  const min = Math.min(...safe, 0);
  const range = max - min || 1;
  const W = 112, H = 40;
  const pts = safe.map((v, i) =>
    `${(i / (safe.length - 1)) * W},${H - ((v - min) / range) * (H - 10) - 5}`
  ).join(' ');
  const fadePts = safe.map((v, i) =>
    `${(i / (safe.length - 1)) * W},${H - ((v - min) / range) * (H - 10) * 0.6 - 5}`
  ).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={fadePts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" opacity="0.3" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  mobile_money: 'Mobile Money',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  ussd: 'USSD',
  qr: 'QR Code',
};

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'succeeded', label: 'Succeeded' },
  { key: 'disputed', label: 'Disputes' },
  { key: 'failed', label: 'Failed' },
  { key: 'pending', label: 'Pending' },
];

export function ConnectPayments({ onLoadError, onLoaderStart }: ConnectPaymentsProps) {
  const { portalFetch, loading: ctxLoading, error: ctxError } = useFlapaConnect();
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const load = () => {
    if (ctxLoading) return;
    if (ctxError) { setLoading(false); setError(ctxError); return; }
    onLoaderStart?.();
    portalFetch('/v1/connect/portal/charges?limit=50')
      .then(r => r.json())
      .then(d => { setCharges(d.charges || []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); onLoadError?.(e); });
  };

  useEffect(() => { load(); }, [ctxLoading, ctxError]);

  if (loading || ctxLoading) return <TableSkeleton />;
  if (error) return <ErrorCard msg={error} />;

  // Month-to-date stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const mtdCharges = charges.filter(c =>
    new Date(c.created_at) >= startOfMonth && c.status === 'succeeded'
  );
  const mtdTotal = mtdCharges.reduce((s, c) => s + c.amount, 0);
  const uniqueCustomers = new Set(
    charges.map(c => c.customer_email || c.description).filter(Boolean)
  ).size;

  // 14-day sparkline
  const sparkValues = Array.from({ length: 14 }, (_, i) => {
    const start = new Date(); start.setDate(start.getDate() - (13 - i)); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(start.getDate() + 1);
    return charges
      .filter(c => { const dt = new Date(c.created_at); return dt >= start && dt < end; })
      .reduce((s, c) => s + c.amount, 0);
  });
  const custSparkValues = sparkValues.map((v, i) => v * (0.7 + (i % 4) * 0.15));

  const disputed = charges.filter(c => c.status === 'disputed').length;
  const filtered = filterStatus === 'all'
    ? charges
    : charges.filter(c => c.status === filterStatus);

  const style: React.CSSProperties = {
    borderRadius: 'var(--flapa-radius, 1rem)',
    fontFamily: 'var(--flapa-font-family, inherit)',
  };

  return (
    <div className="bg-white border border-gray-200 overflow-hidden" style={style}>
      {/* Title */}
      <div className="px-6 pt-5 pb-2">
        <h2 className="text-2xl font-black text-gray-900">Payments</h2>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 px-6 pb-4">
        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
          <div>
            <p className="text-xs text-gray-500 font-semibold">Month-to-date</p>
            <p className="text-lg font-black text-gray-900 mt-0.5">ZMW {fmtAmt(mtdTotal)}</p>
            <span className="inline-flex items-center mt-1.5 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              +{mtdCharges.length} payments
            </span>
          </div>
          <Sparkline values={sparkValues} color="#22c55e" />
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
          <div>
            <p className="text-xs text-gray-500 font-semibold">Customers</p>
            <p className="text-lg font-black text-gray-900 mt-0.5">{uniqueCustomers || charges.length}</p>
            <span className="inline-flex items-center mt-1.5 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>
          <Sparkline values={custSparkValues} color="#22c55e" />
        </div>
      </div>

      {/* Section header + filter tabs */}
      <div className="px-6 pb-0 border-b border-gray-100">
        <p className="text-base font-black text-gray-900 mb-3">Recent payments</p>
        <div className="flex gap-0">
          {FILTER_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setFilterStatus(t.key)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                filterStatus === t.key
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dispute notice */}
      {disputed > 0 && (
        <div className="mx-6 mt-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
          You have {disputed} disputed payment{disputed > 1 ? 's' : ''} that need{disputed === 1 ? 's' : ''} your attention.{' '}
          <button className="text-green-600 font-semibold hover:underline">View disputed payments</button>
        </div>
      )}

      {/* Filter chips + Export */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['Amount', 'Email', 'Date', 'Status', 'Payment method'].map(f => (
            <button key={f} className="px-3 py-1 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
              {f}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors shrink-0">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-white">
              <th className="text-left px-6 py-2.5 text-xs font-black text-gray-600">Date</th>
              <th className="text-left px-4 py-2.5 text-xs font-black text-gray-600">Status</th>
              <th className="text-left px-4 py-2.5 text-xs font-black text-gray-600">From</th>
              <th className="text-left px-4 py-2.5 text-xs font-black text-gray-600">Method</th>
              <th className="text-right px-6 py-2.5 text-xs font-black text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                  No payments found
                </td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {fmtDate(c.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                    {c.customer_email || c.description || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {PAYMENT_METHOD_LABEL[c.payment_method_type || ''] || 'Mobile Money'}
                  </td>
                  <td className="px-6 py-3 text-right whitespace-nowrap">
                    <span className="font-bold text-gray-900">{fmtAmt(c.amount)}</span>
                    {' '}
                    <span className="text-xs text-gray-400">{c.currency || 'ZMW'}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 bg-gray-50/40 border-t border-gray-100 flex items-center justify-between">
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
        <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
          Powered by FlapaPay Connect
        </span>
      </div>
    </div>
  );
}

function ErrorCard({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-6 flex items-center gap-3 text-red-600">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium">{msg}</span>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="px-6 py-5"><div className="h-7 bg-gray-100 rounded w-28" /></div>
      <div className="grid grid-cols-2 gap-3 px-6 pb-4">
        <div className="h-20 bg-gray-50 rounded-xl border border-gray-100" />
        <div className="h-20 bg-gray-50 rounded-xl border border-gray-100" />
      </div>
      <div className="px-6 pb-3 border-b border-gray-100">
        <div className="h-5 bg-gray-100 rounded w-36 mb-3" />
        <div className="flex gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-4 bg-gray-100 rounded w-16" />)}
        </div>
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-6 px-6 py-3.5 border-b border-gray-50">
          <div className="h-3.5 bg-gray-100 rounded w-28" />
          <div className="h-5 bg-gray-100 rounded w-16" />
          <div className="h-3.5 bg-gray-100 rounded w-32 flex-1" />
          <div className="h-3.5 bg-gray-100 rounded w-20" />
          <div className="h-3.5 bg-gray-100 rounded w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}
