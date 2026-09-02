import type { BusinessContextWithDetails } from "@/lib/business-context/get-business-context";

/**
 * Renders the stored (and possibly user-corrected) Business Context into a
 * compact, stable block for injection into research, scoring-rationale,
 * brief, and article prompts. Forbidden claims and brand voice are called
 * out explicitly as hard constraints, not suggestions.
 */
export function buildBusinessContextPrompt(details: BusinessContextWithDetails): string {
  if (!details) return "No business context is available yet.";
  const { context, offerings, audiences, terms, competitors } = details;

  const forbiddenClaims = terms.filter((t) => t.kind === "forbidden_claim");
  const glossary = terms.filter((t) => t.kind === "glossary");

  const lines = [
    `Business summary: ${context.summary}`,
    context.brandVoice && `Brand voice (must match): ${context.brandVoice}`,
    context.industries.length > 0 && `Industries: ${context.industries.join(", ")}`,
    context.locations.length > 0 && `Locations served: ${context.locations.join(", ")}`,
    offerings.length > 0 &&
      `Offerings:\n${offerings.map((o) => `- ${o.name} (${o.kind}): ${o.description ?? ""}`).join("\n")}`,
    audiences.length > 0 &&
      `Target audiences:\n${audiences.map((a) => `- ${a.name}: ${a.description ?? ""}`).join("\n")}`,
    context.customerProblems.length > 0 && `Customer problems: ${context.customerProblems.join("; ")}`,
    context.useCases.length > 0 && `Use cases: ${context.useCases.join("; ")}`,
    context.differentiators.length > 0 && `Differentiators: ${context.differentiators.join("; ")}`,
    context.commercialPriorities.length > 0 &&
      `Commercial priorities: ${context.commercialPriorities.join("; ")}`,
    competitors.length > 0 && `Known competitors: ${competitors.map((c) => c.domain).join(", ")}`,
    glossary.length > 0 && `Preferred terminology: ${glossary.map((t) => t.term).join(", ")}`,
    forbiddenClaims.length > 0 &&
      `HARD CONSTRAINT — never state or imply any of these claims:\n${forbiddenClaims
        .map((t) => `- ${t.term}${t.note ? ` (${t.note})` : ""}`)
        .join("\n")}`,
  ].filter(Boolean);

  return lines.join("\n\n");
}
