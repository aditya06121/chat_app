const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Send a direct message via REST (fallback to socket)
router.post('/direct/:recipientId', requireAuth, async (req, res) => {
  const { recipientId } = req.params;
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'Missing body' });
  const participants = [req.user._id.toString(), recipientId].sort();
  let conversation = await Conversation.findOne({ participants });
  if (!conversation) {
    conversation = await Conversation.create({ participants, isDirect: true });
  }
  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    recipient: recipientId,
    body,
  });
  conversation.lastMessageAt = new Date();
  await conversation.save();
  res.json({
    conversationId: conversation._id.toString(),
    message: {
      id: message._id.toString(),
      body: message.body,
      sender: message.sender.toString(),
      recipient: message.recipient.toString(),
      createdAt: message.createdAt,
    },
  });
});

module.exports = router;


