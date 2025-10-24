import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { getMessage } from "../controller/messages.controller.js";

const messageRouter = Router();

messageRouter.route("/:userid/:contact").get(verifyJWT, getMessage);

export default messageRouter;
