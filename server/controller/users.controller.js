import { user } from "../models/users.models.js";
import jwt from "jsonwebtoken";

const registerUser = async (req, res) => {
  try {
    const { fullName, userName, password } = req.body;
    if ([fullName, userName, password].some((field) => field.trim() === "")) {
      return res.status(400).json({ error: "fields are empty" });
    }
    const userExists = await user.findOne({ userName });
    if (userExists) {
      return res.status(409).json({ error: "username already exists" });
    }

    const newUser = new user({
      fullName: fullName,
      userName: userName.toLowerCase(),
      password: password,
    });
    await newUser.save();
    const createdUser = await user.findById(newUser._id);
    if (!createdUser) res.status(500).json({ error: "something went wrong" });

    return res.status(201).send(`user registered successfully`);
  } catch (e) {
    return res.status(401).json({
      error: "failed to register the user",
      details: e.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { userName, password } = req.body;
    if ([userName, password].some((field) => field.trim() === "")) {
      return res.status(400).json({ error: "fields are empty" });
    }
    const foundUser = await user.findOne({ userName: userName });
    if (!foundUser) {
      return res.status(401).send(`username does not exist`);
    }
    const isPasswordCorrect = await foundUser.comparePassword(password);
    if (!isPasswordCorrect)
      return res.status(401).json({ error: "incorrect password" });
    return res.status(200).json({ status: "logged in successfully" });
  } catch (error) {
    return res.status(501).send(`failed to login`, error);
  }
};

const logout = () => {};

export { registerUser, login };
