import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export const JobDetail: React.FC = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState<JobPosting | null>(null);
    const [loading, setLoading] = useState(true);
    const [showApplyModal, setShowApplyModal] = useState(false);

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

    if (loading) return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
    if (!job) return null;

    return (
        <div className="min-h-screen bg-white font-sans">
            <Navbar />

            <main className="pt-32 pb-24 max-w-4xl mx-auto px-6">
                <Button variant="ghost" onClick={() => navigate('/careers')} className="mb-8 pl-0 hover:bg-transparent hover:text-orange-500">
                    ← Back to Careers
                </Button>

                <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">{job.title}</h1>

                <div className="flex gap-4 text-sm font-bold text-gray-500 mb-12 uppercase tracking-widest">
                    <span>{job.department}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                    <span>•</span>
                    <span>{job.type}</span>
                </div>

                <div className="prose prose-lg max-w-none text-gray-600 mb-16">
                    <h3 className="text-2xl font-black text-gray-900 mb-4">About the Role</h3>
                    <p className="mb-8">{job.description}</p>

                    <h3 className="text-2xl font-black text-gray-900 mb-4">Requirements</h3>
                    <ul className="list-disc pl-6 space-y-2">
                        {job.requirements && job.requirements.map((req, i) => (
                            <li key={i}>{req}</li>
                        ))}
                    </ul>
                </div>

                <div className="bg-gray-50 p-8 rounded-3xl flex flex-col items-center text-center">
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Interested?</h3>
                    <p className="text-gray-500 mb-8">Join us in building the future of African commerce.</p>
                    <Button size="lg" className="bg-black text-white px-12 py-4 rounded-xl font-black hover:bg-orange-500 transition-all" onClick={() => setShowApplyModal(true)}>
                        Apply for this Role
                    </Button>
                </div>
            </main>

            {showApplyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-lg w-full relative">
                        <button onClick={() => setShowApplyModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black">
                            ✕
                        </button>
                        <h2 className="text-2xl font-black mb-6">Apply for {job.title}</h2>
                        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Application submitted (Mock)!'); setShowApplyModal(false); }}>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                                <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-orange-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                <input type="email" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-orange-500" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">LinkedIn / Portfolio URL</label>
                                <input type="url" className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-orange-500" />
                            </div>
                            <div className="pt-4">
                                <Button type="submit" className="w-full bg-orange-500 text-white py-4 rounded-xl font-black hover:bg-orange-600">
                                    Submit Application
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};
