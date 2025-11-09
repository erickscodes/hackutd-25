import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  Mic,
  Paperclip,
  Trash2,
  Sparkles,
  Bot,
  User,
  ChevronLeft,
  Loader2,
} from "lucide-react";

function Chatbot() {
  const [messages, setMessages] = useState([
    {
      sender: "AI-agent",
      text: "💬 Welcome to the Chatbot! How can I help you with your happiness today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const listRef = useRef(null);

  /** Persist to localStorage */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  /** Auto-scroll to bottom on new message */
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  /** Placeholder: simulate a bot response after sending */
  async function fakeBotResponse(userText) {
    setIsTyping(true);
    // TODO: Replace with your real call, e.g.:
    // const res = await axios.post("/api/chat", { text: userText });
    // const botText = res.data.text;
    const canned = [
      "Thanks for the details! Let me check your account & relevant diagnostics.",
      "I can help with that. A quick reset often helps—shall I walk you through it?",
      "I’m reviewing your area’s network status and line provisioning now.",
      "I can escalate this to a specialist team and follow up via SMS or email.",
    ];
    const botText = canned[Math.floor(Math.random() * canned.length)];

    setTimeout(() => {
      setMessages((msgs) => [
        ...msgs,
        {
          sender: "AI-agent",
          text: `😊 Thanks for sharing! (You said: "${input}")`,
        },
      ]);
      setIsTyping(false);
    }
  };

  /** Keyboard: Enter to send, Shift+Enter for newline */
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /** Clear conversation */
  const clearAll = () => {
    if (confirm("Clear this conversation?")) {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  /** Empty state */
  const isEmpty = messages.length === 0 && !isTyping;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #ffe6f0 0%, #fff6fb 100%)",
      }}
    >
      <h2
        style={{
          fontSize: "2.5rem",
          fontWeight: "bold",
          color: "#E20074",
          marginBottom: "0.5rem",
          letterSpacing: "1px",
        }}
      >
        Chatbot Happiness Assistant
      </h2>
      <div
        style={{
          width: "100%",
          maxWidth: 500,
          flex: 1,
          marginBottom: 12,
          overflowY: "auto",
          background: "rgba(255,255,255,0.8)",
          borderRadius: 16,
          boxShadow: "0 2px 12px rgba(226,0,116,0.08)",
          padding: "1rem",
          border: "1px solid #f7c7e3",
        }}
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: TMOBILE.magenta }}
          >
            <ChevronLeft className="h-4 w-4" />
            Dashboard
          </a>
          <div className="text-center">
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
              Live Chat
            </div>
            <h1
              className="mt-1 text-lg sm:text-xl font-extrabold tracking-tight"
              style={{
                backgroundImage: `linear-gradient(90deg, ${TMOBILE.magenta}, ${TMOBILE.magentaLight})`,
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              T-Mobile Support Assistant
            </h1>
          </div>
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl border transition"
            style={{ borderColor: TMOBILE.stroke, color: TMOBILE.magenta }}
            title="Clear chat"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="mx-auto max-w-4xl w-full px-4 sm:px-6 md:px-8 py-4 flex-1">
        <div
          ref={listRef}
          className="w-full h-full max-h-[calc(100dvh-260px)] sm:max-h-[calc(100dvh-240px)] overflow-y-auto rounded-2xl p-4 sm:p-6 border"
          style={{
            background: "rgba(255,255,255,0.65)",
            borderColor: TMOBILE.stroke,
            boxShadow: "0 8px 26px rgba(226,0,116,0.15)",
          }}
        >
          {/* Empty / Onboarding */}
          {isEmpty && (
            <div className="h-full min-h-[40vh] flex flex-col items-center justify-center text-center">
              <div
                className="mb-3 inline-flex items-center justify-center w-12 h-12 rounded-2xl"
                style={{ background: "rgba(226,0,116,0.12)" }}
              >
                <Sparkles color={TMOBILE.magenta} />
              </div>
              <h2
                className="text-xl sm:text-2xl font-bold"
                style={{ color: TMOBILE.ink }}
              >
                How can we help today?
              </h2>
              <p className="text-slate-600 mt-1">
                Try a quick prompt or type your question below.
              </p>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
                {SUGGESTED.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-left px-4 py-3 rounded-xl border transition hover:-translate-y-0.5"
                    style={{
                      background: "rgba(255,255,255,0.85)",
                      borderColor: TMOBILE.stroke,
                      boxShadow: "0 6px 20px rgba(226,0,116,0.12)",
                    }}
                  >
                    <span className="text-sm text-slate-800">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Thread */}
          <div className="space-y-3">
            {messages.map((m) => (
              <Bubble key={m.id} role={m.role} text={m.text} ts={m.ts} />
            ))}

            {isTyping && (
              <div className="mt-2">
                <TypingDots />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Input Bar */}
      <footer
        ref={scrollRef}
        className="sticky bottom-0 border-t backdrop-blur-xl"
        style={{
          background: "rgba(255,255,255,0.85)",
          borderColor: TMOBILE.stroke,
        }}
      >
        <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 md:px-8 py-3">
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
              margin: "10px 0",
            }}
          >
            <div
              style={{
                background: msg.sender === "user" ? "#E20074" : "#fff",
                color: msg.sender === "user" ? "#fff" : "#E20074",
                padding: "10px 16px",
                borderRadius: "18px",
                maxWidth: "70%",
                fontWeight: msg.sender === "user" ? "500" : "600",
                fontSize: "1.1rem",
                boxShadow: "0 1px 6px rgba(226,0,116,0.08)",
                border: msg.sender === "user" ? "none" : "1px solid #f7c7e3",
              }}
            >
              <span>
                {msg.sender === "user" ? "You" : "Agent"}: {msg.text}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          width: "100%",
          maxWidth: 500,
          marginTop: "auto",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message about your experience..."
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #E20074",
            fontSize: "1rem",
            outline: "none",
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "12px 24px",
            background: "#E20074",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(226,0,116,0.12)",
            transition: "background 0.2s",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
