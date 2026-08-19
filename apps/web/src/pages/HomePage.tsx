import { type FormEvent, useEffect, useRef, useState } from "react";
import type { QuizAnswerResult, QuizQuestion } from "@bonjotan/shared-types";
import { checkAnswer, getQuiz } from "../services/api";
import {
  forgetPlayerAvatar,
  forgetPlayerName,
  getRememberedPlayerAvatar,
  getRememberedPlayerName,
  rememberPlayerAvatar,
  rememberPlayerName,
} from "../storage/player";

type LoadStatus = "loading" | "ready" | "error";

const AVATARS = ["1.png", "2.png", "3.png", "4.png", "5.png"].map(
  (fileName, index) => ({
    id: `avatar-${index + 1}`,
    label: `Avatar ${index + 1}`,
    src: `/assets/avatars/${fileName}`,
  }),
);

const PRIMARY_BUTTON =
  "flex min-h-14 items-center justify-center gap-3 rounded-2xl border-2 border-ink bg-sun px-5 py-3.5 font-black text-ink shadow-[0_6px_0_#151515] transition-transform active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink";
const SECONDARY_BUTTON =
  "rounded-full border-2 border-ink bg-white px-4 py-2.5 font-extrabold text-ink focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink";

export function HomePage() {
  const [playerName, setPlayerName] = useState(
    () => getRememberedPlayerName()?.trim() ?? "",
  );
  const [playerAvatar, setPlayerAvatar] = useState(
    () => getRememberedPlayerAvatar() ?? "",
  );
  const [nameInput, setNameInput] = useState(
    () => getRememberedPlayerName()?.trim() ?? "",
  );
  const [avatarInput, setAvatarInput] = useState(
    () => getRememberedPlayerAvatar() ?? AVATARS[0]!.src,
  );

  if (!playerName || !playerAvatar) {
    return (
      <WelcomeScreen
        name={nameInput}
        avatar={avatarInput}
        onNameChange={setNameInput}
        onAvatarChange={setAvatarInput}
        onStart={(name, avatar) => {
          rememberPlayerName(name);
          rememberPlayerAvatar(avatar);
          setPlayerName(name);
          setPlayerAvatar(avatar);
        }}
      />
    );
  }

  return (
    <QuizScreen
      playerName={playerName}
      playerAvatar={playerAvatar}
      onChangeProfile={() => {
        forgetPlayerAvatar();
        forgetPlayerName();
        setNameInput(playerName);
        setAvatarInput(playerAvatar);
        setPlayerName("");
        setPlayerAvatar("");
      }}
    />
  );
}

