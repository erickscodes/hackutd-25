// src/hooks/useIHR.js
import { useEffect, useMemo, useState } from "react";

/** Coerce any possible payload shape into an array of alerts */
function normalizeAlerts(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.alerts)) return payload.alerts;
  return [];
}

function getAlertTimestampMs(a) {
  // IHR objects may use different keys; try a few
  const t =
    a?.ts || a?.timestamp || a?.time || a?.created_at || a?.createdAt || null;
  const d = t ? new Date(t) : null;
  return d && !isNaN(d) ? d.getTime() : null;
}

/**
 * useIHR
 * - Polls your backend endpoints:
 *    GET /api/ihr/asns            -> { ok, asns: [{ asn, name, ...}, ...] }
 *    GET /api/ihr/alerts?asn=...  -> { ok, alerts: [...] }  (or alerts array root)
 * - Optionally listens for Socket.IO "ihr:alerts" pushes
 *
 * Usage:
 *   const socket = useMemo(() => io(), []);
 *   const ihr = useIHR({ minutes: 5, socket });
 */
export default function useIHR({ minutes = 5, socket } = {}) {
  const [asns, setAsns] = useState([]);
  const [asn, setAsn] = useState("AS21928"); // default; will prefer this if available
  const [alerts, setAlerts] = useState([]); // ALWAYS keep as array
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  // Discover candidate ASNs once
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setError(null);
        const r = await fetch("/api/ihr/asns");
        const j = await r.json().catch(() => ({}));
        if (!alive) return;

        const list = Array.isArray(j?.asns) ? j.asns : [];
        setAsns(list);

        // Prefer AS21928 if present; else first; else fallback default
        const preferred =
          list.find((x) => x?.asn === "AS21928")?.asn ||
          list[0]?.asn ||
          "AS21928";
        setAsn(preferred);
      } catch (e) {
        if (!alive) return;
        setError("Failed to load ASNs");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Poll alerts from REST
  useEffect(() => {
    let alive = true;
    if (!asn) return;

    async function pull() {
      try {
        setError(null);
        const r = await fetch(
          `/api/ihr/alerts?asn=${encodeURIComponent(asn)}&minutes=${minutes}`
        );
        const j = await r.json().catch(() => ({}));
        if (!alive) return;

        const arr = normalizeAlerts(j);
        setAlerts(arr);
        setLastUpdated(Date.now());
      } catch (e) {
        if (!alive) return;
        setError("Failed to load alerts");
        setAlerts([]); // keep iterable
      }
    }

    pull();
    const id = setInterval(pull, 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [asn, minutes]);

  // Socket push (optional)
  useEffect(() => {
    if (!socket) return;
    const onPush = (payload) => {
      try {
        if (!payload) return;
        if (payload.asn && payload.asn !== asn) return;
        const arr = normalizeAlerts(payload);
        setAlerts(arr);
        setLastUpdated(Date.now());
      } catch {
        // ignore malformed pushes
      }
    };
    socket.on("ihr:alerts", onPush);
    return () => socket.off("ihr:alerts", onPush);
  }, [socket, asn]);

  // Aggregate per-minute counts for a mini bar chart
  const series = useMemo(() => {
    const base = Array.isArray(alerts) ? alerts : [];
    const byMin = new Map();

    for (const a of base) {
      const ts = getAlertTimestampMs(a);
      if (!ts) continue;
      const d = new Date(ts);
      const key = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        d.getMinutes()
      ).getTime();
      byMin.set(key, (byMin.get(key) || 0) + 1);
    }

    return [...byMin.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([ts, count]) => ({ ts, count }));
  }, [alerts]);

  return {
    asns, // [{ asn, name, ... }]
    asn, // selected ASN
    setAsn, // setter to allow UI selector
    alerts, // ALWAYS array
    count: Array.isArray(alerts) ? alerts.length : 0,
    series, // [{ ts, count }]
    lastUpdated, // number | null
    error, // string | null
  };
}
