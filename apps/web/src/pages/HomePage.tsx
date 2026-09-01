import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  AttemptCompletion,
  PlayerProfile,
  QuizAnswerResult,
  QuizAttempt,
  QuizQuestion,
} from "@bonjotan/shared-types";
import { Link } from "react-router-dom";
import {
  answerAttempt,
  ApiRequestError,
  createPlayer,
  getCurrentPlayer,
  startAttempt,
  updateCurrentPlayer,
} from "../services/api";
import {
  clearPlayerSession,
  loadLegacyPlayerProfile,
  loadPlayerSession,
  PLAYER_AVATARS,
  removeLegacyPlayerProfile,
  savePlayerSession,
} from "../storage/player";

type LoadStatus = "loading" | "ready" | "error";

const AVATARS = PLAYER_AVATARS.map((src, index) => ({
  id: `avatar-${index + 1}`,
  label: `Avatar ${index + 1}`,
  src,
}));

const PRIMARY_BUTTON =
  "flex min-h-14 items-center justify-center gap-3 rounded-2xl border-2 border-ink bg-sun px-5 py-3.5 font-black text-ink shadow-[0_6px_0_#151515] transition-transform active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink";
const LOGO =
  "relative block aspect-[3.125] overflow-hidden [&>img]:absolute [&>img]:-top-[102.5%] [&>img]:left-0 [&>img]:block [&>img]:h-auto [&>img]:w-full";

export function HomePage() {
  const [onboardingStarted, setOnboardingStarted] = useState(() =>
    Boolean(loadPlayerSession()),
  );

  if (onboardingStarted) {
    return (
      <AccountGate returnTo="/">
        {(profile, _token, onEdit) => (
          <ReadyToScanScreen player={profile} onChangeProfile={onEdit} />
        )}
      </AccountGate>
    );
  }

  return (
    <main
      id="main-content"
      className="grid min-h-dvh place-items-center bg-sun px-5 py-[max(24px,env(safe-area-inset-top))]"
    >
      <section
        className="w-full max-w-[560px] rounded-[30px] border-[3px] border-ink bg-cream p-[clamp(28px,8vw,52px)] text-center shadow-[0_10px_0_#151515]"
        aria-labelledby="scan-title"
      >
        <span className={`${LOGO} mx-auto mb-7 w-[200px]`}>
          <img src="/assets/logo.svg" alt="Bonjohop" />
        </span>
        <h1
          className="mb-4 mt-2.5 text-[clamp(2.25rem,10vw,3.8rem)] leading-none tracking-[-.035em]"
          id="scan-title"
        >
          Scan a village QR code to play
        </h1>
        <p className="text-[1.05rem] leading-[1.55] text-muted">
          Cari salah satu dari sepuluh papan <strong>English Point</strong> di
          sekitar Bonjotan. Buka kamera HP kamu, scan kode QR-nya, lalu buka
          link untuk mulai kuis yang berisi lima pertanyaan.
        </p>
        <button
          className={`${PRIMARY_BUTTON} mt-7 w-full`}
          type="button"
          onClick={() => setOnboardingStarted(true)}
        >
          Play
        </button>
      </section>
    </main>
  );
}

export function PointQuizFlow({ slug }: { slug: string }) {
  return (
    <AccountGate returnTo={`/point/${slug}`}>
      {(profile, token, onEdit) => (
        <QuizScreen
          slug={slug}
          player={profile}
          token={token}
          onChangeProfile={onEdit}
        />
      )}
    </AccountGate>
  );
}

