const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isDirect: { type: Boolean, default: true },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 }, { unique: false });

module.exports = mongoose.model('Conversation', ConversationSchema);


