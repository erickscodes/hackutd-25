import React, { useMemo, useRef, useState, useEffect } from "react";
import useSupportPanel from "../hooks/useSupportPanel";
import {
  Flag,
  Search,
  Send,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronLeft,
  Wand2,
  X,
  MessageSquare,
  Loader2,
  Filter,
  AlertTriangle,
  Check,
  Activity,
  MessageSquareWarning,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/** --- Theme (T‑Mobile inspired) --- */
const T = {
  magenta: "#E20074",
  magentaLight: "#FF77C8",
  surface: "rgba(255,255,255,0.70)",
  surface2: "rgba(255,255,255,0.88)",
  stroke: "rgba(255,255,255,0.35)",
  ink: "#0f172a",
};

/* ---------- utils ---------- */
const useNowTicker = (ms = 30_000) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
};

const timeAgo = (d) => {
  if (!d) return "—";
  const ms = Date.now() - new Date(d).getTime();
  if (ms < 60_000) return "just now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${h}h ${r}m ago`;
};

const cn = (...xs) => xs.filter(Boolean).join(" ");

/* ---------- Color helpers ---------- */
const toneBySeverity = (sev = "minor") => {
  switch (sev) {
    case "critical":
      return {
        bg: "bg-rose-50",
        fg: "text-rose-700",
        ring: "ring-rose-300",
        dot: "bg-rose-500",
        chip: "bg-rose-100 text-rose-800",
      };
    case "major":
      return {
        bg: "bg-amber-50",
        fg: "text-amber-700",
        ring: "ring-amber-300",
        dot: "bg-amber-500",
        chip: "bg-amber-100 text-amber-800",
      };
    default:
      return {
        bg: "bg-emerald-50",
        fg: "text-emerald-700",
        ring: "ring-emerald-300",
        dot: "bg-emerald-500",
        chip: "bg-emerald-100 text-emerald-800",
      };
  }
};

const statusTone = (status = "open") =>
  status === "fixed"
    ? {
        bg: "bg-emerald-600",
        fg: "text-white",
        chip: "bg-emerald-100 text-emerald-800",
      }
    : {
        bg: "bg-slate-800",
        fg: "text-white",
        chip: "bg-slate-100 text-slate-800",
      };

/* ---------- Tiny UI bits ---------- */
function Dot({ className }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-2.5 w-2.5 rounded-full", className)}
    />
  );
}

function StatusBadge({ status }) {
  const t = statusTone(status);
  const Icon = status === "fixed" ? Check : Activity;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold",
        t.fg,
        t.bg
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {status === "fixed" ? "Fixed" : "Open"}
    </span>
  );
}

function SeverityBadge({ severity = "minor" }) {
  const t = toneBySeverity(severity);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold",
        t.chip
      )}
    >
      <AlertTriangle className="h-3.5 w-3.5" /> {severity}
    </span>
  );
}

function CountChip({ icon: Icon, label }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-xl border text-[11px] px-2 py-1"
      style={{ borderColor: T.stroke, background: "rgba(255,255,255,0.85)" }}
    >
      <Icon className="h-3.5 w-3.5 opacity-70" />
      {label}
    </span>
  );
}

