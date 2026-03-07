import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { api } from '../lib/axios';

interface BlogPost {
    id: number;
    title: string;
    excerpt: string;
    content: string;
    author: string;
    author_role: string;
    author_image: string;
    category: string;
    image_url: string;
    read_time: string;
    published_at: string;
}

export const BlogPost: React.FC = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await api.get(`/content/blog/${slug}`);
                setPost(res.data);
            } catch (err) {
                console.error('Failed to fetch post', err);
                navigate('/blog');
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [slug, navigate]);

    if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-black text-2xl text-gray-300">Loading...</div>;
    if (!post) return <div className="min-h-screen bg-white flex items-center justify-center font-black text-2xl text-gray-300">Blog post not found</div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-100 selection:text-orange-900">
            <Navbar />

            <main className="pt-32 pb-24">
                {/* Article Header & Hero - Split Layout */}
                <div className="max-w-7xl mx-auto px-6 mb-24">
                    <Button variant="ghost" onClick={() => navigate('/blog')} className="mb-12 pl-0 text-gray-400 hover:bg-transparent hover:text-orange-500">
                        ← Back to Blog
                    </Button>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Left Content */}
                        <div>
                            <div className="flex items-center gap-4 text-sm font-bold text-gray-400 mb-8 uppercase tracking-widest">
                                <span className="text-orange-500">{post.category}</span>
                                <span>•</span>
                                <span>{new Date(post.published_at).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{post.read_time}</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-white mb-10 leading-[1.1] tracking-tight">
                                {post.title}
                            </h1>

                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 shadow-lg">
                                    <img src={post.author_image || 'https://ui-avatars.com/api/?name=' + post.author} alt={post.author} className="w-full h-full object-cover" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-white text-lg">{post.author}</p>
                                    <p className="text-sm text-gray-400 font-medium">{post.author_role}</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Image */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-transparent blur-3xl -z-10 rounded-full"></div>
                            <div className="rounded-[40px] overflow-hidden shadow-2xl aspect-[4/5] border border-white/5 relative z-10 w-full lg:w-[90%] lg:ml-auto">
                                <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <article className="max-w-3xl mx-auto px-6 prose prose-lg prose-invert prose-headings:font-black prose-a:text-orange-500 hover:prose-a:text-orange-600">
                    <p className="lead text-xl text-gray-300 mb-12 font-medium leading-relaxed">{post.excerpt}</p>
                    <div className="text-gray-300" dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }} />
                </article>

                {/* Share / CTA */}
                <div className="max-w-3xl mx-auto px-6 mt-20 pt-16 border-t border-white/10 text-center">
                    <h3 className="text-2xl font-black text-white mb-8">Enjoyed this article?</h3>
                    <div className="flex justify-center gap-4">
                        <Button variant="outline" className="rounded-full border-white/20 text-white hover:bg-white hover:text-black">Share on Twitter</Button>
                        <Button variant="outline" className="rounded-full border-white/20 text-white hover:bg-white hover:text-black">Share on LinkedIn</Button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};
