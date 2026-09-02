import { z } from "zod";

export const contentBriefSchema = z.object({
  angle: z.string().describe("The specific angle this article should take, in one sentence."),
  outline: z
    .array(
      z.object({
        heading: z.string(),
        level: z.union([z.literal(2), z.literal(3)]),
        notes: z.string().describe("What this section should cover and why."),
      }),
    )
    .min(3)
    .max(12),
  targetWordCount: z.number().min(400).max(3000),
  internalLinkTargets: z
    .array(z.object({ url: z.string(), anchor: z.string() }))
    .max(6)
    .describe("Pick only from the internal pages provided — never invent a URL."),
  contentGap: z.string().describe("What existing top-ranking content is missing that this article should cover."),
  cta: z.string().describe("The call to action this article should end with, tied to a real offering."),
});

export type ContentBriefOutput = z.infer<typeof contentBriefSchema>;
