import { ProgressBar } from "@/components/ui/progress-bar";

type Breakdown = {
  searchDemand: number;
  competition: number;
  businessRelevance: number;
  commercialIntent: number;
  contentGap: number;
};

const LABELS: Record<keyof Breakdown, string> = {
  searchDemand: "demand",
  competition: "competition",
  businessRelevance: "relevance",
  commercialIntent: "intent",
  contentGap: "gap",
};

/** Score is a fixed color ramp — bad/warn/ok — the one deliberate accent on an otherwise mono card. */
export function scoreTone(score: number): "bad" | "warn" | "ok" {
  if (score < 40) return "bad";
  if (score < 70) return "warn";
  return "ok";
}

export function ScoreBreakdown({ breakdown }: { breakdown: Breakdown }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
      {(Object.keys(LABELS) as Array<keyof Breakdown>).map((key) => (
        <div key={key} className="flex items-center gap-2.5">
          <span className="w-20 shrink-0 text-[11.5px] text-ink-3">{LABELS[key]}</span>
          <ProgressBar value={breakdown[key]} />
          <span className="mono w-7 shrink-0 text-right text-[11.5px] text-ink-2">
            {Math.round(breakdown[key])}
          </span>
        </div>
      ))}
    </div>
  );
}
