import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema } = mongoose;

const userSchema = new Schema({
  fullName: {
    type: String,
    required: [true, "fullname is required"],
    trim: true,
  },
  userName: {
    type: String,
    required: [true, "username is required"],
    trim: true,
    unique: [true, "username should be unique"],
    index: true,
  },
  status: {
    online: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  password: { type: String, required: [true, "password is required"] },
  contacts: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

userSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(user.password, salt);
  user.password = hashedPassword;
  next();
});

userSchema.methods.comparePassword = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};

export const user = mongoose.model("User", userSchema);
