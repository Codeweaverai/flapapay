import React, { useEffect, useState } from 'react';
import { useFlapaConnect } from '../FlapaConnectProvider';
import {
  AlertCircle, RefreshCw, Download, X, Landmark, Info,
  CheckCircle2, Zap, Smartphone
} from 'lucide-react';

interface Payout {
  id: string;
  amount: number;
  currency: string;
  direction?: string;
  description?: string;
  status?: string;
  created_at: string;
}

interface PayoutRequest {
  id: string;
  amount: number;
  currency: string;
  status: string;
  note?: string;
  created_at: string;
}

interface PayoutMethod {
  id: string;
  type: 'mobile_money' | 'bank_account';
  details: {
    mobile_network?: string;
    mobile_number?: string;
    bank_name?: string;
    account_number?: string;
    account_holder_name?: string;
    verified?: boolean;
  };
  is_default: boolean;
}

interface BalanceData {
  balance?: { available: number; pending: number };
  currency?: string;
  payout_methods?: PayoutMethod[];
}

interface ConnectPayoutsProps {
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

function payoutMethodLabel(pm: PayoutMethod): string {
  if (pm.type === 'mobile_money') {
    const net = (pm.details.mobile_network || '').toUpperCase();
    const num = pm.details.mobile_number || '';
    return `${net} ••••${num.slice(-4)}`;
  }
  return `${pm.details.bank_name || 'Bank'} ••••${(pm.details.account_number || '').slice(-4)}`;
}

// Status mapping for payout_requests: 'pending' | 'approved' | 'paid' | 'rejected'
const REQ_STATUS_STYLE: Record<string, string> = {
  pending:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-blue-50 text-blue-600 border-blue-200',
  paid:     'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
  completed:'bg-green-50 text-green-700 border-green-200',
};
const REQ_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', approved: 'Approved', paid: 'Paid',
  rejected: 'Rejected', completed: 'Paid',
};

function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${REQ_STATUS_STYLE[s] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
      {REQ_STATUS_LABEL[s] || status}
    </span>
  );
}

// ── Payout Modal ──────────────────────────────────────────────────────────────

