// useChatbot.js
import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const STORAGE_KEY = "tmobile_chat_messages_v1";
const TICKET_KEY = "tmobile_chat_ticket_id_v1";

/**
 * Customer chat hook with real-time updates via Socket.IO.
 *
 * Options:
 *  - apiBase: REST base path (default "/api")
 *  - socketOrigin: Socket.IO origin ("" for same origin, or e.g. "http://localhost:4000")
 *  - simulate: fallback canned replies (default false)
 */
export default function useChatbot(options = {}) {
  const {
    apiBase = "/api",
    socketOrigin = "",
    simulate = false,
    requesterName = "Guest",
  } = options;

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [ticketId, setTicketId] = useState(
    () => localStorage.getItem(TICKET_KEY) || null
  );

  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef(null);
  const scrollTrigger = useRef(0); // increment to auto-scroll in UI

  // -------- helpers --------
  const addMessage = useCallback((role, text, extra = {}) => {
    const msg = {
      id: extra.id || crypto.randomUUID(),
      role, // 'user' | 'staff' | 'bot'
      author: extra.author || (role === "staff" ? "Agent" : role),
      text: text || "",
      ts: extra.ts || Date.now(),
    };
    setMessages((prev) => {
      const next = [...prev, msg];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    scrollTrigger.current++;
  }, []);

  const replaceAllMessages = useCallback((arr) => {
    setMessages(arr);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch {}
    scrollTrigger.current++;
  }, []);

  // -------- ensure ticket exists (create once) --------
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (ticketId) return;
      try {
        // Create a ticket to anchor this chat thread
        const res = await axios.post(`${apiBase}/tickets`, {
          requesterName,
          title: "Customer Chat",
          severity: "minor",
          source: "web",
        });
        const id = String(res.data?.ticket?._id);
        if (id && mounted) {
          setTicketId(id);
          localStorage.setItem(TICKET_KEY, id);
        }
      } catch (e) {
        // If server creation fails, we can still simulate locally
        if (simulate && mounted) {
          // create a fake id so the UI works offline
          const fake = `local-${crypto.randomUUID()}`;
          setTicketId(fake);
          localStorage.setItem(TICKET_KEY, fake);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [apiBase, ticketId, requesterName, simulate]);

  // -------- initial history load --------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!ticketId || ticketId.startsWith("local-")) return;
      try {
        const r = await axios.get(`${apiBase}/tickets/${ticketId}/messages`);
        const arr = Array.isArray(r.data) ? r.data : r.data?.messages || [];
        const normalized = arr.map((m) => ({
          id: String(m._id || crypto.randomUUID()),
          role:
            m.authorType === "user"
              ? "user"
              : m.authorType === "staff"
              ? "staff"
              : "bot",
          author: m.authorName || m.authorType || "bot",
          text: m.text || "",
          ts: new Date(m.createdAt || Date.now()).getTime(),
        }));
        if (!cancelled) replaceAllMessages(normalized);
      } catch {
        // no history endpoint or network — ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase, ticketId, replaceAllMessages]);

  // -------- socket wiring --------
  useEffect(() => {
    if (!ticketId || ticketId.startsWith("local-")) return;

    const socket = io(socketOrigin || undefined, {
      transports: ["websocket"],
      withCredentials: false,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", { ticketId, role: "customer" });
    });

    socket.on("chat:new", (payload) => {
      if (String(payload.ticketId) !== String(ticketId)) return;

      const role =
        payload.authorType === "user"
          ? "user"
          : payload.authorType === "staff"
          ? "staff"
          : "bot";

      addMessage(role, payload.text || "", {
        id: String(payload._id || crypto.randomUUID()),
        ts: new Date(payload.createdAt || Date.now()).getTime(),
        author: payload.authorName || payload.authorType || role,
      });
    });

    // Optional: live typing signal from server
    socket.on("chat:typing", ({ ticketId: tId, isTyping: typing }) => {
      if (String(tId) === String(ticketId)) setIsTyping(Boolean(typing));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [socketOrigin, ticketId, addMessage]);

  // -------- send message --------
  const sendMessage = useCallback(
    async (text) => {
      if (!text?.trim()) return;

      // Immediate echo of the user's own message
      addMessage("user", text);

      // show typing until server responds/broadcasts
      setIsTyping(true);

      try {
        if (!ticketId || ticketId.startsWith("local-") || simulate) {
          // Simulated reply (offline)
          const canned = [
            "Thanks! A specialist will reply shortly.",
            "I’m checking on that now.",
            "Got it—give me a moment.",
            "Let me escalate this to our support team.",
          ];
          await new Promise((r) => setTimeout(r, 700 + Math.random() * 900));
          addMessage("bot", canned[Math.floor(Math.random() * canned.length)]);
        } else {
          // Real call; server will broadcast 'chat:new' to the room
          await axios.post(`${apiBase}/tickets/${ticketId}/chat`, {
            authorType: "user",
            authorName: requesterName,
            text,
          });
        }
      } catch (e) {
        addMessage("bot", "⚠️ Network error. Please try again.");
      } finally {
        setIsTyping(false);
      }
    },
    [addMessage, apiBase, ticketId, requesterName, simulate]
  );

  // -------- clear (keep thread id so staff can resume) --------
  const clearChat = useCallback(() => {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
    clearChat,
    scrollTrigger,
    ticketId,
  };
}