function AccountGate({
  children,
  returnTo,
}: {
  children:
    | ReactNode
    | ((
        profile: PlayerProfile,
        token: string,
        onEdit: () => void,
      ) => ReactNode);
  returnTo: string;
}) {
  const storedSession = useState(() => loadPlayerSession())[0];
  const legacy = useState(() => loadLegacyPlayerProfile())[0];
  const [token, setToken] = useState(storedSession?.token);
  const [profile, setProfile] = useState<PlayerProfile>();
  const [status, setStatus] = useState<
    "loading" | "setup" | "ready" | "auth-error"
  >(storedSession ? "loading" : "setup");
  const [authRevision, setAuthRevision] = useState(0);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(() => legacy?.name ?? "");
  const [avatarInput, setAvatarInput] = useState(
    () => legacy?.avatar ?? AVATARS[0]!.src,
  );
  const [error, setError] = useState<string>();
  const [recoveryCode, setRecoveryCode] = useState<string>();

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    getCurrentPlayer(token, controller.signal)
      .then((next) => {
        setProfile(next);
        setNameInput(next.nickname);
        setAvatarInput(next.avatarId);
        setStatus("ready");
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        if (reason instanceof ApiRequestError && reason.status === 401) {
          clearPlayerSession();
          setToken(undefined);
          setStatus("setup");
        } else {
          setStatus("auth-error");
        }
      });
    return () => controller.abort();
  }, [token, authRevision]);

  async function saveAccount(name: string, avatar: string) {
    setError(undefined);
    try {
      if (editing && token) {
        const next = await updateCurrentPlayer(token, name, avatar);
        setProfile(next);
        setEditing(false);
        setStatus("ready");
        return;
      }
      const created = await createPlayer(name, avatar);
      const saved = savePlayerSession(created.sessionToken);
      if (saved) removeLegacyPlayerProfile();
      setToken(created.sessionToken);
      setProfile(created.player);
      setStatus("ready");
      setRecoveryCode(created.recoveryCode);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "We could not save your player. Please try again.",
      );
    }
  }

  if (status === "loading") return <QuizState message="Finding your player…" />;
  if (status === "auth-error")
    return (
      <QuizState
        message="We couldn’t reconnect to your player. Your saved session is still safe in this browser."
        action="Try again"
        onAction={() => {
          setStatus("loading");
          setAuthRevision((value) => value + 1);
        }}
      />
    );
  if (recoveryCode)
    return (
      <RecoveryCodeScreen
        code={recoveryCode}
        onContinue={() => setRecoveryCode(undefined)}
      />
    );

  if (!profile || editing || status === "setup") {
    return (
      <WelcomeScreen
        name={nameInput}
        avatar={avatarInput}
        editing={editing}
        returnTo={returnTo}
        onNameChange={setNameInput}
        onAvatarChange={setAvatarInput}
        onStart={saveAccount}
        {...(error ? { error } : {})}
      />
    );
  }
  const onEdit = () => {
    setNameInput(profile.nickname);
    setAvatarInput(profile.avatarId);
    setEditing(true);
  };
  return (
    <>
      {typeof children === "function"
        ? children(profile, token!, onEdit)
        : children}
    </>
  );
}

