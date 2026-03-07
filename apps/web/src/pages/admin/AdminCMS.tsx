import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    FileText,
    BookOpen,
    Briefcase,
    Edit3,
    Trash2,
    Eye,
    X,
    Save,
    Image,
    CheckCircle2,
    Users,
    MessageSquare
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/axios';
import { LiveChatTab } from './LiveChatTab';

export const AdminCMS: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'blog' | 'help' | 'careers' | 'subscribers' | 'live_chat'>('blog');
    const [contentItems, setContentItems] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        content: '',
        image_url: '',
        author: '',
        author_role: '',
        author_image: '',
        category: '',
        department: '',
        location: '',
        type: 'Full-time',
        tags: '',
        requirements: ''
    });

    const fetchContent = async () => {
        if (activeTab === 'live_chat') return;
        try {
            let endpoint = `/admin/content/${activeTab}`;
            if (activeTab === 'careers') endpoint = '/admin/content/jobs';
            if (activeTab === 'subscribers') endpoint = '/admin/subscribers';

            const res = await api.get(endpoint);
            setContentItems(res.data);
        } catch (err) {
            console.error('Failed to fetch content', err);
        }
    };

    useEffect(() => {
        fetchContent();
    }, [activeTab]);

    const tabs = [
        { id: 'blog', label: 'Blog Posts', icon: FileText, count: activeTab === 'blog' ? contentItems.length : '-' },
        { id: 'help', label: 'Help Articles', icon: BookOpen, count: activeTab === 'help' ? contentItems.length : '-' },
        { id: 'careers', label: 'Job Postings', icon: Briefcase, count: activeTab === 'careers' ? contentItems.length : '-' },
        { id: 'subscribers', label: 'Subscribers', icon: Users, count: activeTab === 'subscribers' ? contentItems.length : '-' },
        { id: 'live_chat', label: 'Live Chat', icon: MessageSquare, count: activeTab === 'live_chat' ? 'LIVE' : '-' },
    ] as const;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const data = new FormData();
        data.append('image', file);

        try {
            const res = await api.post('/admin/content/upload', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData({ ...formData, image_url: res.data.url });
        } catch (err) {
            console.error('Upload failed', err);
            alert('Failed to upload image. Ensure server has write permissions.');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let endpoint = '';
            let payload = {};

            if (activeTab === 'blog') {
                endpoint = '/admin/content/blog';
                payload = {
                    title: formData.title,
                    excerpt: formData.excerpt,
                    content: formData.content,
                    image_url: formData.image_url,
                    author: formData.author,
                    author_role: formData.author_role,
                    author_image: formData.author_image,
                    category: formData.category,
                    tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()) : []
                };
            } else if (activeTab === 'help') {
                endpoint = '/admin/content/help';
                payload = {
                    title: formData.title,
                    category: formData.category,
                    content: formData.content,
                    excerpt: formData.excerpt,
                    tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()) : []
                };
            } else if (activeTab === 'careers') {
                endpoint = '/admin/content/jobs';
                payload = {
                    title: formData.title,
                    department: formData.department,
                    location: formData.location,
                    type: formData.type,
                    description: formData.content,
                    requirements: formData.requirements.split('\n').filter(r => r.trim())
                };
            }

            if (editingId) {
                await api.put(`${endpoint}/${editingId}`, payload);
                alert('Content updated successfully!');
            } else {
                await api.post(endpoint, payload);
                alert('Content created successfully!');
            }
            setIsCreating(false);
            setEditingId(null);
            fetchContent();
            setFormData({
                title: '', excerpt: '', content: '', image_url: '', author: '', author_role: '', author_image: '', category: '',
                department: '', location: '', type: 'Full-time', tags: '', requirements: ''
            });
        } catch (err) {
            console.error('Failed to create content', err);
            alert('Failed to publish content.');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            let endpoint = `/admin/content/${activeTab}`;
            if (activeTab === 'careers') endpoint = '/admin/content/jobs';
            await api.delete(`${endpoint}/${id}`);
            fetchContent();
        } catch (err) {
            console.error('Failed to delete item', err);
            alert('Failed to delete item.');
        }
    };

    return (
        <div className="space-y-12 relative">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h1 className="text-4xl font-black mb-2 tracking-tight">Content Engine</h1>
                    <p className="text-gray-500 font-bold">Govern the platform's narrative, documentation, and career portal.</p>
                </div>
                <Button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({
                            title: '', excerpt: '', content: '', image_url: '', author: '', author_role: '', author_image: '', category: '',
                            department: '', location: '', type: 'Full-time', tags: '', requirements: ''
                        });
                        setIsCreating(true);
                    }}
                    size="lg"
                    className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Create New {activeTab === 'blog' ? 'Post' : activeTab === 'help' ? 'Article' : 'Job'}
                </Button>
            </div>

            {/* CMS Navigation */}
            <div className="flex gap-4 p-2 bg-white/5 rounded-3xl w-fit border border-white/5">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl transition-all font-black text-sm ${activeTab === tab.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-500 hover:text-white'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-white/5'}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Content List */}
            {activeTab === 'subscribers' ? (
                <div className="bg-black border border-white/10 rounded-[40px] p-8">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-500 font-bold text-sm tracking-widest uppercase">
                                <th className="pb-4">Email Address</th>
                                <th className="pb-4">Subscribed At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contentItems.map((item) => (
                                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="py-6 font-bold text-white">{item.email}</td>
                                    <td className="py-6 text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {contentItems.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="py-8 text-center text-gray-500 font-bold">No subscribers yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : activeTab === 'live_chat' ? (
                <LiveChatTab />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {contentItems.map((item) => (
                        <div key={item.id} className="bg-black border border-white/10 p-8 rounded-[40px] hover:border-orange-500/50 transition-all group flex flex-col h-full shadow-2xl">
                            {activeTab === 'blog' && (
                                <div className="h-64 bg-zinc-900 rounded-[32px] mb-8 overflow-hidden relative">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                                            <FileText className="w-12 h-12 text-white/10" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                </div>
                            )}

                            <div className="flex-1">
                                {activeTab === 'careers' && (
                                    <div className="flex gap-2 mb-4">
                                        <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest">{item.type}</span>
                                        <span className="px-3 py-1 rounded-full bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest">{item.location}</span>
                                    </div>
                                )}
                                {activeTab === 'help' && (
                                    <div className="flex gap-2 mb-4">
                                        <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest">{item.category?.replace('_', ' ')}</span>
                                    </div>
                                )}

                                <h3 className="text-xl font-black mb-4 group-hover:text-orange-500 transition-colors text-white line-clamp-2">{item.title}</h3>
                                <p className="text-gray-500 font-bold text-sm line-clamp-3 leading-relaxed mb-8">
                                    {activeTab === 'careers' ? item.description : item.content}
                                </p>

                                {activeTab === 'blog' && item.tags && (
                                    <div className="flex gap-2 flex-wrap mb-4">
                                        {item.tags.map((tag: string, i: number) => (
                                            <span key={i} className="text-[10px] font-bold text-gray-600 bg-white/5 px-2 py-1 rounded-md">#{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-8 border-t border-white/5">
                                <span className="text-xs font-bold text-gray-600">{new Date(item.created_at).toLocaleDateString()}</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => navigate(activeTab === 'help' ? `/help/${item.slug}` : activeTab === 'careers' ? `/careers/${item.slug}` : `/blog/${item.slug}`)}
                                        className="p-2 text-gray-500 hover:text-white transition-all"><Eye className="w-5 h-5" /></button>
                                    <button
                                        onClick={() => {
                                            setEditingId(item.id);
                                            setFormData({
                                                title: item.title || '',
                                                excerpt: item.excerpt || '',
                                                content: item.content || item.description || '',
                                                image_url: item.image_url || '',
                                                author: item.author || '',
                                                author_role: item.author_role || '',
                                                author_image: item.author_image || '',
                                                category: item.category || '',
                                                department: item.department || '',
                                                location: item.location || '',
                                                type: item.type || 'Full-time',
                                                tags: item.tags ? item.tags.join(', ') : '',
                                                requirements: item.requirements ? item.requirements.join('\n') : ''
                                            });
                                            setIsCreating(true);
                                        }}
                                        className="p-2 text-gray-500 hover:text-orange-500 transition-all"><Edit3 className="w-5 h-5" /></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-500 hover:text-red-500 transition-all"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {contentItems.length === 0 && (
                        <div className="col-span-full py-24 text-center">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-500">
                                {activeTab === 'blog' ? <FileText className="w-8 h-8 opacity-20" /> :
                                    activeTab === 'help' ? <BookOpen className="w-8 h-8 opacity-20" /> :
                                        <Briefcase className="w-8 h-8 opacity-20" />}
                            </div>
                            <h3 className="text-xl font-black text-white mb-2">No Content Found</h3>
                            <p className="text-gray-500 font-bold">Start by creating a new {activeTab === 'blog' ? 'post' : activeTab === 'help' ? 'article' : 'job'} to populate this section.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0A0A0B] border border-white/10 rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl relative">
                        <div className="absolute top-0 right-0 p-8 z-10">
                            <button onClick={() => setIsCreating(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-10">
                            <div className="mb-8">
                                <h2 className="text-3xl font-black text-white mb-2">
                                    {editingId ? 'Edit' : 'Create'} {activeTab === 'blog' ? 'Blog Post' : activeTab === 'help' ? 'Help Article' : 'Job Posting'}
                                </h2>
                                <p className="text-gray-500 font-bold">Fill in the details below to publish new content.</p>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-6">
                                <div>
                                    <label className="block text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                                        placeholder="Enter title..."
                                        required
                                    />
                                </div>

                                {activeTab === 'blog' && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Category</label>
                                                <select
                                                    value={formData.category}
                                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none appearance-none"
                                                    required
                                                >
                                                    <option value="">Select Category</option>
                                                    <option value="Fintech">Fintech</option>
                                                    <option value="Engineering">Engineering</option>
                                                    <option value="Industry Insights">Industry Insights</option>
                                                    <option value="Compliance">Compliance</option>
                                                    <option value="Developer Tips">Developer Tips</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Tags (comma separated)</label>
                                                <input
                                                    type="text"
                                                    value={formData.tags}
                                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                                                    placeholder="Tech, Finance, API..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Author</label>
                                                <input
                                                    type="text"
                                                    value={formData.author}
                                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                                                    placeholder="Author name"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Author Role</label>
                                                <input
                                                    type="text"
                                                    value={formData.author_role}
                                                    onChange={(e) => setFormData({ ...formData, author_role: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                                                    placeholder="e.g. Chief Strategy Officer"
                                                    required
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Short Excerpt</label>
                                                <textarea
                                                    value={formData.excerpt}
                                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none min-h-[80px]"
                                                    placeholder="A brief summary of the post..."
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Cover Image</label>
                                            <div className="relative">
                                                <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-4 transition-colors hover:bg-white/10">
                                                    <div className="bg-orange-500/10 p-2 rounded-lg text-orange-500">
                                                        <Image className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleImageUpload}
                                                            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                                {formData.image_url && (
                                                    <div className="mt-3 text-xs text-green-500 flex items-center gap-2 font-bold p-2 bg-green-500/10 rounded-lg w-fit">
                                                        <CheckCircle2 className="w-3 h-3" /> Image uploaded: {formData.image_url.split('/').pop()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {activeTab === 'help' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Category</label>
                                                <select
                                                    value={formData.category}
                                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none appearance-none"
                                                    required
                                                >
                                                    <option value="">Select Category</option>
                                                    <option value="getting_started">Getting Started</option>
                                                    <option value="payments">Payments</option>
                                                    <option value="account">Account & Security</option>
                                                    <option value="api">API & Developers</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Tags (comma separated)</label>
                                                <input
                                                    type="text"
                                                    value={formData.tags}
                                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                                                    placeholder="Tutorial, API, Security..."
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Short Excerpt</label>
                                            <textarea
                                                value={formData.excerpt}
                                                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none min-h-[80px]"
                                                placeholder="A brief summary of the article..."
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'careers' && (
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Department</label>
                                            <input
                                                type="text"
                                                value={formData.department}
                                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                                                placeholder="e.g. Engineering"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Location</label>
                                            <input
                                                type="text"
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                                                placeholder="e.g. Remote, Lagos"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Type</label>
                                            <select
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none appearance-none"
                                            >
                                                <option value="Full-time">Full-time</option>
                                                <option value="Contract">Contract</option>
                                                <option value="Internship">Internship</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">
                                        {activeTab === 'careers' ? 'Role Description' : 'Content Body'}
                                    </label>
                                    <textarea
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none min-h-[150px]"
                                        placeholder="Write your content here..."
                                        required
                                    />
                                </div>

                                {activeTab === 'careers' && (
                                    <div>
                                        <label className="block text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Requirements (one per line)</label>
                                        <textarea
                                            value={formData.requirements}
                                            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none min-h-[100px]"
                                            placeholder="- 3+ years experience..."
                                        />
                                    </div>
                                )}

                                <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl shadow-xl shadow-orange-500/20">
                                    {editingId ? <Edit3 className="w-5 h-5 mr-2 inline-block" /> : <Save className="w-5 h-5 mr-2 inline-block" />}
                                    {editingId ? 'Update Content' : 'Publish Content'}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
