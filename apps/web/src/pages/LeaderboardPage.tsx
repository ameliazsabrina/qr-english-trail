import { useEffect, useState } from "react";
import type { LeaderboardResponse } from "@bonjotan/shared-types";
import { Link } from "react-router-dom";
import { getLeaderboard } from "../services/api";
import { loadPlayerSession } from "../storage/player";

export function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardResponse>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  function load() {
    const controller = new AbortController();
    setStatus("loading");
    getLeaderboard(loadPlayerSession()?.token, controller.signal)
      .then((result) => { setData(result); setStatus("ready"); })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }

  useEffect(load, []);

  if (status === "loading") return <LeaderboardState message="Loading trail leaders…" />;
  if (status === "error") return <LeaderboardState message="The leaderboard is unavailable right now." action="Try again" onAction={load} />;
  if (!data?.entries.length) return <LeaderboardState message="No explorers are ranked yet. Complete an English Point to be the first!" />;

  const rows = data.currentPlayer ? [...data.entries, data.currentPlayer] : data.entries;
  return (
    <section className="mx-auto my-8 w-[min(calc(100%-32px),760px)]" aria-labelledby="leaderboard-title">
      <div className="mb-6 text-center">
        <span className="text-5xl" aria-hidden="true">🏆</span>
        <h1 className="my-2 text-[clamp(2rem,8vw,3.3rem)]" id="leaderboard-title">Trail leaderboard</h1>
        <p className="text-muted">Scores come from first completions across all ten English Points.</p>
      </div>
      <ol className="m-0 grid list-none gap-3 p-0" aria-label="Player rankings">
        {rows.map((entry, index) => (
          <li
            className={`grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 rounded-2xl border-2 p-3 ${entry.isCurrentPlayer ? "border-ink bg-sun" : "border-line bg-white"}`}
            key={`${entry.rank}-${entry.nickname}-${index}`}
            aria-current={entry.isCurrentPlayer ? "true" : undefined}
          >
            <strong className="w-8 text-center text-lg" aria-label={`Rank ${entry.rank}`}>#{entry.rank}</strong>
            <img className="size-12 rounded-full border border-ink object-cover" src={entry.avatarId} alt="" width="48" height="48" />
            <span className="min-w-0">
              <strong className="block truncate">{entry.nickname}</strong>
              <span className="text-sm text-muted">{entry.completedPointCount}/10 points discovered{entry.isCurrentPlayer ? " · You" : ""}</span>
            </span>
            <strong className="text-lg">{entry.totalScore}</strong>
          </li>
        ))}
      </ol>
      <Link className="mx-auto mt-6 flex min-h-12 w-fit items-center rounded-xl bg-ink px-5 font-black text-white no-underline focus-visible:outline-3 focus-visible:outline-offset-3" to="/">Explore the trail</Link>
    </section>
  );
}

function LeaderboardState({ message, action, onAction }: { message: string; action?: string; onAction?: () => void }) {
  return (
    <section className="mx-auto my-11 flex min-h-[55vh] w-[min(calc(100%-32px),760px)] flex-col items-center justify-center text-center" role="status" aria-live="polite">
      <span className="text-6xl" aria-hidden="true">🏆</span>
      <h1>Trail leaderboard</h1>
      <p className="max-w-[480px] text-lg text-muted">{message}</p>
      {action && <button className="min-h-12 rounded-xl bg-ink px-5 font-black text-white" type="button" onClick={onAction}>{action}</button>}
    </section>
  );
}
