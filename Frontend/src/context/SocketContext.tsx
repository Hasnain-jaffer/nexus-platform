/**
 * src/context/SocketContext.tsx
 *
 * Manages a single Socket.IO connection for the entire app.
 * The socket is created when a user logs in and destroyed on logout.
 *
 * Wrap <SocketProvider> inside <AuthProvider> in main.tsx so it can read
 * the JWT token from AuthContext.
 */
import React, { createContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

// ── Context shape ──────────────────────────────────────────────────────────
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  /** Emit an event — safe to call even before the socket is ready */
  emit: (event: string, data?: unknown) => void;
  /** Subscribe to an event; returns an unsubscribe function */
  on: (event: string, callback: (...args: any[]) => void) => () => void;
}

const defaultCtx: SocketContextType = {
  socket: null,
  isConnected: false,
  emit: () => {},
  on: () => () => {},
};

export const SocketContext = createContext<SocketContextType>(defaultCtx);

// ── Provider ───────────────────────────────────────────────────────────────
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect when a logged-in user with a JWT token is present
    if (!user?.token) {
      // If there's an existing socket, disconnect it (user logged out)
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Avoid creating a second socket if one already exists
    if (socketRef.current?.connected) return;

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    const socket = io(SOCKET_URL, {
      // Pass JWT so the backend middleware can authenticate the socket
      auth: { token: user.token },
      // Reconnect automatically with exponential back-off
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [user?.token]); // re-run only when the token changes (login / logout)

  // ── Stable helper: emit ──────────────────────────────────────────────────
  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  // ── Stable helper: on (returns an off function) ──────────────────────────
  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.on(event, callback);
    return () => {
      socketRef.current?.off(event, callback);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, emit, on }}>
      {children}
    </SocketContext.Provider>
  );
};
