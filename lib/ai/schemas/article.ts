import { z } from "zod";

export const articleDraftSchema = z.object({
  title: z.string().max(120),
  metaDescription: z.string().max(160),
  body: z.string().describe("The full article body in Markdown, matching the brief's outline."),
});

export type ArticleDraft = z.infer<typeof articleDraftSchema>;
