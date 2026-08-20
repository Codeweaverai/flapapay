import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { api } from '../lib/axios';
import { API_BASE } from '../lib/runtime';

interface Notification {
    id: string;
    type: 'payment_received' | 'payment_sent' | 'system' | 'withdrawal' | 'payment_request';
    title: string;
    message: string;
    time: string;
    read: boolean;
    amount?: string;
    created_at?: string;
}

interface NotificationContextType {
    socket: Socket | null;
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const unreadCount = notifications.filter(n => !n.read).length;
    const normalizeNotifications = (payload: any) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.notifications)) return payload.notifications;
        if (Array.isArray(payload?.data)) return payload.data;
        return [];
    };

    useEffect(() => {
        if (token && user) {
            // Initialize Socket
            const newSocket = io(API_BASE, {
                transports: ['polling'],
                upgrade: false
            });
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('Socket connected');
                newSocket.emit('join_user', user.id);
            });

            newSocket.on('new_notification', (notification: any) => {
                // Play sound
                const audio = new Audio('/assets/sounds/notification.mp3');
                audio.play().catch(e => console.log('Audio play failed', e));

                setNotifications(prev => [
                    {
                        ...notification,
                        time: 'Just now', // You might want to format this better
                        read: false
                    },
                    ...prev
                ]);
            });

            // Fetch initial notifications
            fetchNotifications();

            return () => {
                newSocket.disconnect();
            };
        }
    }, [token, user]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            // Transform DB notifications to UI format if needed
            // For now assuming DB structure matches UI or is close enough
            // We might need to map `created_at` to `time` string
            const mapped = normalizeNotifications(res.data).map((n: any) => ({
                ...n,
                read: n.is_read,
                time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));
            setNotifications(mapped);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (err) {
            console.error('Failed to mark read', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Failed to mark all read', err);
        }
    };

    const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
        console.log(`[Notification ${type}] ${message}`);
        // Simple alert for errors in dev, otherwise just log
        if (type === 'error') {
            alert(message);
        }
    };

    return (
        <NotificationContext.Provider value={{
            socket,
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            showNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
