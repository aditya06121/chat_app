import { Router } from "express";
import {
  registerUser,
  login,
  logout,
  refreshAccessToken,
  getUser,
  addContact,
  contacts,
} from "../controller/users.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
const userRouter = Router();

userRouter.route("/register").post(registerUser);
userRouter.route("/login").post(login);

//secured routes
userRouter.route("/logout").post(verifyJWT, logout);
userRouter.route("/getuser").get(verifyJWT, getUser);
userRouter.route("/:userid/addcontact").post(verifyJWT, addContact);
userRouter.route("/:userid/contacts").get(verifyJWT, contacts);
userRouter.route("/refreshtoken").post(refreshAccessToken);

export default userRouter;
