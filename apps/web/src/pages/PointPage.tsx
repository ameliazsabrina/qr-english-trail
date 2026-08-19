import { useEffect, useState } from "react";
import type { PublicLearningPoint } from "@bonjotan/shared-types";
import { Link, useParams } from "react-router-dom";
import { getPoint } from "../services/api";

export function PointPage() {
  const { slug = "" } = useParams();
  const [point, setPoint] = useState<PublicLearningPoint>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    getPoint(slug, controller.signal)
      .then((nextPoint) => { setPoint(nextPoint); setStatus("ready"); })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, [slug]);

  if (status === "loading") return <div className="narrow-page state-card" role="status">Opening your English Point…</div>;
  if (status === "error" || !point) return <NotFoundPoint />;

  return (
    <article className="narrow-page lesson-page">
      <Link className="back-link" to="/">← All English Points</Link>
      <header className="lesson-header">
        <span className="point-number large">{point.pointNumber}</span>
        <div><span className="eyebrow">English Point {point.pointNumber} of 10</span><h1>{point.title}</h1><p>{point.topic}</p></div>
      </header>
      <section className="lesson-card">
        <span className="eyebrow">Tiny lesson</span>
        <h2>{point.lesson.heading}</h2>
        <p className="lesson-body">{point.lesson.body}</p>
        <div className="example-list">
          {point.lesson.examples?.map((example) => (
            <div className="example" key={example.english}>
              <strong>{example.english}</strong>
              {example.translation && <span>{example.translation}</span>}
            </div>
          ))}
        </div>
      </section>
      <section className="quiz-callout">
        <div><span className="eyebrow light">Ready to practise?</span><h2>Two questions are waiting</h2><p>Questions will be chosen from a pool of {point.questionCount}.</p></div>
        <button className="button button-light" type="button" disabled title="Player and attempt API is the next implementation slice">Start quiz</button>
      </section>
      <p className="scaffold-note">Quiz attempts unlock when the player and scoring service is connected.</p>
    </article>
  );
}

function NotFoundPoint() {
  return (
    <section className="narrow-page empty-state">
      <span className="empty-icon" aria-hidden="true">🪧</span>
      <h1>This English Point is hiding</h1>
      <p>The QR code may be damaged or this point is not active yet.</p>
      <Link className="button button-primary" to="/">Back to the trail</Link>
    </section>
  );
}

