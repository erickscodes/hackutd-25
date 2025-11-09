import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export default function useLiveTickets(serverUrl = "/") {
  const [stats, setStats] = useState(null);
  const [happiness, setHappiness] = useState(100);
  const [series, setSeries] = useState([]); // [{ ts, confirmed, projected }]
  const [log, setLog] = useState([{ ts: Date.now(), text: "Connecting..." }]);
  const [severityCounts, setSeverityCounts] = useState({
    minor: 0,
    major: 0,
    critical: 0,
  });

  // NEW: track “ticket:created” timestamps for today (for rate/projection)
  const [createdToday, setCreatedToday] = useState([]); // [ts,...]

  // NEW: historical metrics (fetched once if backend provides them)
  const [metrics, setMetrics] = useState({
    avg7d: null, // average tickets per day over last 7 days
    avg30d: null, // average tickets per day over last 30 days
  });

  const socketRef = useRef(null);
  const addLog = (text) =>
    setLog((prev) => [{ ts: Date.now(), text }, ...prev].slice(0, 400));

  useEffect(() => {
    // soft-attempt historical metrics (safe if endpoint doesn’t exist)
    (async () => {
      try {
        const res = await axios.get("/api/metrics"); // { avg7d, avg30d }
        if (res?.data) {
          setMetrics({
            avg7d: Number(res.data.avg7d ?? res.data.sevenDayAvg ?? null),
            avg30d: Number(res.data.avg30d ?? res.data.thirtyDayAvg ?? null),
          });
        }
      } catch {
        // no-op; backend doesn’t expose metrics yet
      }
    })();
  }, []);

  // Reset today's buffer at midnight
  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - startOfToday() < 1100) {
        setCreatedToday([]);
      }
    }, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const socket = io(serverUrl, { withCredentials: false });
    socketRef.current = socket;

    socket.on("connect", () => addLog(`✅ connected ${socket.id}`));
    socket.on("disconnect", () => addLog("❌ disconnected"));

    socket.on("live:stats", (s) => {
      addLog(`📊 stats: ${JSON.stringify(s)}`);
      setStats(s);
      const h = s.happiness ?? 100;
      setHappiness(h);
      setSeries((prev) => [
        ...prev.slice(-199),
        { ts: Date.now(), confirmed: h, projected: h },
      ]);
    });

    socket.on("ticket:created", (t) => {
      addLog(`🆕 ticket: ${t.title} (${t.severity})`);
      if (t?.severity) {
        setSeverityCounts((c) => ({
          ...c,
          [t.severity]: (c[t.severity] || 0) + 1,
        }));
      }
      // track as today's creation if it happened today
      const now = Date.now();
      if (now >= startOfToday()) {
        setCreatedToday((arr) => [...arr, now]);
      }
    });

    socket.on("ticket:closed", (t) => addLog(`✅ ticket closed: ${t.title}`));
    socket.on("ticket:updated", (t) =>
      addLog(`✳️ ticket updated: ${JSON.stringify(t)}`)
    );

    socket.on("happiness:update", ({ happiness: h }) => {
      addLog(`💖 happiness update: ${h}`);
      setHappiness(h);
      setSeries((prev) => [
        ...prev.slice(-199),
        { ts: Date.now(), confirmed: h, projected: h },
      ]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [serverUrl]);

  const actions = {
    createTicket: async ({ title, city, severity }) => {
      const res = await axios.post("/api/test-ticket", {
        title,
        city,
        severity,
      });
      return res.status >= 200 && res.status < 300 ? res.data ?? true : false;
    },
    closeTicket: async (id) => {
      try {
        return await axios.patch(`/api/tickets/${id}/close`);
      } catch (e) {
        return e.response ?? { status: 500 };
      }
    },
  };

  const happyPct = useMemo(
    () => Math.max(0, Math.min(100, happiness)),
    [happiness]
  );

  // ---- Derived business analytics ----
  // count today
  const todayCount = createdToday.length;

  // simple rate-based EoD projection:
  // projectedToday = (todayCount / elapsedHours) * businessHours (or 24 if unknown)
  const elapsedMs = Date.now() - startOfToday();
  const elapsedHours = Math.max(0.25, elapsedMs / 3_600_000); // avoid division by ~0 early morning
  // If you operate 8am-8pm typically, set businessHours=12; else use 24
  const businessHours = 24;
  const projectedToday = Math.round(
    (todayCount / elapsedHours) * businessHours
  );

  // % delta vs 7d average (if available)
  const deltaVs7d = metrics.avg7d
    ? Math.round(((todayCount - metrics.avg7d) / metrics.avg7d) * 100)
    : null;

  // today by hour buckets (0..23) for a micro bar chart
  const hourly = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, "0")}:00`,
    count: createdToday.filter((ts) => new Date(ts).getHours() === h).length,
  }));

  return {
    stats,
    happiness: happyPct,
    series,
    severityCounts,
    log,
    actions,

    // NEW analytics
    metrics, // { avg7d, avg30d } (may be nulls)
    todayCount,
    projectedToday,
    deltaVs7d,
    hourlyToday: hourly,
  };
}
