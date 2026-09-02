import "server-only";
import { generateObject } from "ai";
import { structuredModel } from "./model";
import { articleDraftSchema, type ArticleDraft } from "./schemas/article";
import { buildBusinessContextPrompt } from "./build-business-context-prompt";
import { findForbiddenClaimViolations } from "./check-forbidden-claims";
import type { BusinessContextWithDetails } from "@/lib/business-context/get-business-context";
import type { ContentBriefOutput } from "./schemas/content-brief";
import { ProviderError } from "@/lib/errors";

const SYSTEM_PROMPT = `You write a full blog article in Markdown from a content brief, for a specific
business. Match the business's brand voice exactly. Follow the outline's headings and word-count
target. Use ## for H2 and ### for H3, matching the outline's levels. Include the internal links and
end with the given call to action. Never state or imply anything in the business's forbidden-claims
list — that constraint overrides everything else, including seeming helpful.`;

const MAX_REGENERATION_ATTEMPTS = 2;

export async function generateArticle(params: {
  businessContext: BusinessContextWithDetails;
  brief: ContentBriefOutput;
  targetKeyword: string;
  title: string;
}): Promise<ArticleDraft> {
  const forbiddenClaims = (params.businessContext?.terms ?? [])
    .filter((t) => t.kind === "forbidden_claim")
    .map((t) => t.term);

  const prompt = [
    buildBusinessContextPrompt(params.businessContext),
    "",
    `Target keyword: ${params.targetKeyword}`,
    `Working title: ${params.title}`,
    `Angle: ${params.brief.angle}`,
    `Target word count: ~${params.brief.targetWordCount}`,
    "",
    "Outline:",
    params.brief.outline.map((s) => `${"#".repeat(s.level)} ${s.heading} — ${s.notes}`).join("\n"),
    "",
    "Internal links to include:",
    params.brief.internalLinkTargets.map((l) => `- [${l.anchor}](${l.url})`).join("\n") || "(none)",
    "",
    `Content gap to fill: ${params.brief.contentGap}`,
    `Call to action to end with: ${params.brief.cta}`,
  ].join("\n");

  for (let attempt = 1; attempt <= MAX_REGENERATION_ATTEMPTS; attempt++) {
    let draft: ArticleDraft;
    try {
      const { object } = await generateObject({
        model: structuredModel,
        schema: articleDraftSchema,
        system: SYSTEM_PROMPT,
        prompt,
      });
      draft = object;
    } catch (err) {
      console.error("Article generation failed", err);
      throw new ProviderError("Bloggy couldn't write the article right now. Please try again.", "ai_generation_failed");
    }

    const violations = findForbiddenClaimViolations(draft.body, forbiddenClaims);
    if (violations.length === 0) return draft;

    console.warn(`Article draft violated forbidden claims (attempt ${attempt}):`, violations);
  }

  throw new ProviderError(
    "Bloggy couldn't write this without repeating a claim you've asked it to avoid. Please try again or adjust the brief.",
    "forbidden_claim_violation",
  );
}
