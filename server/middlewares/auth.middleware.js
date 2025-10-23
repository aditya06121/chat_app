import jwt from "jsonwebtoken";
import { user } from "../models/users.models.js";

const verifyJWT = async (req, res, next) => {
  try {
    const token = req.cookies?.AccessToken;
    if (!token) {
      return res.status(401).json({ status: "access token required" });
    }
    const decodedToken = jwt.verify(token, process.env.SECRET_ACCESS);
    const foundUser = await user.findById(decodedToken._id).select("-password");
    if (!foundUser) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.user = foundUser;
    next();
  } catch (error) {
    res.status(401).json({ error: "token authentication failed" });
  }
};
export default verifyJWT;
