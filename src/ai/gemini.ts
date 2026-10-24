import { GoogleGenAI, type Content } from "@google/genai";
import { reviewSchema, reviewJsonSchema, type AiReview } from "../schemas/review";
import { EXAMPLES, MODEL, SYSTEM_PROMPT, wrap } from "./prompt";

export class AiReplyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiReplyError";
  }
}

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing.");
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

function buildContents(prompt: string): Content[] {
  const contents: Content[] = [];
  for (const example of EXAMPLES) {
    contents.push({ role: "user", parts: [{ text: wrap(example.description) }] });
    contents.push({ role: "model", parts: [{ text: JSON.stringify(example.review) }] });
  }
  contents.push({ role: "user", parts: [{ text: wrap(prompt) }] });
  return contents;
}

export async function reviewProject(prompt: string): Promise<AiReview> {
  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: buildContents(prompt),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema: reviewJsonSchema,
    },
  });
  const text = response.text;
  if (!text) throw new AiReplyError("Gemini returned an empty reply.");
  let decoded: unknown;
  try {
    decoded = JSON.parse(text);
  } catch {
    throw new AiReplyError("Gemini returned invalid JSON.");
  }
  const parsed = reviewSchema.safeParse(decoded);
  if (!parsed.success) throw new AiReplyError("Gemini's reply did not match the review schema.");
  return parsed.data;
}
