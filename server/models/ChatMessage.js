import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },
    authorType: {
      type: String,
      enum: ["user", "agent", "bot"],
      required: true,
    },
    authorName: { type: String },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("ChatMessage", ChatMessageSchema);
