import express, { json, urlencoded } from "express";
import cors from "cors";
import userRouter from "./routes/users.routes.js";
import cookieParser from "cookie-parser";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", userRouter);

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // TODO: Change to specific origin in production
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie;
  if (!cookieHeader) return next(new Error("no cookies found"));

  const parsedCookies = parse(cookieHeader);
  const accessToken = parsedCookies.AccessToken;

  if (!accessToken) {
    return next(new Error("Access token not found"));
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.SECRET_ACCESS);
    socket.user = decoded;
    socket.userId = decoded.userId;
    socket.userName = decoded.userName;
    next();
  } catch (error) {
    return next(new Error("Invalid or expired access token"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected", socket.userName);
  socket.on("disconnect", () => {
    console.log("User disconnected", socket.userName);
  });
});

export { server, io };
