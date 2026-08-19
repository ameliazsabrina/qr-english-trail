import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { HomePage } from "./pages/HomePage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PointPage } from "./pages/PointPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/point/:slug" element={<AppShell><PointPage /></AppShell>} />
      <Route path="/leaderboard" element={<AppShell><LeaderboardPage /></AppShell>} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<AppShell><NotFoundPage /></AppShell>} />
    </Routes>
  );
}
