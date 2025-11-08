import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db/connectToDB.js";
import Ticket from "./models/Ticket.js";

dotenv.config();

const app = express();
app.use(express.json()); // <-- needed for JSON bodies

app.post("/api/test-ticket", async (req, res) => {
  try {
    const {
      title = "Test ticket",
      city = "Dallas",
      severity = "minor",
    } = req.body || {};
    const ticket = await Ticket.create({ title, city, severity });
    res.json({ success: true, ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/tickets", async (req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: -1 });
  res.json(tickets);
});

app.get("/", (_req, res) => res.send("Server is running ✅"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Running on PORT ${PORT}`);
});
