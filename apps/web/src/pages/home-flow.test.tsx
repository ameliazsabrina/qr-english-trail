// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError, createPlayer, getCurrentPlayer, updateCurrentPlayer } from "../services/api";
import { HomePage } from "./HomePage";

vi.mock("../services/api", () => ({
  ApiRequestError: class ApiRequestError extends Error {
    constructor(public status: number, message: string) { super(message); }
  },
  getCurrentPlayer: vi.fn(),
  createPlayer: vi.fn(),
  updateCurrentPlayer: vi.fn(),
  startAttempt: vi.fn(),
  answerAttempt: vi.fn(),
}));

const player = {
  publicPlayerId: "player",
  nickname: "Rara",
  avatarId: "/assets/avatars/1.png",
};
const sessionToken = "s".repeat(43);

function renderHome() {
  return render(<MemoryRouter><HomePage /></MemoryRouter>);
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.mocked(getCurrentPlayer).mockResolvedValue(player);
  vi.mocked(createPlayer).mockResolvedValue({
    player,
    sessionToken,
    recoveryCode: "BJN-AAAA-BBBB-CCCC",
  });
  vi.mocked(updateCurrentPlayer).mockResolvedValue(player);
});

afterEach(cleanup);

describe("home session flow", () => {
  it("shows the landing before a new visitor starts onboarding", async () => {
    const user = userEvent.setup();
    renderHome();

    expect(screen.getByRole("heading", { name: /scan a village qr code/i })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(screen.getByRole("heading", { name: "Create your player" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /recover an existing player/i }).getAttribute("href")).toBe("/recover?returnTo=%2F");
  });

  it("shows the one-time recovery code after successful creation", async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole("button", { name: "Play" }));
    await user.type(screen.getByLabelText("Your name"), "Rara");
    await user.click(screen.getByRole("button", { name: "Start Playing" }));

    expect(await screen.findByRole("heading", { name: /simpan kode ini yaa/i })).toBeTruthy();
    expect(screen.getByText("BJN-AAAA-BBBB-CCCC")).toBeTruthy();
    expect(localStorage.getItem("bonjotanPlayerSession")).toContain(sessionToken);
  });

  it("continues from account creation to Ready to scan", async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole("button", { name: "Play" }));
    await user.type(screen.getByLabelText("Your name"), "Rara");
    await user.click(screen.getByRole("button", { name: "Start Playing" }));
    await user.click(await screen.findByRole("button", { name: "I saved my code" }));

    expect(screen.getByRole("heading", { name: "Ready to scan" })).toBeTruthy();
    expect(screen.getByText("Rara")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Play" })).toBeNull();
  });

  it("uses a valid stored session to skip landing and onboarding", async () => {
    localStorage.setItem("bonjotanPlayerSession", JSON.stringify({ version: 2, token: sessionToken }));
    renderHome();

    expect(await screen.findByRole("heading", { name: "Ready to scan" })).toBeTruthy();
    expect(getCurrentPlayer).toHaveBeenCalledWith(sessionToken, expect.any(AbortSignal));
    expect(screen.queryByRole("button", { name: "Play" })).toBeNull();
  });

  it("clears an invalid stored token and returns safely to onboarding", async () => {
    localStorage.setItem("bonjotanPlayerSession", JSON.stringify({ version: 2, token: sessionToken }));
    vi.mocked(getCurrentPlayer).mockRejectedValueOnce(new ApiRequestError(401, "Expired"));
    renderHome();

    expect(await screen.findByRole("heading", { name: "Create your player" })).toBeTruthy();
    expect(localStorage.getItem("bonjotanPlayerSession")).toBeNull();
  });

  it("updates the profile without creating another player", async () => {
    const user = userEvent.setup();
    localStorage.setItem("bonjotanPlayerSession", JSON.stringify({ version: 2, token: sessionToken }));
    vi.mocked(updateCurrentPlayer).mockResolvedValue({ ...player, nickname: "Dito" });
    renderHome();

    await user.click(await screen.findByRole("button", { name: "Edit profile" }));
    const nameInput = screen.getByLabelText("Your name");
    await user.clear(nameInput);
    await user.type(nameInput, "Dito");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(screen.getByText("Dito")).toBeTruthy());
    expect(updateCurrentPlayer).toHaveBeenCalledWith(sessionToken, "Dito", "/assets/avatars/1.png");
    expect(createPlayer).not.toHaveBeenCalled();
  });
});
