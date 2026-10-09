/**
 * Stage 2 of StudyCamp research: exact volume/CPC + keyword difficulty for a
 * hand-picked keyword list (the ideas pool is broad and noisy), then live SERPs
 * for the finalists.
 *
 *   pnpm research:shortlist                          # metrics + KD -> research/studycamp-shortlist.json
 *   pnpm research:shortlist -- --serp="kw one;kw two" # + live SERPs -> research/studycamp-serps.json
 */
import { config } from "dotenv";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";

config({ path: ".env.local" });

const KEYWORDS = [
  // memory + recall
  "spaced repetition", "how does spaced repetition work", "spaced repetition app", "anki alternative",
  "active recall", "active recall examples", "feynman technique", "blurting method", "retrieval practice",
  "leitner system", "interleaving study", "how to memorize things fast", "memorization techniques",
  // flashcards + quizzes
  "how to make flashcards", "how to study with flashcards", "best flashcard app", "flashcards vs practice tests",
  "ai flashcard generator", "quiz generator from notes", "practice test generator",
  // quizlet + tools
  "quizlet alternatives", "quizlet alternative", "best quizlet alternatives", "quizlet vs anki", "is quizlet free",
  "notion alternatives for students", "best study apps", "best study apps for college students",
  // ai
  "ai study tools", "best ai study tools", "how to study with ai", "chatgpt for studying", "ai note taker for students",
  "summarize pdf with ai", "how to summarize a pdf", "ai pdf summarizer", "chat with pdf", "ai summarizer for students",
  // notes
  "how to take notes in college", "best note taking apps for students", "how to take notes from a textbook",
  "note taking methods", "cornell notes", "outline method note taking", "how to take good notes", "digital note taking for students",
  // planning + exams
  "how to study for finals", "how to study for exams", "how to cram for an exam", "how to study for a test in one day",
  "how to make a study schedule", "study schedule for finals", "study plan template", "exam study plan",
  "how to stop procrastinating studying", "how to focus while studying", "how to study when you don't want to",
  "pomodoro technique", "pomodoro timer for studying", "how long should you study", "how to read a textbook",
  "how to study for multiple exams", "how to study effectively", "study techniques", "best study techniques", "study methods for college",
  "lofi study music", "ambient sounds for studying", "how to organize class notes", "how to study for exams with notes",
  "voice notes for students", "how to record lectures", "college study tips", "gpa calculator", "how to track grades",
];

const API_BASE = "https://api.dataforseo.com/v3";
const auth = () => `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64")}`;

async function bulkKd(keywords: string[]): Promise<Map<string, number>> {
  const res = await fetch(`${API_BASE}/dataforseo_labs/google/bulk_keyword_difficulty/live`, {
    method: "POST",
    headers: { authorization: auth(), "content-type": "application/json" },
    body: JSON.stringify([{ keywords, language_code: "en", location_code: 2840 }]),
    signal: AbortSignal.timeout(90_000),
  });
  const json = (await res.json()) as { tasks?: { status_code: number; status_message: string; result?: { items?: { keyword: string; keyword_difficulty: number | null }[] }[] }[] };
  const task = json.tasks?.[0];
  if (!task || task.status_code >= 40000) throw new Error(`bulk_keyword_difficulty failed: ${task?.status_message}`);
  const out = new Map<string, number>();
  for (const i of task.result?.[0]?.items ?? []) if (i.keyword_difficulty != null) out.set(i.keyword, i.keyword_difficulty);
  return out;
}

async function main() {
  const serpArg = process.argv.find((a) => a.startsWith("--serp="))?.slice("--serp=".length);
  const { seoProvider } = await import("@/lib/seo");
  mkdirSync("research", { recursive: true });

  if (!serpArg) {
    const list = [...new Set(KEYWORDS)];
    console.log(`checking ${list.length} keywords (~$${(0.05 + list.length * 0.0001 + 0.01).toFixed(2)})`);
    const [metrics, kd] = await Promise.all([seoProvider.getKeywordMetrics(list), bulkKd(list)]);
    const rows = metrics
      .map((m) => ({ keyword: m.keyword, volume: m.volume ?? 0, cpc: m.cpc, kd: kd.get(m.keyword) ?? null }))
      .sort((a, b) => b.volume - a.volume);
    writeFileSync("research/studycamp-shortlist.json", JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2));
    for (const r of rows) console.log(`${r.keyword.padEnd(46)} vol=${String(r.volume).padStart(7)} kd=${String(r.kd).padStart(4)} cpc=${r.cpc ?? "-"}`);
    process.exit(0);
  }

  const picks = serpArg.split(";").map((s) => s.trim()).filter(Boolean);
  console.log(`SERPs for ${picks.length} keywords (~$${(picks.length * 0.002).toFixed(2)})`);
  const path = "research/studycamp-serps.json";
  const existing: Record<string, unknown> = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
  for (const kw of picks) {
    const serp = await seoProvider.getSerp(kw);
    existing[kw] = serp.results.map((r) => ({ position: r.position, domain: r.domain, title: r.title, url: r.url }));
    console.log(`\n# ${kw}`);
    for (const r of serp.results) console.log(`  ${r.position}. ${r.domain} :: ${r.title}`);
  }
  writeFileSync(path, JSON.stringify(existing, null, 2));
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
