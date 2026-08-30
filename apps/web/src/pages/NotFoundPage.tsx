import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="mx-auto my-11 flex min-h-[55vh] w-[min(calc(100%-32px),760px)] flex-col items-center justify-center text-center">
      <span className="text-6xl" aria-hidden="true">🧭</span>
      <h1 className="my-2 text-[clamp(2rem,8vw,3.3rem)] tracking-[-.035em]">We wandered off the trail</h1>
      <p className="max-w-[480px] text-lg leading-normal text-muted">This page does not exist, but the English Points are nearby.</p>
      <Link className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-ink px-5 py-3 font-black text-white no-underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink" to="/">Find the trail</Link>
    </section>
  );
}
