import React, { useEffect, useState } from 'react';
import { useFlapaConnect } from '../FlapaConnectProvider';
import {
  AlertTriangle, CheckCircle, Info, X,
  Wallet, Edit2, Loader2, CheckCircle2, ExternalLink,
  Copy, Check, Clock, ShieldCheck, Link2,
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'warning' | 'error' | 'success' | 'info';
  title: string;
  message: string;
}

interface AccountData {
  id: string;
  business_name?: string;
  kyc_status: string;
  status: string;
  balance?: { available: number; pending: number };
  payout_methods?: { id: string; type: string; details: any; is_default: boolean }[];
  onboarding?: { status: string; completed: boolean } | null;
  currency?: string;
}

type ConnectState = 'not_onboarded' | 'pending_review' | 'active' | 'needs_update';

interface ConnectNotificationBannerProps {
  maxVisible?: number;
  onLoadError?: (error: Error) => void;
  onLoaderStart?: () => void;
}

export function ConnectNotificationBanner({
  maxVisible = 5,
  onLoadError,
  onLoaderStart,
}: ConnectNotificationBannerProps) {
  const { portalFetch, loading: ctxLoading, error: ctxError } = useFlapaConnect();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [copied, setCopied] = useState(false);

  // Load /me
  useEffect(() => {
    if (ctxLoading || ctxError) { setLoading(false); return; }
    onLoaderStart?.();
    portalFetch('/v1/connect/portal/me')
      .then(r => r.json())
      .then(data => { setAccount(data); setLoading(false); })
      .catch(e => { setLoading(false); onLoadError?.(e); });
  }, [ctxLoading, ctxError]);

  // Auto-generate onboarding link for sellers who are not yet active
  useEffect(() => {
    if (!account) return;
    const state = resolveState(account);
    if (state === 'not_onboarded' || state === 'needs_update') {
      generateLink();
    }
  }, [account]);

  const generateLink = async () => {
    setLinkLoading(true);
    setLinkError('');
    try {
      const res = await portalFetch('/v1/connect/portal/onboarding_link', {
        method: 'POST',
        body: JSON.stringify({ return_url: window.location.href }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setOnboardingUrl(data.url);
      } else {
        setLinkError(data.error || 'Could not generate link');
      }
    } catch {
      setLinkError('Network error. Please try again.');
    } finally {
      setLinkLoading(false);
    }
  };

  const copyLink = () => {
    if (!onboardingUrl) return;
    navigator.clipboard.writeText(onboardingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || ctxLoading || !account) return null;

  const fmtAmt = (n: number) =>
    (n / 100).toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const currency   = account.currency || 'ZMW';
  const kyc        = account.kyc_status?.toLowerCase();
  const status     = account.status?.toLowerCase();
  const available  = account.balance?.available ?? 0;
  const hasPayouts = (account.payout_methods?.length ?? 0) > 0;
  const connectState = resolveState(account);

  // ── Secondary notifications ──────────────────────────────────────────────
  const notifications: Notification[] = [];
  if (kyc === 'rejected')
    notifications.push({ id: 'kyc_rejected', type: 'error', title: 'KYC Verification Failed',
      message: 'Your documents were rejected. Please update them to continue processing payments.' });
  if (kyc === 'pending' || kyc === 'pending_review')
    notifications.push({ id: 'kyc_pending', type: 'warning', title: 'Verification Under Review',
      message: 'Your documents are being reviewed. Payments may be limited until verification is complete.' });
  if (available > 0)
    notifications.push({ id: 'bal_avail', type: 'info', title: 'Funds Available for Payout',
      message: `You have ${currency} ${fmtAmt(available)} ready to be paid out to your account.` });
  if (!hasPayouts && kyc === 'approved')
    notifications.push({ id: 'no_payout', type: 'warning', title: 'No Payout Method on File',
      message: 'Add a mobile money or bank account to receive your earnings.' });

  const visible = notifications.filter(n => !dismissed.has(n.id)).slice(0, maxVisible);

  const ICONS: Record<string, React.ReactNode> = {
    warning: <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />,
    error:   <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />,
    success: <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />,
    info:    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />,
  };
  const COLORS: Record<string, string> = {
    warning: 'bg-yellow-50 border-yellow-200',
    error:   'bg-red-50 border-red-200',
    success: 'bg-green-50 border-green-200',
    info:    'bg-blue-50 border-blue-200',
  };

  return (
    <div className="space-y-2.5" style={{ fontFamily: 'var(--flapa-font-family, inherit)' }}>

      {/* ── Main Connect Status Card ─────────────────────────────────────── */}

      {/* ACTIVE & VERIFIED */}
      {connectState === 'active' && (
        <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden">
          <div className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base font-black text-green-900">Connected & Active</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-green-700 bg-green-100 border border-green-200 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Verified
                </span>
              </div>
              <p className="text-xs text-green-700 mt-0.5 leading-relaxed">
                {account.business_name
                  ? <><strong>{account.business_name}</strong> is fully onboarded with FlapaPay Connect.</>
                  : <>Your FlapaPay Connect account is fully set up.</>}
                {' '}Payouts are enabled.
              </p>
              <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-green-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> KYC Approved
                </span>
                {hasPayouts && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-green-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Payout Method Linked
                  </span>
                )}
                {available > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {currency} {fmtAmt(available)} Available
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PENDING REVIEW */}
      {connectState === 'pending_review' && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
          <div className="p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shrink-0 shadow-sm">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base font-black text-blue-900">Onboarding Under Review</p>
                <span className="text-[10px] font-black text-blue-600 bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-full">
                  In Review
                </span>
              </div>
              <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                Your FlapaPay Connect application is being reviewed by our team. You'll be notified once it's approved — usually within 1–2 business days.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* NEEDS UPDATE */}
      {connectState === 'needs_update' && (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0 shadow-sm">
                <Edit2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-black text-amber-900">Update Required</p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Your KYC documents were rejected. Please re-submit your documents to restore payouts.
                </p>
              </div>
            </div>
            <LinkBox
              url={onboardingUrl}
              loading={linkLoading}
              error={linkError}
              copied={copied}
              onCopy={copyLink}
              onRetry={generateLink}
              theme="amber"
              label="Re-submit Documents"
            />
          </div>
        </div>
      )}

      {/* NOT ONBOARDED */}
      {connectState === 'not_onboarded' && (
        <div className="rounded-2xl overflow-hidden border border-orange-400 bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 shadow-sm">
          {/* Decorative circles */}
          <div className="absolute pointer-events-none">
            <div className="w-40 h-40 bg-white/5 rounded-full -translate-y-16 translate-x-60" />
          </div>
          <div className="p-5 relative">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-base font-black text-white leading-tight">
                  Connect Your Seller Account
                </p>
                <p className="text-xs text-orange-100 mt-0.5 leading-relaxed">
                  Complete your FlapaPay onboarding to receive payouts directly to your mobile money or bank account.
                </p>
              </div>
            </div>

            {/* What you get */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              {[
                'Mobile Money Payouts',
                'Bank Transfers',
                'Instant Cashout',
              ].map(f => (
                <span key={f} className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-200" /> {f}
                </span>
              ))}
            </div>

            {/* Onboarding link box */}
            <LinkBox
              url={onboardingUrl}
              loading={linkLoading}
              error={linkError}
              copied={copied}
              onCopy={copyLink}
              onRetry={generateLink}
              theme="white"
              label="Start Onboarding"
            />
          </div>
        </div>
      )}

      {/* ── Secondary notification banners ───────────────────────────────── */}
      {visible.map(n => (
        <div key={n.id}
          className={`flex items-start gap-3 p-4 rounded-2xl border ${COLORS[n.type] || COLORS.info}`}>
          {ICONS[n.type] || ICONS.info}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">{n.title}</p>
            <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{n.message}</p>
          </div>
          <button
            onClick={() => setDismissed(d => new Set([...d, n.id]))}
            className="p-1 rounded-lg hover:bg-black/5 text-gray-400 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      <div className="text-right">
        <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
          Powered by FlapaPay Connect
        </span>
      </div>
    </div>
  );
}

// ── Shared onboarding link box ────────────────────────────────────────────────

function LinkBox({
  url, loading, error, copied, onCopy, onRetry, theme, label,
}: {
  url: string | null;
  loading: boolean;
  error: string;
  copied: boolean;
  onCopy: () => void;
  onRetry: () => void;
  theme: 'white' | 'amber';
  label: string;
}) {
  const isWhite = theme === 'white';

  if (loading) {
    return (
      <div className={`rounded-xl px-4 py-3 flex items-center gap-2 ${isWhite ? 'bg-white/20' : 'bg-amber-100 border border-amber-200'}`}>
        <Loader2 className={`w-4 h-4 animate-spin shrink-0 ${isWhite ? 'text-white' : 'text-amber-600'}`} />
        <span className={`text-xs font-semibold ${isWhite ? 'text-orange-100' : 'text-amber-700'}`}>
          Generating your onboarding link…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl px-4 py-3 flex items-center justify-between gap-3 ${isWhite ? 'bg-red-500/20 border border-red-300/30' : 'bg-red-50 border border-red-200'}`}>
        <span className={`text-xs font-semibold ${isWhite ? 'text-red-100' : 'text-red-600'}`}>{error}</span>
        <button onClick={onRetry}
          className={`text-xs font-black px-3 py-1.5 rounded-lg shrink-0 transition-colors ${isWhite ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>
          Retry
        </button>
      </div>
    );
  }

  if (!url) return null;

  return (
    <div className={`rounded-xl overflow-hidden ${isWhite ? 'bg-white/15 border border-white/30' : 'bg-white border border-amber-200'}`}>
      {/* Label row */}
      <div className={`px-3 pt-2.5 pb-1 flex items-center gap-1.5 ${isWhite ? '' : ''}`}>
        <Link2 className={`w-3 h-3 shrink-0 ${isWhite ? 'text-orange-200' : 'text-amber-500'}`} />
        <span className={`text-[10px] font-black uppercase tracking-widest ${isWhite ? 'text-orange-200' : 'text-amber-600'}`}>
          {label} Link
        </span>
      </div>
      {/* URL + actions */}
      <div className="flex items-center gap-0 px-3 pb-3">
        <input
          readOnly
          value={url}
          className={`flex-1 min-w-0 text-[11px] font-mono bg-transparent border-0 outline-none truncate ${isWhite ? 'text-white placeholder-orange-200' : 'text-gray-700'}`}
        />
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <button
            onClick={onCopy}
            title="Copy link"
            className={`p-1.5 rounded-lg transition-colors ${isWhite ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-amber-100 hover:bg-amber-200 text-amber-700'}`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open onboarding form"
            className={`p-1.5 rounded-lg transition-colors ${isWhite ? 'bg-white text-orange-600 hover:bg-orange-50' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
      {/* Share hint */}
      <div className={`px-3 py-2 border-t text-[10px] font-medium ${isWhite ? 'bg-black/10 border-white/20 text-orange-100' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
        Share this link with the seller to complete their onboarding.
      </div>
    </div>
  );
}

// ── State resolver ────────────────────────────────────────────────────────────

function resolveState(account: AccountData): ConnectState {
  const kyc      = account.kyc_status?.toLowerCase();
  const status   = account.status?.toLowerCase();
  const onboarding = account.onboarding;

  if (onboarding?.completed && kyc === 'approved' && status === 'active') return 'active';
  if (onboarding?.completed && (kyc === 'pending' || kyc === 'pending_review'))  return 'pending_review';
  if (onboarding?.completed && kyc === 'rejected') return 'needs_update';
  if (onboarding?.status === 'pending') return 'pending_review';

  // Also treat verified/active accounts without explicit onboarding record as active
  if ((kyc === 'approved' || kyc === 'verified') && (status === 'active' || status === 'ACTIVE')) return 'active';

  return 'not_onboarded';
}
