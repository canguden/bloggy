type Breakdown = {
  searchDemand: number;
  competition: number;
  businessRelevance: number;
  commercialIntent: number;
  contentGap: number;
};

const LABELS: Record<keyof Breakdown, string> = {
  searchDemand: "Search demand",
  competition: "Low competition",
  businessRelevance: "Business relevance",
  commercialIntent: "Commercial intent",
  contentGap: "Content gap",
};

export function ScoreBreakdown({ breakdown }: { breakdown: Breakdown }) {
  return (
    <dl className="flex flex-col gap-1.5">
      {(Object.keys(LABELS) as Array<keyof Breakdown>).map((key) => (
        <div key={key} className="flex items-center gap-3">
          <dt className="w-36 shrink-0 text-[var(--text-xs)] text-[var(--text-muted)]">{LABELS[key]}</dt>
          <dd className="flex-1">
            <div className="h-1.5 rounded-full bg-[var(--surface-sunken)]">
              <div
                className="h-1.5 rounded-full bg-[var(--accent)]"
                style={{ width: `${Math.round(breakdown[key])}%` }}
              />
            </div>
          </dd>
          <span className="w-8 shrink-0 text-right text-[var(--text-xs)] text-[var(--text-muted)]">
            {Math.round(breakdown[key])}
          </span>
        </div>
      ))}
    </dl>
  );
}
