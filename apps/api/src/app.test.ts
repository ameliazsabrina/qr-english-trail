import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";

const apps: Awaited<ReturnType<typeof createApp>>[] = [];
afterEach(async () => Promise.all(apps.splice(0).map((app) => app.close())));

describe("content API", () => {
  it("lists ten active points", async () => {
    const app = await createApp({ WEB_ORIGIN: "http://localhost:5173" });
    apps.push(app);
    const response = await app.inject({ method: "GET", url: "/api/points" });
    expect(response.statusCode).toBe(200);
    expect(response.json().points).toHaveLength(10);
  });

  it("does not expose question answer keys on a point response", async () => {
    const app = await createApp({ WEB_ORIGIN: "http://localhost:5173" });
    apps.push(app);
    const response = await app.inject({ method: "GET", url: "/api/points/greetings" });
    expect(response.statusCode).toBe(200);
    expect(response.body).not.toContain("correctOptionId");
    expect(response.json().point.questionCount).toBe(5);
  });

  it("returns a friendly error for an unknown QR slug", async () => {
    const app = await createApp({ WEB_ORIGIN: "http://localhost:5173" });
    apps.push(app);
    const response = await app.inject({ method: "GET", url: "/api/points/not-a-point" });
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("POINT_NOT_FOUND");
  });
});
