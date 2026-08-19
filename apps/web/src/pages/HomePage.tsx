import { useEffect, useState } from "react";
import type { PointSummary } from "@bonjotan/shared-types";
import { Link } from "react-router-dom";
import { ProgressCard } from "../components/ProgressCard";
import { getPoints } from "../services/api";

export function HomePage() {
  const [points, setPoints] = useState<PointSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    getPoints(controller.signal)
      .then((nextPoints) => { setPoints(nextPoints); setStatus("ready"); })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow light">Scan · Learn · Practice · Explore</span>
          <h1>Let’s explore English together!</h1>
          <p>Find ten QR points around Bonjotan. Each stop has a tiny lesson and two fun questions.</p>
          <a className="button button-light" href="#trail">See the trail <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="sun">☀</span>
          <span className="hill hill-back" />
          <span className="hill hill-front" />
          <span className="sign">HELLO!</span>
          <span className="walker">🧒🏽</span>
        </div>
      </section>

      <div className="page-stack">
        <ProgressCard completed={0} />
        <section id="trail" aria-labelledby="trail-heading">
          <div className="section-heading">
            <div><span className="eyebrow">Choose a stop</span><h2 id="trail-heading">English Points</h2></div>
            <span className="count-pill">10 stops</span>
          </div>

          {status === "loading" && <div className="state-card" role="status">Loading the trail…</div>}
          {status === "error" && <div className="state-card error"><strong>The trail couldn’t load.</strong><br />Check your connection and try again.</div>}
          {status === "ready" && (
            <ol className="point-grid">
              {points.map((point) => (
                <li key={point.id}>
                  <Link className="point-card" to={`/point/${point.slug}`}>
                    <span className="point-number">{point.pointNumber}</span>
                    <span className="point-details"><strong>{point.title}</strong><small>{point.topic}</small></span>
                    <span className="arrow" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}

