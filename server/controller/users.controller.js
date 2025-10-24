import { user } from "../models/users.models.js";
import jwt from "jsonwebtoken";

async function generateRefreshAndAccessToken(userId) {
  try {
    const usr = await user.findById(userId);
    const AccessToken = usr.generateAccessToken();
    const RefreshToken = usr.generateRefreshToken();
    usr.RefreshToken = RefreshToken;
    await usr.save();
    return { AccessToken, RefreshToken };
  } catch (error) {
    console.error(`failed to generate tokens:${error}`);
    throw error;
  }
}

const options = {
  httpOnly: true,
  secure: true,
  sameSite: "Strict",
};

const registerUser = async (req, res) => {
  try {
    const { fullName, userName, password } = req.body;
    if ([fullName, userName, password].some((field) => !field?.trim() === "")) {
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
    newUser.status.online = true;

    await newUser.save();
    const createdUser = await user.findById(newUser._id);
    if (!createdUser)
      return res.status(500).json({ error: "something went wrong" });
    const { AccessToken, RefreshToken } = await generateRefreshAndAccessToken(
      newUser._id
    );
    return res
      .status(201)
      .cookie("AccessToken", AccessToken, options)
      .cookie("RefreshToken", RefreshToken, options)
      .json({ status: "user registered successfully" });
  } catch (e) {
    return res.status(500).json({
      error: "failed to register the user",
      details: e.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { userName, password } = req.body;
    if ([userName, password].some((field) => !field?.trim())) {
      return res.status(400).json({ error: "fields are empty" });
    }

    const foundUser = await user.findOne({ userName: userName });
    if (!foundUser) {
      return res.status(401).send(`username does not exist`);
    }
    const isPasswordCorrect = await foundUser.comparePassword(password);
    if (!isPasswordCorrect)
      return res.status(401).json({ error: "incorrect password" });

    const { AccessToken, RefreshToken } = await generateRefreshAndAccessToken(
      foundUser._id
    );
    foundUser.status.online = true;
    await foundUser.save();
    return res
      .status(200)
      .cookie("AccessToken", AccessToken, options)
      .cookie("RefreshToken", RefreshToken, options)
      .json({ status: "user logged in successfully" });
  } catch (error) {
    return res.status(500).send(`failed to login`, error);
  }
};

const logout = async (req, res) => {
  try {
    const id = req.user._id;
    await user.findByIdAndUpdate(id, {
      $unset: { RefreshToken: 1 },
      $set: { "status.online": true, "status.lastSeen": Date.now() },
    });
    req.user.status.online = false;
    req.user.lastSeen = new Date();
    await req.user.save();
    return res
      .status(200)
      .clearCookie("AccessToken", options)
      .clearCookie("RefreshToken", options)
      .json({ status: "logged out successfully" });
  } catch (error) {
    return res.status(500).json({ status: "logout failed", error: error });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const token = req.cookies?.RefreshToken;
    if (!token) {
      return res.status(401).json({ status: "refresh token required" });
    }
    const decodedToken = jwt.verify(token, process.env.SECRET_REFRESH);
    const foundUser = await user
      .findById(decodedToken?._id)
      .select("-password");
    if (!foundUser) {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (token !== foundUser.RefreshToken) {
      return res
        .status(401)
        .json({ status: "refresh token is expired or used" });
    }
    const { AccessToken, RefreshToken } = await generateRefreshAndAccessToken(
      foundUser._id
    );
    return res
      .status(201)
      .cookie("AccessToken", AccessToken, options)
      .cookie("RefreshToken", RefreshToken, options)
      .json({
        status: "Tokens generated successfully",
        user: foundUser.userName,
      });
  } catch (error) {
    return res.status(500).json({ status: "Server failed", error: error });
  }
};

const getUser = async (req, res) => {
  try {
    const searchUser = req.query.search;
    const foundUser = await user.findOne({ userName: searchUser });
    if (!foundUser)
      return res.status(401).json({ error: "unable to find user" });
    return res
      .status(200)
      .json({ status: "successfully found user", user: foundUser._id });
  } catch (error) {
    return res.status(500).json({ status: "server failed", error: error });
  }
};

const addContact = async (req, res) => {
  try {
    const userid = req.params.userid;
    const loggedInUser = req.user._id.toString();
    if (userid !== loggedInUser)
      return res.status(401).json({ error: "unauthorized" });
    const { userName } = req.body;
    const userExists = await user.findOne({ userName });
    if (!userExists) {
      return res.status(409).json({ error: "user does not exist" });
    }
    if (req.user.contacts.includes(userExists._id)) {
      return res.status(400).json({ error: "Already in contacts" });
    }
    // to add to contact in both the logged in user as well to whom the request is sent
    req.user.contacts.push(userExists._id);
    userExists.contacts.push(req.user._id);
    await req.user.save();
    await userExists.save();

    return res
      .status(201)
      .json({ status: `contact ${userExists.userName} added successfully` });
  } catch (error) {
    return res.status(500).json({ status: "server failed", error: error });
  }
};

const contacts = async (req, res) => {
  try {
    const userid = req.params.userid;
    const loggedInUser = req.user._id.toString();
    if (userid !== loggedInUser)
      return res.status(401).json({ error: "unauthorized" });

    const userWithContacts = await user
      .findById(req.user._id)
      .populate("contacts", "userName email");

    return res.status(200).json({
      contacts: userWithContacts.contacts,
    });
  } catch (error) {
    return res.status(500).json({ status: "server failed", error: error });
  }
};

export {
  registerUser,
  login,
  logout,
  refreshAccessToken,
  getUser,
  addContact,
  contacts,
};
