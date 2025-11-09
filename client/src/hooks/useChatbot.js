// useChatbot.noLocalStorage.js
// Customer chat hook with real-time updates via Socket.IO.
// This version removes ALL localStorage usage.
// Optional: pass an `initialTicketId` if you want to reuse an existing ticket (SSR, URL param, etc.)

import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";

/**
 * Options:
 *  - apiBase: REST base path (default "/api")
 *  - socketOrigin: Socket.IO origin ("" for same origin, or e.g. "http://localhost:4000")
 *  - simulate: fallback canned replies (default false)
 *  - requesterName: display name for the user (default "Guest")
 *  - initialTicketId: (optional) existing ticket id to join instead of creating a new one
 */
export default function useChatbot(options = {}) {
  const {
    apiBase = "/api",
    socketOrigin = "",
    simulate = false,
    requesterName = "Guest",
    initialTicketId,
  } = options;

  // If you want to pick up a ticket id from the URL without storing it anywhere:
  // e.g. /chat.html?t=6910ab... (no persistence)
  const ticketFromUrl = (() => {
    try {
      const u = new URL(window.location.href);
      return u.searchParams.get("t") || null;
    } catch {
      return null;
    }
  })();

  const [messages, setMessages] = useState([]);
  const [ticketId, setTicketId] = useState(
    initialTicketId || ticketFromUrl || null
  );
  const [isTyping, setIsTyping] = useState(false);

  const socketRef = useRef(null);
  const scrollTrigger = useRef(0);
  const seenIdsRef = useRef(new Set()); // dedupe for history + live

  const normalizeWire = (m) => ({
    id: String(m._id || m.id || crypto.randomUUID()),
    role:
      m.authorType === "user"
        ? "user"
        : m.authorType === "staff"
        ? "staff"
        : "bot",
    author: m.authorName || m.authorType || "bot",
    text: m.text || "",
    ts: new Date(m.createdAt || m.ts || Date.now()).getTime(),
  });

  const pushMessage = useCallback((msg) => {
    if (!msg?.id) return;
    if (seenIdsRef.current.has(msg.id)) return;
    seenIdsRef.current.add(msg.id);

    setMessages((prev) => {
      const next = [...prev, msg];
      return next;
    });

    if (msg.role === "bot") setIsTyping(false);
    scrollTrigger.current++;
  }, []);

  const replaceAllMessages = useCallback((arr) => {
    const ids = new Set();
    const deduped = [];
    for (const m of arr) {
      if (!m?.id || ids.has(m.id)) continue;
      ids.add(m.id);
      deduped.push(m);
    }
    seenIdsRef.current = ids;
    setMessages(deduped);
    scrollTrigger.current++;
  }, []);

  // --- create ticket once (unless initialTicketId provided) ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (ticketId) return; // already have one (SSR/url param)
      try {
        const res = await axios.post(`${apiBase}/tickets`, {
          requesterName,
          title: "Customer Chat",
          severity: "minor",
          source: "web",
        });
        const id = String(res.data?.ticket?._id);
        if (id && mounted) {
          setTicketId(id);
          setIsTyping(true); // expect welcome/AI soon
        }
      } catch {
        if (simulate && mounted) {
          const fake = `local-${crypto.randomUUID()}`;
          setTicketId(fake);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [apiBase, ticketId, requesterName, simulate]);

  // --- initial REST history (safety on mount / ticket change) ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!ticketId || ticketId.startsWith("local-")) return;
      try {
        const r = await axios.get(`${apiBase}/tickets/${ticketId}/messages`);
        const arr = Array.isArray(r.data) ? r.data : r.data?.messages || [];
        const normalized = arr.map(normalizeWire);
        if (!cancelled) replaceAllMessages(normalized);
      } catch {
        // ignore; socket backlog will cover it on join
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase, ticketId, replaceAllMessages]);

  // --- socket wiring (one socket for the page) ---
  useEffect(() => {
    const socket = io(socketOrigin || undefined, {
      transports: ["websocket"],
      withCredentials: false,
    });
    socketRef.current = socket;

    const joinCurrent = () => {
      if (!ticketId || ticketId.startsWith("local-")) return;
      socket.emit("join", { ticketId, role: "customer" });
    };

    socket.on("connect", joinCurrent);
    socket.io.on("reconnect", joinCurrent);
    socket.on("reconnect", joinCurrent);

    // history backlog (server emits once on join)
    const onHistory = (history) => {
      if (!Array.isArray(history)) return;
      const normalized = history.map(normalizeWire);
      replaceAllMessages(normalized);
    };
    socket.on("chat:history", onHistory);

    // live messages
    const onChatNew = (payload) => {
      if (!payload?.ticketId) return;
      if (String(payload.ticketId) !== String(ticketId)) return;
      pushMessage(normalizeWire(payload));
    };
    socket.on("chat:new", onChatNew);

    // typing (optional)
    const onTyping = ({ ticketId: tId, isTyping: typing }) => {
      if (String(tId) === String(ticketId)) setIsTyping(Boolean(typing));
    };
    socket.on("chat:typing", onTyping);

    const onVis = () => {
      if (document.visibilityState === "visible") joinCurrent();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      socket.off("chat:history", onHistory);
      socket.off("chat:new", onChatNew);
      socket.off("chat:typing", onTyping);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [socketOrigin, ticketId, pushMessage, replaceAllMessages, apiBase]);

  // --- when ticketId changes, proactively join & refresh history ---
  useEffect(() => {
    if (!ticketId || ticketId.startsWith("local-")) return;

    if (socketRef.current?.connected) {
      socketRef.current.emit("join", { ticketId, role: "customer" });
    }

    (async () => {
      try {
        const r = await axios.get(`${apiBase}/tickets/${ticketId}/messages`);
        const arr = Array.isArray(r.data) ? r.data : r.data?.messages || [];
        const normalized = arr.map(normalizeWire);
        replaceAllMessages(normalized);
      } catch {
        // ignore
      }
    })();
  }, [ticketId, apiBase, replaceAllMessages]);

  // --- send message ---
  const sendMessage = useCallback(
    async (text) => {
      if (!text?.trim()) return;

      if (!ticketId || ticketId.startsWith("local-") || simulate) {
        // offline demo
        pushMessage({
          id: crypto.randomUUID(),
          role: "user",
          author: requesterName,
          text,
          ts: Date.now(),
        });

        setIsTyping(true);
        try {
          const canned = [
            "Thanks! A specialist will reply shortly.",
            "I’m checking on that now.",
            "Got it—give me a moment.",
            "Let me escalate this to our support team.",
          ];
          await new Promise((r) => setTimeout(r, 700 + Math.random() * 900));
          pushMessage({
            id: crypto.randomUUID(),
            role: "bot",
            author: "AutoBot",
            text: canned[Math.floor(Math.random() * canned.length)],
            ts: Date.now(),
          });
        } finally {
          setIsTyping(false);
        }
        return;
      }

      setIsTyping(true);
      const stopTypingIn = setTimeout(() => setIsTyping(false), 10_000);

      try {
        await axios.post(`${apiBase}/tickets/${ticketId}/chat`, {
          authorType: "user",
          authorName: requesterName,
          text,
        });
      } catch {
        pushMessage({
          id: crypto.randomUUID(),
          role: "bot",
          author: "System",
          text: "⚠️ Network error. Please try again.",
          ts: Date.now(),
        });
        setIsTyping(false);
      } finally {
        clearTimeout(stopTypingIn);
      }
    },
    [apiBase, ticketId, requesterName, simulate, pushMessage]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    seenIdsRef.current = new Set();
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
    clearChat,
    scrollTrigger,
    ticketId,
    setTicketId, // exposed so parent can inject/replace id without storage
  };
}
