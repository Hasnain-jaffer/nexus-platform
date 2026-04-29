/**
 * src/hooks/useSocket.ts
 *
 * Thin hook that reads the live socket from SocketContext.
 * Import and use this in any component that needs real-time events.
 *
 * Usage:
 *   const { socket, isConnected } = useSocket();
 *   useEffect(() => {
 *     socket?.on('new_message', handler);
 *     return () => { socket?.off('new_message', handler); };
 *   }, [socket]);
 */
import { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';

export const useSocket = () => useContext(SocketContext);
