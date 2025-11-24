import { useEffect, useRef } from "react";
import { io } from 'socket.io-client';

export const useSocket = (user) => {
    const socketRef = useRef(null);

    useEffect(() => {
        if (!user?.id) return;

        console.log('🔌 Initializing Socket.io...');

        const socket = io("https://chatting-1-iel1.onrender.com", {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            console.log('✅ Socket connected');
            socketRef.emit('user_online', user.id);
        });

        socket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
        });

        return () => {
            socket.disconnect();
        }
    }, [user?.id]);

    return socketRef.current;
};

