// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { QuizQuestion } from "@bonjotan/shared-types";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PointQuizFlow } from "./HomePage";
import { RecoveryPage, validReturnTo } from "./RecoveryPage";
import { createPlayer, recoverPlayer, startAttempt } from "../services/api";

vi.mock("../services/api", () => ({
  ApiRequestError: class extends Error {},
  getCurrentPlayer: vi.fn(async () => ({ publicPlayerId: "player", nickname: "Rara", avatarId: "/assets/avatars/1.png" })),
  createPlayer: vi.fn(), updateCurrentPlayer: vi.fn(),
  recoverPlayer: vi.fn(),
  startAttempt: vi.fn(),
  answerAttempt: vi.fn(async (_token: string, _attempt: string, _question: string, optionId: string) => ({
    result: { correct: optionId === "a", correctOptionId: "a", explanation: "That is right." },
  })),
}));

const questions: QuizQuestion[] = Array.from({ length: 5 }, (_, index) => ({
  id: `question-${index + 1}`, type: "multiple-choice", prompt: `Question ${index + 1}?`,
  translation: `Terjemahan ${index + 1}.`, topic: "Greetings", active: true,
  options: [{ id: "a", label: "Right" }, { id: "b", label: "Wrong" }],
}));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  localStorage.setItem("bonjotanPlayerSession", JSON.stringify({ version: 2, token: "t".repeat(43) }));
  vi.mocked(startAttempt).mockResolvedValue({ id: "attempt", mode: "eligible", expiresAt: new Date().toISOString(), questions });
});
afterEach(cleanup);

describe("server-authoritative QR quiz flow", () => {
  it("announces scoring mode before showing attempt-bound questions", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><PointQuizFlow slug="greetings" /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Let’s Earn Points!" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Start Quiz!" }));
    expect(await screen.findByRole("heading", { name: "Question 1?" })).toBeTruthy();
    expect(startAttempt).toHaveBeenCalledWith("t".repeat(43), "greetings", expect.any(AbortSignal));
    expect(createPlayer).not.toHaveBeenCalled();
  });

  it("clearly announces practice mode before a replay", async () => {
    vi.mocked(startAttempt).mockResolvedValue({ id: "attempt-2", mode: "practice", expiresAt: new Date().toISOString(), questions });
    render(<MemoryRouter><PointQuizFlow slug="greetings" /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Let’s Practice!" })).toBeTruthy();
    expect(screen.getByText(/leaderboard score will stay the same/i)).toBeTruthy();
  });

  it("commits a legacy profile migration only after server creation succeeds", async () => {
    localStorage.clear();
    localStorage.setItem("bonjotanPlayerProfile", JSON.stringify({ version: 1, name: "Rara", avatar: "/assets/avatars/1.png" }));
    vi.mocked(createPlayer).mockResolvedValue({
      player: { publicPlayerId: "player", nickname: "Rara", avatarId: "/assets/avatars/1.png" },
      sessionToken: "s".repeat(43), recoveryCode: "BJN-AAAA-BBBB-CCCC",
    });
    const user = userEvent.setup();
    render(<MemoryRouter><PointQuizFlow slug="greetings" /></MemoryRouter>);
    await user.click(screen.getByRole("button", { name: "Start Playing" }));
    expect(await screen.findByRole("heading", { name: /simpan kode ini yaa/i })).toBeTruthy();
    expect(localStorage.getItem("bonjotanPlayerProfile")).toBeNull();
    expect(localStorage.getItem("bonjotanPlayerSession")).toContain('"version":2');
  });

  it("retains the legacy profile when server migration fails", async () => {
    localStorage.clear();
    localStorage.setItem("bonjotanPlayerProfile", JSON.stringify({ version: 1, name: "Rara", avatar: "/assets/avatars/1.png" }));
    vi.mocked(createPlayer).mockRejectedValue(new Error("Network unavailable"));
    const user = userEvent.setup();
    render(<MemoryRouter><PointQuizFlow slug="greetings" /></MemoryRouter>);
    await user.click(screen.getByRole("button", { name: "Start Playing" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Network unavailable");
    expect(localStorage.getItem("bonjotanPlayerProfile")).not.toBeNull();
    expect(localStorage.getItem("bonjotanPlayerSession")).toBeNull();
  });

  it("continues a first QR visit to the same quiz after recovery-code confirmation", async () => {
    localStorage.clear();
    vi.mocked(createPlayer).mockResolvedValue({
      player: { publicPlayerId: "player", nickname: "Rara", avatarId: "/assets/avatars/1.png" },
      sessionToken: "s".repeat(43), recoveryCode: "BJN-AAAA-BBBB-CCCC",
    });
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={["/point/greetings"]}><PointQuizFlow slug="greetings" /></MemoryRouter>);

    expect(screen.getByRole("link", { name: /pulihkan dengan kodemu/i }).getAttribute("href")).toBe("/recover?returnTo=%2Fpoint%2Fgreetings");
    await user.type(screen.getByLabelText("Your name"), "Rara");
    await user.click(screen.getByRole("button", { name: "Start Playing" }));
    expect(await screen.findByRole("heading", { name: /simpan kode ini yaa/i })).toBeTruthy();
    expect(startAttempt).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "I saved my code" }));
    expect(await screen.findByRole("heading", { name: "Let’s Earn Points!" })).toBeTruthy();
    expect(startAttempt).toHaveBeenCalledWith("s".repeat(43), "greetings", expect.any(AbortSignal));
  });

  it("returns a recovered player to the original QR route", async () => {
    localStorage.clear();
    vi.mocked(recoverPlayer).mockResolvedValue({
      player: { publicPlayerId: "player", nickname: "Rara", avatarId: "/assets/avatars/1.png" },
      sessionToken: "r".repeat(43), recoveryCode: "BJN-AAAA-BBBB-CCCC",
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/recover?returnTo=%2Fpoint%2Fgreetings"]}>
        <Routes>
          <Route path="/recover" element={<RecoveryPage />} />
          <Route path="/point/:slug" element={<CurrentPath />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Recovery code"), "BJN-AAAA-BBBB-CCCC");
    await user.click(screen.getByRole("button", { name: "Recover player" }));
    await user.click(await screen.findByRole("link", { name: "Continue" }));
    expect(await screen.findByText("/point/greetings")).toBeTruthy();
  });

  it("rejects external and unrecognized recovery destinations", () => {
    expect(validReturnTo("/point/greetings")).toBe("/point/greetings");
    expect(validReturnTo("https://example.com/point/greetings")).toBe("/");
    expect(validReturnTo("//example.com")).toBe("/");
    expect(validReturnTo("/leaderboard")).toBe("/");
  });
});

function CurrentPath() {
  return <p>{useLocation().pathname}</p>;
}
