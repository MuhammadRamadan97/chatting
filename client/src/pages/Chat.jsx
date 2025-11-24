import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { authAPI, messageAPI } from '../services/api';
import ChatBox from '../components/ChatBox';
import UserList from '../components/UserList';
import './Chat.css';

const Chat = () => {
    const { user, logout } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const navigate = useNavigate();

    // █████ SOCKET SETUP █████
    useEffect(() => {
        if (!user?.id) return;

        console.log('🔌 Connecting socket...');
        const newSocket = io("https://chatting-1-iel1.onrender.com");

        newSocket.on('connect', () => {
            console.log('✅ Socket connected');
            newSocket.emit('user_online', user.id);
        });

        setSocket(newSocket);
        return () => newSocket.disconnect();
    }, [user?.id]);

    // █████ SOCKET EVENT LISTENERS █████
    useEffect(() => {
        if (!socket) return;

        // Online users update
        socket.on('users_online', (userIds) => {
            setOnlineUsers(Array.isArray(userIds) ? userIds : []);
        });

        // Receive message
        socket.on('receive_message', (data) => {
            console.log('💬 Message received:', data);
            setMessages(prev => [
                ...prev,
                {
                    _id: data._id,
                    sender: data.sender,
                    text: data.text,
                    seen: false,
                    timestamp: data.timestamp,
                    receiver: data.receiver,
                },
            ]);
        });

        // Seen event
        socket.on('messages_seen', (data) => {
            console.log('👀 messages_seen event received:', data);

            setMessages(prev =>
                prev.map(msg => {
                    const seenByReceiver = msg.sender === user?.id && msg.receiver === data.by;
                    const seenBySender = msg.receiver === user?.id && msg.sender === data.by;

                    if (seenByReceiver || seenBySender) {
                        return { ...msg, seen: true };
                    }

                    return msg;
                })
            );
        });

        // Typing indicators
        socket.on('user_typing', () => setIsTyping(true));
        socket.on('user_stopped_typing', () => setIsTyping(false));

        // Cleanup listeners
        return () => {
            socket.off('users_online');
            socket.off('receive_message');
            socket.off('messages_seen');
            socket.off('user_typing');
            socket.off('user_stopped_typing');
        };
    }, [socket, user?.id]);

    // █████ FETCH USERS █████
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await authAPI.getUsers();
                setUsers(data || []);
            } catch (error) {
                console.error('⚠️ Failed to fetch users:', error);
            }
        };
        fetchUsers();
    }, []);

    // █████ FETCH MESSAGES & EMIT MARK_SEEN █████
    useEffect(() => {
        if (!selectedUser || !user?.id || !socket) return;

        const loadMessages = async () => {
            try {
                console.log('📨 Loading messages...');
                const { data } = await messageAPI.getMessages(selectedUser._id);
                setMessages(data || []);

                // Emit mark_seen immediately
                console.log('👀 Emitting mark_seen');
                socket.emit('mark_seen', {
                    senderId: selectedUser._id,
                    receiverId: user.id,
                });

                // Optimistic UI update
                setMessages(prev =>
                    prev.map(msg =>
                        msg.sender === selectedUser._id && msg.receiver === user.id
                            ? { ...msg, seen: true }
                            : msg
                    )
                );
            } catch (error) {
                console.error('⚠️ Failed to load messages:', error);
            }
        };

        loadMessages();
    }, [selectedUser, user?.id, socket]);

    // █████ SEND MESSAGE █████
    const handleSendMessage = useCallback((text) => {
        if (!socket || !selectedUser || !user?.id) return;

        socket.emit('send_message', {
            sender: user.id,
            receiver: selectedUser._id,
            text,
        });

        setMessages(prev => [
            ...prev,
            {
                _id: Date.now(),
                sender: user.id,
                receiver: selectedUser._id,
                text,
                seen: false,
                timestamp: new Date(),
            },
        ]);
    }, [socket, selectedUser, user?.id]);

    // █████ TYPING EVENTS █████
    const handleTyping = useCallback(() => {
        if (socket && selectedUser) {
            socket.emit('typing', { receiver: selectedUser._id });
        }
    }, [socket, selectedUser]);

    const handleStopTyping = useCallback(() => {
        if (socket && selectedUser) {
            socket.emit('stop_typing', { receiver: selectedUser._id });
        }
    }, [socket, selectedUser]);

    // █████ LOGOUT █████
    const handleLogout = () => {
        if (socket) socket.disconnect();
        logout();
        navigate('/login');
    };

    return (
        <div className="chat-container">
            <div className="header">
                <h1>💬 Chat App</h1>
                <div className="user-info">
                    <span>{user?.username}</span>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </div>

            <div className="chat-wrapper">
                <UserList
                    users={users}
                    selectedUser={selectedUser}
                    onlineUsers={onlineUsers}
                    onSelectUser={setSelectedUser}
                />

                <ChatBox
                    selectedUser={selectedUser}
                    messages={messages}
                    currentUser={user}
                    onSendMessage={handleSendMessage}
                    onTyping={handleTyping}
                    onStopTyping={handleStopTyping}
                    isTyping={isTyping}
                />
            </div>
        </div>
    );
};

export default Chat;