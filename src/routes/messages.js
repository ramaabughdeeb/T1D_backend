const express = require('express');
const router = express.Router();

const Message = require('../models/Message');
const User = require('../models/User');

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

// Get all conversations for one user
// مهم: لازم يكون هذا الراوت قبل /:user1/:user2
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: userId },
        { receiverId: userId },
      ],
    })
      .populate('senderId', 'firstName lastName email role')
      .populate('receiverId', 'firstName lastName email role')
      .sort({ createdAt: -1 });

    const conversationsMap = new Map();

    messages.forEach((msg) => {
      const sender = msg.senderId;
      const receiver = msg.receiverId;

      if (!sender || !receiver) return;

      const otherUser =
        sender._id.toString() === userId.toString() ? receiver : sender;

      if (!otherUser) return;

      const otherUserId = otherUser._id.toString();

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          user: otherUser,
          lastMessage: msg.message,
          lastMessageAt: msg.createdAt,
          isRead: msg.isRead,
        });
      }
    });

    return res.status(200).json({
      conversations: Array.from(conversationsMap.values()),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error getting conversations',
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
// Mark conversation messages as read
router.put('/read/:user1/:user2', async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    await Message.updateMany(
      {
        senderId: user2,
        receiverId: user1,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    return res.status(200).json({
      message: 'Messages marked as read',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error marking messages as read',
      error: error.message,
    });
  }
});

module.exports = router;