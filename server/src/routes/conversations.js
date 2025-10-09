const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// List direct conversations for current user
router.get('/', requireAuth, async (req, res) => {
  const conversations = await Conversation.find({
    isDirect: true,
    participants: req.user._id,
  })
    .sort({ lastMessageAt: -1 })
    .limit(50)
    .lean();
  res.json(
    conversations.map((c) => ({
      id: c._id.toString(),
      participants: c.participants.map((p) => p.toString()),
      lastMessageAt: c.lastMessageAt,
    }))
  );
});

// Get or create direct conversation with a user
router.post('/with/:otherUserId', requireAuth, async (req, res) => {
  const otherUserId = req.params.otherUserId;
  const participants = [req.user._id.toString(), otherUserId].sort();
  let conversation = await Conversation.findOne({ participants });
  if (!conversation) {
    conversation = await Conversation.create({ participants, isDirect: true });
  }
  res.json({ id: conversation._id.toString(), participants });
});

// Messages in a conversation
router.get('/:conversationId/messages', requireAuth, async (req, res) => {
  const { conversationId } = req.params;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const messages = await Message.find({ conversation: conversationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  res.json(
    messages
      .reverse()
      .map((m) => ({
        id: m._id.toString(),
        body: m.body,
        sender: m.sender.toString(),
        recipient: m.recipient.toString(),
        createdAt: m.createdAt,
      }))
  );
});

module.exports = router;


