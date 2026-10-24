import { z } from "zod";

export const aiRequestSchema = z.object({
  prompt: z.string().trim().min(20, "Describe your booking app in at least 20 characters.").max(2000, "Keep the description under 2000 characters."),
});

export const reviewSchema = z.object({
  summary: z.string().describe("One sentence summarizing how the described badminton booking app works."),
  strengths: z.array(z.string()).min(1).max(3).describe("Specific strengths demonstrated by the booking app description."),
  improvements: z.array(z.string()).min(1).max(3).describe("Concrete improvements for the booking app, prioritized for players and facility admins."),
  readiness: z.enum(["ready", "almost", "not-yet"]).describe("How ready the booking app is for real users based only on the details provided."),
});

export type AiReview = z.infer<typeof reviewSchema>;
export const reviewJsonSchema = z.toJSONSchema(reviewSchema);
