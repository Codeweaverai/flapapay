import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import { useEnvironment } from '../contexts/EnvironmentContext';

/* White Developers workspace: the primary Sidebar owns Developer child navigation. */
type Section = 'api-keys' | 'activity' | 'environments';
type ApiKey = { key_type: string; key_value: string; is_active: boolean; created_at?: string };
type ApiKeysResponse = { keys?: ApiKey[]; canManageKeys?: boolean; canReadKeys?: boolean };

const sectionFromPath = (pathname: string): Section => {
  if (pathname.includes('/activity')) return 'activity';
  if (pathname.includes('/environments')) return 'environments';
  return 'api-keys';
};

const Icon = ({ children, className = 'h-4 w-4' }: { children: React.ReactNode; className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

const keyLabel = (type: string) => type.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());

export const DeveloperWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeEnvironment, environments, selectEnvironment, error: environmentError } = useEnvironment();
  const [keysResponse, setKeysResponse] = useState<ApiKeysResponse | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const section = useMemo(() => sectionFromPath(location.pathname), [location.pathname]);
  const isSandbox = activeEnvironment?.kind === 'sandbox';
  const environmentName = activeEnvironment?.name || (isSandbox ? 'Sandbox' : 'Live environment');
  const liveReady = activeEnvironment?.complianceStatus === 'ACTIVE' && activeEnvironment?.isLiveEnabled === true;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setNotice(null);
      try {
        if (section === 'api-keys') {
          const response = await api.get('/merchants/keys');
          setKeysResponse(response.data);
        }
        if (section === 'activity') {
          const response = await api.get('/merchant/environment-activity');
          setActivity(response.data?.items || []);
        }
      } catch (error: any) {
        setNotice(error.response?.data?.error || 'Unable to load this environment workspace.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [section, activeEnvironment?.id]);

  const changeEnvironment = async (environmentId: string) => {
    try {
      setNotice(null);
      await selectEnvironment(environmentId);
    } catch (error: any) {
      setNotice(error.response?.data?.error || 'This environment is not available yet.');
    }
  };

  const rotateKeys = async () => {
    try {
      const response = await api.post('/merchants/keys/roll', { keyType: isSandbox ? 'test' : 'live' });
      setKeysResponse(previous => ({ ...previous, ...response.data, keys: response.data?.keys || [] }));
      setRevealed({});
      setNotice(`${isSandbox ? 'Sandbox' : 'Live'} credentials rotated successfully.`);
    } catch (error: any) {
      setNotice(error.response?.data?.error || 'Unable to rotate credentials.');
    }
  };

  const copyKey = async (key: ApiKey) => {
    try {
      await navigator.clipboard?.writeText(key.key_value);
      setCopied(key.key_value);
      setNotice(`${keyLabel(key.key_type)} copied to clipboard.`);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setNotice('Copy is unavailable in this browser.');
    }
  };

  const keys = keysResponse?.keys || [];
  const publicKeys = keys.filter(key => key.key_type.includes('public'));
  const secretKeys = keys.filter(key => key.key_type.includes('secret') || !key.key_type.includes('public'));
  const title = section === 'api-keys' ? 'API keys' : section === 'activity' ? 'Activity' : 'Environments';
  const description = section === 'api-keys'
    ? 'Create and manage credentials scoped to the environment selected in your sidebar.'
    : section === 'activity'
      ? 'A time-ordered record of events generated in your selected environment.'
      : 'Keep sandbox testing separate from Live payment processing, credentials, and compliance.';

  const KeyRow = ({ keyItem, secret }: { keyItem: ApiKey; secret?: boolean }) => {
    const isVisible = revealed[keyItem.key_value] === true;
    const display = secret && !isVisible ? `${keyItem.key_value.slice(0, Math.min(8, keyItem.key_value.length))}••••••••••••••••` : keyItem.key_value;
    return <div className="border-b border-gray-100 px-5 py-5 last:border-b-0 sm:px-6">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div><p className="text-sm font-bold text-gray-900">{keyLabel(keyItem.key_type)}</p><p className="mt-1 text-[11px] text-gray-500">{keyItem.created_at ? `Created ${new Date(keyItem.created_at).toLocaleDateString()}` : 'Created just now'} · {secret ? 'Server-side only' : 'Safe for client-side use'}</p></div>
        <div className="flex items-center gap-2"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.1em] text-gray-500">{secret ? 'secret' : 'publishable'}</span>{secret && <button onClick={() => setRevealed(current => ({ ...current, [keyItem.key_value]: !isVisible }))} className="text-xs font-bold text-orange-600 hover:text-orange-700">{isVisible ? 'Hide' : 'Reveal'}</button>}</div>
      </div>
      <div className="flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded-xl bg-gray-950 px-3.5 py-3 font-mono text-xs text-orange-200">{display}</code><button onClick={() => void copyKey(keyItem)} aria-label={`Copy ${keyLabel(keyItem.key_type)}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"><Icon className={copied === keyItem.key_value ? 'h-4 w-4 text-emerald-600' : 'h-4 w-4'}>{copied === keyItem.key_value ? <path d="m5 12 4 4L19 6"/> : <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>}</Icon></button></div>
    </div>;
  };

  return <div className="min-h-screen bg-white text-gray-900">
    <Sidebar />
    <main className="min-h-screen bg-white md:ml-72">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-gray-100 bg-white/95 px-5 backdrop-blur-xl lg:px-10">
        <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-gray-400">Developers</p><p className="mt-1 text-sm font-bold text-gray-900">{title}</p></div>
        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isSandbox ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}><span className={`h-2 w-2 rounded-full ${isSandbox ? 'bg-orange-500' : 'bg-amber-500'}`} /><select aria-label="Select environment" value={activeEnvironment?.id || ''} onChange={event => void changeEnvironment(event.target.value)} className="max-w-[150px] appearance-none bg-transparent text-xs font-black outline-none"><option value="">Select environment</option>{environments.map(environment => <option key={environment.id} value={environment.id}>{environment.kind === 'sandbox' ? 'Sandbox' : 'Live'}</option>)}</select></div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-9 lg:px-10 lg:py-12">
        <div className={`mb-8 flex flex-col gap-3 rounded-2xl border px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between ${isSandbox ? 'border-orange-200 bg-orange-50 text-orange-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}><div><strong>{isSandbox ? 'Sandbox environment' : 'Live environment'}</strong><span className="ml-2 text-xs opacity-70">{isSandbox ? 'Simulated transactions only. No real money moves.' : 'Production mode. Live payment rails require approval.'}</span></div><button onClick={() => navigate('/developers/environments')} className="text-xs font-black underline underline-offset-4">Manage environments</button></div>
        {(notice || environmentError) && <div className="mb-6 flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800"><span>{notice || environmentError}</span><button onClick={() => setNotice(null)} className="px-2 text-orange-700">×</button></div>}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-orange-500">Developers</p><h1 className="mt-3 text-4xl font-black tracking-[-.045em] text-gray-950">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">{description}</p></div>{section === 'api-keys' && keysResponse?.canManageKeys && <button onClick={() => void rotateKeys()} className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 px-4 text-xs font-black text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 active:scale-[.97]"><Icon className="mr-2 h-4 w-4"><path d="M12 5v14M5 12h14"/></Icon>Rotate key pair</button>}</div>

        {section === 'api-keys' && <div className="space-y-5"><div className="rounded-2xl border border-orange-200 bg-[radial-gradient(circle_at_88%_0%,rgba(251,146,60,.18),transparent_35%),#fff] p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="grid h-11 w-11 place-items-center rounded-xl bg-orange-100 text-orange-600"><Icon className="h-5 w-5"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m11 12 7-7 3 3-7 7M18 5l2 2M15 8l2 2"/></Icon></div><div className="flex-1"><p className="font-black text-gray-900">Your keys are scoped to <span className="text-orange-600">{environmentName}</span></p><p className="mt-1 text-sm text-gray-500">Every request is isolated to the selected environment and its merchant resources.</p></div><span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.1em] text-emerald-700">Environment scoped</span></div></div>
          {!isSandbox && !liveReady && <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center"><div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700"><Icon className="h-5 w-5"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></Icon></div><div className="flex-1"><p className="font-black text-amber-900">Live access is waiting for compliance approval.</p><p className="mt-1 text-sm text-amber-800">Complete merchant verification before rotating or using Live credentials.</p></div><button onClick={() => setNotice('Open Merchant Compliance to complete verification.')} className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-800">Review compliance</button></div>}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="border-b border-gray-100 px-5 py-5 sm:px-6"><p className="font-black text-gray-900">Active keys</p><p className="mt-1 text-sm text-gray-500">Use publishable keys in client-side code. Keep secret keys on your server.</p></div>{loading ? <div className="p-8 text-sm text-gray-500">Loading keys…</div> : keys.length === 0 ? <div className="p-8 text-sm text-gray-500">No credentials are assigned to this environment yet.</div> : <div>{publicKeys.map(key => <KeyRow key={key.key_value} keyItem={key} />)}{secretKeys.map(key => <KeyRow key={key.key_value} keyItem={key} secret />)}</div>}<div className="flex items-center justify-between border-t border-gray-100 px-5 py-4 text-xs sm:px-6"><span className="text-gray-500">Rotate credentials to issue a new key pair for this environment.</span>{keysResponse?.canManageKeys && <button onClick={() => void rotateKeys()} className="font-black text-rose-600 hover:text-rose-700">Rotate credentials</button>}</div></div>
        </div>}

        {section === 'activity' && <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">{loading ? <div className="p-8 text-sm text-gray-500">Loading activity…</div> : activity.length === 0 ? <div className="p-10 text-center text-sm text-gray-500">No events have been recorded in this environment yet.</div> : activity.map(item => <div key={item.id} className="flex items-center gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0 sm:px-6"><div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-600"><Icon className="h-4 w-4"><path d="M3 12h3l2-5 4 10 2-5h7"/></Icon></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-gray-900">{item.action || item.activity_type || 'Environment event'}</p><p className="mt-1 text-xs text-gray-500">{item.resource_type || 'Developer workspace'} {item.outcome ? `· ${item.outcome}` : ''}</p></div><time className="shrink-0 text-[10px] font-bold text-gray-400">{item.created_at ? new Date(item.created_at).toLocaleString() : 'Just now'}</time></div>)}</div>}

        {section === 'environments' && <div className="grid gap-4 lg:grid-cols-2">{environments.map(environment => { const selected = environment.id === activeEnvironment?.id; const blocked = environment.kind === 'live' && !(environment.complianceStatus === 'ACTIVE' && environment.isLiveEnabled); return <div key={environment.id} className={`rounded-2xl border bg-white p-6 shadow-sm ${selected ? 'border-orange-300 ring-2 ring-orange-50' : 'border-gray-200'}`}><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className={`grid h-11 w-11 place-items-center rounded-xl ${environment.kind === 'sandbox' ? 'bg-orange-50 text-orange-600' : 'bg-amber-50 text-amber-600'}`}><Icon className="h-5 w-5"><path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z"/><path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5"/></Icon></div><div><p className="font-black text-gray-900">{environment.name}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[.14em] text-gray-400">{environment.kind}</p></div></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${environment.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{environment.status}</span></div><div className="mt-5 space-y-3 border-t border-gray-100 pt-4 text-sm"><div className="flex justify-between text-gray-500"><span>Processing</span><span className="font-bold text-gray-800">{environment.kind === 'sandbox' ? 'Simulated' : 'Live rails'}</span></div><div className="flex justify-between text-gray-500"><span>Credentials</span><span className="font-bold text-gray-800">Environment scoped</span></div><div className="flex justify-between text-gray-500"><span>Live access</span><span className={blocked ? 'font-bold text-amber-700' : 'font-bold text-emerald-700'}>{blocked ? 'Approval required' : 'Ready'}</span></div></div><button disabled={selected} onClick={() => void changeEnvironment(environment.id)} className="mt-5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-default disabled:opacity-40">{selected ? 'Selected environment' : 'Use environment'}</button></div>; })}</div>}
      </div>
    </main>
  </div>;
};
