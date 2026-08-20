import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { api } from '../lib/axios';
import { useEnvironment } from '../contexts/EnvironmentContext';

type Section = 'api-keys' | 'activity' | 'environments';

type ApiKeysResponse = {
    environment?: { id: string; name: string; kind: 'live' | 'sandbox'; complianceStatus?: string; isLiveEnabled?: boolean };
    keys?: Array<{ key_type: string; key_value: string; is_active: boolean; created_at: string }>;
    test?: { public: string; secret: string };
    live?: { public: string; secret: string };
    canManageKeys?: boolean;
    canReadKeys?: boolean;
};

const sectionFromPath = (pathname: string): Section => {
    if (pathname.includes('activity')) return 'activity';
    if (pathname.includes('environments')) return 'environments';
    return 'api-keys';
};

export const DeveloperWorkspace: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { activeEnvironment, environments, selectEnvironment, error: environmentError } = useEnvironment();
    const [keys, setKeys] = useState<ApiKeysResponse | null>(null);
    const [activity, setActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const section = useMemo(() => sectionFromPath(location), [location]);

    useEffect(() => {
        if (section === 'api-keys') {
            setLoading(true);
            api.get('/merchants/keys')
                .then(response => setKeys(response.data))
                .catch(error => setNotice(error.response?.data?.error || 'Unable to load API keys'))
                .finally(() => setLoading(false));
        }
        if (section === 'activity') {
            setLoading(true);
            api.get('/merchant/environment-activity')
                .then(response => setActivity(response.data?.items || []))
                .catch(error => setNotice(error.response?.data?.error || 'Unable to load activity'))
                .finally(() => setLoading(false));
        }
    }, [section, activeEnvironment?.id]);

    const changeEnvironment = async (id: string) => {
        setNotice(null);
        try {
            await selectEnvironment(id);
        } catch (error: any) {
            setNotice(error.response?.data?.error || 'This environment is not available yet.');
        }
    };

    const rotateKeys = async () => {
        setNotice(null);
        try {
            const mode = activeEnvironment?.kind === 'sandbox' ? 'test' : 'live';
            const response = await api.post('/merchants/keys/roll', { keyType: mode });
            setKeys(response.data);
            setNotice(`${activeEnvironment?.kind === 'sandbox' ? 'Sandbox' : 'Live'} keys rotated successfully.`);
        } catch (error: any) {
            setNotice(error.response?.data?.error || 'Unable to rotate keys');
        }
    };

    const currentKeys = keys?.keys || [];
    const complianceReady = activeEnvironment?.kind === 'sandbox' || (
        activeEnvironment?.complianceStatus === 'ACTIVE' && activeEnvironment?.isLiveEnabled === true
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] text-gray-900">
            <Sidebar />
            <main className="md:ml-72 min-h-screen">
                <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
                    <div className="flex flex-col gap-6 border-b border-gray-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Developers workspace</p>
                            <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-950">Build with confidence.</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-500">Manage credentials, inspect environment activity, and keep Live and Sandbox workspaces separate.</p>
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                            <span className={`h-2 w-2 rounded-full ${activeEnvironment?.kind === 'sandbox' ? 'bg-orange-500' : 'bg-amber-500'}`} />
                            <span className="text-xs font-black uppercase tracking-[0.14em]">{activeEnvironment?.kind === 'sandbox' ? 'Sandbox' : 'Live'}</span>
                            <select value={activeEnvironment?.id || ''} onChange={event => changeEnvironment(event.target.value)} className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-bold outline-none focus:border-orange-300">
                                {environments.map(environment => <option key={environment.id} value={environment.id}>{environment.kind === 'sandbox' ? 'Sandbox' : 'Live'}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
                        <aside className="rounded-3xl border border-gray-200 bg-white p-3 shadow-sm">
                            <p className="px-3 pb-3 pt-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Developers</p>
                            {[
                                ['api-keys', 'API Keys'],
                                ['activity', 'Activity'],
                                ['environments', 'Environments'],
                            ].map(([id, label]) => (
                                <button key={id} onClick={() => navigate(`/developers/${id}`)} className={`mb-1 flex w-full items-center rounded-2xl px-3 py-3 text-left text-xs font-black transition ${section === id ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                                    {label}
                                    {section === id && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-orange-500" />}
                                </button>
                            ))}
                            <button onClick={() => navigate('/developers')} className="mt-5 w-full rounded-2xl border border-gray-100 px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 transition hover:border-orange-200 hover:text-orange-500">API reference →</button>
                        </aside>

                        <section className="min-w-0">
                            {(notice || environmentError) && <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700">{notice || environmentError}</div>}
                            {section === 'api-keys' && (
                                <div className="space-y-6">
                                    <div className="flex items-end justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{activeEnvironment?.kind === 'sandbox' ? 'Sandbox' : 'Live'} credentials</p><h2 className="mt-2 text-2xl font-black">API Keys</h2></div>{keys?.canManageKeys && <button onClick={rotateKeys} className="rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600">Rotate keys</button>}</div>
                                    {!complianceReady && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="font-black text-amber-900">Live access is waiting for compliance approval.</p><p className="mt-1 text-sm text-amber-800">Complete merchant verification and wait for approval before using Live credentials.</p><button onClick={() => navigate('/merchant/compliance-requirements')} className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-white">Review compliance</button></div>}
                                    <div className="grid gap-4 md:grid-cols-2">{(loading ? [] : currentKeys).map(key => <div key={key.key_type + key.key_value} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{key.key_type.replace('_', ' ')}</span><span className="text-[10px] font-black text-emerald-600">{key.is_active ? 'Active' : 'Revoked'}</span></div><code className="mt-5 block truncate rounded-xl bg-gray-950 px-3 py-3 text-xs text-orange-300">{key.key_value}</code><p className="mt-3 text-[10px] text-gray-400">Created {new Date(key.created_at).toLocaleString()}</p></div>)}</div>
                                    {!loading && currentKeys.length === 0 && <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">No keys are assigned to this environment yet.</div>}
                                </div>
                            )}
                            {section === 'activity' && <div><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Environment audit trail</p><h2 className="mt-2 text-2xl font-black">Activity</h2><div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="divide-y divide-gray-100">{loading ? <div className="p-8 text-sm text-gray-400">Loading activity…</div> : activity.length === 0 ? <div className="p-8 text-sm text-gray-500">No activity recorded in this environment yet.</div> : activity.map(item => <div key={item.id} className="flex items-center justify-between gap-4 p-5"><div><p className="text-sm font-black text-gray-900">{item.action || item.activity_type}</p><p className="mt-1 text-xs text-gray-500">{item.resource_type || 'Environment'} {item.outcome ? `· ${item.outcome}` : ''}</p></div><time className="shrink-0 text-[10px] font-bold text-gray-400">{new Date(item.created_at).toLocaleString()}</time></div>)}</div></div></div>}
                            {section === 'environments' && <div><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Workspace isolation</p><h2 className="mt-2 text-2xl font-black">Environments</h2><div className="mt-6 grid gap-4 md:grid-cols-2">{environments.map(environment => <div key={environment.id} className={`rounded-2xl border bg-white p-6 shadow-sm ${activeEnvironment?.id === environment.id ? 'border-orange-300 ring-2 ring-orange-50' : 'border-gray-200'}`}><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{environment.kind === 'sandbox' ? 'Sandbox' : 'Live'}</p><h3 className="mt-2 text-lg font-black">{environment.name}</h3></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${environment.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>{environment.status}</span></div><p className="mt-4 text-sm leading-6 text-gray-500">{environment.kind === 'sandbox' ? 'Test integrations and payment flows without touching production funds.' : 'Production credentials and payment rails, available after compliance approval.'}</p><button disabled={activeEnvironment?.id === environment.id} onClick={() => changeEnvironment(environment.id)} className="mt-5 rounded-xl border border-gray-200 px-4 py-2 text-xs font-black text-gray-700 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-default disabled:opacity-40">{activeEnvironment?.id === environment.id ? 'Selected' : 'Use environment'}</button></div>)}</div></div>}
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};
