const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', index: true, required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    body: { type: String, required: true, trim: true },
    readAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', MessageSchema);