function PayoutModal({
  available, currency, defaultMethod, onClose, onSubmit, submitting,
}: {
  available: number;
  currency: string;
  defaultMethod: PayoutMethod | null;
  onClose: () => void;
  onSubmit: (amount: number, type: 'instant' | 'standard') => void;
  submitting: boolean;
}) {
  const [type, setType] = useState<'instant' | 'standard'>('instant');
  const [amount, setAmount] = useState((available / 100).toFixed(2));
  const amtNum = parseFloat(amount) || 0;
  const instFee = type === 'instant' ? Math.round(amtNum * 0.02 * 100) / 100 : 0;

  const nextDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-black text-gray-900">Pay out funds</h3>
              <p className="text-sm text-green-600 mt-0.5">Choose how you want to receive your funds.</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Auto payout notice */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-600 leading-relaxed">
              <span className="font-semibold">Automatic payouts enabled.</span>{' '}
              Your next payout is {nextDate()}. You can start an instant payout to get your money faster.
            </p>
          </div>

          {/* Type selector */}
          <div>
            <p className="text-xs font-black text-gray-700 mb-2">Pay out type</p>
            <div className="space-y-2">
              {(['instant', 'standard'] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${type === t ? 'border-green-500 bg-white' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 ${type === t ? 'border-green-500' : 'border-gray-300'}`}>
                    {type === t && <div className="w-2 h-2 rounded-full bg-green-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 capitalize">{t}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t === 'instant'
                        ? `Up to ${currency} ${fmtAmt(available)} arrives instantly. 2% fee applies.`
                        : 'Arrives in 1–3 business days. No fee.'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Default payout destination */}
          <div>
            <p className="text-xs font-black text-gray-700 mb-2">Pay out to (default)</p>
            {defaultMethod ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-green-500 bg-green-50/20">
                <div className="w-4 h-4 rounded-full border-2 border-green-500 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
                {defaultMethod.type === 'mobile_money'
                  ? <Smartphone className="w-4 h-4 text-gray-500 shrink-0" />
                  : <Landmark className="w-4 h-4 text-gray-500 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{payoutMethodLabel(defaultMethod)}</p>
                  <p className="text-[10px] text-gray-400 capitalize">
                    {defaultMethod.type === 'mobile_money' ? 'Mobile Money' : 'Bank Account'}
                    {' · '}
                    {defaultMethod.type === 'mobile_money' ? 'via PawaPay' : 'via Lenco'}
                    {' · Default'}
                  </p>
                </div>
                {defaultMethod.details.verified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                )}
              </div>
            ) : (
              <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs text-amber-700 font-medium">
                  No payout method on file. Complete onboarding to add one.
                </p>
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <p className="text-xs font-black text-gray-700 mb-2">Amount</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-semibold">{currency}</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                max={available / 100}
                step="0.01"
                className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-xl text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Available: {currency} {fmtAmt(available)}</p>
          </div>

          {/* Fee */}
          {type === 'instant' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-1.5">
                Instant Payout fee (2%)
                <Info className="w-3.5 h-3.5 text-gray-400" />
              </span>
              <span className="font-semibold text-gray-900">{currency} {instFee.toFixed(2)}</span>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={() => onSubmit(amtNum, type)}
            disabled={submitting || amtNum <= 0 || amtNum > available / 100 || !defaultMethod}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all"
          >
            {submitting ? 'Processing…' : `Pay out via ${defaultMethod?.type === 'mobile_money' ? 'PawaPay' : defaultMethod?.type === 'bank_account' ? 'Lenco' : '…'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ConnectPayouts({ onLoadError, onLoaderStart }: ConnectPayoutsProps) {
  const { portalFetch, loading: ctxLoading, error: ctxError } = useFlapaConnect();
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [balance, setBalance] = useState<BalanceData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const load = () => {
    if (ctxLoading) return;
    if (ctxError) { setLoading(false); setError(ctxError); return; }
    onLoaderStart?.();
    Promise.all([
      portalFetch('/v1/connect/portal/payout-requests').then(r => r.json()),
      portalFetch('/v1/connect/portal/me').then(r => r.json()),
    ])
      .then(([reqData, meData]) => {
        setPayoutRequests(reqData.requests || []);
        setBalance(meData);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); onLoadError?.(e); });
  };

  useEffect(() => { load(); }, [ctxLoading, ctxError]);

  const handlePayoutSubmit = async (amount: number, type: 'instant' | 'standard') => {
    setSubmitting(true);
    try {
      const res = await portalFetch('/v1/connect/portal/payout-execute', {
        method: 'POST',
        body: JSON.stringify({ amount, type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Payout failed');
      } else {
        setShowModal(false);
        const provider = data.payout_method === 'mobile_money' ? 'PawaPay' : 'Lenco';
        setSuccessMsg(
          `${type === 'instant' ? 'Instant' : 'Standard'} payout of ZMW ${data.net_amount?.toFixed(2)} submitted via ${provider}. Ref: ${data.reference}`
        );
        setTimeout(() => setSuccessMsg(''), 6000);
        load();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const style: React.CSSProperties = {
    borderRadius: 'var(--flapa-radius, 1rem)',
    fontFamily: 'var(--flapa-font-family, inherit)',
  };

  if (loading || ctxLoading) return <PayoutSkeleton />;
  if (error) return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-6 flex items-center gap-3 text-red-600">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold">{error}</p>
        <button onClick={() => { setError(null); load(); }} className="text-xs text-red-400 underline mt-1">Retry</button>
      </div>
    </div>
  );

  const available = balance?.balance?.available ?? 0;
  const pending = balance?.balance?.pending ?? 0;
  const total = available + pending;
  const currency = balance?.currency || 'ZMW';
  const payoutMethods: PayoutMethod[] = balance?.payout_methods || [];
  const defaultMethod = payoutMethods.find(m => m.is_default) || payoutMethods[0];

  const nextDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  return (
    <>
      {showModal && (
        <PayoutModal
          available={available}
          currency={currency}
          defaultMethod={defaultMethod || null}
          onClose={() => setShowModal(false)}
          onSubmit={handlePayoutSubmit}
          submitting={submitting}
        />
      )}

      <div className="bg-white border border-gray-200 overflow-hidden" style={style}>
        {/* Title */}
        <div className="px-6 pt-5 pb-0">
          <h2 className="text-2xl font-black text-gray-900">Payouts</h2>
        </div>

        {/* Balance header */}
        <div className="px-6 pt-4 pb-5 border-b border-gray-100">
          {successMsg && (
            <div className="mb-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-2.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
            </div>
          )}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-semibold">Total balance</p>
              <p className="text-3xl font-black text-gray-900 mt-1">
                {currency} {fmtAmt(total)}
              </p>
              <div className="flex items-center gap-6 mt-3 flex-wrap">
                <div>
                  <p className="text-xs text-gray-400">Next estimated payout</p>
                  <p className="text-sm font-black text-gray-900 mt-0.5">{currency} {fmtAmt(available)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Scheduled for</p>
                  <p className="text-sm font-black text-gray-900 mt-0.5 flex items-center gap-2">
                    {nextDate()}
                    <button className="text-green-600 text-xs font-semibold hover:underline">Update</button>
                  </p>
                </div>
                {defaultMethod && (
                  <div>
                    <p className="text-xs text-gray-400">Payout to</p>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5 flex items-center gap-1.5">
                      {defaultMethod.type === 'mobile_money'
                        ? <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                        : <Landmark className="w-3.5 h-3.5 text-gray-400" />
                      }
                      {payoutMethodLabel(defaultMethod)}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setShowModal(true)} disabled={available <= 0}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-bold rounded-lg transition-all flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> Pay out
              </button>
              <button className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-lg transition-all">
                See details
              </button>
            </div>
          </div>
        </div>

        {/* Filter chips + Export */}
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-1.5">
            {['Status', 'Amount', 'Method', 'Date'].map(f => (
              <button key={f} className="px-3 py-1 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
                {f}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-2.5 text-xs font-black text-gray-600">Date</th>
                <th className="text-left px-4 py-2.5 text-xs font-black text-gray-600">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-black text-gray-600">Destination</th>
                <th className="text-left px-4 py-2.5 text-xs font-black text-gray-600">Note</th>
                <th className="text-right px-6 py-2.5 text-xs font-black text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payoutRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                    No payout requests yet. Click <strong>Pay out</strong> to request one.
                  </td>
                </tr>
              ) : (
                payoutRequests.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5 text-sm text-gray-700 whitespace-nowrap">
                      {fmtDate(p.created_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">
                      {defaultMethod ? (
                        <span className="flex items-center gap-1.5">
                          {defaultMethod.type === 'mobile_money'
                            ? <Smartphone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            : <Landmark className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          }
                          {payoutMethodLabel(defaultMethod)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400 max-w-[140px] truncate">
                      {p.note || '—'}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <span className="font-bold text-gray-900">{fmtAmt(p.amount)}</span>
                      {' '}
                      <span className="text-xs text-gray-400">{p.currency || 'ZMW'}</span>
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
          <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Powered by FlapaPay Connect</span>
        </div>
      </div>
    </>
  );
}

function PayoutSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="px-6 py-5"><div className="h-7 bg-gray-100 rounded w-24" /></div>
      <div className="px-6 pb-5 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-100 rounded w-40" />
            <div className="flex gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-4 bg-gray-100 rounded w-28" />)}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 bg-gray-100 rounded-lg w-24" />
            <div className="h-9 bg-gray-100 rounded-lg w-24" />
          </div>
        </div>
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-6 px-6 py-3.5 border-b border-gray-50">
          <div className="h-3.5 bg-gray-100 rounded w-28" />
          <div className="h-5 bg-gray-100 rounded w-14" />
          <div className="h-3.5 bg-gray-100 rounded flex-1" />
          <div className="h-3.5 bg-gray-100 rounded w-20" />
        </div>
      ))}
    </div>
  );
}
