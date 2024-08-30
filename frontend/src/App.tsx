import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.tsx";
import DebatePage from "./pages/DebatePage.tsx";

function App() {
  const ws = new WebSocket("ws://localhost:8080");
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage ws={ws} />} />
          <Route path="/debate" element={<DebatePage ws={ws} />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
