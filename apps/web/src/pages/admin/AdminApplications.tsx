// Recruiter workspace style: calm high-trust records, compact filters, explicit status ownership, and mobile-safe review controls.
import { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Check, ChevronDown, Clock3, ExternalLink, Mail, MapPin, MessageSquareText, Phone, RefreshCw, Search, UserRound } from 'lucide-react';
import { api } from '../../lib/axios';

type ApplicationStatus = 'submitted' | 'in_review' | 'shortlisted' | 'interview' | 'rejected' | 'hired';

interface Application {
    id: string;
    full_name: string;
    email: string;
    phone?: string | null;
    portfolio_url?: string | null;
    cover_note: string;
    status: ApplicationStatus;
    reviewer_notes?: string | null;
    created_at: string;
    reviewed_at?: string | null;
    job_title: string;
    department?: string | null;
    location?: string | null;
    employment_type?: string | null;
}

const statusOptions: Array<{ value: 'ALL' | ApplicationStatus; label: string }> = [
    { value: 'ALL', label: 'All statuses' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'in_review', label: 'In review' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'interview', label: 'Interview' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'hired', label: 'Hired' },
];

const statusStyles: Record<ApplicationStatus, string> = {
    submitted: 'bg-slate-100 text-slate-700 ring-slate-200',
    in_review: 'bg-amber-50 text-amber-700 ring-amber-200',
    shortlisted: 'bg-blue-50 text-blue-700 ring-blue-200',
    interview: 'bg-violet-50 text-violet-700 ring-violet-200',
    rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
    hired: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

const statusLabel = (status: ApplicationStatus) => status.replace('_', ' ');

export const AdminApplications = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [status, setStatus] = useState<'ALL' | ApplicationStatus>('ALL');
    const [department, setDepartment] = useState('ALL');
    const [query, setQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [draftNotes, setDraftNotes] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);

    const departments = useMemo(() => ['ALL', ...Array.from(new Set(applications.map((application) => application.department).filter(Boolean))).sort() as string[]], [applications]);
    const selectedApplication = applications.find((application) => application.id === selectedId) || null;

    const loadApplications = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (status !== 'ALL') params.set('status', status);
            if (department !== 'ALL') params.set('department', department);
            if (query.trim()) params.set('q', query.trim());
            params.set('limit', '100');
            const response = await api.get(`/admin/recruitment/applications?${params.toString()}`);
            setApplications(response.data.applications || []);
            setTotal(response.data.total || 0);
        } catch (requestError: any) {
            setError(requestError?.response?.data?.error || 'Unable to load candidate applications.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadApplications(); }, [status, department]);

    useEffect(() => {
        const timer = window.setTimeout(() => loadApplications(), 280);
        return () => window.clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        if (selectedApplication) setDraftNotes(selectedApplication.reviewer_notes || '');
    }, [selectedApplication?.id]);

    const updateApplication = async (application: Application, nextStatus: ApplicationStatus, notes = draftNotes) => {
        setSavingId(application.id);
        setError(null);
        try {
            const response = await api.patch(`/admin/recruitment/applications/${application.id}`, { status: nextStatus, reviewerNotes: notes });
            setApplications((current) => current.map((item) => item.id === application.id ? { ...item, ...response.data.application } : item));
        } catch (requestError: any) {
            setError(requestError?.response?.data?.error || 'Unable to update this application.');
        } finally {
            setSavingId(null);
        }
    };

    const openReview = (application: Application) => {
        setSelectedId(application.id);
        setDraftNotes(application.reviewer_notes || '');
    };

    return (
        <div className="space-y-6 font-sans">
            <section className="relative overflow-hidden rounded-[30px] border border-slate-100 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-8 text-white shadow-[0_20px_50px_rgba(15,23,42,.16)] sm:px-8 lg:px-10">
                <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-orange-500/25 blur-3xl" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-orange-200"><BriefcaseBusiness className="h-4 w-4" />Recruitment workspace</div><h2 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">Candidate applications</h2><p className="mt-3 leading-relaxed text-slate-300">Review incoming candidates, document assessment notes, and move each application through the hiring workflow.</p></div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Matching applications</p><p className="mt-1 text-3xl font-black">{total}</p></div>
                </div>
            </section>

            <section className="rounded-[28px] border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
                    <label className="relative block"><span className="sr-only">Search applications</span><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search candidate, email, or role" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" /></label>
                    <label><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value as 'ALL' | ApplicationStatus)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-400">{statusOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
                    <label><span className="sr-only">Filter by department</span><select value={department} onChange={(event) => setDepartment(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-400">{departments.map((value) => <option value={value} key={value}>{value === 'ALL' ? 'All departments' : value}</option>)}</select></label>
                    <button type="button" onClick={loadApplications} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-orange-300 hover:text-orange-600"><RefreshCw className="h-4 w-4" />Refresh</button>
                </div>
            </section>

            {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">{error}</div>}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)]">
                <section className="space-y-3">
                    {loading ? <div className="rounded-[28px] border border-slate-100 bg-white p-12 text-center text-sm font-bold text-slate-500">Loading candidate applications…</div> : applications.length === 0 ? <div className="rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-14 text-center"><UserRound className="mx-auto h-9 w-9 text-slate-300" /><h3 className="mt-4 text-lg font-black text-slate-900">No applications found</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">Try a different filter, or check back after a candidate submits an application.</p></div> : applications.map((application) => <button key={application.id} type="button" onClick={() => openReview(application)} className={`w-full rounded-[24px] border p-5 text-left transition sm:p-6 ${selectedId === application.id ? 'border-orange-300 bg-orange-50/40 shadow-[0_16px_35px_rgba(249,115,22,.08)]' : 'border-slate-100 bg-white shadow-sm hover:border-orange-200 hover:shadow-md'}`}><div className="flex gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">{application.full_name.charAt(0).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="truncate text-base font-black text-slate-900">{application.full_name}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{application.job_title}</p></div><span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ring-1 ${statusStyles[application.status]}`}>{statusLabel(application.status)}</span></div><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-500"><span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{application.email}</span><span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{new Date(application.created_at).toLocaleDateString()}</span>{application.department && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{application.department}</span>}</div></div></div></button>)}</section>

                <aside className="xl:sticky xl:top-6 xl:self-start">
                    {selectedApplication ? <section className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm"><div className="border-b border-slate-100 bg-slate-50/70 p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">Candidate review</p><h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-900">{selectedApplication.full_name}</h3><p className="mt-1 text-sm font-bold text-slate-500">{selectedApplication.job_title}</p></div><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm"><UserRound className="h-5 w-5" /></div></div></div><div className="space-y-6 p-6"><div className="space-y-3 text-sm"><a href={`mailto:${selectedApplication.email}`} className="flex items-center gap-3 font-bold text-slate-700 hover:text-orange-600"><Mail className="h-4 w-4 text-orange-500" />{selectedApplication.email}</a>{selectedApplication.phone && <a href={`tel:${selectedApplication.phone}`} className="flex items-center gap-3 font-bold text-slate-700 hover:text-orange-600"><Phone className="h-4 w-4 text-orange-500" />{selectedApplication.phone}</a>}{selectedApplication.portfolio_url && <a target="_blank" rel="noreferrer" href={selectedApplication.portfolio_url} className="flex items-center gap-3 font-bold text-slate-700 hover:text-orange-600"><ExternalLink className="h-4 w-4 text-orange-500" />Portfolio or LinkedIn</a>}</div><div><p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Candidate note</p><p className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">{selectedApplication.cover_note}</p></div><label className="block"><span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400"><MessageSquareText className="h-3.5 w-3.5" />Internal reviewer notes</span><textarea value={draftNotes} onChange={(event) => setDraftNotes(event.target.value)} rows={5} placeholder="Add private assessment notes for the recruitment team…" className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" /></label><label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Application status</span><div className="relative"><select value={selectedApplication.status} onChange={(event) => updateApplication(selectedApplication, event.target.value as ApplicationStatus)} disabled={savingId === selectedApplication.id} className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-black capitalize text-slate-800 outline-none focus:border-orange-400 disabled:cursor-wait disabled:opacity-60">{statusOptions.filter((option) => option.value !== 'ALL').map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /></div></label><button type="button" disabled={savingId === selectedApplication.id} onClick={() => updateApplication(selectedApplication, selectedApplication.status)} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-orange-500 disabled:cursor-wait disabled:opacity-60">{savingId === selectedApplication.id ? 'Saving review…' : <><Check className="h-4 w-4" />Save review notes</>}</button></div></section> : <section className="rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-center"><BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-300" /><h3 className="mt-4 font-black text-slate-900">Choose a candidate</h3><p className="mt-2 text-sm leading-relaxed text-slate-500">Select an application to review contact details, the candidate note, and internal workflow status.</p></section>}
                </aside>
            </div>
        </div>
    );
};
