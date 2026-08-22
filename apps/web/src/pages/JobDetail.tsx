// Job application style: mobile-first bottom-sheet form with real validation, clear progress, and touch-safe controls.
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, LoaderCircle, Send, X } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { api } from '../lib/axios';

interface JobPosting {
    id: number;
    title: string;
    department: string;
    location: string;
    type: string;
    description: string;
    requirements: string[];
    slug: string;
}

interface ApplicationForm {
    fullName: string;
    email: string;
    phone: string;
    portfolioUrl: string;
    coverNote: string;
}

const emptyApplication: ApplicationForm = { fullName: '', email: '', phone: '', portfolioUrl: '', coverNote: '' };

export const JobDetail: React.FC = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState<JobPosting | null>(null);
    const [loading, setLoading] = useState(true);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [form, setForm] = useState<ApplicationForm>(emptyApplication);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await api.get(`/content/jobs/${slug}`);
                setJob(res.data);
            } catch (err) {
                console.error('Failed to fetch job', err);
                navigate('/careers');
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [slug, navigate]);

    useEffect(() => {
        if (!showApplyModal) return;
        const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setShowApplyModal(false); };
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);
        return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKeyDown); };
    }, [showApplyModal]);

    const openApplication = () => {
        setForm(emptyApplication);
        setFormError(null);
        setSubmitted(false);
        setShowApplyModal(true);
    };

    const closeApplication = () => setShowApplyModal(false);

    const updateForm = (field: keyof ApplicationForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!job) return;
        if (form.fullName.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(form.email.trim()) || form.coverNote.trim().length < 20) {
            setFormError('Please provide your name, a valid email, and a short note of at least 20 characters.');
            return;
        }
        setFormError(null);
        setIsSubmitting(true);
        try {
            await api.post(`/content/jobs/${job.id}/applications`, {
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                portfolioUrl: form.portfolioUrl.trim(),
                coverNote: form.coverNote.trim(),
            });
            setSubmitted(true);
        } catch (error: any) {
            setFormError(error?.response?.data?.message || 'We could not submit your application. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="flex min-h-screen items-center justify-center bg-white">Loading...</div>;
    if (!job) return null;

    return (
        <div className="min-h-screen bg-white font-sans">
            <Navbar />
            <main className="mx-auto max-w-4xl px-6 pb-24 pt-28 sm:pt-32">
                <Button variant="ghost" onClick={() => navigate('/careers')} className="mb-8 min-h-11 pl-0 text-gray-700 hover:bg-transparent hover:text-orange-500"><ArrowLeft className="mr-2 h-4 w-4" />Back to Careers</Button>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">{job.department}</p>
                <h1 className="mt-4 text-4xl font-black leading-[1.03] text-gray-900 sm:text-5xl">{job.title}</h1>
                <div className="mt-6 flex flex-wrap gap-x-3 gap-y-1 text-sm font-bold uppercase tracking-wide text-gray-500"><span>{job.location}</span><span className="text-orange-400">•</span><span>{job.type}</span></div>
                <div className="prose prose-lg mt-12 max-w-none text-gray-600 sm:mt-16"><h3 className="text-2xl font-black text-gray-900">About the Role</h3><p>{job.description}</p><h3 className="mt-10 text-2xl font-black text-gray-900">Requirements</h3><ul>{job.requirements?.map((requirement, index) => <li key={index}>{requirement}</li>)}</ul></div>
                <div className="mt-14 border border-orange-100 bg-orange-50/60 p-6 text-center sm:mt-16 sm:p-10"><h3 className="text-2xl font-black text-gray-900">Interested in this role?</h3><p className="mx-auto mt-3 max-w-lg text-gray-600">Share your details and a short note about why this opportunity is right for you.</p><Button size="lg" className="mt-7 min-h-14 w-full rounded-xl bg-black px-8 text-base font-black text-white hover:bg-orange-500 sm:w-auto" onClick={openApplication}>Apply for this role <Send className="ml-2 h-4 w-4" /></Button></div>
            </main>

            {showApplyModal && (
                <div role="dialog" aria-modal="true" aria-labelledby="application-title" className="fixed inset-0 z-[70] flex items-end bg-slate-950/70 p-0 backdrop-blur-sm md:items-center md:justify-center md:p-6" onMouseDown={closeApplication}>
                    <div className="max-h-[92dvh] w-full overflow-hidden rounded-t-[30px] bg-white shadow-[0_-24px_80px_rgba(0,0,0,.38)] md:max-w-2xl md:rounded-[30px]" onMouseDown={(event) => event.stopPropagation()}>
                        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white px-5 py-5 sm:px-7"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">Application</p><h2 id="application-title" className="mt-2 text-xl font-black leading-tight text-gray-900 sm:text-2xl">{submitted ? 'Application recorded' : `Apply for ${job.title}`}</h2></div><button type="button" onClick={closeApplication} aria-label="Close application form" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"><X className="h-5 w-5" /></button></header>
                        <div className="max-h-[calc(92dvh-112px)] overflow-y-auto overscroll-contain px-5 pb-7 pt-5 sm:px-7 sm:pb-8">
                            {submitted ? (
                                <div className="py-8 text-center sm:py-12"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600"><CheckCircle2 className="h-7 w-7" /></div><h3 className="mt-6 text-2xl font-black text-gray-900">Thank you, {form.fullName.split(' ')[0]}.</h3><p className="mx-auto mt-3 max-w-md leading-relaxed text-gray-600">Your application for <strong>{job.title}</strong> has been recorded. The team will be in touch if your experience matches the next stage.</p><Button type="button" onClick={closeApplication} className="mt-8 min-h-12 w-full rounded-xl bg-black font-black text-white hover:bg-orange-500 sm:w-auto sm:px-8">Done</Button></div>
                            ) : (
                                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                                    <p className="text-sm leading-relaxed text-gray-600">Fields marked required help us review your application. You can use your phone keyboard’s appropriate input mode for every field.</p>
                                    {formError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{formError}</div>}
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <label className="block text-sm font-bold text-gray-800">Full name <span className="text-orange-600">*</span><input value={form.fullName} onChange={(event) => updateForm('fullName', event.target.value)} autoComplete="name" autoFocus required className="mt-2 h-14 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10" /></label>
                                        <label className="block text-sm font-bold text-gray-800">Email address <span className="text-orange-600">*</span><input value={form.email} onChange={(event) => updateForm('email', event.target.value)} type="email" autoComplete="email" inputMode="email" required className="mt-2 h-14 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10" /></label>
                                    </div>
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <label className="block text-sm font-bold text-gray-800">Phone number <span className="font-normal text-gray-400">(optional)</span><input value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} type="tel" autoComplete="tel" inputMode="tel" className="mt-2 h-14 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10" /></label>
                                        <label className="block text-sm font-bold text-gray-800">Portfolio or LinkedIn <span className="font-normal text-gray-400">(optional)</span><input value={form.portfolioUrl} onChange={(event) => updateForm('portfolioUrl', event.target.value)} type="url" inputMode="url" placeholder="https://" className="mt-2 h-14 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10" /></label>
                                    </div>
                                    <label className="block text-sm font-bold text-gray-800">Why are you interested? <span className="text-orange-600">*</span><textarea value={form.coverNote} onChange={(event) => updateForm('coverNote', event.target.value)} required minLength={20} rows={5} placeholder="Tell us briefly how your experience could contribute to FlapaPay." className="mt-2 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base leading-relaxed outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10" /></label>
                                    <Button type="submit" disabled={isSubmitting} className="min-h-14 w-full rounded-xl bg-orange-500 text-base font-black text-white hover:bg-orange-600 disabled:cursor-wait disabled:opacity-70">{isSubmitting ? <><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Submitting application</> : <>Submit application <Send className="ml-2 h-4 w-4" /></>}</Button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};
