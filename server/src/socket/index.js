const { Server } = require('socket.io');
const { verifyJwt } = require('../utils/jwt');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const userIdToSocketId = new Map();

function attachSocketServer(httpServer) {
  const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim());
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (origins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));
      const payload = verifyJwt(token);
      socket.userId = payload.sub;
      return next();
    } catch (e) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    userIdToSocketId.set(socket.userId, socket.id);

    socket.on('direct:message', async ({ recipientId, body }) => {
      if (!recipientId || !body) return;
      const participants = [socket.userId, recipientId].sort();
      let conversation = await Conversation.findOne({ participants });
      if (!conversation) {
        conversation = await Conversation.create({ participants, isDirect: true, lastMessageAt: new Date() });
      }
      const message = await Message.create({
        conversation: conversation._id,
        sender: socket.userId,
        recipient: recipientId,
        body,
      });
      conversation.lastMessageAt = new Date();
      await conversation.save();

      const payload = {
        conversationId: conversation._id.toString(),
        message: {
          id: message._id.toString(),
          body: message.body,
          sender: message.sender.toString(),
          recipient: message.recipient.toString(),
          createdAt: message.createdAt,
        },
      };

      // emit to sender
      io.to(socket.id).emit('direct:message', payload);
      // emit to recipient if online
      const recipientSocketId = userIdToSocketId.get(recipientId);
      if (recipientSocketId) io.to(recipientSocketId).emit('direct:message', payload);
    });

    socket.on('disconnect', () => {
      userIdToSocketId.delete(socket.userId);
    });
  });
}

module.exports = { attachSocketServer };


