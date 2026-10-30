import { beforeEach, describe, expect, it, vi } from "vitest";

const gemini = vi.hoisted(() => ({ generateContent: vi.fn() }));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: gemini.generateContent };
  },
}));

import { AiReplyError, reviewProject } from "../src/ai/gemini";

describe("Gemini booking review response contract", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
    gemini.generateContent.mockReset();
  });

  it("returns the exact review fields consumed by the frontend", async () => {
    const review = {
      summary: "Players can book available courts and admins review requests.",
      strengths: ["The booking flow is clear."],
      improvements: ["Explain how schedule conflicts are prevented."],
      readiness: "almost",
    };
    gemini.generateContent.mockResolvedValue({ text: JSON.stringify(review) });

    await expect(reviewProject("Players can find courts and submit booking requests for review.")).resolves.toEqual(review);
    expect(gemini.generateContent).toHaveBeenCalledWith(expect.objectContaining({
      config: expect.objectContaining({ responseMimeType: "application/json" }),
    }));
  });

  it("rejects a player Q&A response instead of sending a mismatched shape", async () => {
    gemini.generateContent.mockResolvedValue({
      text: JSON.stringify({ topic: "booking", answers: [{ question: "How?", answer: "Submit a booking request." }] }),
    });

    await expect(reviewProject("Players can find courts and submit booking requests for review.")).rejects.toBeInstanceOf(AiReplyError);
  });
});
