import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema(
  {
    // 📋 Basic info
    title: { type: String, required: true }, // Short issue summary
    description: { type: String }, // Optional longer message
    city: { type: String, default: "Unknown" }, // User’s location (or from IP)

    // ⚙️ AI analysis & classification
    severity: {
      type: String,
      enum: ["minor", "major", "critical"],
      default: "minor",
    },
    keywords: [{ type: String }], // e.g. ["network issue", "signal issue"]

    // 📈 Ticket status workflow
    status: {
      type: String,
      enum: ["open", "investigating", "escalated", "fixed"],
      default: "open",
    },
    flagged: { type: Boolean, default: false }, // SLA breach or critical escalation
    assignedTo: { type: String }, // Which agent or team owns it

    // 🕒 Timing / analytics
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    escalatedAt: { type: Date },
    timeSpentMs: { type: Number, default: 0 }, // auto-computed when resolved

    // 👥 Meta data
    createdBy: { type: String }, // could be userId or sessionId
    contactInfo: { type: String }, // optional phone/email
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },

    // 💬 Feedback after resolution
    feedbackScore: { type: Number, min: 1, max: 5 },
    neededAssistance: { type: Boolean, default: false }, // user indicated extra help
    feedbackComment: { type: String },
  },
  { timestamps: true }
);

// 🧠 Middleware: when status changes to "fixed", calculate time spent
TicketSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === "fixed" &&
    !this.resolvedAt
  ) {
    this.resolvedAt = new Date();
    this.timeSpentMs = this.resolvedAt - this.createdAt;
  }
  next();
});

export default mongoose.model("Ticket", TicketSchema);
