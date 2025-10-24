import mongoose from "mongoose";
const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    readStatus: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const message = mongoose.model("Message", messageSchema);