function WelcomeScreen({
  name,
  avatar,
  editing,
  returnTo,
  onNameChange,
  onAvatarChange,
  onStart,
  error,
}: {
  name: string;
  avatar: string;
  editing: boolean;
  returnTo: string;
  onNameChange: (name: string) => void;
  onAvatarChange: (avatar: string) => void;
  onStart: (name: string, avatar: string) => void | Promise<void>;
  error?: string;
}) {
  const trimmedName = name.trim();
  const headingRef = useInitialFocus<HTMLHeadingElement>();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (trimmedName && avatar) onStart(trimmedName, avatar);
  }

  return (
    <main
      id="main-content"
      className="relative isolate flex min-h-dvh overflow-hidden bg-cream px-5 py-6 text-ink"
    >
      <div
        className="absolute -right-9 -top-11 -z-10 size-28 rounded-full bg-sun/50"
        aria-hidden="true"
      />
      <div
        className="absolute -left-5 top-[37%] -z-10 size-14 rounded-full bg-sun/50"
        aria-hidden="true"
      />
      {/* <div
        className="absolute inset-x-0 bottom-0 -z-20 h-1/4 rounded-t-[50%] bg-sun"
        aria-hidden="true"
      /> */}
      <section
        className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-[500px] flex-col items-center justify-center text-center md:min-h-[calc(100dvh-5rem)]"
        aria-labelledby="welcome-title"
      >
        <h1
          className="sr-only"
          id="welcome-title"
          ref={headingRef}
          tabIndex={-1}
        >
          {editing ? "Edit your player" : "Create your player"}
        </h1>
        <div className="mb-8 flex items-center font-black">
          <span className={`${LOGO} w-[min(62vw,245px)]`}>
            <img src="/assets/logo.svg" alt="Bonjohop" />
          </span>
        </div>
        <form className="grid w-full gap-3 text-left" onSubmit={handleSubmit}>
          <AvatarCarousel avatar={avatar} onChange={onAvatarChange} />
          <label className="text-sm font-extrabold" htmlFor="player-name">
            Your name
          </label>
          <input
            className="h-16 w-full rounded-2xl border-2 border-ink bg-white px-5 text-lg text-ink shadow-[0_8px_24px_rgba(21,21,21,.08)] outline-none focus:ring-4 focus:ring-sun/40"
            id="player-name"
            name="name"
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="e.g. Budi"
            autoComplete="name"
            maxLength={40}
          />
          <button
            className={PRIMARY_BUTTON}
            type="submit"
            disabled={!trimmedName || !avatar}
          >
            {editing ? "Save changes" : "Start Playing"}
          </button>
          {error && (
            <p
              className="m-0 text-center font-bold text-red-700"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </p>
          )}
          {!editing && (
            <Link
              className="text-center font-bold text-ink"
              to={`/recover?returnTo=${encodeURIComponent(returnTo)}`}
            >
              Sudah punya akun? Pulihkan dengan kodemu.
            </Link>
          )}
        </form>
      </section>
    </main>
  );
}

function ReadyToScanScreen({
  player,
  onChangeProfile,
}: {
  player: PlayerProfile;
  onChangeProfile: () => void;
}) {
  const headingRef = useInitialFocus<HTMLHeadingElement>();

  return (
    <main
      id="main-content"
      className="grid min-h-dvh place-items-center bg-sun px-5 py-[max(24px,env(safe-area-inset-top))]"
    >
      <section
        className="w-full max-w-[560px] rounded-[30px] border-[3px] border-ink bg-cream p-[clamp(28px,8vw,52px)] shadow-[0_10px_0_#151515]"
        aria-labelledby="ready-title"
      >
        <div className="flex items-center gap-4 border-b-2 border-line pb-5">
          <img
            className="size-20 rounded-full border-2 border-ink bg-sun-soft object-cover"
            src={player.avatarId}
            alt=""
            width="500"
            height="500"
          />
          <div className="min-w-0">
            <p className="m-0 text-sm font-extrabold uppercase tracking-[.08em] text-muted">
              Ready to explore
            </p>
            <p className="m-0 truncate text-2xl font-black">
              {player.nickname}
            </p>
          </div>
        </div>
        <div className="py-7">
          <span className="text-5xl" aria-hidden="true">
            ⌁
          </span>
          <h1
            className="mb-3 mt-3 text-[clamp(2.4rem,10vw,4rem)] leading-none tracking-[-.035em] outline-none"
            id="ready-title"
            ref={headingRef}
            tabIndex={-1}
          >
            Ready to scan
          </h1>
          <p className="m-0 text-[1.05rem] leading-[1.55] text-muted">
            You’re ready—scan an English Point QR code.
          </p>
          <p className="mb-0 mt-3 leading-[1.55] text-muted">
            Open your phone’s camera, point it at a village QR sign, then tap
            the link that appears.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            className="min-h-14 rounded-2xl border-2 border-ink bg-white px-5 py-3 font-black text-ink focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink"
            type="button"
            onClick={onChangeProfile}
          >
            Edit profile
          </button>
          <Link
            className="flex min-h-14 items-center justify-center rounded-2xl border-2 border-ink bg-ink px-5 py-3 font-black text-white no-underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink"
            to="/leaderboard"
          >
            View leaderboard
          </Link>
        </div>
      </section>
    </main>
  );
}

