type ProgressCardProps = { completed: number; total?: number };

export function ProgressCard({ completed, total = 10 }: ProgressCardProps) {
  const percent = Math.round((completed / total) * 100);
  return (
    <section className="rounded-[22px] border border-line bg-white p-[26px] shadow-[0_10px_30px_rgba(21,21,21,.07)]" aria-labelledby="progress-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-xs font-black uppercase tracking-[.11em]">Your adventure</span>
        <h2 className="my-1.5 text-[clamp(1.35rem,4vw,1.75rem)]" id="progress-title">{completed}/{total} English Points discovered</h2>
      </div>
      <div className="h-[13px] overflow-hidden rounded-full bg-cream" role="progressbar" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={total}>
        <span className="block h-full rounded-[inherit] bg-sun" style={{ width: `${percent}%` }} />
      </div>
      <p className="mb-0 mt-3 text-muted">{completed === 0 ? "Scan a trail QR code or choose a point to begin." : "Keep exploring—you’re doing brilliantly!"}</p>
    </section>
  );
}
