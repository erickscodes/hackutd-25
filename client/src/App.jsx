import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import "./App.css";
import Dashboard from "./pages/Dashboard.jsx";
import Chatbot from "./pages/Chatbot.jsx";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <Dashboard />
      <Chatbot />
    </div>
  );
}

export default App;
