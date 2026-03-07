import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { api } from '../lib/axios';
import { useNavigate } from 'react-router-dom';

interface BlogPost {
    id: number;
    title: string;
    excerpt: string;
    date: string; // mapped from published_at
    readTime: string; // mapped from read_time
    category: string;
    image: string; // mapped from image_url
    slug: string;
    published_at: string;
    read_time: string;
    image_url: string;
}

export const BlogPage: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [subMessage, setSubMessage] = useState('');
    const navigate = useNavigate();

    const [selectedCategory, setSelectedCategory] = useState('All Posts');

    const fetchPosts = async (category: string = 'All Posts') => {
        setLoading(true);
        try {
            const res = await api.get('/content/blog', {
                params: { category: category === 'All Posts' ? undefined : category }
            });
            setPosts(res.data);
            setSelectedCategory(category);
        } catch (err) {
            console.error('Failed to fetch blog posts', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setSubStatus('loading');
        try {
            const res = await api.post('/api/subscribe', { email });
            setSubStatus('success');
            setSubMessage(res.data.message || 'Subscribed successfully!');
            setEmail('');
        } catch (err: any) {
            setSubStatus('error');
            setSubMessage(err.response?.data?.message || 'Failed to subscribe. Try again.');
        }
        setTimeout(() => setSubStatus('idle'), 3000);
    };

    const featuredPost = posts.length > 0 ? posts[0] : null;
    const gridPosts = posts.length > 0 ? posts.slice(1) : [];

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="pt-20">
                {/* Blog Hero & Spotlight */}
                <section className="py-24 bg-gray-50 border-b border-gray-100">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight">
                                Insights for <span className="text-orange-500 underline decoration-yellow-400 decoration-4">global</span> builders.
                            </h1>
                            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                                Deep dives into fintech, engineering, and the future of commerce in Africa.
                            </p>
                        </div>

                        {/* Featured Post */}
                        {loading ? (
                            <div className="text-center min-h-[400px] flex items-center justify-center">Loading insights...</div>
                        ) : featuredPost && (
                            <div onClick={() => navigate(`/blog/${featuredPost.slug}`)} className="relative rounded-[48px] overflow-hidden bg-black text-white shadow-2xl group cursor-pointer">
                                <div className="grid grid-cols-1 lg:grid-cols-2">
                                    <div className="p-10 md:p-20 flex flex-col justify-center">
                                        <div className="flex items-center gap-4 mb-8">
                                            <span className="px-4 py-1.5 rounded-full bg-orange-500 text-white text-xs font-black uppercase tracking-widest">
                                                Featured
                                            </span>
                                            <span className="text-gray-400 font-bold">{featuredPost.read_time}</span>
                                        </div>
                                        <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight group-hover:text-orange-400 transition-colors">
                                            {featuredPost.title}
                                        </h2>
                                        <p className="text-xl text-gray-400 mb-10 leading-relaxed line-clamp-3">
                                            {featuredPost.excerpt}
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-orange-500 overflow-hidden border-2 border-white/20">
                                                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Author" />
                                            </div>
                                            <div>
                                                <p className="font-bold">Kwame Mensah</p>
                                                <p className="text-sm text-gray-500">Chief Strategy Officer</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-[400px] lg:h-auto relative overflow-hidden">
                                        <img
                                            src={featuredPost.image_url}
                                            alt={featuredPost.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent lg:block hidden"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Filters & Grid */}
                <section className="py-24 bg-white">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16">
                            <div className="flex flex-wrap gap-4 justify-center">
                                {['All Posts', 'Fintech', 'Engineering', 'Industry Insights', 'Compliance', 'Developer Tips'].map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => fetchPosts(cat)}
                                        className={`px-6 py-2.5 rounded-2xl font-black text-sm transition-all ${selectedCategory === cat ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            <div className="relative w-full md:w-80 group">
                                <input
                                    type="text"
                                    placeholder="Search articles..."
                                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-bold"
                                />
                                <svg className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                            {gridPosts.map((post, index) => (
                                <article
                                    key={index}
                                    onClick={() => navigate(`/blog/${post.slug}`)}
                                    className="group cursor-pointer"
                                >
                                    <div className="relative h-64 rounded-[40px] overflow-hidden mb-8 shadow-sm group-hover:shadow-xl transition-all duration-500">
                                        <img
                                            src={post.image_url}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute top-6 left-6">
                                            <span className="px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-gray-900 text-xs font-black uppercase tracking-widest">
                                                {post.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 text-sm font-bold text-gray-400 mb-4">
                                            <span>{new Date(post.published_at).toLocaleDateString()}</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-200"></span>
                                            <span>{post.read_time}</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-orange-500 transition-colors leading-tight">
                                            {post.title}
                                        </h3>
                                        <p className="text-gray-500 leading-relaxed line-clamp-2">
                                            {post.excerpt}
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <div className="mt-24 text-center">
                            <Button size="lg" variant="outline" className="px-12 py-5 rounded-2xl font-black border-gray-100 hover:border-orange-500 hover:text-orange-500 transition-all text-lg">
                                Load More Articles
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Newsletter */}
                <section className="py-24 bg-gray-50">
                    <div className="mx-auto max-w-4xl px-6 lg:px-8">
                        <div className="bg-white rounded-[64px] p-12 md:p-20 text-center shadow-sm border border-orange-100 relative overflow-hidden">
                            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-yellow-400 rounded-full blur-[100px] opacity-20"></div>
                            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6">Stay in the loop</h2>
                            <p className="text-xl text-gray-500 mb-10">Get the latest insights on African fintech delivered to your inbox.</p>
                            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto relative z-10 w-full">
                                <div className="flex-1 text-left relative">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full px-8 py-5 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-orange-500 font-bold outline-none"
                                        disabled={subStatus === 'loading' || subStatus === 'success'}
                                    />
                                    {subStatus !== 'idle' && (
                                        <div className={`absolute -bottom-8 left-0 text-sm font-bold ${subStatus === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                            {subMessage}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    disabled={subStatus === 'loading' || subStatus === 'success' || !email}
                                    size="lg"
                                    className="bg-orange-500 text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50 min-w-[160px]"
                                >
                                    {subStatus === 'loading' ? 'Subscribing...' : subStatus === 'success' ? 'Joined!' : 'Subscribe'}
                                </Button>
                            </form>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};