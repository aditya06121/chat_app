import express, { json, urlencoded } from "express";
import cors from "cors";
import userRouter from "./routes/users.routes.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", userRouter);

export default app;
