import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, ShieldAlert, UserPlus, CreditCard, Search, Tag, Trash2, MoreVertical, Loader2 } from 'lucide-react';
import { api } from '../../lib/axios';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'security' | 'user' | 'system' | 'transaction';
    created_at: string;
    read: boolean;
}

export const AdminNotifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread' | 'system' | 'security'>('all');
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/admin/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAllRead = async () => {
        try {
            await api.patch('/admin/notifications/read');
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark read', err);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.delete(`/admin/notifications/${id}`);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (err) {
            console.error('Failed to delete', err);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'security': return <ShieldAlert className="w-5 h-5 text-red-500" />;
            case 'transaction': return <CreditCard className="w-5 h-5 text-yellow-500" />;
            case 'user': return <UserPlus className="w-5 h-5 text-blue-500" />;
            case 'system': return <Bell className="w-5 h-5 text-orange-500" />;
            default: return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    const getIconBg = (type: string) => {
        switch (type) {
            case 'security': return 'bg-red-50 border border-red-100';
            case 'transaction': return 'bg-yellow-50 border border-yellow-100';
            case 'user': return 'bg-blue-50 border border-blue-100';
            case 'system': return 'bg-orange-50 border border-orange-100';
            default: return 'bg-gray-50 border border-gray-200';
        }
    };

    return (
        <div className="space-y-12 max-w-5xl mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black mb-2 tracking-tight text-slate-900">Notifications Desk</h1>
                    <p className="text-slate-500 font-bold">Review system alerts, security warnings, and platform events.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={markAllRead}
                        className="bg-white hover:bg-slate-50 px-6 py-3 rounded-xl font-bold transition-all border border-slate-200 text-slate-700 flex items-center gap-2 shadow-sm"
                    >
                        <CheckCircle2 className="w-4 h-4" /> Mark All as Read
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden flex min-h-[600px]">
                {/* Sidebar Filters */}
                <div className="w-64 border-r border-slate-200 p-8 bg-slate-50/50">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Filter View</h3>
                    <nav className="space-y-2">
                        {[
                            { id: 'all', label: 'All Notifications', icon: Bell },
                            { id: 'unread', label: 'Unread', icon: CheckCircle2 },
                            { id: 'security', label: 'Security Alerts', icon: ShieldAlert },
                            { id: 'system', label: 'System Events', icon: Tag },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setFilter(item.id as any)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${filter === item.id
                                    ? 'bg-white text-orange-500 shadow-sm border border-slate-200'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Notifications List */}
                <div className="flex-1 p-8">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight capitalize">{filter} Inbox</h2>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search notifications..."
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none w-64 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                                <Loader2 className="w-8 h-8 animate-spin mb-4 text-orange-500" />
                                <p className="font-medium">Loading notifications...</p>
                            </div>
                        ) : (
                            <>
                                {notifications
                                    .filter(n => filter === 'all' ? true : filter === 'unread' ? !n.read : n.type === filter)
                                    .map((note) => (
                                        <div key={note.id} className={`p-6 rounded-2xl border transition-all group flex gap-6 ${note.read ? 'bg-white border-slate-100' : 'bg-orange-50/30 border-orange-200 shadow-sm shadow-orange-500/5'}`}>
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${getIconBg(note.type)}`}>
                                                {getIcon(note.type)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className={`font-black text-lg ${note.read ? 'text-slate-700' : 'text-slate-900'}`}>
                                                        {note.title}
                                                    </h3>
                                                    <span className="text-xs font-bold text-slate-400">{new Date(note.created_at).toLocaleString()}</span>
                                                </div>
                                                <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-2xl">{note.message}</p>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => deleteNotification(note.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                {notifications.length === 0 && (
                                    <div className="text-center py-24">
                                        <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <h3 className="text-lg font-black text-slate-900 mb-1">All Caught Up!</h3>
                                        <p className="text-slate-500 font-medium">You have no new notifications matching this filter.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
