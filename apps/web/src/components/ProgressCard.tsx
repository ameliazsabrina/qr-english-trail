type ProgressCardProps = { completed: number; total?: number };

export function ProgressCard({ completed, total = 10 }: ProgressCardProps) {
  const percent = Math.round((completed / total) * 100);
  return (
    <section className="progress-card" aria-labelledby="progress-title">
      <div className="progress-copy">
        <span className="eyebrow">Your adventure</span>
        <h2 id="progress-title">{completed}/{total} English Points discovered</h2>
      </div>
      <div className="progress-track" role="progressbar" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={total}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <p>{completed === 0 ? "Scan a trail QR code or choose a point to begin." : "Keep exploring—you’re doing brilliantly!"}</p>
    </section>
  );
}

