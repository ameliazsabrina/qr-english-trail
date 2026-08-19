import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="narrow-page empty-state">
      <span className="empty-icon" aria-hidden="true">🧭</span>
      <h1>We wandered off the trail</h1>
      <p>This page does not exist, but the English Points are nearby.</p>
      <Link className="button button-primary" to="/">Find the trail</Link>
    </section>
  );
}

