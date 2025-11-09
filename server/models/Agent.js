const AgentSchema = new mongoose.Schema({
  name: String,
  email: { type: String, index: true },
  team: String, // e.g., "NOC", "Care"
  role: {
    type: String,
    enum: ["agent", "supervisor", "admin"],
    default: "agent",
  },
});
export const Agent = mongoose.model("Agent", AgentSchema);
