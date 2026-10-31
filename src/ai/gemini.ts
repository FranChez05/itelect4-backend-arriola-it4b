import "dotenv/config";
import { GoogleGenAI, type Content } from "@google/genai";
import { reviewSchema, reviewJsonSchema, type AiReview } from "../schemas/review";
import { EXAMPLES, FALLBACK_MODEL, MODEL, SYSTEM_PROMPT, wrap } from "./prompt";

export class AiReplyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiReplyError";
  }
}

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing.");
  if (!client) {
    client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        // Keep retries bounded so Vercel can try the fallback model in the same request.
        timeout: 20_000,
        retryOptions: { attempts: 1 },
      },
    });
  }
  return client;
}

function buildContents(description: string): Content[] {
  const contents: Content[] = [];
  for (const example of EXAMPLES) {
    contents.push({ role: "user", parts: [{ text: wrap(example.description) }] });
    contents.push({ role: "model", parts: [{ text: JSON.stringify(example.review) }] });
  }
  contents.push({ role: "user", parts: [{ text: wrap(description) }] });
  return contents;
}

function shouldTryFallback(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { status?: unknown; statusCode?: unknown; message?: unknown };
  const status = Number(candidate.status ?? candidate.statusCode);
  return status === 429 || status === 503 || status === 504 || status === 404 ||
    (typeof candidate.message === "string" && /UNAVAILABLE|SERVICE_UNAVAILABLE|RESOURCE_EXHAUSTED|quota|model .*not found|DEADLINE_EXCEEDED|timeout/i.test(candidate.message));
}

async function generateReview(model: string, prompt: string): Promise<string | undefined> {
  const response = await getClient().models.generateContent({
    model,
    contents: buildContents(prompt),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema: reviewJsonSchema,
      temperature: 0,
    },
  });
  return response.text;
}

export async function reviewProject(prompt: string): Promise<AiReview> {
  let text: string | undefined;
  try {
    text = await generateReview(MODEL, prompt);
  } catch (error) {
    if (!shouldTryFallback(error)) throw error;
    console.warn(`Gemini model ${MODEL} unavailable; retrying with ${FALLBACK_MODEL}.`);
    text = await generateReview(FALLBACK_MODEL, prompt);
  }
  if (!text) throw new AiReplyError("Gemini returned an empty reply.");
  let decoded: unknown;
  try {
    decoded = JSON.parse(text);
  } catch {
    throw new AiReplyError("Gemini returned invalid JSON.");
  }
  const parsed = reviewSchema.safeParse(decoded);
  if (!parsed.success) throw new AiReplyError("Gemini's reply did not match the booking review schema.");
  return parsed.data;
}
