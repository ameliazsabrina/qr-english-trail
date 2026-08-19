import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="Bonjotan English Trail home">
          <span className="brand-mark" aria-hidden="true">B</span>
          <span>English Trail</span>
        </NavLink>
        <NavLink className="leaderboard-link" to="/leaderboard">
          <span aria-hidden="true">🏆</span> Leaders
        </NavLink>
      </header>
      <main>{children}</main>
      <footer className="footer">Made for learning and exploring Bonjotan.</footer>
    </div>
  );
}

