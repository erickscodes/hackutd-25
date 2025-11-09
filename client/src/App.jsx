import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import "./App.css";
import Chatbot from "./pages/Chatbot.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Chatbot />
      <Dashboard />
    </>
  );
}

export default App;
