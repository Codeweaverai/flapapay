import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/axios';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

interface ChatMessage {
    id: string;
    sender: 'user' | 'ai' | 'agent' | 'system';
    content: string;
    created_at: string;
}

interface SupportSession {
    id: string;
    status: 'active' | 'waiting_for_agent' | 'agent_active' | 'closed';
    agent_name?: string;
    agent_avatar?: string;
}

export const Notifications: React.FC = () => {
    const navigate = useNavigate();
    const { } = useAuth();
    const { socket, notifications, markAsRead, markAllAsRead } = useNotifications();

    const [activeTab, setActiveTab] = useState<'notifications' | 'support'>('notifications');
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    // Chat State
    const [session, setSession] = useState<SupportSession | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Modal State
    const [selectedNotification, setSelectedNotification] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filteredNotifications = filter === 'all'
        ? notifications
        : notifications.filter(n => !n.read);

    // Initial Load & Socket Listeners
    useEffect(() => {
        if (activeTab === 'support') {
            loadSessionAndMessages();
        }
    }, [activeTab]);

    useEffect(() => {
        if (!socket) return;

        socket.on('new_message', (msg: any) => {
            setChatMessages(prev => [...prev, msg]);
            scrollToBottom();
        });

        return () => {
            socket.off('new_message');
        };
    }, [socket]);

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages, activeTab]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const loadSessionAndMessages = async () => {
        try {
            // 1. Get or Create Session
            const sessionRes = await api.post('/support/session');
            setSession(sessionRes.data);

            if (sessionRes.data?.id) {
                // 2. Join Socket Room
                socket?.emit('join_session', sessionRes.data.id);

                // 3. Load History
                const msgRes = await api.get(`/ support / messages / ${sessionRes.data.id} `);
                setChatMessages(msgRes.data);
            }
        } catch (err) {
            console.error('Failed to load chat', err);
        }
    };

    const handleNotificationClick = (notification: any) => {
        markAsRead(notification.id);
        setSelectedNotification(notification);
        setIsModalOpen(true);
    };

    const getMetadata = (notification: any) => {
        if (!notification.metadata) return {};
        try {
            return typeof notification.metadata === 'string'
                ? JSON.parse(notification.metadata)
                : notification.metadata;
        } catch (e) {
            return {};
        }
    };

    const handleSendMessage = async (e?: React.FormEvent, manualMessage?: string) => {
        if (e) e.preventDefault();
        const msgToSend = manualMessage || newMessage;
        if (!msgToSend.trim() || !session) return;

        setIsSending(true);
        try {
            await api.post('/support/message', {
                sessionId: session.id,
                content: msgToSend
            });
            setNewMessage('');
            // Refresh messages after sending
            const msgRes = await api.get(`/ support / messages / ${session.id} `);
            setChatMessages(msgRes.data);
            scrollToBottom();
        } catch (err) {
            console.error('Failed to send message', err);
        } finally {
            setIsSending(false);
        }
    };

    const QuickActionButtons = () => {
        const actions = [
            { label: '💳 Get Virtual Card', query: 'How do I get a virtual card?' },
            { label: '📄 KYC Status', query: 'What is my KYC verification status?' },
            { label: '💰 Deposit Problem', query: 'I have a problem with my mobile money deposit.' },
            { label: '🎧 Talk to Agent', query: 'I need to speak with a human support agent.' },
        ];

        return (
            <div className="flex gap-2 flex-wrap mb-6">
                {actions.map((action, i) => (
                    <button
                        key={i}
                        onClick={() => handleSendMessage(undefined, action.query)}
                        disabled={isSending}
                        className="px-4 py-2 bg-orange-50 border border-orange-100 rounded-xl text-[11px] font-black text-orange-600 hover:bg-orange-100 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        {action.label}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-white flex" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundAttachment: 'fixed' }}>
            {/* Sidebar (Desktop) */}
            <div className="hidden md:block w-72 shrink-0">
                <Sidebar />
            </div>

            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <header className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Notifications & Support</h1>
                            <p className="text-gray-500 font-bold mt-1 uppercase text-xs tracking-widest">Stay Updated</p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
                        >
                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </header>

                    {/* Tabs */}
                    <div className="flex space-x-1 bg-white p-1 rounded-2xl shadow-sm border border-gray-100 mb-8 w-fit">
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'notifications'
                                ? 'bg-orange-50 text-orange-600 shadow-sm'
                                : 'text-gray-400 hover:text-gray-600'
                                } `}
                        >
                            Notifications
                            {notifications.filter(n => !n.read).length > 0 && (
                                <span className="ml-2 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                                    {notifications.filter(n => !n.read).length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('support')}
                            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'support'
                                ? 'bg-orange-50 text-orange-600 shadow-sm'
                                : 'text-gray-400 hover:text-gray-600'
                                } `}
                        >
                            Live Support
                        </button>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-gray-50 overflow-hidden min-h-[600px]">
                        {activeTab === 'notifications' ? (
                            <div className="flex flex-col h-full">
                                <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                                    <div className="flex space-x-2 items-center">
                                        <button
                                            onClick={() => markAllAsRead()}
                                            className="mr-4 text-xs font-bold text-orange-500 hover:text-orange-600"
                                        >
                                            Mark all read
                                        </button>
                                        <button
                                            onClick={() => setFilter('all')}
                                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={() => setFilter('unread')}
                                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filter === 'unread' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                        >
                                            Unread
                                        </button>
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-50 overflow-y-auto max-h-[600px]">
                                    {filteredNotifications.length === 0 ? (
                                        <div className="p-12 text-center text-gray-400">
                                            <p>No notifications found.</p>
                                        </div>
                                    ) : (
                                        filteredNotifications.map(notification => (
                                            <div
                                                key={notification.id}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-4 ${!notification.read ? 'bg-orange-50/30' : ''}`}
                                            >
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${notification.type === 'payment_received' ? 'bg-green-100 text-green-600' :
                                                    notification.type === 'withdrawal' ? 'bg-blue-100 text-blue-600' :
                                                        notification.type === 'system' ? 'bg-red-100 text-red-600' :
                                                            'bg-orange-100 text-orange-600'
                                                    }`}>
                                                    {notification.type === 'payment_received' && (
                                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                        </svg>
                                                    )}
                                                    {notification.type === 'withdrawal' && (
                                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                                        </svg>
                                                    )}
                                                    {notification.type === 'system' && (
                                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                    )}
                                                    {notification.type === 'payment_sent' && (
                                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className={`text-base font-bold ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                                            {notification.title}
                                                            {!notification.read && <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full inline-block align-middle"></span>}
                                                        </h3>
                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{notification.time}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                                                    {notification.amount && (
                                                        <p className={`text-sm font-black mt-2 ${notification.type === 'payment_request' ? 'text-purple-600' : notification.amount.startsWith('+') ? 'text-green-600' : notification.amount.startsWith('-') ? 'text-red-500' : 'text-gray-900'}`}>
                                                            {notification.amount}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-[600px]">
                                <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-tr from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/30 overflow-hidden shrink-0">
                                            {session?.agent_avatar ? (
                                                <img src={session.agent_avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">
                                                {session?.status === 'agent_active' ? session.agent_name : 'Live Support'}
                                            </h2>
                                            <p className="text-xs font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                                                <span className={`w-2 h-2 rounded-full ${session?.status === 'waiting_for_agent' ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></span>
                                                {session?.status === 'waiting_for_agent' ? 'Waiting for Agent' :
                                                    session?.status === 'agent_active' ? 'Human Agent Connected' : 'AI Assistant Online'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30">
                                    {chatMessages.map(msg => (
                                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                                {msg.sender !== 'user' && msg.sender !== 'system' && (
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">
                                                        {msg.sender === 'agent' ? (session?.agent_name || 'Support Agent') : 'AI Assistant'}
                                                    </span>
                                                )}
                                                <div className={`p-4 rounded-2xl ${msg.sender === 'user'
                                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 rounded-tr-none'
                                                    : msg.sender === 'system'
                                                        ? 'bg-gray-200 text-gray-600 text-center text-xs w-full py-2 rounded-full'
                                                        : 'bg-white text-gray-700 shadow-sm border border-gray-100 rounded-tl-none'
                                                    }`}>
                                                    <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                                                    <p className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${msg.sender === 'user' ? 'text-orange-200' : 'text-gray-400'
                                                        }`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <div className="p-6 bg-white border-t border-gray-100">
                                    <QuickActionButtons />
                                    <form onSubmit={handleSendMessage} className="flex gap-4">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type your message..."
                                            disabled={isSending}
                                            className="flex-1 bg-gray-50 border-transparent focus:border-orange-500/20 focus:bg-white rounded-2xl px-6 py-4 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim() || isSending}
                                            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-4 rounded-2xl transition-all shadow-lg shadow-orange-500/30 active:scale-95"
                                        >
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedNotification?.title || 'Notification Details'}
            >
                {selectedNotification && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedNotification.type === 'payment_received' ? 'bg-green-100 text-green-600' :
                                selectedNotification.type === 'withdrawal' ? 'bg-blue-100 text-blue-600' :
                                    selectedNotification.type === 'system' ? 'bg-red-100 text-red-600' :
                                        'bg-orange-100 text-orange-600'
                                }`}>
                                {/* Icons same as list */}
                                {selectedNotification.type === 'payment_received' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>}
                                {selectedNotification.type === 'withdrawal' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>}
                                {selectedNotification.type === 'system' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                                {selectedNotification.type === 'payment_sent' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900">{selectedNotification.title}</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedNotification.time}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message</label>
                            <div className="bg-white border border-gray-100 rounded-2xl p-6 font-medium text-gray-700 leading-relaxed shadow-sm">
                                {selectedNotification.message}
                            </div>
                        </div>

                        {selectedNotification.amount && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount</label>
                                <div className={`text-4xl font-black ${selectedNotification.type === 'payment_request' ? 'text-purple-600' : selectedNotification.amount.startsWith('+') ? 'text-green-600' : selectedNotification.amount.startsWith('-') ? 'text-red-500' : 'text-gray-900'}`}>
                                    {selectedNotification.amount}
                                </div>
                            </div>
                        )}

                        {getMetadata(selectedNotification).requestId && (
                            <div className="pt-4">
                                <Button
                                    onClick={() => {
                                        const metadata = getMetadata(selectedNotification);
                                        navigate(`/ pay - request / ${metadata.requestId} `);
                                        setIsModalOpen(false);
                                    }}
                                    fullWidth
                                    className="h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    Pay This Request Now
                                </Button>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <Button
                                variant="ghost"
                                className="flex-1 h-14 rounded-xl font-bold border border-gray-100"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
