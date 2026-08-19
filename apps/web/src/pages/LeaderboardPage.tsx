import { Link } from "react-router-dom";

export function LeaderboardPage() {
  return (
    <section className="narrow-page empty-state">
      <span className="empty-icon" aria-hidden="true">🏆</span>
      <span className="eyebrow">Trail leaders</span>
      <h1>Leaderboard coming soon</h1>
      <p>Only nicknames, safe avatars, scores, and points discovered will appear here.</p>
      <Link className="button button-primary" to="/">Explore the trail</Link>
    </section>
  );
}

