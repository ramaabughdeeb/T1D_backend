const express = require('express');
const router = express.Router();

const Message = require('../models/Message');

// Send message
router.post('/', async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;

    if (!senderId || !receiverId || !message) {
      return res.status(400).json({
        message: 'senderId, receiverId, and message are required',
      });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      message,
    });

    return res.status(201).json(newMessage);
  } catch (error) {
    return res.status(500).json({
      message: 'Error sending message',
      error: error.message,
    });
  }
});

// Get conversation between two users
router.get('/:user1/:user2', async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    const messages = await Message.find({
      $or: [
        {
          senderId: user1,
          receiverId: user2,
        },
        {
          senderId: user2,
          receiverId: user1,
        },
      ],
    }).sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({
      message: 'Error getting messages',
      error: error.message,
    });
  }
});
// Delete message
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!messageId || !userId) {
      return res.status(400).json({
        message: 'messageId and userId are required',
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        message: 'Message not found',
      });
    }

    // بس اللي بعت الرسالة بقدر يحذفها
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'You can only delete your own messages',
      });
    }

    await Message.findByIdAndDelete(messageId);

    return res.status(200).json({
      message: 'Message deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error deleting message',
      error: error.message,
    });
  }
});

module.exports = router;