/* ---------- Analysis Modal ---------- */
function AnalysisModal({ open, onClose, summary }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="w-full max-w-xl rounded-2xl border shadow-2xl"
        style={{ background: "rgba(255,255,255,0.94)", borderColor: T.stroke }}
      >
        <div
          className="flex items-center justify-between p-3 border-b"
          style={{ borderColor: T.stroke }}
        >
          <div
            className="inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: T.magenta }}
          >
            <Wand2 className="h-4 w-4" /> AI Analysis
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1"
            aria-label="Close analysis dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 text-sm text-slate-800">
          <div
            className="font-semibold text-base truncate"
            title={summary.title}
          >
            {summary.title}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-xl p-3 border bg-white"
              style={{ borderColor: T.stroke }}
            >
              <div className="text-[11px] text-slate-500 mb-1">Ticket</div>
              <div>
                Severity: <b>{summary.severity}</b>
              </div>
              <div>
                Status: <b>{summary.status}</b>
              </div>
              {summary.city && (
                <div>
                  City: <b>{summary.city}</b>
                </div>
              )}
              <div>
                Age: <b>{summary.ageHuman}</b>
              </div>
              <div>
                Last Activity: <b>{summary.lastAtHuman}</b>
              </div>
            </div>
            <div
              className="rounded-xl p-3 border bg-white"
              style={{ borderColor: T.stroke }}
            >
              <div className="text-[11px] text-slate-500 mb-1">
                Conversation
              </div>
              <div>
                Messages: <b>{summary.msgCount}</b>
              </div>
              <div>
                User: <b>{summary.userCount}</b>
              </div>
              <div>
                Staff: <b>{summary.staffCount}</b>
              </div>
              <div>
                Bot: <b>{summary.botCount}</b>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-3 border bg-white"
            style={{ borderColor: T.stroke }}
          >
            <div className="text-[11px] text-slate-500 mb-1">Signals</div>
            <ul className="list-disc pl-5 space-y-1">
              {summary.signals?.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <div
            className="rounded-xl p-3 border bg-white"
            style={{ borderColor: T.stroke }}
          >
            <div className="text-[11px] text-slate-500 mb-1">
              Suggested Next Action
            </div>
            <div>{summary.nextAction}</div>
          </div>
        </div>

        <div
          className="p-3 border-t flex justify-end"
          style={{ borderColor: T.stroke }}
        >
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl text-white text-sm"
            style={{
              background: T.magenta,
              boxShadow: "0 6px 20px rgba(226,0,116,0.35)",
            }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- Ticket Row (icon‑first, compact) ---------- */
function TicketRow({ t, active, onClick, onAnalyze, onFlag, analyzing }) {
  const isOpen = t.status !== "fixed";
  const flagged = !!t.flagged;
  useNowTicker(30_000);

  const sevTone = toneBySeverity(t.severity);

  // conditions: lag, volume, refund keyword → show small icons
  const conditions = [];
  if (
    t.lastMessageAt &&
    Date.now() - new Date(t.lastMessageAt) > 30 * 60 * 1000
  ) {
    conditions.push({ icon: Clock, title: "30+ min since last activity" });
  }
  if ((t.messageCount ?? 0) > 10) {
    conditions.push({
      icon: MessageSquareWarning,
      title: "High message volume",
    });
  }
  if ((t.lastMessageSnippet || "").toLowerCase().includes("refund")) {
    conditions.push({ icon: Info, title: "Mentions refund" });
  }

  return (
    <motion.button
      onClick={onClick}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "w-full text-left relative rounded-2xl border p-3 mb-2.5 transition",
        "hover:brightness-[.99]"
      )}
      style={{
        background: "rgba(255,255,255,0.95)",
        borderColor: active ? T.magenta : T.stroke,
        boxShadow: active
          ? "0 0 0 4px rgba(226,0,116,0.12)"
          : "0 6px 18px rgba(226,0,116,0.08)",
      }}
      aria-pressed={active}
      role="option"
      aria-selected={!!active}
    >
      <div className="flex items-center gap-3">
        {/* left status disc */}
        <div
          className={cn(
            "grid place-items-center h-10 w-10 rounded-full ring-2",
            sevTone.ring
          )}
          style={{ background: "white" }}
        >
          <Dot className={cn("", sevTone.dot)} />
        </div>

        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="font-semibold text-slate-800 truncate"
              title={t.title || "Untitled"}
            >
              {t.title || "Untitled"}
            </div>
            <StatusBadge status={t.status} />
            <SeverityBadge severity={t.severity || "minor"} />
          </div>

          <div className="mt-0.5 text-[11px] text-slate-600 flex items-center gap-3">
            {t.city && (
              <span className="inline-flex items-center gap-1" title={t.city}>
                <MapPin className="h-3 w-3" /> {t.city}
              </span>
            )}
            {t.lastMessageAt && (
              <span
                className="inline-flex items-center gap-1"
                title={new Date(t.lastMessageAt).toLocaleString()}
              >
                <Clock className="h-3 w-3" />
                {timeAgo(t.lastMessageAt)}
              </span>
            )}
            {typeof t.messageCount === "number" && (
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> {t.messageCount}
              </span>
            )}
            {/* conditions */}
            {conditions.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-amber-700"
                title={c.title}
              >
                <c.icon className="h-3 w-3" />
              </span>
            ))}
          </div>

          {t.lastMessageSnippet && (
            <div className="mt-1 text-[12px] text-slate-700 line-clamp-1">
              {t.lastMessageSnippet}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAnalyze?.(t);
            }}
            title="AI Analyze"
            className="rounded-lg p-1.5 border hover:brightness-95 inline-flex items-center gap-1"
            style={{
              borderColor: analyzing ? T.magenta : T.stroke,
              background: analyzing ? "rgba(226,0,116,0.08)" : "white",
              color: analyzing ? T.magenta : "inherit",
            }}
            aria-busy={analyzing}
            disabled={analyzing}
          >
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            <span className="sr-only">Analyze</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onFlag?.(t);
            }}
            title={flagged ? "Unflag" : "Flag"}
            className={cn(
              "rounded-lg p-1.5 border inline-flex items-center justify-center",
              flagged ? "bg-rose-600 text-white border-transparent" : "bg-white"
            )}
            style={{ borderColor: flagged ? "transparent" : T.stroke }}
          >
            <Flag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.button>
  );
}

