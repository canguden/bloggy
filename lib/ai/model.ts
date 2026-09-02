import "server-only";
import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@/lib/config/env";

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

/** One model for structured generation tasks (business context, opportunities, briefs, articles). */
export const structuredModel = openai("gpt-4.1");
