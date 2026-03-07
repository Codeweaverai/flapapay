import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { api } from '../lib/axios';

interface HelpArticle {
    id: number;
    title: string;
    category: string;
    content: string;
    tags: string[];
    slug: string;
}

const categories = [
    { title: "Account & Settings", icon: "👤", desc: "Manage your profile, verification, and limits.", color: "bg-pink-500" },
    { title: "Payments & Transfers", icon: "💸", desc: "Guides on sending, receiving, and managing your money.", color: "bg-green-500" },
    { title: "Business & API", icon: "👨‍💻", desc: "Advanced tools for developers and business owners.", color: "bg-indigo-500" },
    { title: "Security & Trust", icon: "🛡️", desc: "How we protect your data and funds.", color: "bg-orange-500" },
];

export const HelpCenterPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [articles, setArticles] = useState<HelpArticle[]>([]);
    const [loading, setLoading] = useState(false);
    const [openArticle, setOpenArticle] = useState<number | null>(null);

    const searchArticles = async (query: string = '', category: string = '') => {
        setLoading(true);
        try {
            const res = await api.get('/content/help', {
                params: { search: query, category }
            });
            setArticles(res.data);
            setOpenArticle(null); // Reset open state on new search
        } catch (err) {
            console.error('Failed to search articles', err);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        searchArticles();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        searchArticles(searchQuery);
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="pt-20">
                {/* Help Search Hero - High Fidelity */}
                <section className="py-32 bg-gray-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500 rounded-full blur-[200px] opacity-10 -translate-y-1/2 translate-x-1/4"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-500 rounded-full blur-[150px] opacity-10 translate-y-1/2 -translate-x-1/4"></div>

                    <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-xs font-black text-orange-600 uppercase tracking-widest mb-10">
                            Support Hub
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-10 tracking-tight leading-tight">
                            How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">help</span> you today?
                        </h1>

                        <div className="max-w-3xl mx-auto relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-[32px] blur opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
                            <form onSubmit={handleSearch} className="relative bg-white rounded-[30px] shadow-2xl overflow-hidden flex items-center">
                                <div className="pl-8 text-gray-400">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search for guides, FAQs, or troubleshooting..."
                                    className="w-full px-6 py-8 focus:outline-none font-bold text-xl text-gray-900 bg-transparent"
                                />
                                <div className="pr-4">
                                    <Button type="submit" className="bg-black text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-gray-800 transition-all">
                                        Search
                                    </Button>
                                </div>
                            </form>
                        </div>

                        <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm font-black text-gray-400">
                            <span className="uppercase tracking-widest">Popular:</span>
                            {['Verification', 'Card Limits', 'API Keys', 'Fees'].map(topic => (
                                <button key={topic} onClick={() => { setSearchQuery(topic); searchArticles(topic); }} className="text-gray-900 hover:text-orange-500 border-b-2 border-transparent hover:border-orange-500 transition-all pb-1">{topic}</button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Categories Grid - High Fidelity */}
                <section className="py-24 bg-white">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                            {categories.map((cat, i) => (
                                <div key={i} onClick={() => searchArticles('', cat.title)} className="p-8 rounded-[40px] bg-white border border-gray-100 hover:border-orange-500/20 hover:shadow-[0_16px_32px_-12px_rgba(249,115,22,0.1)] hover:-translate-y-2 transition-all duration-500 group cursor-pointer relative overflow-hidden">
                                    <div className={`absolute top-0 right-0 w-24 h-24 ${cat.color} opacity-0 group-hover:opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-all duration-700`}></div>
                                    <div className="text-4xl mb-6">{cat.icon}</div>
                                    <h3 className="text-xl font-black text-gray-900 mb-2">{cat.title}</h3>
                                    <p className="text-sm text-gray-500">{cat.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Dynamic Results */}
                        <div className="mx-auto max-w-4xl">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
                                    {loading ? 'Searching...' : (articles.length > 0 ? 'Search Results' : 'No articles found')}
                                </h2>
                            </div>

                            <div className="space-y-6">
                                {articles.map((article) => (
                                    <div
                                        key={article.id}
                                        className={`bg-white rounded-[32px] overflow-hidden border transition-all duration-500 ${openArticle === article.id ? 'border-orange-500 shadow-xl' : 'border-gray-100 hover:border-gray-200 shadow-sm'}`}
                                    >
                                        <button
                                            onClick={() => setOpenArticle(openArticle === article.id ? null : article.id)}
                                            className="w-full p-8 flex justify-between items-center text-left"
                                        >
                                            <div>
                                                <div className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">{article.category}</div>
                                                <h3 className={`text-xl font-black transition-colors ${openArticle === article.id ? 'text-orange-500' : 'text-gray-900'}`}>
                                                    {article.title}
                                                </h3>
                                            </div>
                                            <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-500 ${openArticle === article.id ? 'bg-orange-500 text-white rotate-180' : 'bg-gray-50 text-gray-400'}`}>
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </button>
                                        <div className={`transition-all duration-500 ease-in-out ${openArticle === article.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div className="px-8 pb-8">
                                                <div className="w-full h-px bg-gray-50 mb-6"></div>
                                                <p className="text-gray-600 text-lg leading-relaxed">{article.content}</p>
                                                {article.tags && (
                                                    <div className="flex gap-2 mt-6">
                                                        {article.tags.map(tag => (
                                                            <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500">#{tag}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Support CTA */}
                <section className="py-32 bg-white">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="bg-black rounded-[80px] p-16 md:p-24 text-center text-white relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,_rgba(249,115,22,0.3),_transparent_70%)] opacity-50"></div>
                            <div className="relative z-10">
                                <h2 className="text-4xl md:text-6xl font-black mb-10 tracking-tight">Still need help?</h2>
                                <p className="text-xl md:text-2xl text-gray-400 mb-16 max-w-2xl mx-auto leading-relaxed">
                                    Our specialist support team is available 24/7 to help you scale your business globally.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-8 justify-center">
                                    <Button size="lg" className="bg-orange-500 text-white px-12 py-6 rounded-3xl font-black shadow-2xl hover:bg-orange-600 active:scale-95 transition-all text-xl">
                                        Start Live Chat
                                    </Button>
                                    <Button size="lg" variant="outline" className="px-12 py-6 rounded-3xl font-black border-white/20 text-white hover:bg-white/10 active:scale-95 transition-all text-xl">
                                        Send an Email
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};