/* ---------- Chat bubble ---------- */
function Bubble({ role, author, text, ts }) {
  const isUser = role === "user";
  const isStaff = role === "staff";
  useNowTicker(30_000);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      className={cn(
        "max-w-[85%] sm:max-w-[72%] md:max-w-[60%] rounded-2xl p-3 border shadow-sm",
        isUser ? "mr-auto bg-white" : "ml-auto"
      )}
      style={{
        background: isStaff
          ? T.magenta
          : isUser
          ? "rgba(255,255,255,0.95)"
          : "rgba(255,255,255,0.88)",
        color: isStaff ? "#fff" : T.ink,
        borderColor: isStaff ? "transparent" : T.stroke,
      }}
      title={new Date(ts).toLocaleString()}
      role="group"
    >
      <div className="text-[11px] opacity-70 mb-1 flex items-center gap-1">
        <span className="font-semibold truncate max-w-[55%]">
          {author || (isUser ? "Customer" : role === "bot" ? "Bot" : "Staff")}
        </span>
        <span className="opacity-60">·</span>
        <span className="truncate">{timeAgo(ts)}</span>
      </div>
      <div className="text-[13px] sm:text-sm whitespace-pre-wrap leading-relaxed">
        {text}
      </div>
    </motion.div>
  );
}

