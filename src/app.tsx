import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import PollList from "./pages/PollList";
import AddPoll from "./pages/AddPoll";
import ViewPoll from "./pages/ViewPoll";

export default function App() {
  return (
    <Router>
      <nav style={{ padding: "1rem", background: "#eee" }}>
        <Link to="/">Home</Link> | <Link to="/poll/add">Create Poll</Link> | <Link to="/api/creator">Creator Dashboard</Link>
      </nav>
      <Routes>
        <Route path="/" element={<PollList />} />
        <Route path="/poll/add" element={<AddPoll />} />
        <Route path="/poll/:id" element={<ViewPoll />} />
      </Routes>
    </Router>
  );
}
