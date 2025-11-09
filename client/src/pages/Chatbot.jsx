import { useState } from "react";

function Chatbot() {
  const [messages, setMessages] = useState([
    {
      sender: "AI-agent",
      text: "💬 Welcome to the Chatbot! How can I help you with your happiness today?",
    },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { sender: "user", text: input }]);
    setInput("");

    setTimeout(() => {
      setMessages((msgs) => [
        ...msgs,
        {
          sender: "AI-agent",
          text: `😊 Thanks for sharing! (You said: "${input}")`,
        },
      ]);
    }, 800);
  };

  return (
    <div
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
        {messages.map((msg, i) => (
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

export default Chatbot;
