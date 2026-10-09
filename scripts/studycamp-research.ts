/**
 * StudyCamp keyword research, run against live DataForSEO through bloggy's own
 * provider (so every call is cached in provider_cache and repeat runs are free).
 *
 *   pnpm research:studycamp            # run (hard-capped estimated spend)
 *   pnpm research:studycamp -- --dry   # print the estimated cost, call nothing
 *
 * Output: research/studycamp-keywords.json
 */
import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";

config({ path: ".env.local" });

const SEED_GROUPS: string[][] = [
  ["how to study effectively", "active recall", "spaced repetition", "study techniques", "how to memorize faster"],
  ["how to take notes", "cornell notes", "note taking methods", "flashcards", "how to make flashcards"],
  ["study schedule", "exam preparation", "pomodoro technique", "how to study for finals", "study plan template"],
  ["ai study tools", "summarize pdf with ai", "quizlet alternatives", "notion for students", "ai flashcard generator"],
];

const IDEAS_PER_GROUP = 200;
const MIN_VOLUME = 150;
const MAX_KD = 55;
const SERP_CANDIDATES = 30;
const MAX_ESTIMATED_USD = 1.0;

// Rough DataForSEO list prices (USD) used only for the preflight estimate.
const COST = { ideasRequest: 0.01, ideasItem: 0.0001, difficultyRequest: 0.01, difficultyItem: 0.0001, serp: 0.002 };

// The ideas endpoint is broad: answer-key hunters, PDF tools, named exams. Keep only
// what a studycamp reader (a student building study habits) would actually search.
const RELEVANT =
  /(stud(y|ying)|note ?taking|notes|flashcard|memori[sz]|recall|spaced|revision|revise|pomodoro|cornell|mind map|feynman|learning (style|technique|method)|study (tip|technique|method|plan|schedule|guide)|exam prep|prepare for|finals|test.taking|summari[sz]e|quizlet|anki|notion|highlight|procrastinat|concentrat|focus|read(ing)? (faster|comprehension|textbook)|homework|ai (tool|flashcard|note|study))/i;
const EXCLUDE =
  /(answers?\b|answer key|leaked|cheat|kumon|edgenuity|apex|pdf|png|jpg|docx?\b|heic|synonym|thesaurus|\bdef\b|practice (test|exam)|test dates|schedule sat|\bap (exam|test)|university|walmart|h&r|bonus|multiple choice|examples? of|footnote|lsat|\bact\b|\bged\b|clep|psat|\bteas\b|nremt|rbt|ptcb|cmas|psi exams|civil service|step up|active student|i love|open evidence|national knowledge|study stack|study buddies|dynamic study|\bsat\b|\bgre\b|\bmcat\b|bar exam|nclex|real estate|driver|permit)/i;

const API_BASE = "https://api.dataforseo.com/v3";

async function bulkKeywordDifficulty(keywords: string[]): Promise<Map<string, number>> {
  const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64");
  const out = new Map<string, number>();
  for (let i = 0; i < keywords.length; i += 1000) {
    const res = await fetch(`${API_BASE}/dataforseo_labs/google/bulk_keyword_difficulty/live`, {
      method: "POST",
      headers: { authorization: `Basic ${auth}`, "content-type": "application/json" },
      body: JSON.stringify([{ keywords: keywords.slice(i, i + 1000), language_code: "en", location_code: 2840 }]),
    });
    const json = (await res.json()) as {
      tasks?: { status_code: number; status_message: string; result?: { items?: { keyword: string; keyword_difficulty: number | null }[] }[] }[];
    };
    const task = json.tasks?.[0];
    if (!task || task.status_code >= 40000) throw new Error(`bulk_keyword_difficulty failed: ${task?.status_message}`);
    for (const item of task.result?.[0]?.items ?? []) {
      if (item.keyword_difficulty != null) out.set(item.keyword, item.keyword_difficulty);
    }
  }
  return out;
}

async function main() {
  const dry = process.argv.includes("--dry");
  const estimate =
    SEED_GROUPS.length * (COST.ideasRequest + IDEAS_PER_GROUP * COST.ideasItem) +
    COST.difficultyRequest +
    IDEAS_PER_GROUP * SEED_GROUPS.length * COST.difficultyItem +
    SERP_CANDIDATES * COST.serp;
  console.log(`Estimated max spend: $${estimate.toFixed(2)} (cap $${MAX_ESTIMATED_USD.toFixed(2)}; cached calls are free)`);
  if (estimate > MAX_ESTIMATED_USD) throw new Error("Estimate exceeds cap");
  if (dry) return;

  const { seoProvider } = await import("@/lib/seo");

  // 1. Expand seeds into ideas.
  const byKeyword = new Map<string, { keyword: string; volume: number; cpc: number | null; competition: number | null; intent: string | null }>();
  for (const seeds of SEED_GROUPS) {
    const ideas = await seoProvider.getKeywordIdeas(seeds, IDEAS_PER_GROUP);
    console.log(`ideas for [${seeds[0]}, ...]: ${ideas.length}`);
    for (const idea of ideas) {
      if ((idea.volume ?? 0) < MIN_VOLUME) continue;
      const existing = byKeyword.get(idea.keyword);
      if (!existing || (idea.volume ?? 0) > existing.volume) {
        byKeyword.set(idea.keyword, {
          keyword: idea.keyword,
          volume: idea.volume ?? 0,
          cpc: idea.cpc,
          competition: idea.competition,
          intent: idea.intent,
        });
      }
    }
  }
  const pool = [...byKeyword.values()];
  console.log(`unique ideas >= ${MIN_VOLUME}/mo: ${pool.length}`);

  // 2. Keyword difficulty for the whole pool.
  const kd = await bulkKeywordDifficulty(pool.map((k) => k.keyword));
  const scored = pool
    .map((k) => ({ ...k, kd: kd.get(k.keyword) ?? null }))
    .filter((k) => k.kd !== null && k.kd <= MAX_KD)
    .filter((k) => RELEVANT.test(k.keyword) && !EXCLUDE.test(k.keyword))
    .map((k) => ({ ...k, score: Math.round((k.volume / ((k.kd as number) + 10)) * 10) / 10 }))
    .sort((a, b) => b.score - a.score);
  console.log(`after KD <= ${MAX_KD} + relevance: ${scored.length}`);

  // 3. Live SERPs for the best candidates.
  const top = scored.slice(0, SERP_CANDIDATES);
  const withSerp = [];
  for (const k of top) {
    const serp = await seoProvider.getSerp(k.keyword);
    withSerp.push({ ...k, serp: serp.results.map((r) => ({ position: r.position, domain: r.domain, title: r.title, url: r.url })) });
  }

  mkdirSync("research", { recursive: true });
  writeFileSync(
    "research/studycamp-keywords.json",
    JSON.stringify({ generatedAt: new Date().toISOString(), location: "US", language: "en", candidates: withSerp, poolSize: scored.length, rest: scored.slice(SERP_CANDIDATES, 150) }, null, 2),
  );
  console.log(`wrote research/studycamp-keywords.json (${withSerp.length} with SERPs)`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