function RecoveryCodeScreen({
  code,
  onContinue,
}: {
  code: string;
  onContinue: () => void;
}) {
  const headingRef = useInitialFocus<HTMLHeadingElement>();

  return (
    <main
      id="main-content"
      className="grid min-h-dvh place-items-center bg-sun px-5 text-center"
    >
      <section
        className="w-full max-w-lg rounded-[28px] border-[3px] border-ink bg-white p-8 shadow-[0_10px_0_#151515]"
        aria-labelledby="recovery-title"
      >
        <h1
          className="outline-none"
          id="recovery-title"
          ref={headingRef}
          tabIndex={-1}
        >
          Simpan kode ini yaa!
        </h1>
        <p>
          Kode ini digunakan untuk mengakses akunmu. Simpan di tempat yang aman,
          misalnya di catatan HP atau screenshot. Jangan sampai hilang.
        </p>
        <output className="my-6 block rounded-xl bg-cream p-4 text-xl font-black tracking-wider">
          {code}
        </output>
        <button
          className={`${PRIMARY_BUTTON} w-full`}
          type="button"
          onClick={onContinue}
        >
          I saved my code
        </button>
      </section>
    </main>
  );
}

function AvatarCarousel({
  avatar,
  onChange,
}: {
  avatar: string;
  onChange: (avatar: string) => void;
}) {
  const matchedIndex = AVATARS.findIndex((option) => option.src === avatar);
  const currentIndex = matchedIndex >= 0 ? matchedIndex : 0;

  function move(direction: -1 | 1) {
    const nextIndex =
      (currentIndex + direction + AVATARS.length) % AVATARS.length;
    onChange(AVATARS[nextIndex]!.src);
  }

  return (
    <fieldset className="m-0 min-w-0 border-0 pb-2 text-center">
      <legend className="mb-3 w-full p-0 text-center text-sm font-extrabold">
        Pick your avatar
      </legend>
      <div className="relative mx-auto flex w-full max-w-[310px] items-center justify-center">
        <button
          className="absolute left-1 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-white p-0 text-lg font-black text-ink shadow-[0_5px_0_#ffc400] active:-translate-y-[46%] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink"
          type="button"
          onClick={() => move(-1)}
          aria-label="Previous avatar"
        >
          <span aria-hidden="true">←</span>
        </button>
        <div className="w-[170px] overflow-hidden rounded-full">
          <div
            className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {AVATARS.map((option, index) => (
              <div
                className="aspect-square shrink-0 basis-full rounded-full border-[3px] border-ink bg-sun-soft shadow-[0_5px_0_#ffc400]"
                key={option.id}
                aria-hidden={index !== currentIndex}
              >
                <img
                  src={option.src}
                  alt={index === currentIndex ? option.label : ""}
                  width="500"
                  height="500"
                  className="block size-full rounded-[inherit] object-cover"
                />
              </div>
            ))}
          </div>
        </div>
        <button
          className="absolute right-1 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-white p-0 text-lg font-black text-ink shadow-[0_5px_0_#ffc400] active:-translate-y-[46%] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink"
          type="button"
          onClick={() => move(1)}
          aria-label="Next avatar"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <div
        className="mt-3 flex justify-center gap-2"
        aria-label="Choose avatar"
      >
        {AVATARS.map((option, index) => (
          <button
            type="button"
            key={option.id}
            className={`h-3 rounded-full border border-ink transition-[width,background-color] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${index === currentIndex ? "w-7 bg-ink" : "w-3 bg-white"}`}
            onClick={() => onChange(option.src)}
            aria-label={`Choose ${option.label}`}
            aria-pressed={index === currentIndex}
          />
        ))}
      </div>
    </fieldset>
  );
}

