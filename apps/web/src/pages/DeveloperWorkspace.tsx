import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/axios';
import { useEnvironment } from '../contexts/EnvironmentContext';

/*
 * Visual direction: FlapaPay Developers Console.
 * Reference-informed layout: compact dark navigation rail, restrained typography,
 * elevated credential panels, clear environment status, and warm orange accents.
 */

type Section = 'api-keys' | 'activity' | 'environments';

type ApiKey = {
    key_type: string;
    key_value: string;
    is_active: boolean;
    created_at?: string;
};

type ApiKeysResponse = {
    environment?: { id: string; name: string; kind: 'live' | 'sandbox'; complianceStatus?: string; isLiveEnabled?: boolean };
    keys?: ApiKey[];
    canManageKeys?: boolean;
    canReadKeys?: boolean;
};

const sectionFromPath = (pathname: string): Section => {
    if (pathname.includes('/activity')) return 'activity';
    if (pathname.includes('/environments')) return 'environments';
    return 'api-keys';
};

const Icon = ({ name, className = 'h-4 w-4' }: { name: string; className?: string }) => {
    const common = { className, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    const paths: Record<string, React.ReactNode> = {
        grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
        card: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></>,
        users: <><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20"/><circle cx="9.5" cy="7" r="3"/><path d="M18 8a3 3 0 0 1 0 6M21 20v-1.5a4 4 0 0 0-3-3.87"/></>,
        wallet: <><path d="M20 7V6a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v8a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7"/><path d="M16 14h2"/></>,
        key: <><circle cx="7.5" cy="15.5" r="4.5"/><path d="m11 12 7-7 3 3-7 7M18 5l2 2M15 8l2 2"/></>,
        pulse: <><path d="M3 12h3l2-5 4 10 2-5h7"/></>,
        code: <><path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14"/></>,
        layers: <><path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z"/><path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5"/></>,
        chevron: <path d="m9 18 6-6-6-6"/>,
        search: <><circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2"/></>,
        book: <><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5V4.5Z"/><path d="M4 18a2.5 2.5 0 0 1 2.5-2.5H20"/></>,
        copy: <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
        check: <path d="m5 12 4 4L19 6"/>,
        eye: <><path d="M2 12s3.4-6 10-6 10 6 10 6-3.4 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
        shield: <><path d="M12 3 4.5 6v5.5c0 4.7 3.2 8.1 7.5 9.5 4.3-1.4 7.5-4.8 7.5-9.5V6L12 3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></>,
        plus: <path d="M12 5v14M5 12h14"/>,
        lock: <><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
        external: <><path d="M14 3h7v7M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></>,
    };
    return <svg {...common}>{paths[name]}</svg>;
};

const labelForKey = (type: string) => type.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());

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
        setNotice(null);
        try {
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
            setNotice(`${isSandbox ? 'Sandbox' : 'Live'} key pair rotated successfully.`);
        } catch (error: any) {
            setNotice(error.response?.data?.error || 'Unable to rotate keys.');
        }
    };

    const copyKey = async (key: ApiKey) => {
        try {
            await navigator.clipboard?.writeText(key.key_value);
            setCopied(key.key_value);
            setNotice(`${labelForKey(key.key_type)} copied to clipboard.`);
            window.setTimeout(() => setCopied(null), 1600);
        } catch {
            setNotice('Copy is unavailable in this browser.');
        }
    };

    const developerItems: Array<{ id: Section; label: string; icon: string; route: string }> = [
        { id: 'api-keys', label: 'API keys', icon: 'key', route: '/developers/api-keys' },
        { id: 'activity', label: 'Activity', icon: 'pulse', route: '/developers/activity' },
        { id: 'environments', label: 'Environments', icon: 'layers', route: '/developers/environments' },
    ];
    const keys = keysResponse?.keys || [];
    const publicKeys = keys.filter(key => key.key_type.includes('public'));
    const secretKeys = keys.filter(key => key.key_type.includes('secret') || !key.key_type.includes('public'));
    const liveReady = activeEnvironment?.complianceStatus === 'ACTIVE' && activeEnvironment?.isLiveEnabled === true;

    const NavItem = ({ label, icon, active, onClick }: { label: string; icon: string; active?: boolean; onClick: () => void }) => (
        <button onClick={onClick} className={`group flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] transition ${active ? 'bg-orange-400/12 text-white shadow-[inset_2px_0_0_#ff9c26]' : 'text-[#8491a9] hover:bg-white/[0.045] hover:text-[#dde4f2]'}`}>
            <Icon name={icon} className={`h-[17px] w-[17px] shrink-0 ${active ? 'text-orange-300' : 'text-[#66748d] group-hover:text-[#c2cfdf]'}`} />
            <span className="flex-1">{label}</span>
            {active && <span className="h-1.5 w-1.5 rounded-full bg-orange-300" />}
        </button>
    );

    const KeyRow = ({ keyItem, secret }: { keyItem: ApiKey; secret?: boolean }) => {
        const isVisible = revealed[keyItem.key_value] === true;
        const displayValue = secret && !isVisible
            ? `${keyItem.key_value.slice(0, Math.min(8, keyItem.key_value.length))}••••••••••••••••`
            : keyItem.key_value;
        return (
            <div className="border-b border-white/[0.055] p-5 last:border-b-0 sm:p-6">
                <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-medium text-[#e0e8f4]">{labelForKey(keyItem.key_type)}</p>
                        <p className="mt-1 text-[10px] text-[#7787a3]">
                            {keyItem.created_at ? `Created ${new Date(keyItem.created_at).toLocaleDateString()}` : 'Created just now'} · {secret ? 'Server-side only' : 'Safe for client-side use'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="rounded-md bg-white/[0.06] px-2 py-1 text-[10px] font-medium text-[#9ba9c1]">{secret ? 'secret' : 'publishable'}</span>
                        {secret && <button onClick={() => setRevealed(current => ({ ...current, [keyItem.key_value]: !isVisible }))} className="rounded-md px-1.5 py-1 text-[11px] text-orange-200 transition hover:bg-orange-400/10 hover:text-white">{isVisible ? 'Hide' : 'Reveal'}</button>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-lg border border-white/[0.075] bg-[#111a2d] px-3 py-2.5 font-mono text-xs text-[#b5c1d6]">{displayValue}</code>
                    <button onClick={() => void copyKey(keyItem)} aria-label={`Copy ${labelForKey(keyItem.key_type)}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/[0.08] text-[#8290aa] transition hover:border-white/20 hover:text-white">
                        <Icon name={copied === keyItem.key_value ? 'check' : 'copy'} className={`h-3.5 w-3.5 ${copied === keyItem.key_value ? 'text-emerald-300' : ''}`} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#070b17] font-sans text-[#dce5f2] selection:bg-orange-400/30">
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-[244px] flex-col border-r border-white/[0.07] bg-[#090f1d] lg:flex">
                <div className="flex h-[72px] items-center gap-3 px-5">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-orange-300 to-orange-600 text-sm font-black text-[#241104] shadow-[0_8px_24px_rgba(255,132,28,.22)]">F</div>
                    <div><p className="text-sm font-semibold tracking-[-.025em] text-white">FlapaPay</p><p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[.16em] text-[#66748d]">Developer console</p></div>
                </div>
                <div className="flex-1 overflow-y-auto px-3 pb-5 pt-2">
                    <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.15em] text-[#52617c]">Workspace</p>
                    <nav className="space-y-1">
                        <NavItem label="Overview" icon="grid" onClick={() => setNotice('Use the main merchant dashboard for operational overview.')} />
                        <NavItem label="Payments" icon="card" onClick={() => setNotice('Use the main merchant dashboard for payments.')} />
                        <NavItem label="Customers" icon="users" onClick={() => setNotice('Use the main merchant dashboard for customers.')} />
                        <NavItem label="Balances" icon="wallet" onClick={() => setNotice('Use the main merchant dashboard for balances.')} />
                    </nav>
                    <div className="my-6 h-px bg-white/[0.06]" />
                    <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.15em] text-[#52617c]">Developers</p>
                    <nav className="space-y-1">{developerItems.map(item => <NavItem key={item.id} label={item.label} icon={item.icon} active={section === item.id} onClick={() => navigate(item.route)} />)}</nav>
                    <button onClick={() => setNotice('The API reference remains available at flapapay.com/developers.')} className="mt-6 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] text-[#8491a9] transition hover:bg-white/[0.045] hover:text-white"><Icon name="book" className="h-4 w-4" />API reference <Icon name="external" className="ml-auto h-3.5 w-3.5" /></button>
                </div>
                <div className="border-t border-white/[0.07] p-3">
                    <button onClick={() => setNotice('Account controls are available in Settings.')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/[0.045]"><div className="grid h-8 w-8 place-items-center rounded-full border border-[#3b4770] bg-[#1a2440] text-[10px] font-semibold text-[#bdc8df]">FP</div><div className="min-w-0"><p className="truncate text-xs font-medium text-[#dce5f2]">Merchant workspace</p><p className="mt-0.5 text-[10px] text-[#61708b]">Settings & access</p></div></button>
                </div>
            </aside>

            <main className="min-h-screen lg:ml-[244px]">
                <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-white/[0.07] bg-[#070b17]/90 px-5 backdrop-blur-xl lg:px-9">
                    <div className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-orange-400/10 text-orange-300 lg:hidden">F</div><div className="hidden items-center gap-2 text-sm text-[#697790] sm:flex"><span>Developers</span><Icon name="chevron" className="h-3.5 w-3.5"/><span className="text-[#e7ebf4]">{section === 'api-keys' ? 'API keys' : section === 'activity' ? 'Activity' : 'Environments'}</span></div><span className="text-sm font-medium text-white sm:hidden">Developers</span></div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setNotice('Search is available from the primary merchant dashboard.')} className="hidden items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-[#8e9bb5] transition hover:border-white/20 hover:text-white sm:flex"><Icon name="search" className="h-3.5 w-3.5"/>Search <span className="text-[#52617c]">⌘K</span></button>
                        <div className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${isSandbox ? 'border-orange-400/25 bg-orange-400/[0.06] text-orange-100' : 'border-emerald-400/25 bg-emerald-400/[0.06] text-emerald-100'}`}><span className={`h-1.5 w-1.5 rounded-full ${isSandbox ? 'bg-orange-300' : 'bg-emerald-300'}`} /><select aria-label="Select environment" value={activeEnvironment?.id || ''} onChange={event => void changeEnvironment(event.target.value)} className="max-w-[124px] appearance-none bg-transparent text-xs font-medium outline-none"><option value="">Select environment</option>{environments.map(environment => <option key={environment.id} value={environment.id} className="bg-[#111a2d] text-white">{environment.kind === 'sandbox' ? 'Sandbox' : 'Live'}</option>)}</select></div>
                        <button onClick={() => setNotice('Developer help is available in the API reference.')} className="grid h-8 w-8 place-items-center rounded-lg text-[#8491a9] transition hover:bg-white/[0.05] hover:text-white"><Icon name="book" className="h-4 w-4" /></button>
                    </div>
                </header>

                <div className="mx-auto max-w-[1180px] px-5 py-7 lg:px-9 lg:py-8">
                    <div className={`mb-7 flex items-center justify-between rounded-xl border px-4 py-3 text-xs ${isSandbox ? 'border-orange-400/20 bg-orange-400/[0.05] text-orange-100' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-100'}`}><span><strong className="font-semibold">{isSandbox ? 'Sandbox environment' : 'Live environment'}</strong><span className="ml-2 text-white/50">{isSandbox ? 'Simulated transactions only. No real money moves.' : 'Production mode. Real payment rails require provider approval.'}</span></span><button onClick={() => navigate('/developers/environments')} className="font-medium underline underline-offset-4">Manage</button></div>

                    {(notice || environmentError) && <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-orange-400/20 bg-orange-400/[0.08] px-4 py-3 text-sm text-orange-100"><span>{notice || environmentError}</span><button onClick={() => setNotice(null)} className="text-orange-200 hover:text-white">×</button></div>}

                    {section === 'api-keys' && <div>
                        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[.16em] text-[#697792]">Developers</p><h1 className="text-[30px] font-semibold tracking-[-.04em] text-white">API keys</h1><p className="mt-2 max-w-2xl text-sm text-[#7f8ca5]">Create and manage credentials scoped to your <span className="text-[#f6b56a]">{environmentName}</span> workspace.</p></div>{keysResponse?.canManageKeys && <button onClick={() => void rotateKeys()} className="inline-flex h-10 items-center justify-center rounded-xl bg-[#ee7f20] px-4 text-xs font-semibold text-[#210d00] shadow-[0_8px_24px_rgba(238,127,32,.22)] transition hover:bg-[#f59e42] active:scale-[.97]"><Icon name="plus" className="mr-2 h-4 w-4"/>Rotate key pair</button>}</div>

                        <div className="rounded-2xl border border-orange-400/25 bg-[radial-gradient(circle_at_80%_0%,rgba(238,127,32,.17),transparent_38%),#0e1526] p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-400/15 text-orange-200"><Icon name="key" className="h-5 w-5" /></div><div className="flex-1"><p className="text-sm font-medium text-white">Your keys are scoped to <span className="text-[#f6b56a]">{environmentName}</span></p><p className="mt-1 text-xs text-[#7886a0]">Requests made with these keys can only access resources in the selected environment.</p></div><span className="w-fit rounded-md bg-emerald-400/10 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-300"><Icon name="shield" className="mr-1 inline h-3 w-3"/>Environment scoped</span></div></div>

                        {!isSandbox && !liveReady && <div className="mt-5 flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5"><div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-400/10 text-amber-200"><Icon name="lock" className="h-4 w-4" /></div><div className="flex-1"><p className="text-sm font-medium text-amber-100">Live access is waiting for compliance approval.</p><p className="mt-1 text-xs text-amber-100/60">Complete merchant verification before rotating or using Live credentials.</p></div><button onClick={() => setNotice('Open Merchant Compliance to complete verification.')} className="rounded-lg border border-amber-300/20 px-3 py-2 text-[11px] font-medium text-amber-100 hover:bg-amber-400/10">Review compliance</button></div>}

                        <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0e1526]"><div className="border-b border-white/[0.07] p-5 sm:p-6"><p className="text-sm font-medium text-white">Active keys</p><p className="mt-1 text-xs text-[#75829c]">Use publishable keys in client-side code. Keep secret keys on your server.</p></div>{loading ? <div className="p-8 text-sm text-[#7d8ca6]">Loading keys…</div> : keys.length === 0 ? <div className="p-8 text-sm text-[#7d8ca6]">No credentials are assigned to this environment yet.</div> : <div>{publicKeys.map(key => <KeyRow key={key.key_value} keyItem={key} />)}{secretKeys.map(key => <KeyRow key={key.key_value} keyItem={key} secret />)}</div>}<div className="flex items-center justify-between border-t border-white/[0.07] p-4 text-[11px]"><span className="text-[#697791]">Need to rotate a key? Generate a new environment-scoped pair.</span>{keysResponse?.canManageKeys && <button onClick={() => void rotateKeys()} className="font-medium text-rose-300 hover:text-rose-200">Rotate credentials</button>}</div></div>
                    </div>}

                    {section === 'activity' && <div><div className="mb-8"><p className="mb-2 text-[11px] font-semibold uppercase tracking-[.16em] text-[#697792]">Developers / Logs</p><h1 className="text-[30px] font-semibold tracking-[-.04em] text-white">Activity</h1><p className="mt-2 text-sm text-[#7f8ca5]">An append-only record of events in the selected environment.</p></div><div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0e1526]">{loading ? <div className="p-8 text-sm text-[#7d8ca6]">Loading activity…</div> : activity.length === 0 ? <div className="p-10 text-center text-sm text-[#7d8ca6]">No events have been recorded in this environment yet.</div> : activity.map(item => <div key={item.id} className="flex items-center gap-4 border-b border-white/[0.055] px-5 py-4 last:border-b-0 sm:px-6"><div className="grid h-9 w-9 place-items-center rounded-lg bg-orange-400/10 text-orange-200"><Icon name="pulse" className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-[#e0e8f4]">{item.action || item.activity_type || 'Environment event'}</p><p className="mt-1 text-xs text-[#7787a3]">{item.resource_type || 'Developer workspace'} {item.outcome ? `· ${item.outcome}` : ''}</p></div><time className="shrink-0 text-[10px] text-[#65748e]">{item.created_at ? new Date(item.created_at).toLocaleString() : 'Just now'}</time></div>)}</div></div>}

                    {section === 'environments' && <div><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[.16em] text-[#697792]">Platform controls</p><h1 className="text-[30px] font-semibold tracking-[-.04em] text-white">Environments</h1><p className="mt-2 max-w-2xl text-sm text-[#7f8ca5]">Separate sandbox testing from live processing with environment-scoped keys, activity, and compliance.</p></div><span className="rounded-lg border border-white/[0.08] px-3 py-2 text-[11px] text-[#8e9bb5]">{environments.length} provisioned</span></div><div className="grid gap-4 lg:grid-cols-2">{environments.map(environment => { const selected = environment.id === activeEnvironment?.id; const blocked = environment.kind === 'live' && !(environment.complianceStatus === 'ACTIVE' && environment.isLiveEnabled); return <div key={environment.id} className={`rounded-2xl border bg-[#0e1526] p-5 transition ${selected ? 'border-orange-400/45 shadow-[inset_2px_0_0_#ee7f20]' : 'border-white/[0.07] hover:border-white/[0.13]'}`}><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className={`grid h-10 w-10 place-items-center rounded-xl ${environment.kind === 'sandbox' ? 'bg-orange-400/10 text-orange-200' : 'bg-emerald-400/10 text-emerald-200'}`}><Icon name="layers" className="h-5 w-5" /></div><div><p className="text-sm font-medium text-white">{environment.name}</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-[.14em] text-[#7886a0]">{environment.kind}</p></div></div><span className={`rounded-md px-2 py-1 text-[10px] font-medium ${environment.status === 'active' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/[0.06] text-[#8d9bb3]'}`}>{environment.status}</span></div><div className="mt-5 space-y-3 border-t border-white/[0.06] pt-4 text-xs"><div className="flex justify-between text-[#7886a0]"><span>Processing</span><span className="text-[#dbe4f2]">{environment.kind === 'sandbox' ? 'Simulated transactions' : 'Real payment rails'}</span></div><div className="flex justify-between text-[#7886a0]"><span>Credentials</span><span className="text-[#dbe4f2]">Environment scoped</span></div><div className="flex justify-between text-[#7886a0]"><span>Live access</span><span className={blocked ? 'text-amber-200' : 'text-emerald-300'}>{blocked ? 'Approval required' : 'Ready'}</span></div></div><button disabled={selected} onClick={() => void changeEnvironment(environment.id)} className="mt-5 rounded-lg border border-white/[0.09] px-3 py-2 text-[11px] font-medium text-[#c5d0df] transition hover:border-orange-300/40 hover:bg-orange-400/10 hover:text-white disabled:cursor-default disabled:opacity-40">{selected ? 'Selected environment' : 'Use environment'}</button></div>; })}</div></div>}
                </div>
            </main>
        </div>
    );
};
