import { Router } from "express";
import { registerUser, login } from "../controller/users.controller.js";
const userRouter = Router();

userRouter.route("/register").post(registerUser);
userRouter.route("/login").post(login);

export default userRouter;
