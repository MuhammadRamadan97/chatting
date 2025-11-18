import React, { useState, useEffect, useRef } from "react";
import "./MessageInput.css";

const MessageInput = ({ onSendMessage, onTyping, onStopTyping }) => {
    const [text, setText] = useState("");
    const typingTimeoutRef = useRef(null);

    const handleChange = (e) => {
        setText(e.target.value);

        // Notify typing
        onTyping();

        // Clear previous timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // Stop typing after 1.5s of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            onStopTyping();
        }, 1500);
    };

    const handleSend = () => {
        if (text.trim() === "") return;

        onSendMessage(text.trim());
        setText("");

        // Stop typing immediately after sending
        onStopTyping();
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    return (
        <div className="message-input">
            <textarea
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={3}
            />
            <button onClick={handleSend}>Send</button>
        </div>
    );
};

export default MessageInput;
