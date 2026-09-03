"use client";

import { useRouter } from "next/navigation";
import { Segmented } from "@/components/ui/segmented";

type Filter = "all" | "draft" | "ready";

export function ArticleStatusFilter({ current }: { current: Filter }) {
  const router = useRouter();

  return (
    <Segmented<Filter>
      options={[
        { value: "all", label: "All" },
        { value: "draft", label: "Draft" },
        { value: "ready", label: "Ready" },
      ]}
      value={current}
      onChange={(value) => router.push(value === "all" ? "/app/articles" : `/app/articles?status=${value}`)}
    />
  );
}
