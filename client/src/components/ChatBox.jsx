import React, { useRef, useEffect } from 'react';
import MessageInput from './MessageInput';
import './ChatBox.css';

const ChatBox = ({
    selectedUser,
    messages = [],
    currentUser,
    onSendMessage,
    onTyping,
    onStopTyping,
    isTyping
}) => {
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!selectedUser) {
        return (
            <div className="chat-box empty">
                <p>👈 Select a contact to start chatting</p>
            </div>
        );
    }

    return (
        <div className="chat-box">
            <div className="chat-header">
                <h3>💬 {selectedUser.username}</h3>
            </div>

            <div className="messages">
                {messages.length > 0 ? (
                    messages.map((msg, idx) => {
                        const isSent = msg.sender === currentUser?.id;

                        return (
                            <div key={msg._id || `${msg.sender}-${msg.timestamp}`} className={`message ${isSent ? 'sent' : 'received'}`}>
                                <p>{msg.text}</p>
                                <span className="timestamp">
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}

                                    {isSent && (
                                        <span className={`check ${msg.seen ? 'seen' : ''}`}>
                                            {msg.seen ? '✓✓' : '✓'}
                                        </span>
                                    )}
                                </span>
                            </div>
                        );
                    })
                ) : (
                    <p className="no-messages">No messages yet. Start chatting! 👋</p>
                )}

                {isTyping && <div className="typing">✏️ typing...</div>}
                <div ref={messagesEndRef} />
            </div>

            <MessageInput
                onSendMessage={onSendMessage}
                onTyping={onTyping}
                onStopTyping={onStopTyping}
            />
        </div>
    );
};

export default ChatBox;