import React, { useEffect, useState } from 'react';
import { useFlapaConnect } from '../FlapaConnectProvider';
import { TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

interface BalancesData {
  id: string;
  business_name: string;
  kyc_status: string;
  status: string;
  balance: { available: number; pending: number };
}

interface ConnectBalancesProps {
  onLoadError?: (error: Error) => void;
  onLoaderStart?: () => void;
}

const fmtAmt = (n: number) =>
  (n / 100).toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function ConnectBalances({ onLoadError, onLoaderStart }: ConnectBalancesProps) {
  const { portalFetch, loading: ctxLoading, error: ctxError } = useFlapaConnect();
  const [data, setData] = useState<BalancesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ctxLoading) return;
    if (ctxError) { setLoading(false); setError(ctxError); return; }
    onLoaderStart?.();
    portalFetch('/v1/connect/portal/me')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); onLoadError?.(e); });
  }, [ctxLoading, ctxError]);

  if (loading || ctxLoading) return <BalanceSkeleton />;

  if (error) return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-6 flex items-center gap-3 text-red-600">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium">{error}</span>
    </div>
  );

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4"
      style={{ borderRadius: 'var(--flapa-radius, 1rem)', fontFamily: 'var(--flapa-font-family, inherit)' }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Account Balance</p>
          <p className="text-lg font-black text-gray-900 mt-0.5">{data?.business_name}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          data?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>{data?.status}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-orange-50">
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-1">Available</p>
          <p className="text-3xl font-black text-gray-900">
            <span className="text-base font-bold text-gray-400 mr-1">ZMW</span>
            {fmtAmt(data?.balance.available || 0)}
          </p>
          <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Ready to pay out
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-gray-50">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Pending</p>
          <p className="text-3xl font-black text-gray-500">
            <span className="text-base font-bold text-gray-300 mr-1">ZMW</span>
            {fmtAmt(data?.balance.pending || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">In settlement</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
          data?.kyc_status === 'APPROVED' ? 'bg-green-100 text-green-600' :
          data?.kyc_status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
        }`}>KYC: {data?.kyc_status}</span>
        <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Powered by FlapaPay Connect</span>
      </div>
    </div>
  );
}

function BalanceSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4 animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-32"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 bg-orange-50 rounded-2xl"></div>
        <div className="h-24 bg-gray-50 rounded-2xl"></div>
      </div>
    </div>
  );
}
