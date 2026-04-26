import { useEffect, useRef, useCallback } from 'react';
import { io as socketIo } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

export type ConnectEventType =
    | 'kyc.approved' | 'kyc.rejected'
    | 'dispute.updated'
    | 'payout.completed' | 'payout.failed'
    | 'account.activated' | 'account.suspended';

export interface ConnectEvent {
    type: ConnectEventType;
    account_id?: string;
    dispute_id?: string;
    doc_id?: string;
    status?: string;
    timestamp: string;
}

/**
 * Subscribe to real-time Connect events via Socket.io.
 * Uses the existing NotificationContext socket — no new connection needed.
 *
 * @example
 * useConnectSocket((event) => {
 *   if (event.type === 'kyc.approved') refreshAccounts();
 * });
 */
export function useConnectSocket(onEvent: (event: ConnectEvent) => void) {
    const { token } = useAuth();
    const socketRef = useRef<any>(null);
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;

    const handleEvent = useCallback((data: ConnectEvent) => {
        onEventRef.current(data);
    }, []);

    useEffect(() => {
        if (!token) return;

        // Re-use existing socket or create a lightweight one
        const socket = socketIo(import.meta.env.VITE_API_URL || 'http://localhost:3005', {
            transports: ['websocket'],
            upgrade: false,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            // The server rooms are keyed by user ID — join via user JWT
            socket.emit('join_user_token', token);
        });

        socket.on('connect_event', handleEvent);

        return () => {
            socket.off('connect_event', handleEvent);
            socket.disconnect();
        };
    }, [token, handleEvent]);
}
