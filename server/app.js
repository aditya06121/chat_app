import express, { json, urlencoded } from "express";
import cors from "cors";
import userRouter from "./routes/users.routes.js";
import cookieParser from "cookie-parser";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import { createServer } from "http";
import { Server } from "socket.io";
import messageRouter from "./routes/messages.routes.js";
import { message } from "./models/message.models.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: "*", // TODO: Change to specific origin in production
    credentials: true,
  })
);
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cookieParser());

// HTTP Server
const server = createServer(app);

// Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: "*", // TODO: Change to specific origin in production
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie;

  if (!cookieHeader) {
    return next(new Error("no cookies found"));
  }

  const parsedCookies = parse(cookieHeader);
  const accessToken = parsedCookies.AccessToken;

  if (!accessToken) {
    return next(new Error("Access token not found"));
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.SECRET_ACCESS);
    socket.user = decoded;
    socket.userId = decoded._id;
    socket.userName = decoded.userName;
    next();
  } catch (error) {
    return next(new Error("Invalid or expired access token"));
  }
});

// CRITICAL: Add this middleware BEFORE routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes (defined AFTER the io middleware)
app.use("/api/auth", userRouter);
app.use("/api/message", messageRouter);

// Socket.IO Connection Handler
io.on("connection", (socket) => {
  socket.join(socket.userId);
  console.log("User connected:", socket.userName, "| User ID:", socket.userId);

  // Typing indicators
  socket.on("typing", ({ to }) => {
    io.to(to).emit("user_typing", {
      from: socket.userId,
      fromUserName: socket.userName,
      isTyping: true,
    });
  });

  socket.on("stop_typing", ({ to }) => {
    io.to(to).emit("user_typing", {
      from: socket.userId,
      fromUserName: socket.userName,
      isTyping: false,
    });
  });

  // Handle private messages
  socket.on("private_message", async ({ content, to }) => {
    try {
      if (!content || !to) {
        socket.emit("message_error", {
          error: "Content and recipient are required",
        });
        return;
      }

      const newMessage = new message({
        sender: socket.userId,
        receiver: to,
        content: content,
        readStatus: "sent",
        sentAt: new Date(),
      });

      await newMessage.save();
      console.log("Message saved to database:", newMessage._id);

      // Emit to receiver's room
      io.to(to).emit("private_message", {
        content: content,
        from: socket.userId,
        fromUserName: socket.userName,
        sentAt: newMessage.sentAt,
        messageId: newMessage._id,
      });

      // Check if receiver is connected
      const receiverSockets = await io.in(to).fetchSockets();
      if (receiverSockets.length > 0) {
        await message.findByIdAndUpdate(newMessage._id, {
          readStatus: "delivered",
        });

        // Notify sender message was delivered
        socket.emit("message_delivered", {
          messageId: newMessage._id,
          to: to,
        });
      }

      // Send confirmation to sender
      socket.emit("message_sent", {
        content: content,
        to: to,
        sentAt: newMessage.sentAt,
        messageId: newMessage._id,
        status: "success",
      });
    } catch (error) {
      console.error("Error sending message:", error.message);
      socket.emit("message_error", {
        error: "Failed to send message",
        details: error.message,
      });
    }
  });

  // Handle marking messages as read
  socket.on("mark_as_read", async ({ messageIds, sender }) => {
    try {
      await message.updateMany(
        {
          _id: { $in: messageIds },
          receiver: socket.userId,
          sender: sender,
        },
        { readStatus: "read" }
      );

      io.to(sender).emit("messages_read", {
        messageIds: messageIds,
        readBy: socket.userId,
      });

      console.log(`Messages marked as read:`, messageIds);
    } catch (error) {
      console.error("Error marking messages as read:", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log(
      "User disconnected:",
      socket.userName,
      "| User ID:",
      socket.userId
    );
  });
});

export { server, io };
