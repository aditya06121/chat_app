import { Router } from "express";
const userRouter = Router();

const registerUser = (req, res) => {
  const { name, pass } = req.body || {};
  if (name === "adi" && pass === "adi") {
    return res.status(201).json(`correct`);
  }
  return res.status(401).json(`incorrect`);
};

const hello = (req, res) => {
  res.send(`get is working`);
};

userRouter.route("/register").post(registerUser).get(hello);

export default userRouter;
