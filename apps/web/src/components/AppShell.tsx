import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen">
      <header className="flex h-[70px] items-center justify-between border-b border-line bg-white px-[max(20px,calc((100vw-1120px)/2))] max-sm:h-[62px]">
        <nav className="contents" aria-label="Primary navigation">
        <NavLink className="flex items-center gap-2.5 text-[1.08rem] font-black no-underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink" to="/" aria-label="Bonjotan English Trail home">
          <span className="grid size-[38px] place-items-center rounded-[12px_12px_12px_3px] bg-sun text-ink" aria-hidden="true">B</span>
          <span>English Trail</span>
        </NavLink>
        <NavLink className="rounded-xl px-[13px] py-2.5 font-bold no-underline hover:bg-sun-soft focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink" to="/leaderboard">
          <span aria-hidden="true">🏆</span> Leaders
        </NavLink>
        </nav>
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
      <footer className="border-t border-line px-5 py-[30px] text-center text-muted">Made for learning and exploring Bonjotan.</footer>
    </div>
  );
}
