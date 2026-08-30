import { type FormEvent, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { recoverPlayer } from "../services/api";
import { savePlayerSession } from "../storage/player";

export function RecoveryPage() {
  const [searchParams] = useSearchParams();
  const returnTo = validReturnTo(searchParams.get("returnTo"));
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success">("idle");
  const [error, setError] = useState<string>();
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (status === "success") successHeadingRef.current?.focus();
  }, [status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("saving"); setError(undefined);
    try {
      const recovered = await recoverPlayer(code);
      if (!savePlayerSession(recovered.sessionToken)) throw new Error("Browser storage is unavailable.");
      setStatus("success");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not recover that player.");
      setStatus("idle");
    }
  }

  if (status === "success") return (
    <section className="mx-auto my-11 flex min-h-[55vh] w-[min(calc(100%-32px),560px)] flex-col items-center justify-center text-center">
      <h1 className="outline-none" ref={successHeadingRef} tabIndex={-1}>Player restored</h1><p>Your score, progress, and ranking are ready on this browser.</p>
      <Link className="rounded-xl bg-ink px-5 py-3 font-black text-white no-underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink" to={returnTo}>Continue</Link>
    </section>
  );

  return (
    <section className="mx-auto my-11 w-[min(calc(100%-32px),560px)] rounded-3xl border-2 border-ink bg-white p-7">
      <h1>Recover your player</h1>
      <p>Enter the recovery code you saved when the player was created.</p>
      <form className="grid gap-4" onSubmit={submit}>
        <label className="font-bold" htmlFor="recovery-code">Recovery code</label>
        <input className="min-h-14 rounded-xl border-2 border-ink px-4 font-bold uppercase" id="recovery-code" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" required />
        <button className="min-h-14 rounded-xl bg-sun px-5 font-black text-ink disabled:opacity-50" disabled={status === "saving"} type="submit">{status === "saving" ? "Recovering…" : "Recover player"}</button>
        {error && <p className="m-0 font-bold text-red-700" role="alert" aria-live="assertive">{error}</p>}
      </form>
    </section>
  );
}

export function validReturnTo(value: string | null): string {
  if (value === "/") return value;
  return value && /^\/point\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : "/";
}
