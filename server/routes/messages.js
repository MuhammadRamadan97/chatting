const express = require('express');
const auth = require('../middleware/auth');
const Message = require('../models/Message');

const router = express.Router();

// Get messages between two users
router.get('/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;

        // Get messages WITHOUT marking as seen yet
        const messages = await Message.find({
            $or: [
                { sender: req.user.id, receiver: userId },
                { sender: userId, receiver: req.user.id }
            ]
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch messages', error });
    }
});

// Save message
router.post('/', auth, async (req, res) => {
    try {
        const { receiver, text } = req.body;
        const message = new Message({
            sender: req.user.id,
            receiver,
            text,
            seen: false
        });
        await message.save();
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: 'Failed to save message', error });
    }
});

module.exports = router;