/* ---------- Page ---------- */
export default function Support() {
  const {
    tickets,
    filtered,
    selectedId,
    selectedTicket,
    currentMessages,
    openCount,
    fixedCount,
    filters,
    setFilters,
    selectTicket,
    sendMessage,
    closeTicket,
    loading,
    loadingThread,
    error,
  } = useSupportPanel({
    apiBase: "/api",
    socketOrigin: "",
    staffName: "Agent",
  });

  const [input, setInput] = useState("");
  const [analyzingId, setAnalyzingId] = useState(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const listRef = useRef(null);
  const atBottomRef = useRef(true);

  const onSend = async () => {
    const text = input.trim();
    if (!text || !selectedId) return;
    const res = await sendMessage(selectedId, text);
    if (!res.ok) alert(res.error || "Send failed");
    setInput("");
  };

  const onClose = async () => {
    if (!selectedId) return;
    const ok = confirm("Close this ticket?");
    if (!ok) return;
    const r = await closeTicket(selectedId);
    if (!r.ok && r.status === 404) alert("Ticket not found");
    else if (!r.ok) alert("Close failed");
  };

  // smart autoscroll
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
      atBottomRef.current = nearBottom;
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (atBottomRef.current)
      requestAnimationFrame(() => (el.scrollTop = el.scrollHeight));
  }, [currentMessages.length, loadingThread]);

  const statusTabs = useMemo(
    () => [
      { key: "all", label: `All (${tickets.length})`, icon: Activity },
      { key: "open", label: `Open (${openCount})`, icon: MessageSquare },
      { key: "fixed", label: `Fixed (${fixedCount})`, icon: CheckCircle2 },
    ],
    [tickets.length, openCount, fixedCount]
  );

  // ---- lightweight client analysis
  const analyzeTicket = async (ticket) => {
    try {
      setAnalyzingId(ticket._id);
      const res = await fetch(`/api/tickets/${ticket._id}/messages`);
      let msgs = [];
      if (res.ok) msgs = await res.json();

      const userCount = msgs.filter((m) => m.authorType === "user").length;
      const staffCount = msgs.filter((m) => m.authorType === "staff").length;
      const botCount = msgs.filter((m) => m.authorType === "bot").length;
      const msgCount = msgs.length;

      const createdAt = ticket.createdAt ? new Date(ticket.createdAt) : null;
      const lastAt = ticket.lastMessageAt
        ? new Date(ticket.lastMessageAt)
        : null;
      const now = new Date();
      const toHuman = (ms) => {
        if (!ms && ms !== 0) return "—";
        const m = Math.round(ms / 60000);
        if (m < 60) return `${m} min`;
        const h = Math.floor(m / 60);
        const rem = m % 60;
        return `${h}h ${rem}m`;
      };
      const ageHuman = createdAt
        ? toHuman(now.getTime() - createdAt.getTime())
        : "—";
      const lastAtHuman = lastAt
        ? toHuman(now.getTime() - lastAt.getTime())
        : "—";

      const severityScore =
        ticket.severity === "critical"
          ? 3
          : ticket.severity === "major"
          ? 2
          : 1;
      const lagScore =
        lastAt && now.getTime() - lastAt.getTime() > 30 * 60 * 1000
          ? 2
          : lastAt && now.getTime() - lastAt.getTime() > 10 * 60 * 1000
          ? 1
          : 0;
      const volumeScore = msgCount > 8 ? 2 : msgCount > 4 ? 1 : 0;
      const urgency = severityScore + lagScore + volumeScore;

      const signals = [];
      if (ticket.severity === "critical")
        signals.push("Critical severity — prioritize.");
      if (lagScore >= 2)
        signals.push("No agent activity in the last 30+ minutes.");
      if (userCount > staffCount)
        signals.push("More customer messages than staff responses.");
      if ((ticket.lastMessageSnippet || "").toLowerCase().includes("refund"))
        signals.push("Customer mentioned refund — consider credit/escalation.");

      const nextAction =
        urgency >= 5
          ? "Escalate to Tier-2, acknowledge delay, and provide a concrete ETA."
          : urgency >= 3
          ? "Reply with next steps & expected resolution window; set follow-up reminder."
          : "Close loop with resolution or request missing details; offer survey link.";

      setAnalysis({
        title: ticket.title || "Untitled",
        severity: ticket.severity || "minor",
        status: ticket.status || "open",
        city: ticket.city,
        ageHuman,
        lastAtHuman,
        msgCount,
        userCount,
        staffCount,
        botCount,
        signals: signals.length ? signals : ["No risk signals detected."],
        nextAction,
      });
      setAnalysisOpen(true);
    } catch (e) {
      console.error(e);
      alert("Analyze failed");
    } finally {
      setAnalyzingId(null);
    }
  };

  const flagTicket = async (ticket) => {
    const id = ticket._id;
    try {
      const res = await fetch(`/api/tickets/${id}/flag`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagged: !ticket.flagged }),
      });
      if (!res.ok) console.warn("Flag route missing or failed");
    } catch (e) {
      console.error(e);
    }
  };

  const headerChips = (
    <div className="hidden sm:flex items-center gap-2">
      <CountChip
        icon={MessageSquare}
        label={`${selectedTicket?.messageCount ?? 0} msgs`}
      />
      {selectedTicket?.severity && (
        <CountChip icon={Flag} label={selectedTicket.severity} />
      )}
      {selectedTicket?.city && (
        <CountChip icon={MapPin} label={selectedTicket.city} />
      )}
    </div>
  );

  return (
    <div
      className="h-dvh flex flex-col overflow-hidden"
      style={{
        background:
          "radial-gradient(1200px 700px at -10% -10%, rgba(226,0,116,0.08), transparent 50%), radial-gradient(1200px 700px at 110% 10%, rgba(255,119,200,0.08), transparent 50%), linear-gradient(to bottom right, #ffffff, #f8fafc)",
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b backdrop-blur-xl"
        style={{ background: "rgba(255,255,255,0.75)", borderColor: T.stroke }}
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-6 md:px-8 py-2.5 flex items-center justify-between gap-2">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: T.magenta }}
          >
            <ChevronLeft className="h-4 w-4" /> Dashboard
          </a>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="sm:hidden inline-flex items-center gap-1 text-xs px-2 py-1 rounded-xl border"
            style={{
              borderColor: T.stroke,
              background: "rgba(255,255,255,0.9)",
            }}
            aria-expanded={showFilters}
            aria-controls="filters"
          >
            <Filter className="h-3.5 w-3.5" /> Filters
          </button>
          {headerChips}
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 min-h-0 overflow-hidden mx-auto max-w-7xl px-3 sm:px-6 md:px-8 py-4 grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Sidebar */}
        <section
          className="rounded-2xl border p-3 sm:p-4 flex flex-col min-h-0"
          style={{
            background: T.surface,
            borderColor: T.stroke,
            boxShadow: "0 8px 26px rgba(226,0,116,0.15)",
          }}
        >
          <div
            id="filters"
            className={cn(
              "sm:block",
              showFilters ? "block" : "hidden sm:block"
            )}
          >
            <TicketFilters
              tickets={tickets}
              openCount={openCount}
              fixedCount={fixedCount}
              filters={filters}
              setFilters={setFilters}
              statusTabs={statusTabs}
            />
          </div>

          <div className="mt-3 flex-1 min-h-0 overflow-y-auto pr-1">
            {loading && <ListSkeleton />}
            {error && (
              <div className="text-sm text-rose-600">Error: {error}</div>
            )}
            {!loading && filtered.length === 0 && <EmptyState />}

            <AnimatePresence initial={false}>
              {filtered.map((t) => (
                <motion.div
                  key={t._id}
                  layout
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                >
                  <TicketRow
                    t={t}
                    active={String(t._id) === String(selectedId)}
                    onClick={() => selectTicket(String(t._id))}
                    onAnalyze={analyzeTicket}
                    onFlag={flagTicket}
                    analyzing={analyzingId === t._id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Conversation */}
        <section
          className="lg:col-span-2 rounded-2xl border p-3 sm:p-4 flex flex-col min-h-0"
          style={{
            background: T.surface,
            borderColor: T.stroke,
            boxShadow: "0 8px 26px rgba(226,0,116,0.15)",
          }}
        >
          {/* Thread Header */}
          <div
            className="flex items-center justify-between gap-3 pb-2 border-b"
            style={{ borderColor: T.stroke }}
          >
            <div className="min-w-0">
              <div className="text-[11px] text-slate-600">Ticket</div>
              <motion.div
                key={selectedTicket?._id || "none"}
                layout
                className="font-semibold truncate"
              >
                {selectedTicket?.title ||
                  (selectedId ? "Loading…" : "Select a ticket")}
              </motion.div>
              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                {selectedTicket?.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {selectedTicket.city}
                  </span>
                )}
                {selectedTicket?.severity && (
                  <span>Severity: {selectedTicket.severity}</span>
                )}
                {typeof selectedTicket?.messageCount === "number" && (
                  <span> · {selectedTicket.messageCount} messages</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {selectedTicket?.status !== "fixed" ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  className="px-3 py-2 rounded-xl text-white text-sm"
                  style={{
                    background: T.magenta,
                    boxShadow: "0 6px 20px rgba(226,0,116,0.35)",
                  }}
                  title="Close ticket"
                >
                  <CheckCircle2 className="inline h-4 w-4 mr-1" /> Close
                </motion.button>
              ) : (
                <span className="text-emerald-600 text-sm inline-flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Fixed
                </span>
              )}
              {selectedTicket && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => analyzeTicket(selectedTicket)}
                  className="px-2.5 py-2 rounded-xl text-sm border inline-flex items-center gap-1"
                  style={{
                    borderColor: T.stroke,
                    background: "rgba(255,255,255,0.95)",
                  }}
                  title="Analyze conversation"
                >
                  <Wand2 className="h-4 w-4" />{" "}
                  <span className="hidden sm:inline">Analyze</span>
                </motion.button>
              )}
            </div>
          </div>

          {/* Thread (self‑scrolling) */}
          <div
            ref={listRef}
            className="flex-1 min-h-0 overflow-y-auto py-3 space-y-2.5"
            style={{ scrollBehavior: "smooth" }}
          >
            {loadingThread && (
              <div className="text-sm text-slate-600">Loading history…</div>
            )}

            <AnimatePresence initial={false}>
              {currentMessages.map((m) => (
                <Bubble
                  key={m.id}
                  role={m.role}
                  author={m.author}
                  text={m.text}
                  ts={m.ts}
                />
              ))}
            </AnimatePresence>

            {!loadingThread && currentMessages.length === 0 && selectedId && (
              <div className="text-sm text-slate-600">
                No messages yet — say hello to the customer 👋
              </div>
            )}
            {!selectedId && (
              <div className="text-sm text-slate-600">
                Pick a ticket to view the conversation.
              </div>
            )}
          </div>

          {/* Composer */}
          <Composer
            disabled={!selectedId}
            input={input}
            setInput={setInput}
            onSend={onSend}
          />
        </section>
      </main>

      {/* Analysis Modal */}
      <AnimatePresence>
        <AnalysisModal
          open={analysisOpen}
          onClose={() => setAnalysisOpen(false)}
          summary={analysis || {}}
        />
      </AnimatePresence>
    </div>
  );
}

/* ---------- subcomponents ---------- */
function TicketFilters({
  tickets,
  openCount,
  fixedCount,
  filters,
  setFilters,
  statusTabs,
}) {
  return (
    <>
      <div className="flex flex-wrap gap-1.5 items-center">
        {statusTabs.map((tab) => (
          <motion.button
            key={tab.key}
            onClick={() => setFilters((f) => ({ ...f, status: tab.key }))}
            whileTap={{ scale: 0.96 }}
            className="text-[11px] px-2.5 py-1 rounded-full border transition inline-flex items-center gap-1"
            style={{
              background:
                filters.status === tab.key
                  ? "rgba(226,0,116,0.12)"
                  : "rgba(255,255,255,0.85)",
              color: filters.status === tab.key ? T.magenta : T.ink,
              borderColor: T.stroke,
            }}
          >
            <tab.icon className="h-3.5 w-3.5" /> {tab.label}
          </motion.button>
        ))}

        <select
          value={filters.severity}
          onChange={(e) =>
            setFilters((f) => ({ ...f, severity: e.target.value }))
          }
          className="ml-auto text-[11px] border rounded-xl h-8 px-2 bg-white/80"
          style={{ borderColor: T.stroke }}
          title="Filter by severity or flagged"
        >
          <option value="all">All tickets</option>
          <option value="minor">Minor</option>
          <option value="major">Major</option>
          <option value="critical">Critical</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>

      <div
        className="mt-2 flex items-center gap-2 border rounded-xl px-2 h-9 bg-white/85"
        style={{ borderColor: T.stroke }}
      >
        <Search className="h-4 w-4 text-slate-500" />
        <input
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          placeholder="Search title, city, snippet…"
          className="flex-1 bg-transparent outline-none text-[13px]"
          aria-label="Search tickets"
        />
      </div>
    </>
  );
}

function Composer({ disabled, input, setInput, onSend }) {
  const [rows, setRows] = useState(1);
  useEffect(() => {
    const lines = input.split("\n").length;
    setRows(Math.min(6, Math.max(1, lines)));
  }, [input]);

  return (
    <>
      <div className="pt-2 border-top" style={{ borderColor: T.stroke }} />
      <div className="pt-2 border-t" style={{ borderColor: T.stroke }}>
        <div
          className="flex items-end gap-2 rounded-2xl border p-2 sm:p-3 bg:white/85"
          style={{ borderColor: T.stroke, background: "rgba(255,255,255,0.9)" }}
        >
          <textarea
            rows={rows}
            disabled={disabled}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (
                (e.key === "Enter" && !e.shiftKey) ||
                (e.key === "Enter" && (e.metaKey || e.ctrlKey))
              ) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder={!disabled ? "Type a reply…" : "Select a ticket first"}
            className="flex-1 resize-none bg-transparent outline-none text-sm sm:text-[15px] max-h-40 leading-6"
            aria-label="Message composer"
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={disabled || !input.trim()}
            onClick={onSend}
            className="inline-flex items-center gap-2 rounded-xl text-white px-3 sm:px-4 py-2 font-medium transition disabled:opacity-50"
            style={{
              background: T.magenta,
              boxShadow: "0 8px 22px rgba(226,0,116,0.35)",
            }}
            title="Send"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </motion.button>
        </div>
        <div className="mt-1.5 text-[11px] sm:text-xs text-slate-500 flex items-center justify-between">
          <div>
            Press{" "}
            <kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-white">
              Enter
            </kbd>{" "}
            to send,{" "}
            <kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-white">
              Shift
            </kbd>
            +
            <kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-white">
              Enter
            </kbd>{" "}
            for new line.
          </div>
          <div className="opacity-70">{input.trim().length} chars</div>
        </div>
      </div>
    </>
  );
}

/* ---------- Empty / Skeleton ---------- */
function EmptyState() {
  return (
    <div className="text-sm text-slate-600 grid place-items-center py-10">
      <div className="text-center max-w-xs">
        <div className="mx-auto grid place-items-center h-12 w-12 rounded-full bg-slate-100 mb-3">
          <Search className="h-5 w-5 text-slate-500" />
        </div>
        <div className="font-semibold">No tickets match your filters</div>
        <div className="text-slate-500 mt-1">
          Try changing status, severity, or the search query.
        </div>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[74px] rounded-2xl border overflow-hidden"
          style={{ borderColor: T.stroke, background: "rgba(255,255,255,0.9)" }}
        >
          <div className="animate-pulse h-full">
            <div className="h-5 w-2/3 bg-slate-200/70 mt-3 ml-3 rounded"></div>
            <div className="h-3 w-1/3 bg-slate-200/60 mt-2 ml-3 rounded"></div>
            <div className="h-3 w-5/6 bg-slate-200/50 mt-3 ml-3 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
