import React, { useState, useEffect, useRef } from 'react';
import {
    MessageSquare,
    User,
    Send,
    Clock,
    AlertCircle,
    UserCheck,
    XCircle,
    CheckCircle
} from 'lucide-react';
import { api } from '../../lib/axios';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button } from '../../components/ui/Button';

interface ChatMessage {
    id: string;
    session_id: string;
    sender: 'user' | 'ai' | 'agent' | 'system';
    content: string;
    created_at: string;
}

interface SupportSession {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    user_avatar?: string;
    agent_id?: string;
    status: 'active' | 'waiting_for_agent' | 'agent_active' | 'closed';
    updated_at: string;
}

export const LiveChatTab: React.FC = () => {
    const { socket } = useNotifications();
    const [sessions, setSessions] = useState<SupportSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<SupportSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchSessions = async () => {
        try {
            const res = await api.get('/admin/support/sessions');
            setSessions(res.data);

            // Update selected session data if it exists in the list
            if (selectedSession) {
                const updated = res.data.find((s: SupportSession) => s.id === selectedSession.id);
                if (updated) setSelectedSession(updated);
            }
        } catch (err) {
            console.error('Failed to fetch sessions', err);
        }
    };

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 5000); // Poll for session updates
        return () => clearInterval(interval);
    }, [selectedSession?.id]);

    useEffect(() => {
        if (selectedSession) {
            loadMessages(selectedSession.id);
            socket?.emit('join_session', selectedSession.id);
        }
    }, [selectedSession?.id]);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (msg: any) => {
            if (selectedSession && msg.session_id === selectedSession.id) {
                setMessages(prev => {
                    // Prevent duplicates if already polling/loading
                    if (prev.find(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
            // Trigger refresh for status/updated_at
            fetchSessions();
        };

        socket.on('new_message', handleNewMessage);
        return () => {
            socket.off('new_message');
        };
    }, [socket, selectedSession?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const loadMessages = async (sessionId: string) => {
        try {
            const res = await api.get(`/support/messages/${sessionId}`);
            setMessages(res.data);
        } catch (err) {
            console.error('Failed to load messages', err);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedSession) return;

        try {
            await api.post('/support/message', {
                sessionId: selectedSession.id,
                content: newMessage
            });
            setNewMessage('');
        } catch (err) {
            console.error('Failed to send message', err);
        }
    };

    const handleTakeover = async () => {
        if (!selectedSession) return;
        try {
            await api.post(`/admin/support/sessions/${selectedSession.id}/takeover`);
            fetchSessions();
        } catch (err) {
            console.error('Takeover failed', err);
        }
    };

    const handleClose = async () => {
        if (!selectedSession) return;
        if (!confirm('Are you sure you want to close this session?')) return;
        try {
            await api.post(`/admin/support/sessions/${selectedSession.id}/close`);
            fetchSessions();
            setSelectedSession(null);
        } catch (err) {
            console.error('Close failed', err);
        }
    };

    const handleComplete = async () => {
        if (!selectedSession) return;
        try {
            await api.post(`/admin/support/sessions/${selectedSession.id}/complete`);
            fetchSessions();
        } catch (err) {
            console.error('Complete failed', err);
        }
    };

    return (
        <div className="flex bg-black border border-white/10 rounded-[40px] overflow-hidden h-[700px] shadow-2xl">
            {/* Sidebar: Sessions List */}
            <div className="w-80 border-r border-white/10 flex flex-col bg-zinc-950/50">
                <div className="p-6 border-b border-white/5">
                    <h3 className="font-black text-white text-lg flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-orange-500" />
                        Live Sessions
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {sessions.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setSelectedSession(s)}
                            className={`w-full text-left p-6 hover:bg-white/5 transition-all border-b border-white/5 group ${selectedSession?.id === s.id ? 'bg-orange-500/10 border-r-4 border-r-orange-500' : ''}`}
                        >
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 overflow-hidden border border-white/10 group-hover:border-orange-500/50 transition-colors">
                                    {s.user_avatar ? (
                                        <img src={s.user_avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-orange-500">
                                            <User className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-white text-sm truncate uppercase tracking-tight">{s.user_name}</h4>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        {s.status === 'active' && <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                                        {s.status === 'waiting_for_agent' && <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.5)]" />}
                                        {s.status === 'agent_active' && <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />}
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest truncate">
                                            {s.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-gray-600 font-bold uppercase tracking-tighter">
                                <span>{new Date(s.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {s.status === 'waiting_for_agent' && <span className="text-orange-500 animate-bounce">Needs Attention</span>}
                            </div>
                        </button>
                    ))}
                    {sessions.length === 0 && (
                        <div className="p-12 text-center mt-20">
                            <Clock className="w-8 h-8 text-gray-700 mx-auto mb-4 opacity-20" />
                            <p className="text-gray-600 font-bold text-sm tracking-tight italic">Waiting for incoming support requests...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-zinc-900/20">
                {selectedSession ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-800 overflow-hidden border border-white/10">
                                    {selectedSession.user_avatar ? (
                                        <img src={selectedSession.user_avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-700">
                                            <User className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase tracking-tight">{selectedSession.user_name}</h3>
                                    <p className="text-xs text-gray-500 font-bold">{selectedSession.user_email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {selectedSession.status === 'waiting_for_agent' && (
                                    <Button
                                        onClick={handleTakeover}
                                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black px-6 shadow-xl shadow-orange-500/20 active:scale-95 transition-all text-xs flex items-center gap-2"
                                    >
                                        <UserCheck className="w-4 h-4" />
                                        Take Over
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={handleClose}
                                    className="border-white/10 text-gray-400 hover:text-red-500 hover:border-red-500/50 rounded-2xl font-black px-6 text-xs flex items-center gap-2 transition-all h-10 px-4"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Close
                                </Button>
                                {selectedSession.status === 'agent_active' && (
                                    <Button
                                        onClick={handleComplete}
                                        className="bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black px-6 shadow-xl shadow-green-500/20 active:scale-95 transition-all text-xs flex items-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Complete & Ask Review
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Messages Flow */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-black/10">
                            {messages.map((m) => {
                                const isSystem = m.sender === 'system';
                                const isAgent = m.sender === 'agent';

                                if (isSystem) {
                                    return (
                                        <div key={m.id} className="flex justify-center my-8">
                                            <span className="px-6 py-2 bg-white/5 border border-white/5 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                <AlertCircle className="w-3 h-3" />
                                                {m.content}
                                            </span>
                                        </div>
                                    );
                                }
                                return (
                                    <div key={m.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] group ${isAgent ? 'items-end' : 'items-start'} flex flex-col`}>
                                            <div className="flex items-center gap-2 mb-2 px-2">
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                    {isAgent ? 'You' : m.sender === 'ai' ? 'AI Assistant' : selectedSession.user_name}
                                                </span>
                                                <span className="text-[10px] text-gray-700 font-bold">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className={`px-6 py-4 rounded-[28px] font-bold text-sm leading-relaxed shadow-xl ${isAgent
                                                ? 'bg-orange-500 text-white rounded-tr-none shadow-orange-500/10'
                                                : m.sender === 'ai'
                                                    ? 'bg-zinc-800 text-gray-400 border border-white/5 rounded-tl-none italic'
                                                    : 'bg-white/10 text-white border border-white/5 rounded-tl-none shadow-black/20'
                                                }`}>
                                                {m.content}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-8 bg-black/40 border-t border-white/10 backdrop-blur-md">
                            <form onSubmit={handleSendMessage} className="flex gap-4">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={selectedSession.status === 'agent_active' ? "Type your reply..." : "Take over conversation to respond..."}
                                    disabled={selectedSession.status !== 'agent_active'}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all disabled:opacity-30 disabled:cursor-not-allowed placeholder:text-gray-600"
                                />
                                <Button
                                    type="submit"
                                    disabled={!newMessage.trim() || selectedSession.status !== 'agent_active'}
                                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-white/5 disabled:text-gray-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-orange-500/20 transition-all flex items-center gap-2"
                                >
                                    <Send className="w-5 h-5" />
                                    Send
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-32 h-32 bg-orange-500/5 rounded-[48px] flex items-center justify-center mb-10 group">
                            <MessageSquare className="w-16 h-16 text-orange-500 opacity-20 group-hover:opacity-50 transition-all duration-700" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Support Command Center</h2>
                        <p className="text-gray-500 font-bold max-w-sm leading-relaxed">Select a session from the sidebar to engage with users and manage support tickets in real-time.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
