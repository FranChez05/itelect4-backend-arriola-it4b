import { z } from "zod";

export const aiRequestSchema = z.object({
  prompt: z.string().trim().min(20, "Ask a player question in at least 20 characters.").max(2000, "Keep the question under 2000 characters."),
});

export const aiTopicSchema = z.enum(["booking", "availability", "account", "admin", "mixed", "other"]);

export const aiReplySchema = z.object({
  topic: aiTopicSchema.describe("The main BAMICOURT topic addressed by the player's question."),
  answers: z.array(z.object({
    question: z.string().min(1).describe("One distinct question from the player's message."),
    answer: z.string().min(1).describe("A direct, accurate answer to that question."),
  })).min(1).describe("A separate answer for every distinct player question, kept in the order asked."),
});

export type AiReply = z.infer<typeof aiReplySchema>;
export const aiReplyJsonSchema = z.toJSONSchema(aiReplySchema);
