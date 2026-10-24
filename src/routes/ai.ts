import { Router, type Request, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import { authMiddleware } from "../middleware/auth";
import { aiRequestSchema } from "../schemas/review";
import { AiReplyError, reviewProject } from "../ai/gemini";

const router = Router();
router.use(authMiddleware);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  keyGenerator: (req: Request) => req.userId || "unauthenticated",
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Five AI reviews a minute is the limit. Try again shortly." },
});
router.use(aiLimiter);

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = aiRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation failed", errors: parsed.error.issues.map((issue) => issue.message) });
    return;
  }

  try {
    res.status(200).json(await reviewProject(parsed.data.prompt));
  } catch (error) {
    const errorStatus = typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status?: unknown }).status)
      : undefined;
    if (errorStatus === 429 || (error instanceof Error && /quota|resource_exhausted/i.test(error.message))) {
      res.status(429).json({ message: "The AI quota is used up for now. Try again later." });
      return;
    }
    console.error("AI review failed:", error);
    if (error instanceof Error && error.message === "GEMINI_API_KEY is missing.") {
      res.status(500).json({ message: "AI review is not configured on the server yet." });
      return;
    }
    const message = error instanceof AiReplyError
      ? "The AI service returned an unusable review. Please try again."
      : "The AI service did not answer properly. Please try again.";
    res.status(502).json({ message });
  }
});

export default router;