function QuizScreen({
  slug,
  player,
  token,
  onChangeProfile,
}: {
  slug: string;
  player: PlayerProfile;
  token: string;
  onChangeProfile: () => void;
}) {
  const [attempt, setAttempt] = useState<QuizAttempt>();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string>();
  const [answerResult, setAnswerResult] = useState<QuizAnswerResult>();
  const [isChecking, setIsChecking] = useState(false);
  const [score, setScore] = useState(0);
  const [completion, setCompletion] = useState<AttemptCompletion>();
  const [modeAcknowledged, setModeAcknowledged] = useState(false);
  const [answerError, setAnswerError] = useState<string>();
  const headingRef = useRef<HTMLHeadingElement>(null);

  function loadQuestions() {
    const controller = new AbortController();
    setStatus("loading");
    startAttempt(token, slug, controller.signal)
      .then((nextAttempt) => {
        setAttempt(nextAttempt);
        setQuestions(nextAttempt.questions);
        setQuestionIndex(0);
        setSelectedOptionId(undefined);
        setAnswerResult(undefined);
        setScore(0);
        setCompletion(undefined);
        setModeAcknowledged(false);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setStatus("error");
      });
    return () => controller.abort();
  }

  useEffect(loadQuestions, [slug, token]);
  const question = questions[questionIndex];

  async function chooseAnswer(optionId: string) {
    if (!question || answerResult || isChecking) return;
    setSelectedOptionId(optionId);
    setIsChecking(true);
    try {
      const response = await answerAttempt(
        token,
        attempt!.id,
        question.id,
        optionId,
      );
      setAnswerResult(response.result);
      setCompletion(response.completion);
      setAnswerError(undefined);
      if (response.result.correct) setScore((current) => current + 1);
    } catch (reason) {
      setSelectedOptionId(undefined);
      setAnswerError(
        reason instanceof Error
          ? reason.message
          : "We could not save that answer. Try again.",
      );
    } finally {
      setIsChecking(false);
    }
  }

  function nextQuestion() {
    setSelectedOptionId(undefined);
    setAnswerResult(undefined);
    setQuestionIndex((current) => current + 1);
    window.setTimeout(() => headingRef.current?.focus(), 0);
  }

  if (status === "loading")
    return <QuizState message="Mixing your questions…" />;
  if (status === "error")
    return (
      <QuizState
        message="We couldn’t load the questions."
        action="Try again"
        onAction={loadQuestions}
      />
    );
  if (attempt && !modeAcknowledged) {
    const practice = attempt.mode === "practice";
    return (
      <main
        id="main-content"
        className="grid min-h-dvh place-items-center bg-cream px-5 text-center"
      >
        <section
          className="w-full max-w-lg rounded-[28px] border-[3px] border-ink bg-white p-8 shadow-[0_10px_0_#ffc400]"
          aria-labelledby="mode-title"
        >
          ```tsx
          <span className="text-5xl" aria-hidden="true">
            {practice ? "🔄" : "⭐"}
          </span>
          <h1 id="mode-title">
            {practice ? "Let’s Practice!" : "Let’s Earn Points!"}
          </h1>
          <p>
            {practice
              ? "Ready for another round? Practice as much as you like! Your leaderboard score will stay the same."
              : "Answer correctly to earn 100 points, then get 20 bonus points when you finish the quiz!"}
          </p>
          <button
            className={`${PRIMARY_BUTTON} mt-5 w-full`}
            type="button"
            onClick={() => setModeAcknowledged(true)}
          >
            {practice ? "Practice Again!" : "Start Quiz!"}
          </button>
          ```
        </section>
      </main>
    );
  }
  if (!question) {
    return (
      <main
        id="main-content"
        className="flex min-h-dvh flex-col items-center justify-center bg-cream px-5 py-[30px] text-center"
      >
        <img
          className="mb-5 size-28 rounded-full border-[3px] border-ink bg-sun-soft object-cover shadow-[0_8px_0_#ffc400]"
          src={player.avatarId}
          alt=""
          width="500"
          height="500"
        />
        <span className="text-xs font-black uppercase tracking-[.105em]">
          Round complete
        </span>
        <h1 className="my-2.5 text-[clamp(2.5rem,12vw,4.4rem)] tracking-[-.035em]">
          Great work, {player.nickname}!
        </h1>
        <p className="mb-7 text-[1.08rem] text-muted">
          You got <strong>{score}</strong> of{" "}
          <strong>{questions.length}</strong> questions right.
        </p>
        {completion && (
          <div
            className="mb-6 rounded-2xl border-2 border-ink bg-white px-5 py-4"
            aria-live="polite"
          >
            <strong className="block text-xl">
              +{completion.awardedScore} leaderboard points
            </strong>
            <span>
              {completion.progress.totalScore} total ·{" "}
              {completion.progress.completedPointCount}/10 English Points
              discovered
            </span>
          </div>
        )}
        <button
          className={`${PRIMARY_BUTTON} w-full max-w-[340px]`}
          type="button"
          onClick={loadQuestions}
        >
          Play again <span aria-hidden="true">↻</span>
        </button>
        <Link
          className="mt-[22px] inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-4 py-2.5 font-extrabold text-ink no-underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink"
          to="/leaderboard"
        >
          <span aria-hidden="true">🏆</span>
          See the leaderboard
        </Link>
      </main>
    );
  }

  const progress =
    ((questionIndex + (answerResult ? 1 : 0)) / questions.length) * 100;

  return (
    <main id="main-content" className="flex min-h-dvh flex-col bg-cream">
      <header className="flex min-h-[72px] items-center justify-between gap-3 px-[18px] pb-[11px] pt-[max(13px,env(safe-area-inset-top))] min-[700px]:px-8">
        <div className="flex items-center gap-2.5 font-black">
          <span className={`${LOGO} w-[104px] min-[700px]:w-[120px]`}>
            <img src="/assets/logo.svg" alt="Bonjohop" />
          </span>
        </div>
        <button
          className="max-w-[60%] cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap rounded-full border-2 border-ink bg-sun px-[13px] py-[9px] font-extrabold text-ink focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink [&>img]:-ml-2 [&>img]:-my-1.5 [&>img]:mr-1.5 [&>img]:inline-block [&>img]:size-[30px] [&>img]:rounded-full [&>img]:object-cover [&>span]:align-middle"
          type="button"
          onClick={onChangeProfile}
          aria-label={`Player: ${player.nickname}. Change name or avatar`}
        >
          <img src={player.avatarId} alt="" width="500" height="500" />
          <span>{player.nickname}</span>
        </button>
      </header>
      <div
        className="h-[5px] bg-white"
        aria-label={`Question ${questionIndex + 1} of ${questions.length}`}
      >
        <span
          className="block h-full bg-sun transition-[width] duration-200 motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
      <section
        className="mx-auto flex w-full max-w-[900px] flex-1 flex-col px-[18px] pb-[max(24px,env(safe-area-inset-bottom))] pt-6 min-[700px]:p-[34px] min-[700px]:pt-9"
        aria-labelledby="question-heading"
      >
        <div className="flex justify-between gap-4 text-xs font-black uppercase tracking-[.08em]">
          <span>{question.topic}</span>
          <span>
            {questionIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="flex flex-1 flex-col justify-center py-7 min-[700px]:py-11">
          {question.instructions && (
            <p className="mb-2 text-muted">{question.instructions}</p>
          )}
          {question.media && (
            <img
              className="mb-5 max-h-80 w-full rounded-[18px] object-contain"
              src={question.media.src}
              alt={question.media.alt ?? ""}
            />
          )}
          <h1
            className="m-0 text-[clamp(2rem,9.7vw,4.1rem)] leading-[1.05] tracking-[-.035em] outline-none"
            id="question-heading"
            ref={headingRef}
            tabIndex={-1}
          >
            {question.prompt}
          </h1>
          <p
            className="mb-0 mt-3 text-[clamp(.95rem,4vw,1.2rem)] font-semibold leading-snug text-muted"
            lang="id"
          >
            {question.translation}
          </p>
        </div>
        <div
          className="grid gap-[11px] min-[700px]:grid-cols-3 min-[700px]:gap-3.5"
          aria-label="Answer choices"
        >
          {question.options?.map((option, index) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrect = answerResult?.correctOptionId === option.id;
            const isWrong = Boolean(
              answerResult && isSelected && !answerResult.correct,
            );
            return (
              <button
                className={`relative grid min-h-[67px] w-full cursor-pointer grid-cols-[40px_1fr_auto] items-center gap-[13px] rounded-[17px] border-2 border-ink bg-white px-[15px] py-[11px] text-left font-extrabold text-ink transition-[background-color,transform] active:scale-[.985] disabled:cursor-default disabled:opacity-100 disabled:active:scale-100 min-[700px]:min-h-[104px] ${isSelected ? "bg-sun-soft" : ""} ${isCorrect ? "bg-sun" : ""} ${isWrong ? "bg-white shadow-[inset_0_0_0_3px_#fff9e9]" : ""}`}
                type="button"
                key={option.id}
                onClick={() => chooseAnswer(option.id)}
                disabled={Boolean(answerResult) || isChecking}
              >
                <span
                  className={`grid size-[38px] place-items-center rounded-[11px] text-xs ${isWrong ? "bg-ink text-white" : "bg-sun text-ink"}`}
                  aria-hidden="true"
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex min-w-0 items-center gap-3">
                  {option.image && (
                    <img
                      className="size-[72px] rounded-xl object-cover"
                      src={option.image.src}
                      alt={option.image.alt ?? ""}
                    />
                  )}
                  <span>{option.label}</span>
                </span>
                {(isCorrect || isWrong) && (
                  <span className="text-2xl" aria-hidden="true">
                    {isCorrect ? "✓" : "×"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
      {answerResult && (
        <aside
          className={`grid gap-[15px] border-t-2 border-ink px-[18px] pb-[max(20px,env(safe-area-inset-bottom))] pt-5 min-[700px]:grid-cols-[1fr_auto] min-[700px]:items-center min-[700px]:px-[max(34px,calc((100vw-832px)/2))] ${answerResult.correct ? "bg-sun" : "bg-white"}`}
          aria-live="polite"
        >
          <div>
            <strong className="block text-xl">
              {answerResult.correct ? "Nice one!" : "Almost!"}
            </strong>
            <p className="mb-0 mt-1 leading-snug">{answerResult.explanation}</p>
          </div>
          <button
            className="min-h-[52px] cursor-pointer rounded-[14px] border-2 border-ink bg-ink px-[18px] py-[11px] font-black text-white focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink min-[700px]:min-w-[180px]"
            type="button"
            onClick={nextQuestion}
          >
            {questionIndex === questions.length - 1
              ? "See results"
              : "Continue"}{" "}
            <span aria-hidden="true">→</span>
          </button>
        </aside>
      )}
      {answerError && (
        <p
          className="m-0 bg-white p-3 text-center font-bold text-red-700"
          role="alert"
          aria-live="assertive"
        >
          {answerError}
        </p>
      )}
    </main>
  );
}

function QuizState({
  message,
  action,
  onAction,
}: {
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center bg-cream px-5 py-[30px] text-center"
      role="status"
      aria-live="polite"
    >
      <span
        className="mb-[18px] grid size-[74px] place-items-center rounded-[24px_24px_24px_7px] bg-sun text-[2rem] font-black text-ink shadow-[0_8px_0_#151515]"
        aria-hidden="true"
      >
        B
      </span>
      <p className="font-bold text-muted">{message}</p>
      {action && (
        <button
          className={`${PRIMARY_BUTTON} min-w-[180px]`}
          type="button"
          onClick={onAction}
        >
          {action}
        </button>
      )}
    </main>
  );
}

function useInitialFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return ref;
}
