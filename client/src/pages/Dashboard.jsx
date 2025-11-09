import React, { useMemo, useState } from "react";
import useLiveTickets from "../hooks/useLiveTickets";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import {
  Activity,
  AlertTriangle,
  Smile,
  Frown,
  Signal,
  RefreshCw,
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

function formatClock(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function KPI({ label, value, sub, icon }) {
  return (
    <Card className="flex flex-col justify-between rounded-2xl border border-white/20 bg-white/40 backdrop-blur-lg shadow-[0_8px_25px_rgba(226,0,116,0.25)]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-800">
          {label}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#E20074] drop-shadow-sm">
          {value}
        </div>
        {sub && <div className="text-xs text-slate-600 mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function TrendChart({ data }) {
  const formatted = data.map((d) => ({
    time: formatClock(d.ts),
    Confirmed: d.confirmed,
    Projected: d.projected ?? d.confirmed,
  }));
  return (
    <Card className="rounded-2xl border border-white/20 bg-white/40 backdrop-blur-lg shadow-[0_8px_25px_rgba(226,0,116,0.25)]">
      <CardHeader className="pb-2">
        <CardTitle>Happiness Index – Real-time Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] sm:h-[350px] md:h-[400px] w-full">
          <ResponsiveContainer>
            <LineChart data={formatted}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Confirmed"
                dot={false}
                strokeWidth={3}
                stroke="#E20074"
              />
              <Line
                type="monotone"
                dataKey="Projected"
                dot={false}
                strokeWidth={3}
                stroke="#FF9AD5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function SeverityBar({ counts }) {
  const data = Object.entries(counts).map(([k, v]) => ({
    bucket: k,
    count: v,
  }));
  return (
    <Card className="rounded-2xl border border-white/20 bg-white/40 backdrop-blur-lg shadow-[0_8px_25px_rgba(226,0,116,0.25)]">
      <CardHeader className="pb-2">
        <CardTitle>Tickets by Severity (recent)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] sm:h-[350px] md:h-[400px] w-full">
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#E20074" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function Alerts({ series }) {
  const latest = series.at(-1);
  const prev = series.at(-6);
  const drop =
    latest && prev
      ? Math.round((prev.confirmed ?? 0) - (latest.confirmed ?? 0))
      : 0;
  const showAlert = latest && drop >= 15;
  if (!latest) return null;
  return (
    <Card className="rounded-2xl border border-white/20 bg-white/40 backdrop-blur-lg shadow-[0_8px_25px_rgba(226,0,116,0.25)]">
      <CardHeader className="pb-2">
        <CardTitle>Early Warning</CardTitle>
      </CardHeader>
      <CardContent>
        {showAlert ? (
          <Alert
            variant="destructive"
            className="rounded-xl bg-[#E20074]/20 text-[#E20074] border-[#E20074]/40 backdrop-blur-md"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Sentiment Drop Detected</AlertTitle>
            <AlertDescription>
              Happiness Index dropped by {drop} points recently. Investigate
              common topics.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="rounded-xl bg-white/50 backdrop-blur-md border-white/20 text-slate-800">
            <Smile className="h-4 w-4" />
            <AlertTitle>Stable</AlertTitle>
            <AlertDescription>
              No significant negative trend detected.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

/** NEW: Business Insights block */
function BusinessInsights({
  todayCount,
  projectedToday,
  avg7d,
  avg30d,
  deltaVs7d,
  hourlyToday,
}) {
  const deltaColor =
    deltaVs7d == null
      ? "text-slate-600"
      : deltaVs7d >= 0
      ? "text-emerald-600"
      : "text-rose-600";

  return (
    <Card className="rounded-2xl border border-white/20 bg-white/60 backdrop-blur-lg">
      <CardHeader className="pb-2">
        <CardTitle>Business Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <KPI label="Today's Tickets" value={todayCount} sub="Since 00:00" />
          <KPI
            label="Projected Today"
            value={projectedToday}
            sub="Rate-based projection"
          />
          <KPI label="7-Day Avg" value={avg7d ?? "—"} sub="Per day" />
          <KPI label="30-Day Avg" value={avg30d ?? "—"} sub="Per day" />
          <KPI
            label="vs 7-Day Avg"
            value={
              deltaVs7d == null
                ? "—"
                : `${deltaVs7d > 0 ? "+" : ""}${deltaVs7d}%`
            }
            sub="Positive = busier"
            icon={<Signal />}
          />
        </div>

        {/* Tiny hourly bar to spot surges today */}
        <div className="h-[220px] w-full">
          <ResponsiveContainer>
            <BarChart data={hourlyToday}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#E20074" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={`text-xs ${deltaColor}`}>
          {deltaVs7d == null
            ? "Historical averages unavailable — add /api/metrics to your backend for 7d/30d."
            : deltaVs7d === 0
            ? "On pace with your 7-day average."
            : deltaVs7d > 0
            ? "Busier than usual versus the 7-day average."
            : "Quieter than usual versus the 7-day average."}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardDemo() {
  const {
    stats,
    happiness,
    series,
    severityCounts,
    actions,
    log,
    metrics,
    todayCount,
    projectedToday,
    deltaVs7d,
    hourlyToday,
  } = useLiveTickets();

  const latestConfirmed = series.at(-1)?.confirmed ?? 70;
  const latestProjected = series.at(-1)?.projected ?? latestConfirmed;

  const [title, setTitle] = useState("No signal near downtown");
  const [city, setCity] = useState("Dallas");
  const [severity, setSeverity] = useState("critical");
  const [closeId, setCloseId] = useState("");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#E20074]/10 via-white/60 to-[#FFB7E6]/30 text-slate-900 px-4 sm:px-6 md:px-10 py-6 space-y-6 w-full overflow-x-hidden backdrop-blur-3xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-[#E20074] to-[#FF77C8] bg-clip-text text-transparent drop-shadow-sm">
            T-Mobile AI Dashboard
          </h1>
          <p className="text-slate-700 text-sm md:text-base">
            Real-time sentiment and agent performance — live data feed.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="rounded-xl bg-[#E20074] hover:bg-[#c60063] text-white border-0 shadow-[0_4px_20px_rgba(226,0,116,0.4)]"
            onClick={async () => {
              const ok = await actions.createTicket({ title, city, severity });
              if (!ok) alert("Create failed");
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Create Ticket
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <KPI
          label="Happiness Index"
          value={`${Math.round(latestConfirmed)}`}
          sub="Confirmed"
          icon={<Activity />}
        />
        <KPI
          label="Projected HI"
          value={`${Math.round(latestProjected)}`}
          sub="After last agent"
          icon={<Signal />}
        />
        <KPI
          label="Open Tickets"
          value={`${stats?.open ?? 0}`}
          sub="Current open"
          icon={<Frown />}
        />
        <KPI
          label="Fixed Tickets"
          value={`${stats?.fixed ?? 0}`}
          sub="Resolved"
          icon={<Smile />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <TrendChart data={series} />
        </div>
        <SeverityBar counts={severityCounts} />
      </div>

      {/* NEW: Business Insights */}
      <BusinessInsights
        todayCount={todayCount}
        projectedToday={projectedToday}
        avg7d={metrics.avg7d}
        avg30d={metrics.avg30d}
        deltaVs7d={deltaVs7d}
        hourlyToday={hourlyToday}
      />

      {/* Actions */}
      <Card className="rounded-2xl border border-white/20 bg-white/40 backdrop-blur-lg">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              className="border border-white/40 bg-white/70 rounded-xl h-10 px-3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="title"
            />
            <input
              className="border border-white/40 bg-white/70 rounded-xl h-10 px-3"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="city"
            />
            <select
              className="border border-white/40 bg-white/70 rounded-xl h-10 px-3"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="minor">minor</option>
              <option value="major">major</option>
              <option value="critical">critical</option>
            </select>
            <Button
              onClick={async () => {
                const ok = await actions.createTicket({
                  title,
                  city,
                  severity,
                });
                if (!ok) alert("Create failed");
              }}
            >
              Create Ticket
            </Button>
          </div>
          <div className="flex gap-2">
            <input
              className="border border-white/40 bg-white/70 rounded-xl h-10 px-3 flex-1"
              value={closeId}
              onChange={(e) => setCloseId(e.target.value)}
              placeholder="ticket _id to close"
            />
            <Button
              variant="outline"
              onClick={async () => {
                const id = closeId.trim();
                if (!id) return alert("Paste a ticket _id");
                const res = await actions.closeTicket(id);
                if (res.status === 409) alert("Already fixed");
                else if (res.status === 404) alert("Not found");
                else if (!(res.status >= 200 && res.status < 300))
                  alert("Close failed");
              }}
            >
              Close Ticket
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Alerts series={series} />
      </div>

      <Card className="rounded-2xl border border-white/20 bg-white/40 backdrop-blur-lg">
        <CardHeader>
          <CardTitle>📋 Live Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="h-64 overflow-y-auto bg-white/60 p-3 rounded-lg text-sm">
            {log.map(
              (l) => `[${new Date(l.ts).toLocaleTimeString()}] ${l.text}\n`
            )}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
