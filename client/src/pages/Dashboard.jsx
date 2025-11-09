// src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import SolvedIssues from "../components/SolvedIssues.jsx";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import {
  Activity,
  AlertTriangle,
  Smile,
  Frown,
  Signal,
  RefreshCw,
  Globe2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import useLiveTickets from "../hooks/useLiveTickets";
import useIHR from "../hooks/useIHR";

/** --- THEME (T-Mobile) --- */
const TMOBILE = {
  magenta: "#E20074",
  magentaLight: "#FF77C8",
  magentaSoft: "#FF9AD5",
  ink: "#0B0B0C",
  slate900: "#0f172a",
  surface: "rgba(255,255,255,0.65)",
  stroke: "rgba(255,255,255,0.3)",
  grid: "rgba(0,0,0,0.08)",
  glow: "0 8px 28px rgba(226, 0, 116, 0.25)",
};

/** --- UTIL --- */
function formatClock(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function countryFlag(cc = "") {
  // quick emoji flag from 2-letter cc
  const s = (cc || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(s)) return "🌐";
  const codePoints = [...s].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function KPI({ label, value, sub, icon, tone = "primary" }) {
  const toneBg =
    tone === "success"
      ? "rgba(16,185,129,0.12)"
      : tone === "warn"
      ? "rgba(245,158,11,0.14)"
      : tone === "danger"
      ? "rgba(239,68,68,0.14)"
      : "rgba(226,0,116,0.12)"; // primary
  const toneColor =
    tone === "success"
      ? "#10B981"
      : tone === "warn"
      ? "#F59E0B"
      : tone === "danger"
      ? "#EF4444"
      : TMOBILE.magenta;

  return (
    <Card
      className="group flex flex-col justify-between rounded-2xl border backdrop-blur-xl transition-all hover:-translate-y-0.5"
      style={{
        background: TMOBILE.surface,
        borderColor: TMOBILE.stroke,
        boxShadow: TMOBILE.glow,
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-800/90 flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center h-6 w-6 rounded-full"
            style={{ background: toneBg, color: toneColor }}
          >
            {icon}
          </span>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="text-3xl sm:text-4xl font-extrabold tracking-tight"
          style={{ color: toneColor }}
          aria-live="polite"
        >
          {value}
        </div>
        {sub && <div className="text-xs text-slate-700/80 mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

/** --- CHARTS --- */
/** Combined chart: Happiness (left axis) + IHR Alerts/min (right axis) — NO Projected line */
function TrendChart({ series, ihrAlertsPerMinute = [], ihrLastUpdated }) {
  // Map alerts per minute to the happiness timestamps (minute buckets)
  const alertsMap = new Map();
  (ihrAlertsPerMinute || []).forEach((pt) => {
    const t = typeof pt.ts === "number" ? pt.ts : Date.parse(pt.ts);
    const minuteKey = Math.floor(t / 60_000) * 60_000;
    alertsMap.set(minuteKey, Number(pt.count) || 0);
  });

  const formatted = (series || []).map((d) => {
    const t = Number(d.ts);
    const minuteKey = Math.floor(t / 60_000) * 60_000;
    const alerts = alertsMap.get(minuteKey) || 0;
    return {
      time: formatClock(t),
      Happiness: d.confirmed,
      Alerts: alerts,
    };
  });

  const updatedSub =
    ihrLastUpdated != null
      ? `IHR updated ${new Date(ihrLastUpdated).toLocaleTimeString()}`
      : "IHR updated —";

  return (
    <Card
      className="rounded-2xl border backdrop-blur-xl transition-all"
      style={{
        background: TMOBILE.surface,
        borderColor: TMOBILE.stroke,
        boxShadow: TMOBILE.glow,
      }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-900">
          Network Health & Happiness Trend
        </CardTitle>
        <div className="text-xs text-slate-600">{updatedSub}</div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] sm:h-[350px] md:h-[400px] w-full">
          <ResponsiveContainer>
            <LineChart data={formatted}>
              <CartesianGrid strokeDasharray="3 3" stroke={TMOBILE.grid} />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="left"
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                label={{
                  value: "Happiness",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                label={{
                  value: "IHR Alerts / min",
                  angle: 90,
                  position: "insideRight",
                }}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: TMOBILE.stroke }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="Happiness"
                dot={false}
                strokeWidth={3}
                stroke={TMOBILE.magenta}
              />
              <Bar
                yAxisId="right"
                dataKey="Alerts"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                opacity={0.5}
                barSize={12}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function SeverityBar({ counts }) {
  const data = Object.entries(counts || {}).map(([k, v]) => ({
    bucket: k,
    count: v,
  }));
  return (
    <Card
      className="rounded-2xl border backdrop-blur-xl transition-all"
      style={{
        background: TMOBILE.surface,
        borderColor: TMOBILE.stroke,
        boxShadow: TMOBILE.glow,
      }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-900">
          Tickets by Severity (recent)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] sm:h-[350px] md:h-[400px] w-full">
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={TMOBILE.grid} />
              <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: TMOBILE.stroke }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Bar
                dataKey="count"
                fill={TMOBILE.magenta}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsCard({
  series,
  minutes = 10,
  lateWindowPct = 0.4,
  absDrop = 12,
  pctDrop = 12,
}) {
  if (!series || series.length < 3) return null;

  const now = Date.now();
  const cutoff = now - minutes * 60 * 1000;
  const recent = series.filter((p) => Number(p.ts) >= cutoff);
  if (recent.length < 3) return null;

  const splitIdx = Math.max(1, Math.floor(recent.length * (1 - lateWindowPct)));
  const early = recent.slice(0, splitIdx);
  const late = recent.slice(splitIdx);

  const avg = (arr) =>
    arr.reduce((s, x) => s + Number(x.confirmed ?? 0), 0) /
    Math.max(1, arr.length);
  const earlyAvg = avg(early);
  const lateAvg = avg(late);
  const dropAbs = Math.round(earlyAvg - lateAvg);
  const dropPct =
    earlyAvg > 0 ? Math.round(((earlyAvg - lateAvg) / earlyAvg) * 100) : 0;

  const showAlert = dropAbs >= absDrop || dropPct >= pctDrop;

  return (
    <Card
      className="rounded-2xl border backdrop-blur-xl"
      style={{
        background: "rgba(255,255,255,0.65)",
        borderColor: "rgba(255,255,255,0.3)",
        boxShadow: "0 8px 28px rgba(226,0,116,0.25)",
      }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-900">Early Warning</CardTitle>
      </CardHeader>
      <CardContent>
        {showAlert ? (
          <Alert
            className="rounded-xl border"
            style={{
              background: "rgba(226,0,116,0.18)",
              color: "#E20074",
              borderColor: "rgba(226,0,116,0.4)",
            }}
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Sentiment Drop Detected</AlertTitle>
            <AlertDescription>
              {`Avg HI fell by ${dropAbs} pts (${dropPct}%) over the last ${minutes} min. Investigate common topics.`}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert
            className="rounded-xl border"
            style={{
              background: "rgba(255,255,255,0.6)",
              borderColor: "rgba(255,255,255,0.3)",
              color: "#0f172a",
            }}
          >
            <Smile className="h-4 w-4" />
            <AlertTitle>Stable</AlertTitle>
            <AlertDescription>
              No significant negative trend detected in the last {minutes}{" "}
              minutes.
            </AlertDescription>
          </Alert>
        )}
        <div className="mt-2 text-xs text-slate-600">
          Early avg: {Math.round(earlyAvg)} · Late avg: {Math.round(lateAvg)} ·
          Δ {dropAbs} ({dropPct}
          %)
        </div>
      </CardContent>
    </Card>
  );
}

/** Ops (Avg Active & Avg Resolution) */
function OpsCharts({ data }) {
  const formatted = (data || []).map((d) => ({
    time: formatClock(d.ts),
    "Avg Active (min)": d.activeMin,
    "Avg Resolution (min)": d.resolutionMin,
  }));

  return (
    <Card
      className="rounded-2xl border backdrop-blur-xl transition-all"
      style={{
        background: TMOBILE.surface,
        borderColor: TMOBILE.stroke,
        boxShadow: TMOBILE.glow,
      }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-900">
          Operations — Avg Active & Resolution Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] sm:h-[350px] md:h-[400px] w-full">
          <ResponsiveContainer>
            <LineChart data={formatted}>
              <CartesianGrid strokeDasharray="3 3" stroke={TMOBILE.grid} />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: TMOBILE.stroke }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Avg Active (min)"
                dot={false}
                strokeWidth={3}
                stroke="#6366F1"
              />
              <Line
                type="monotone"
                dataKey="Avg Resolution (min)"
                dot={false}
                strokeWidth={3}
                stroke="#10B981"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/** --- PAGE --- */
export default function DashboardDemo() {
  const {
    stats,
    series,
    severityCounts,
    actions,
    log,
    metrics,
    todayCount,
    projectedToday, // still used in BusinessInsights fallback calc if you want
    deltaVs7d,
    hourlyToday,
    opsSeries,
  } = useLiveTickets();

  // IHR (ASN AS21928, 5-minute window, 30s refresh)
  const {
    alertsPerMinute = [],
    lastUpdated: ihrLastUpdated,
    error: ihrError,
  } = useIHR({
    asn: "AS21928",
    minutes: 5,
    pollMs: 30_000,
  });

  // 🛰️ Overall IHR network status (via your /api/ihr/network route)
  const [net, setNet] = useState(null);
  const [netErr, setNetErr] = useState(null);
  useEffect(() => {
    let alive = true;
    async function pullNet() {
      try {
        const r = await fetch("/api/ihr/network?asn=AS21928");
        const j = await r.json();
        if (!alive) return;
        if (r.ok && j?.ok) {
          setNet(j);
          setNetErr(null);
        } else {
          setNet(null);
          setNetErr(j?.message || j?.error || "unavailable");
        }
      } catch (e) {
        if (!alive) return;
        setNet(null);
        setNetErr(e?.message || "fetch_failed");
      }
    }
    pullNet();
    const id = setInterval(pullNet, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // KPI: sum of IHR alerts in the last 5m
  const ihrTotal5m = useMemo(
    () => (alertsPerMinute || []).reduce((s, p) => s + Number(p.count || 0), 0),
    [alertsPerMinute]
  );

  const latestConfirmed = (series || []).at(-1)?.confirmed ?? 70;

  // --- simple metrics as fallbacks (yesterday / last24h / projectedToday)
  const [simple, setSimple] = useState({
    yesterdayCount: null,
    last24hCount: null,
    projectedToday: null,
  });
  useEffect(() => {
    let alive = true;
    async function pull() {
      try {
        const r = await fetch("/api/metrics/simple");
        if (r.ok) {
          const m = await r.json();
          if (alive) {
            setSimple({
              yesterdayCount: m.yesterdayCount ?? null,
              last24hCount: m.last24hCount ?? null,
              projectedToday: m.projectedToday ?? null,
            });
          }
        }
      } catch {}
    }
    pull();
    const id = setInterval(pull, 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Derive a pretty subtitle for the IHR status card
  const netOK = !!net;
  const netCC = net?.country ? String(net.country).toUpperCase() : "";
  const netName = net?.name || "T-Mobile";
  const netASN = net?.asn ? `AS${net.asn}` : "AS21928";
  const netSub = netOK
    ? `${countryFlag(netCC)} ${netASN} — ${netName}${
        netCC ? ` (${netCC})` : ""
      }`
    : "Network reachability";

  return (
    <div
      className="min-h-screen flex flex-col w-full overflow-x-hidden"
      style={{
        background:
          "radial-gradient(1200px 700px at -10% -10%, rgba(226,0,116,0.08), transparent 50%), radial-gradient(1200px 700px at 110% 10%, rgba(255,119,200,0.08), transparent 50%), linear-gradient(to bottom right, #ffffff, #f8fafc)",
      }}
    >
      {/* Top Bar */}
      <div
        className="w-full border-b backdrop-blur-xl"
        style={{
          background: "rgba(255,255,255,0.7)",
          borderColor: TMOBILE.stroke,
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 py-4 flex items-center justify-between">
          <div>
            <div
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                background: "rgba(226,0,116,0.12)",
                color: TMOBILE.magenta,
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: TMOBILE.magenta }}
              />
              Live
            </div>
            <h1
              className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight"
              style={{
                backgroundImage: `linear-gradient(90deg, ${TMOBILE.magenta}, ${TMOBILE.magentaLight})`,
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              T-Mobile AI Dashboard
            </h1>
            <p className="text-slate-700/80 text-sm md:text-base">
              Real-time sentiment, network health & operations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              className="rounded-xl text-white transition-all hover:-translate-y-0.5"
              style={{
                background: TMOBILE.magenta,
                boxShadow: "0 6px 20px rgba(226,0,116,0.35)",
              }}
              onClick={async () => {
                const res = await actions.createTicket({
                  title: "No signal near downtown",
                  city: "Dallas",
                  severity: "critical",
                });
                if (!res || res.success !== true) alert("Create failed");
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Create Ticket
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPI
            label="Happiness Index"
            value={`${Math.round(latestConfirmed)}`}
            sub="Confirmed"
            icon={<Activity className="h-4 w-4" />}
            tone="primary"
          />

          <KPI
            label="IHR Alerts (5m)"
            value={`${ihrTotal5m}`}
            sub={
              ihrLastUpdated
                ? `Network delay alarms • ${new Date(
                    ihrLastUpdated
                  ).toLocaleTimeString()}`
                : "Network delay alarms"
            }
            icon={<Signal className="h-4 w-4" />}
            tone={ihrTotal5m > 0 ? "warn" : "success"}
          />

          <KPI
            label="Open Tickets"
            value={`${stats?.open ?? 0}`}
            sub="Current open"
            icon={<Frown className="h-4 w-4" />}
            tone={stats?.open > 0 ? "warn" : "success"}
          />

          <KPI
            label="Fixed Tickets"
            value={`${stats?.fixed ?? 0}`}
            sub="Resolved"
            icon={<Smile className="h-4 w-4" />}
            tone="success"
          />

          {/* 🛰️ Overall IHR Status */}
          <KPI
            label="IHR Overall Status"
            value={netOK ? "OK" : "—"}
            sub={netSub}
            icon={<Globe2 className="h-4 w-4" />}
            tone={netOK ? "success" : "warn"}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <TrendChart
              series={series}
              ihrAlertsPerMinute={alertsPerMinute}
              ihrLastUpdated={ihrLastUpdated}
            />
          </div>
          <SeverityBar counts={severityCounts} />
        </div>

        {/* Ops */}
        <OpsCharts data={opsSeries} />

        {/* Business Insights (simple version using your existing metrics) */}
        <Card
          className="rounded-2xl border backdrop-blur-xl transition-all"
          style={{
            background: TMOBILE.surface,
            borderColor: TMOBILE.stroke,
            boxShadow: TMOBILE.glow,
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-900">Business Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <KPI
                label="Today's Tickets"
                value={todayCount ?? "—"}
                sub="Since 00:00"
                icon={<Signal className="h-4 w-4" />}
              />
              <KPI
                label="Projected Today"
                value={simple.projectedToday ?? projectedToday ?? "—"}
                sub="Rate-based"
                icon={<Signal className="h-4 w-4" />}
              />
              <KPI
                label="Yesterday"
                value={simple.yesterdayCount ?? "—"}
                sub="Prev day"
                icon={<Signal className="h-4 w-4" />}
              />
              <KPI
                label="Last 24 Hours"
                value={simple.last24hCount ?? "—"}
                sub="Rolling window"
                icon={<Signal className="h-4 w-4" />}
              />
            </div>

            <div className="h-[220px] w-full">
              <ResponsiveContainer>
                <BarChart data={hourlyToday || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={TMOBILE.grid} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      borderColor: TMOBILE.stroke,
                    }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Bar
                    dataKey="count"
                    fill={TMOBILE.magenta}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* (Optional) Tiny errors */}
        {(ihrError || netErr) && (
          <div className="text-xs text-rose-600">
            {ihrError && <>IHR Alerts error: {String(ihrError)} · </>}
            {netErr && <>IHR Status error: {String(netErr)}</>}
          </div>
        )}

        {/* Live Feed + Solved */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AlertsCard series={series} />
          <Card
            className="lg:col-span-2 rounded-2xl border backdrop-blur-xl"
            style={{
              background: TMOBILE.surface,
              borderColor: TMOBILE.stroke,
              boxShadow: TMOBILE.glow,
            }}
          >
            <CardHeader>
              <CardTitle className="text-slate-900">📋 Live Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <pre
                className="h-64 overflow-y-auto p-3 rounded-lg text-sm"
                style={{
                  background: "rgba(255,255,255,0.55)",
                  border: `1px solid ${TMOBILE.stroke}`,
                  lineHeight: 1.35,
                }}
                aria-live="polite"
              >
                {(log || []).map(
                  (l) => `[${new Date(l.ts).toLocaleTimeString()}] ${l.text}\n`
                )}
              </pre>
            </CardContent>
          </Card>
        </div>

        <SolvedIssues limit={12} />
      </main>

      <footer className="mt-auto py-6 text-center text-xs text-slate-600">
        <span>
          Made with <span style={{ color: TMOBILE.magenta }}>♥</span> — T-Mobile
          Magenta UI
        </span>
      </footer>
    </div>
  );
}
