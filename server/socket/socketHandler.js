const Message = require('../models/Message');

let onlineUsers = new Map();

const setupSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('🔌 User connected:', socket.id);

        // User comes online
        socket.on('user_online', (userId) => {
            onlineUsers.set(userId, socket.id);
            console.log(`✅ ${userId} online`);
            io.emit('users_online', Array.from(onlineUsers.keys()));
        });

        // Send message
        socket.on('send_message', async (data) => {
            const { sender, receiver, text } = data;
            try {
                const message = new Message({ sender, receiver, text, seen: false });
                await message.save();

                const receiverSocketId = onlineUsers.get(receiver);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('receive_message', {
                        _id: message._id,
                        sender,
                        text,
                        seen: false,
                        timestamp: new Date()
                    });
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });

        // Mark messages as seen (called from frontend)
        socket.on('mark_seen', async ({ senderId, receiverId }) => {
            console.log('\n📌 mark_seen event received');
            console.log('   Sender:', senderId);
            console.log('   Receiver:', receiverId);

            try {
                const result = await Message.updateMany(
                    { sender: senderId, receiver: receiverId, seen: false },
                    { $set: { seen: true } }
                );
                console.log(`   ✅ Marked ${result.modifiedCount} as seen`);

                const senderSocketId = onlineUsers.get(senderId);
                const receiverSocketId = onlineUsers.get(receiverId);

                // Emit to sender (original sender sees ✓✓)
                if (senderSocketId) {
                    io.to(senderSocketId).emit('messages_seen', {
                        by: receiverId,
                        senderId,
                        receiverId,
                        count: result.modifiedCount,
                    });
                    console.log('   📤 emitted messages_seen to SENDER');
                }

                // Emit to receiver (so they instantly reflect seen state)
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('messages_seen', {
                        by: receiverId,
                        senderId,
                        receiverId,
                        count: result.modifiedCount,
                    });
                    console.log('   📤 emitted messages_seen to RECEIVER');
                }

                console.log('   ✅ Event sent\n');
            } catch (error) {
                console.error('Error:', error);
            }
        });

        // Typing
        socket.on('typing', (data) => {
            const receiverSocketId = onlineUsers.get(data.receiver);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('user_typing', {});
            }
        });

        socket.on('stop_typing', (data) => {
            const receiverSocketId = onlineUsers.get(data.receiver);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('user_stopped_typing', {});
            }
        });

        // Disconnect
        socket.on('disconnect', () => {
            onlineUsers.forEach((sid, uid) => {
                if (sid === socket.id) onlineUsers.delete(uid);
            });
            io.emit('users_online', Array.from(onlineUsers.keys()));
        });
    });
};

module.exports = setupSocket;