function WelcomeScreen({
  name,
  avatar,
  onNameChange,
  onAvatarChange,
  onStart,
}: {
  name: string;
  avatar: string;
  onNameChange: (name: string) => void;
  onAvatarChange: (avatar: string) => void;
  onStart: (name: string, avatar: string) => void;
}) {
  const trimmedName = name.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (trimmedName && avatar) onStart(trimmedName, avatar);
  }

  return (
    <main className="relative isolate flex min-h-dvh overflow-hidden bg-cream px-5 py-6 text-ink">
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
        <div className="mb-8 flex items-center font-black">
          <span className="quiz-logo w-[min(62vw,245px)]">
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
            placeholder="e.g. Rara"
            autoComplete="name"
            maxLength={40}
          />
          <button
            className={PRIMARY_BUTTON}
            type="submit"
            disabled={!trimmedName || !avatar}
          >
            Start Playing
          </button>
        </form>
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
            className={`h-3 rounded-full border border-ink transition-all focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${index === currentIndex ? "w-7 bg-ink" : "w-3 bg-white"}`}
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
  playerName,
  playerAvatar,
  onChangeProfile,
}: {
  playerName: string;
  playerAvatar: string;
  onChangeProfile: () => void;
}) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string>();
  const [answerResult, setAnswerResult] = useState<QuizAnswerResult>();
  const [isChecking, setIsChecking] = useState(false);
  const [score, setScore] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  function loadQuestions() {
    const controller = new AbortController();
    setStatus("loading");
    getQuiz(controller.signal)
      .then((nextQuestions) => {
        setQuestions(nextQuestions);
        setQuestionIndex(0);
        setSelectedOptionId(undefined);
        setAnswerResult(undefined);
        setScore(0);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setStatus("error");
      });
    return () => controller.abort();
  }

  useEffect(loadQuestions, []);
  const question = questions[questionIndex];

  async function chooseAnswer(optionId: string) {
    if (!question || answerResult || isChecking) return;
    setSelectedOptionId(optionId);
    setIsChecking(true);
    try {
      const result = await checkAnswer(question.id, optionId);
      setAnswerResult(result);
      if (result.correct) setScore((current) => current + 1);
    } catch {
      setSelectedOptionId(undefined);
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
  if (!question) {
    return (
      <main className="quiz-complete">
        <img
          className="complete-avatar"
          src={playerAvatar}
          alt=""
          width="500"
          height="500"
        />
        <span className="step-kicker">Round complete</span>
        <h1>Great work, {playerName}!</h1>
        <p>
          You got <strong>{score}</strong> of{" "}
          <strong>{questions.length}</strong> questions right.
        </p>
        <button className="start-button" type="button" onClick={loadQuestions}>
          Play a new mix <span aria-hidden="true">↻</span>
        </button>
        <button className="text-button" type="button" onClick={onChangeProfile}>
          Change name or avatar
        </button>
      </main>
    );
  }

  const progress =
    ((questionIndex + (answerResult ? 1 : 0)) / questions.length) * 100;

  return (
    <main className={`quiz-screen${answerResult ? " has-feedback" : ""}`}>
      <header className="quiz-header">
        <div className="quiz-brand">
          <span className="quiz-logo header-logo">
            <img src="/assets/logo.svg" alt="Bonjohop" />
          </span>
        </div>
        <button
          className="player-chip"
          type="button"
          onClick={onChangeProfile}
          aria-label={`Player: ${playerName}. Change name or avatar`}
        >
          <img src={playerAvatar} alt="" width="500" height="500" />
          <span>{playerName}</span>
        </button>
      </header>
      <div
        className="quiz-progress"
        aria-label={`Question ${questionIndex + 1} of ${questions.length}`}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <section className="question-stage" aria-labelledby="question-heading">
        <div className="question-meta">
          <span>{question.topic}</span>
          <span>
            {questionIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="question-copy">
          {question.instructions && <p>{question.instructions}</p>}
          <h1 id="question-heading" ref={headingRef} tabIndex={-1}>
            {question.prompt}
          </h1>
        </div>
        <div className="answer-grid" aria-label="Answer choices">
          {question.options?.map((option, index) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrect = answerResult?.correctOptionId === option.id;
            const isWrong = Boolean(
              answerResult && isSelected && !answerResult.correct,
            );
            return (
              <button
                className={`answer-button${isSelected ? " is-selected" : ""}${isCorrect ? " is-correct" : ""}${isWrong ? " is-wrong" : ""}`}
                type="button"
                key={option.id}
                onClick={() => chooseAnswer(option.id)}
                disabled={Boolean(answerResult) || isChecking}
              >
                <span className="answer-key" aria-hidden="true">
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{option.label}</span>
                {(isCorrect || isWrong) && (
                  <span className="answer-mark" aria-hidden="true">
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
          className={`answer-feedback ${answerResult.correct ? "correct" : "incorrect"}`}
          aria-live="polite"
        >
          <div>
            <strong>{answerResult.correct ? "Nice one!" : "Almost!"}</strong>
            <p>{answerResult.explanation}</p>
          </div>
          <button type="button" onClick={nextQuestion}>
            {questionIndex === questions.length - 1
              ? "See results"
              : "Continue"}{" "}
            <span aria-hidden="true">→</span>
          </button>
        </aside>
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
    <main className="quiz-state" role="status">
      <span className="loading-mark" aria-hidden="true">
        B
      </span>
      <p>{message}</p>
      {action && (
        <button className="start-button" type="button" onClick={onAction}>
          {action}
        </button>
      )}
    </main>
  );
}
