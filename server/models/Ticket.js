import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    city: { type: String, default: "Unknown" },

    severity: {
      type: String,
      enum: ["minor", "major", "critical"],
      default: "minor",
    },

    status: {
      type: String,
      enum: ["open", "investigating", "escalated", "fixed"],
      default: "open",
    },

    flagged: { type: Boolean, default: false },

    // relationships / metadata
    createdBy: { type: String }, // requester display name
    assignedTo: { type: String }, // agent display name (simple for hackathon)

    // denormalized chat fields for dashboards
    lastMessageSnippet: String,
    lastMessageAt: Date,
    messageCount: { type: Number, default: 0 },

    // resolution metrics
    resolvedAt: Date,
    timeSpentMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Guard: resolvedAt implies status fixed
TicketSchema.pre("validate", function (next) {
  if (this.resolvedAt && this.status !== "fixed") {
    return next(new Error("resolvedAt can only be set when status is 'fixed'"));
  }
  next();
});

export default mongoose.model("Ticket", TicketSchema);
