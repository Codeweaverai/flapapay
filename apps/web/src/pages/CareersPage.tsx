// Careers discovery style: clear role search, compact department chips, and generous mobile touch targets.
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Search, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
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

const benefits = [
    { title: 'Competitive Salary', description: 'Above-market compensation including stock options.', icon: '💰' },
    { title: 'Global Freedom', description: 'Remote-first culture. Work from anywhere you thrive.', icon: '🌍' },
    { title: 'L&D Budget', description: '$2,000 annual budget for your professional growth.', icon: '📚' },
    { title: 'Health & Wellness', description: 'Comprehensive coverage for you and your family.', icon: '🏥' },
    { title: 'Equipment', description: 'The best tools for the job. New MacBook, monitor, etc.', icon: '🖥️' },
    { title: 'Paid Time Off', description: 'Unlimited vacation. We trust you to recharge.', icon: '🏝️' },
];

export const CareersPage: React.FC = () => {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('All departments');

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await api.get('/content/jobs');
                setJobs(res.data);
            } catch (err) {
                console.error('Failed to fetch jobs', err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const uniqueJobs = useMemo(() => {
        const seen = new Set<string>();
        return jobs.filter((job) => {
            const key = [job.title, job.department, job.location, job.type].join('|').toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [jobs]);

    const departments = useMemo(
        () => ['All departments', ...Array.from(new Set(uniqueJobs.map((job) => job.department).filter(Boolean))).sort()],
        [uniqueJobs]
    );

    const filteredJobs = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return uniqueJobs.filter((job) => {
            const matchesDepartment = selectedDepartment === 'All departments' || job.department === selectedDepartment;
            const searchableText = [job.title, job.department, job.location, job.type, job.description].join(' ').toLowerCase();
            return matchesDepartment && (!normalizedQuery || searchableText.includes(normalizedQuery));
        });
    }, [uniqueJobs, query, selectedDepartment]);

    const clearFilters = () => {
        setQuery('');
        setSelectedDepartment('All departments');
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="pt-20">
                <section className="relative overflow-hidden bg-black py-24 text-white lg:py-32">
                    <div className="relative z-10 mx-auto max-w-7xl px-6 text-center lg:px-8">
                        <div className="mb-8 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-yellow-400">Careers at FlapaPay</div>
                        <h1 className="mb-8 text-5xl font-black leading-tight tracking-tight md:text-8xl">Build the infrastructure <br />of a <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">new economy</span>.</h1>
                        <p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-gray-400 md:text-2xl">We're a team of dreamers and builders solving the most fundamental challenges in African commerce. Join us.</p>
                        <Button size="lg" className="min-h-14 rounded-2xl bg-orange-500 px-9 py-5 text-lg font-black text-white shadow-xl shadow-orange-500/20 transition-all active:scale-95 sm:px-12 xl:text-xl" onClick={() => document.getElementById('open-roles')?.scrollIntoView({ behavior: 'smooth' })}>View Open Roles</Button>
                    </div>
                </section>

                <section className="relative overflow-hidden bg-white py-24">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid grid-cols-1 items-center gap-20 lg:grid-cols-2">
                            <div>
                                <h2 className="mb-8 text-4xl font-black leading-tight text-gray-900">A culture of high ownership and low ego.</h2>
                                <p className="mb-10 text-xl leading-relaxed text-gray-600">At FlapaPay, we don't care where you went to school or what your previous title was. We care about your ability to solve complex problems and your drive to make an impact.</p>
                                <div className="grid grid-cols-2 gap-8"><div><p className="mb-2 text-4xl font-black text-orange-500">100%</p><p className="font-bold text-gray-900">Remote First</p><p className="text-sm text-gray-500">Work from 15+ countries.</p></div><div><p className="mb-2 text-4xl font-black text-yellow-500">4.9</p><p className="font-bold text-gray-900">Culture Score</p><p className="text-sm text-gray-500">Internal employee feedback.</p></div></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4"><div className="space-y-4"><div className="aspect-square overflow-hidden rounded-[32px] bg-gray-100"><img src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=600" className="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0" alt="Office Life" /></div><div className="aspect-[3/4] overflow-hidden rounded-[32px] bg-gray-100"><img src="https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&w=600" className="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0" alt="Meetings" /></div></div><div className="space-y-4 py-8"><div className="aspect-[3/4] overflow-hidden rounded-[32px] bg-gray-100"><img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600" className="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0" alt="Collaboration" /></div><div className="aspect-square overflow-hidden rounded-[32px] bg-gray-100"><img src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600" className="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0" alt="Workshop" /></div></div></div>
                        </div>
                    </div>
                </section>

                <section className="bg-gray-50 py-24"><div className="mx-auto max-w-7xl px-6 lg:px-8"><div className="mb-16 text-center"><h2 className="mb-4 text-4xl font-black text-gray-900">You take care of our customers, we take care of you.</h2><p className="mx-auto max-w-2xl text-gray-500">We provide everything you need to do the best work of your life.</p></div><div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">{benefits.map((benefit) => <div key={benefit.title} className="group rounded-[40px] border border-gray-100 bg-white p-8 shadow-sm transition-all duration-500 hover:shadow-xl sm:p-10"><div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-50 text-3xl transition-all duration-300 group-hover:scale-110 group-hover:bg-orange-500">{benefit.icon}</div><h3 className="mb-4 text-2xl font-black text-gray-900">{benefit.title}</h3><p className="leading-relaxed text-gray-500">{benefit.description}</p></div>)}</div></div></section>

                <section id="open-roles" className="bg-white py-24">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mb-10 flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between"><div className="max-w-2xl"><h2 className="mb-4 text-4xl font-black text-gray-900">Help us write history.</h2><p className="text-xl text-gray-500">Find the role that fits your ambition.</p></div>{!loading && <p className="text-sm font-bold text-gray-500"><span className="text-gray-900">{filteredJobs.length}</span> of {uniqueJobs.length} roles shown</p>}</div>

                        <div className="mb-10 border-y border-gray-100 py-5 md:flex md:items-end md:justify-between md:gap-8">
                            <label className="block md:max-w-md md:flex-1"><span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-gray-500">Search roles</span><span className="relative block"><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title, location, or keyword" className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-base text-gray-900 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10" /></span></label>
                            <div className="mt-5 md:mt-0 md:max-w-[55%]"><div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-gray-500"><SlidersHorizontal className="h-4 w-4 text-orange-500" />Department</div><div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">{departments.map((department) => <button type="button" key={department} onClick={() => setSelectedDepartment(department)} aria-pressed={selectedDepartment === department} className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-bold transition ${selectedDepartment === department ? 'border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/15' : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-600'}`}>{department}</button>)}</div></div>
                        </div>

                        <div className="space-y-4">{loading ? <p className="py-12 text-center text-gray-500">Loading open roles...</p> : filteredJobs.length > 0 ? filteredJobs.map((job) => <Link to={`/careers/${job.slug || job.id}`} key={job.id} className="group block rounded-[32px] border border-gray-100 p-6 transition-all duration-300 hover:border-orange-500 hover:bg-orange-50/30 sm:p-8 md:flex md:items-center md:justify-between md:gap-8 md:p-10"><div className="flex items-start gap-4 sm:gap-6"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-50 text-2xl transition-all group-hover:bg-white group-hover:shadow-lg sm:h-16 sm:w-16">💼</div><div className="min-w-0"><h3 className="text-xl font-black leading-tight text-gray-900 sm:text-2xl">{job.title}</h3><div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm font-bold text-gray-500"><span>{job.department}</span><span className="text-orange-400">•</span><span>{job.location}</span><span className="text-orange-400">•</span><span>{job.type}</span></div></div></div><div className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-black text-white transition-colors group-hover:bg-orange-500 md:mt-0">Review role <ArrowUpRight className="h-4 w-4" /></div></Link>) : <div className="rounded-[28px] border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center"><h3 className="text-xl font-black text-gray-900">No roles match those filters.</h3><p className="mx-auto mt-3 max-w-md text-gray-500">Try a different keyword or return to all departments to see every open opportunity.</p><Button type="button" variant="outline" onClick={clearFilters} className="mt-6 min-h-11 rounded-xl border-gray-300 bg-white px-5 font-bold text-gray-900 hover:border-orange-500 hover:text-orange-600">Clear filters</Button></div>}</div>
                    </div>
                </section>

                <section className="py-24"><div className="mx-auto max-w-5xl px-6 lg:px-8"><div className="relative overflow-hidden rounded-[48px] bg-black p-8 text-center text-white sm:p-12 md:p-24"><div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-orange-500 opacity-20 blur-[120px]" /><h2 className="relative z-10 mb-8 text-4xl font-black leading-tight md:text-6xl">Ready to build the <br />next big thing?</h2><p className="relative z-10 mb-12 text-xl text-gray-400">If you don't see a role that fits but still want to join us, reach out.</p><Button size="lg" className="relative z-10 min-h-14 rounded-2xl bg-white px-9 py-5 font-black text-black shadow-2xl transition-all hover:bg-orange-500 hover:text-white sm:px-12">General Application</Button></div></div></section>
            </main>
            <Footer />
        </div>
    );
};
