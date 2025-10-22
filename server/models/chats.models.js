import mongoose from "mongoose";

const { Schema } = mongoose;

const chatSchema = new Schema(
  {
    message: String,
    from: { type: Schema.Types.ObjectId, ref: "User" },
    to: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
export const chat = mongoose.model("Chat", chatSchema);
