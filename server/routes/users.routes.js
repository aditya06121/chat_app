import { Router } from "express";
import {
  registerUser,
  login,
  logout,
  refreshAccessToken,
} from "../controller/users.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
const userRouter = Router();

userRouter.route("/register").post(registerUser);
userRouter.route("/login").post(login);

//secured routes
userRouter.route("/logout").post(verifyJWT, logout);
userRouter.route("/refreshtoken").post(refreshAccessToken);

export default userRouter;
