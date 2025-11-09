// server/routes/simple-metrics.js
import express from "express";
import Ticket from "../models/Ticket.js";

const router = express.Router();

/**
 * Lightweight metrics for when 7d/30d aggregates aren't available.
 * Returns: todayCount, yesterdayCount, last24hCount, projectedToday
 */
router.get("/metrics/simple", async (_req, res) => {
  try {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const startOf24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [todayCount, yesterdayCount, last24hCount] = await Promise.all([
      Ticket.countDocuments({ createdAt: { $gte: startOfToday, $lt: now } }),
      Ticket.countDocuments({
        createdAt: { $gte: startOfYesterday, $lt: startOfToday },
      }),
      Ticket.countDocuments({ createdAt: { $gte: startOf24h, $lt: now } }),
    ]);

    const hoursElapsed =
      (now.getTime() - startOfToday.getTime()) / (60 * 60 * 1000);
    const projectedToday =
      hoursElapsed > 0
        ? Math.round((todayCount / hoursElapsed) * 24)
        : todayCount;

    res.json({
      todayCount,
      yesterdayCount,
      last24hCount,
      projectedToday,
    });
  } catch (e) {
    console.error("GET /api/metrics/simple error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
