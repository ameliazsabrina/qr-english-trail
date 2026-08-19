import { describe, expect, it } from "vitest";
import { learningPoints } from "./points.js";
import { validateContent } from "./validation.js";

describe("content validation", () => {
  it("accepts the initial ten-point content set", () => {
    expect(() => validateContent(learningPoints)).not.toThrow();
  });

  it("rejects duplicate question IDs", () => {
    const copy = structuredClone(learningPoints);
    copy[1]!.questions[0]!.id = copy[0]!.questions[0]!.id;
    expect(() => validateContent(copy)).toThrow(/Duplicate question ID/);
  });
});
