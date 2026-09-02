import { z } from "zod";

export const derivedBusinessContextSchema = z.object({
  summary: z.string().describe("One paragraph: what this business does, in plain language."),
  industries: z.array(z.string()).max(5),
  locations: z.array(z.string()).max(10).describe("Geographic markets this business serves, if apparent."),
  offerings: z
    .array(
      z.object({
        name: z.string(),
        kind: z.enum(["product", "service"]),
        description: z.string(),
      }),
    )
    .max(12),
  audiences: z
    .array(
      z.object({
        name: z.string().describe("A short audience label, e.g. 'SMB marketing teams'."),
        description: z.string(),
      }),
    )
    .max(6),
  customerProblems: z.array(z.string()).max(8),
  useCases: z.array(z.string()).max(8),
  differentiators: z.array(z.string()).max(6),
  brandVoice: z.string().describe("2-4 words describing tone, e.g. 'direct, technical, no hype'."),
  commercialPriorities: z
    .array(z.string())
    .max(5)
    .describe("What the business most wants prospects to do or buy."),
  competitors: z.array(z.string()).max(6).describe("Competitor domains mentioned or clearly implied, if any."),
  confidence: z.number().min(0).max(1).describe("How confident this derivation is, given the source pages."),
});

export type DerivedBusinessContext = z.infer<typeof derivedBusinessContextSchema>;
