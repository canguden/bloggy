"use client";

import { useState } from "react";
import { OpportunityCard } from "./opportunity-card";
import type { opportunities as opportunitiesTable } from "@/lib/db/schema";

type Item = {
  opportunity: typeof opportunitiesTable.$inferSelect;
  domain: string;
  faviconUrl: string | null;
  keyword: string | null;
  volume: number | null;
};

/** Optimistic dismiss: the row collapses immediately, undo lives in the toast (5s). */
export function OpportunityList({ items }: { items: Item[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = items.filter((item) => !dismissed.has(item.opportunity.id));

  return (
    <ul className="flex flex-col gap-4">
      {visible.map(({ opportunity, domain, faviconUrl, keyword, volume }) => (
        <li key={opportunity.id}>
          <OpportunityCard
            opportunity={opportunity}
            domain={domain}
            faviconUrl={faviconUrl}
            keyword={keyword}
            volume={volume}
            onDismissed={(id) => setDismissed((prev) => new Set(prev).add(id))}
          />
        </li>
      ))}
    </ul>
  );
}
