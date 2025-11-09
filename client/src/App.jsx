import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Chatbot from "./pages/Chatbot.jsx";
import NotFound from "./pages/NotFound.jsx"; // optional but recommended
import Feedback from "./pages/Feedback.jsx";
import Support from "./pages/SupportPanel.jsx";

function App() {
  return (
    <div className="staff-app">
      <Dashboard />
      <Chatbot />
    </div>
  );
}

export default App;
