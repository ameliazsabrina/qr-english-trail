import { useEffect, useState } from "react";
import type { PublicLearningPoint } from "@bonjotan/shared-types";
import { Link, useParams } from "react-router-dom";
import { getPoint } from "../services/api";
import { PointQuizFlow } from "./HomePage";

export function PointPage() {
  const { slug = "" } = useParams();
  const [point, setPoint] = useState<PublicLearningPoint>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    setPoint(undefined);
    setStatus("loading");
    getPoint(slug, controller.signal)
      .then((nextPoint) => { setPoint(nextPoint); setStatus("ready"); })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, [slug]);

  if (status === "loading") return <main id="main-content" className="mx-auto my-11 w-[min(calc(100%-32px),760px)] rounded-[18px] border border-line bg-white p-[30px] text-center" role="status" aria-live="polite">Opening your English Point…</main>;
  if (status === "error" || !point) return <NotFoundPoint />;

  return <PointQuizFlow slug={slug} />;
}

function NotFoundPoint() {
  return (
    <main id="main-content" className="mx-auto my-11 flex min-h-[55vh] w-[min(calc(100%-32px),760px)] flex-col items-center justify-center text-center">
      <span className="text-6xl" aria-hidden="true">🪧</span>
      <h1 className="my-2 text-[clamp(2rem,8vw,3.3rem)] tracking-[-.035em]">This English Point is hiding</h1>
      <p className="max-w-[480px] text-lg leading-normal text-muted">The QR code may be damaged or this point is not active yet.</p>
      <Link className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-ink px-5 py-3 font-black text-white no-underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink" to="/">Back to the trail</Link>
    </main>
  );
}
