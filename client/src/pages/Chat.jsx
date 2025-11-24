
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

    // Socket Setup
    useEffect(() => {
        if (!user?.id) return;

        console.log('🔌 Socket setup...');
        const newSocket = io("https://chatting-1-iel1.onrender.com");

        newSocket.on('connect', () => {
            console.log('✅ Connected');
            newSocket.emit('user_online', user.id);
        });

        newSocket.on('users_online', (userIds) => {
            setOnlineUsers(Array.isArray(userIds) ? userIds : []);
        });

        newSocket.on('receive_message', (data) => {
            console.log('💬 Message received');
            setMessages(prev => [...prev, {
                _id: data._id,
                sender: data.sender,
                text: data.text,
                seen: false,
                timestamp: data.timestamp
            }]);
        });

        // Listen for messages_seen
        newSocket.on('messages_seen', (data) => {
            console.log('👀 MESSAGES_SEEN received:', data);

            setMessages(prev =>
                prev.map(msg =>
                    msg.sender === user.id ? { ...msg, seen: true } : msg
                )
            );
        });

        newSocket.on('user_typing', () => setIsTyping(true));
        newSocket.on('user_stopped_typing', () => setIsTyping(false));

        setSocket(newSocket);

        return () => newSocket.disconnect();
    }, [user?.id]);

    // Fetch users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await authAPI.getUsers();
                setUsers(data || []);
            } catch (error) {
                console.error('Failed to fetch users');
            }
        };
        fetchUsers();
    }, []);

    // Fetch messages and emit mark_seen
    useEffect(() => {
        if (!selectedUser || !user?.id || !socket) return;

        const loadMessages = async () => {
            try {
                console.log('📨 Loading messages...');
                const { data } = await messageAPI.getMessages(selectedUser._id);
                setMessages(data || []);

                // ✅ Emit mark_seen AFTER loading
                console.log('👀 Emitting mark_seen');
                socket.emit('mark_seen', {
                    senderId: selectedUser._id,
                    receiverId: user.id
                });
                setMessages(prev =>
                    prev.map(msg =>
                        msg.receiver === user.id && msg.sender === selectedUser._id
                            ? { ...msg, seen: true }
                            : msg
                    )
                );
            } catch (error) {
                console.error('Failed to load messages');
            }
        };

        loadMessages();
    }, [selectedUser, user?.id, socket]);

    // Send message
    const handleSendMessage = useCallback((text) => {
        if (!socket || !selectedUser || !user?.id) return;

        socket.emit('send_message', {
            sender: user.id,
            receiver: selectedUser._id,
            text
        });

        setMessages(prev => [...prev, {
            _id: Date.now(),
            sender: user.id,
            text,
            seen: false,
            timestamp: new Date()
        }]);
    }, [socket, selectedUser, user?.id]);

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