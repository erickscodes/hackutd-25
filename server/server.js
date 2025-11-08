import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { connectDB } from "./db/connectToDB.js";
import Ticket from "./models/Ticket.js";

require("dotenv").config();
console.log("OPEN_API_KEY:", process.env.OPEN_API_KEY);

const app = express();
app.use(express.json());

// --- HTTP + WebSocket setup ---
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: "*" } });

// --- Helper: Compute and emit live stats ---
async function computeAndEmitStats() {
  try {
    const total = await Ticket.countDocuments();
    const open = await Ticket.countDocuments({ status: { $ne: "fixed" } });
    const fixed = await Ticket.countDocuments({ status: "fixed" });
    const flagged = await Ticket.countDocuments({ flagged: true });

    const bySeverity = await Ticket.aggregate([
      { $group: { _id: "$severity", count: { $sum: 1 } } },
    ]);

    const recentClosed = await Ticket.find({ status: "fixed" })
      .sort({ updatedAt: -1 })
      .limit(200);

    // Compute averages
    let avgResolutionMs = 0;
    if (recentClosed.length > 0) {
      const totalMs = recentClosed.reduce(
        (sum, t) => sum + (t.updatedAt - t.createdAt),
        0
      );
      avgResolutionMs = totalMs / recentClosed.length;
    }

    const openTickets = await Ticket.find({ status: { $ne: "fixed" } }).select(
      "createdAt"
    );
    let avgActiveMs = 0;
    if (openTickets.length > 0) {
      const now = Date.now();
      const totalMs = openTickets.reduce(
        (sum, t) => sum + (now - t.createdAt.getTime()),
        0
      );
      avgActiveMs = totalMs / openTickets.length;
    }

    const severityCounts = { minor: 0, major: 0, critical: 0 };
    for (const entry of bySeverity) {
      severityCounts[entry._id] = entry.count;
    }

    const payload = {
      total,
      open,
      fixed,
      flagged,
      severityCounts,
      avgActiveMinutes: +(avgActiveMs / 60000).toFixed(1),
      avgResolutionMinutes: +(avgResolutionMs / 60000).toFixed(1),
    };

    io.emit("live:stats", payload);
  } catch (err) {
    console.error("Error computing stats:", err.message);
  }
}

// --- REST routes ---
app.post("/api/test-ticket", async (req, res) => {
  try {
    const { title = "Test ticket", city = "Dallas", severity = "minor" } =
      req.body || {};
    const ticket = await Ticket.create({ title, city, severity });

    res.json({ success: true, ticket });
    io.emit("ticket:created", ticket);

    // Update stats after every ticket creation
    await computeAndEmitStats();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/tickets", async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Server is running ✅");
});

// --- WebSocket connection event ---
io.on("connection", async (socket) => {
  console.log(`🟢 Client connected: ${socket.id}`);
  await computeAndEmitStats();

  socket.on("disconnect", () => {
    console.log(`🔴 Client disconnected: ${socket.id}`);
  });
});

// --- Start server ---
const PORT = process.env.PORT || 4000;

server.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Running on PORT ${PORT}`);

  // Refresh stats every 5 seconds
  setInterval(async () => {
    await computeAndEmitStats();
  }, 5000);
});
