import "server-only";
import { registerJobHandler } from "./run-job";
import { analyzeWebsiteHandler } from "./handlers/analyze-website";
import { researchKeywordsHandler } from "./handlers/research-keywords";
import { generateArticleHandler } from "./handlers/generate-article";

let registered = false;

/** Idempotent — safe to call from every entry point that might run a job. */
export function ensureJobHandlersRegistered() {
  if (registered) return;
  registerJobHandler(analyzeWebsiteHandler);
  registerJobHandler(researchKeywordsHandler);
  registerJobHandler(generateArticleHandler);
  registered = true;
}
