import { user } from "../models/users.models.js";
import { message } from "../models/message.models.js";

const getMessage = async (req, res) => {
  try {
    const userid = req.params.userid;
    const loggedInUser = req.user._id.toString();

    if (userid !== loggedInUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const contact = req.params.contact;
    const contactData = await user.findOne({ userName: contact });

    if (!contactData) {
      return res.status(404).json({ error: "Contact not found" });
    }

    // Find all messages between these two users
    const messages = await message
      .find({
        $or: [
          { sender: loggedInUser, receiver: contactData._id },
          { sender: contactData._id, receiver: loggedInUser },
        ],
      })
      .sort({ sentAt: 1 });

    // ONLY mark messages as "delivered" (not "read")
    // This means the messages reached the user's device
    const sentMessageIds = messages
      .filter(
        (msg) =>
          msg.receiver.toString() === loggedInUser && msg.readStatus === "sent"
      )
      .map((msg) => msg._id);

    if (sentMessageIds.length > 0) {
      await message.updateMany(
        { _id: { $in: sentMessageIds } },
        { readStatus: "delivered" }
      );

      // Get io instance (choose one method based on what you used in app.js)
      const io = req.io; // using middleware

      // Notify the sender that messages were delivered
      io.to(contactData._id.toString()).emit("messages_delivered", {
        messageIds: sentMessageIds,
        deliveredTo: loggedInUser,
      });
    }

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({
      error: "Failed to fetch messages",
      details: error.message,
    });
  }
};

export { getMessage };
