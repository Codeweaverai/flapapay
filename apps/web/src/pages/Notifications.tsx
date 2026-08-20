import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    Bot,
    Clock3,
    Headphones,
    LifeBuoy,
    MessageSquareText,
    Send,
    Sparkles,
    UserRound
} from 'lucide-react';
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

const normalizeChatMessages = (payload: any): ChatMessage[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.messages)) return payload.messages;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
};

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
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
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
        setIsLoadingChat(true);
        setChatError(null);
        try {
            // 1. Get or Create Session
            const sessionRes = await api.post('/support/session');
            setSession(sessionRes.data);

            if (sessionRes.data?.id) {
                // 2. Join Socket Room
                socket?.emit('join_session', sessionRes.data.id);

                // 3. Load History
                const msgRes = await api.get(`/support/messages/${sessionRes.data.id}`);
                setChatMessages(normalizeChatMessages(msgRes.data));
            }
        } catch (err) {
            console.error('Failed to load chat', err);
            setChatMessages([]);
            setChatError('Unable to load support messages right now.');
        } finally {
            setIsLoadingChat(false);
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

    const formatWithdrawalNotificationMessage = (notification: any) => {
        if (notification.type !== 'withdrawal') return notification.message;
        const metadata = getMetadata(notification);
        const destinationDetails = metadata.destinationDetails || {};
        const bankName = String(destinationDetails.bankName || '').trim();
        const accountName = String(destinationDetails.accountName || '').trim();
        const accountNumber = String(destinationDetails.accountNumber || '').trim();
        const phoneNumber = String(destinationDetails.phoneNumber || '').trim();
        const provider = String(destinationDetails.provider || '').trim();
        const maskedAccount = accountNumber
            ? `••••${accountNumber.replace(/\D/g, '').slice(-4) || accountNumber.slice(-4)}`
            : '';
        const target =
            [bankName, accountName && maskedAccount ? `${accountName} ${maskedAccount}` : accountName].filter(Boolean).join(' • ')
            || [provider, phoneNumber].filter(Boolean).join(' • ')
            || notification.message;
        const status = String(metadata.status || '').toUpperCase();

        if (status === 'PENDING') return `Withdrawal to ${target} is being processed.`;
        if (status === 'COMPLETED') return `Withdrawal to ${target} completed successfully.`;
        if (status === 'FAILED') {
            return metadata.failureReason
                ? `Withdrawal to ${target} failed: ${metadata.failureReason}`
                : `Withdrawal to ${target} failed.`;
        }

        return notification.message;
    };

    const handleSendMessage = async (e?: React.FormEvent, manualMessage?: string) => {
        if (e) e.preventDefault();
        const msgToSend = manualMessage || newMessage;
        if (!msgToSend.trim() || !session) return;

        setIsSending(true);
        setChatError(null);
        try {
            await api.post('/support/message', {
                sessionId: session.id,
                content: msgToSend
            });
            setNewMessage('');
            // Refresh messages after sending
            const msgRes = await api.get(`/support/messages/${session.id}`);
            setChatMessages(normalizeChatMessages(msgRes.data));
            scrollToBottom();
        } catch (err) {
            console.error('Failed to send message', err);
            setChatError('Unable to send your message right now.');
        } finally {
            setIsSending(false);
        }
    };

    const QuickActionButtons = () => {
        const actions = [
            { label: 'Get Virtual Card', query: 'How do I get a virtual card?' },
            { label: 'KYC Status', query: 'What is my KYC verification status?' },
            { label: 'Deposit Problem', query: 'I have a problem with my mobile money deposit.' },
            { label: 'Talk to Agent', query: 'I need to speak with a human support agent.' },
        ];

        return (
            <div className="flex gap-2 flex-wrap">
                {actions.map((action, i) => (
                    <button
                        key={i}
                        onClick={() => handleSendMessage(undefined, action.query)}
                        disabled={isSending}
                        className="rounded-full border border-orange-200/80 bg-white/80 px-4 py-2 text-[11px] font-black text-orange-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 active:scale-95 disabled:opacity-50"
                    >
                        {action.label}
                    </button>
                ))}
            </div>
        );
    };

    const supportStatus = session?.status ?? 'active';
    const statusLabel = supportStatus === 'waiting_for_agent'
        ? 'Waiting for Agent'
        : supportStatus === 'agent_active'
            ? 'Human Agent Connected'
            : supportStatus === 'closed'
                ? 'Conversation Closed'
                : 'AI Assistant Online';
    const statusAccent = supportStatus === 'waiting_for_agent'
        ? 'bg-amber-500'
        : supportStatus === 'agent_active'
            ? 'bg-emerald-500'
            : supportStatus === 'closed'
                ? 'bg-slate-400'
                : 'bg-sky-500';
    const supportTitle = session?.status === 'agent_active' ? (session.agent_name || 'Support Agent') : 'Flapa Support';

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
                                                    <p className="text-sm text-gray-500 mt-1">{formatWithdrawalNotificationMessage(notification)}</p>
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
                            <div className="flex h-[680px] flex-col bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),linear-gradient(180deg,_#fff7ed_0%,_#fff_28%,_#fff_100%)]">
                                <div className="border-b border-orange-100/80 bg-white/70 px-6 py-6 backdrop-blur md:px-8">
                                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-amber-400 to-rose-500 text-white shadow-[0_18px_40px_-18px_rgba(249,115,22,0.9)]">
                                                {session?.agent_avatar ? (
                                                    <img src={session.agent_avatar} alt="" className="h-full w-full object-cover" />
                                                ) : session?.status === 'agent_active' ? (
                                                    <Headphones className="h-6 w-6" />
                                                ) : (
                                                    <Bot className="h-6 w-6" />
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-orange-600">
                                                        Live Support
                                                    </span>
                                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
                                                        <span className={`h-2.5 w-2.5 rounded-full ${statusAccent}${supportStatus !== 'closed' ? ' animate-pulse' : ''}`}></span>
                                                        {statusLabel}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-black tracking-tight text-slate-950">{supportTitle}</h2>
                                                    <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
                                                        Ask about failed deposits, card access, KYC, settlements, or request a human agent when the AI assistant is not enough.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 md:min-w-[320px]">
                                            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                                                <div className="mb-2 flex items-center gap-2 text-slate-400">
                                                    <Clock3 className="h-4 w-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.22em]">Response</span>
                                                </div>
                                                <p className="text-sm font-black text-slate-900">Live</p>
                                                <p className="text-xs font-medium text-slate-500">Messages update in real time</p>
                                            </div>
                                            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                                                <div className="mb-2 flex items-center gap-2 text-slate-400">
                                                    <Sparkles className="h-4 w-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.22em]">Mode</span>
                                                </div>
                                                <p className="text-sm font-black text-slate-900">
                                                    {supportStatus === 'agent_active' ? 'Human' : 'AI First'}
                                                </p>
                                                <p className="text-xs font-medium text-slate-500">Escalates when needed</p>
                                            </div>
                                            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                                                <div className="mb-2 flex items-center gap-2 text-slate-400">
                                                    <MessageSquareText className="h-4 w-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.22em]">Messages</span>
                                                </div>
                                                <p className="text-sm font-black text-slate-900">{chatMessages.length}</p>
                                                <p className="text-xs font-medium text-slate-500">Visible in this thread</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
                                    <div className="mx-auto flex max-w-4xl flex-col gap-4">
                                        <div className="flex items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-white/75 px-4 py-3 shadow-sm backdrop-blur">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                                                    <LifeBuoy className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">Support thread</p>
                                                    <p className="text-xs font-medium text-slate-500">
                                                        {supportStatus === 'waiting_for_agent'
                                                            ? 'A human agent has been requested and will join this chat.'
                                                            : supportStatus === 'agent_active'
                                                                ? 'You are now connected to a human support specialist.'
                                                                : 'The AI assistant can answer common account and payment questions instantly.'}
                                                    </p>
                                                </div>
                                            </div>
                                            {session?.id && (
                                                <div className="hidden rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white md:block">
                                                    Session {session.id.slice(0, 8)}
                                                </div>
                                            )}
                                        </div>
                                    {chatError && (
                                        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                            <span>{chatError}</span>
                                        </div>
                                    )}
                                    {isLoadingChat && (
                                        <div className="space-y-3 rounded-[28px] border border-orange-100 bg-white/70 p-5 shadow-sm">
                                            <div className="h-4 w-40 animate-pulse rounded-full bg-orange-100" />
                                            <div className="h-16 animate-pulse rounded-3xl bg-slate-100" />
                                            <div className="ml-auto h-14 w-3/4 animate-pulse rounded-3xl bg-orange-100/70" />
                                        </div>
                                    )}
                                    {chatMessages.length === 0 && !chatError && !isLoadingChat && (
                                        <div className="rounded-[32px] border border-dashed border-orange-200 bg-white/80 px-6 py-12 text-center shadow-sm">
                                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                                                <MessageSquareText className="h-7 w-7" />
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900">Start the conversation</h3>
                                            <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-500">
                                                Send a message below or use one of the quick actions to get instant help without leaving this page.
                                            </p>
                                        </div>
                                    )}
                                    {normalizeChatMessages(chatMessages).map(msg => (
                                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[88%] md:max-w-[78%] ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                                                {msg.sender !== 'system' && (
                                                    <div className={`mb-1.5 flex items-center gap-2 px-1 ${msg.sender === 'user' ? 'self-end text-slate-400' : 'self-start text-slate-500'}`}>
                                                        <div className={`flex h-7 w-7 items-center justify-center rounded-full ${msg.sender === 'user' ? 'bg-slate-900 text-white' : msg.sender === 'agent' ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'}`}>
                                                            {msg.sender === 'user' ? <UserRound className="h-3.5 w-3.5" /> : msg.sender === 'agent' ? <Headphones className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.22em]">
                                                            {msg.sender === 'user' ? 'You' : msg.sender === 'agent' ? (session?.agent_name || 'Support Agent') : 'AI Assistant'}
                                                        </span>
                                                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={`rounded-[24px] px-4 py-3.5 ${msg.sender === 'user'
                                                    ? 'rounded-br-md bg-slate-900 text-white shadow-[0_18px_40px_-18px_rgba(15,23,42,0.9)]'
                                                    : msg.sender === 'system'
                                                        ? 'w-full rounded-full bg-amber-100/80 py-2 text-center text-xs font-bold text-amber-700'
                                                        : msg.sender === 'agent'
                                                            ? 'rounded-bl-md border border-emerald-100 bg-emerald-50 text-emerald-950 shadow-sm'
                                                            : 'rounded-bl-md border border-sky-100 bg-white text-slate-700 shadow-sm'
                                                    }`}>
                                                    <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                    <div ref={messagesEndRef} />
                                </div>
                                <div className="border-t border-orange-100/80 bg-white/85 px-4 py-3 backdrop-blur md:px-6 md:py-4">
                                    <div className="mx-auto max-w-4xl">
                                        <div className="mb-3 flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Quick Actions</p>
                                                <p className="mt-0.5 text-xs font-medium text-slate-500">Use a shortcut or type a detailed message.</p>
                                            </div>
                                            <div className="hidden items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-bold text-orange-700 md:flex">
                                                <Sparkles className="h-4 w-4" />
                                                Human escalation available
                                            </div>
                                        </div>
                                        <QuickActionButtons />
                                        <form onSubmit={handleSendMessage} className="mt-3 flex flex-col gap-3 md:flex-row md:items-end">
                                            <div className="flex-1 rounded-[24px] border border-slate-200 bg-slate-50/80 p-2 shadow-inner shadow-slate-100">
                                                <textarea
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    placeholder="Describe your issue clearly. Include amount, currency, date, or the action that failed."
                                                    disabled={isSending}
                                                    rows={2}
                                                    className="min-h-[64px] w-full resize-none bg-transparent px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={!newMessage.trim() || isSending}
                                                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 font-black text-white shadow-[0_18px_40px_-18px_rgba(15,23,42,0.9)] transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Send className="h-4 w-4" />
                                                {isSending ? 'Sending...' : 'Send Message'}
                                            </button>
                                        </form>
                                        <p className="mt-2 text-[11px] font-medium text-slate-400">
                                            For faster support, mention the transaction type, exact amount, and what you expected to happen.
                                        </p>
                                    </div>
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
                                {formatWithdrawalNotificationMessage(selectedNotification)}
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
