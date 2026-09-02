import { z } from "zod";

/**
 * AI only supplies the qualitative wrapper around an already-scored keyword —
 * a title, a recommended format, and a plain-language rationale grounded in
 * the score breakdown it is shown. It never sets or adjusts the score.
 */
export const opportunityEnrichmentSchema = z.object({
  opportunities: z.array(
    z.object({
      keyword: z.string(),
      title: z.string().describe("A specific, compelling article title targeting this keyword."),
      format: z.enum(["how_to", "listicle", "comparison", "guide", "landing"]),
      rationale: z
        .string()
        .describe("1-2 sentences explaining why this is a good opportunity, grounded in the score breakdown given."),
    }),
  ),
});

export type OpportunityEnrichment = z.infer<typeof opportunityEnrichmentSchema>["opportunities"][number];
