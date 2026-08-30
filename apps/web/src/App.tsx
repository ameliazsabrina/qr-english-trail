import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { HomePage } from "./pages/HomePage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PointPage } from "./pages/PointPage";
import { RecoveryPage } from "./pages/RecoveryPage";

export function App() {
  return (
    <>
      <a className="sr-only fixed left-3 top-3 z-50 rounded bg-white p-3 font-bold text-ink focus:not-sr-only" href="#main-content">Skip to main content</a>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/point/:slug" element={<PointPage />} />
        <Route path="/leaderboard" element={<AppShell><LeaderboardPage /></AppShell>} />
        <Route path="/recover" element={<AppShell><RecoveryPage /></AppShell>} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<AppShell><NotFoundPage /></AppShell>} />
      </Routes>
    </>
  );
}
