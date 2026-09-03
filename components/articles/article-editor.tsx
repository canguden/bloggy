"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { FiChevronLeft, FiCheck, FiAlertCircle, FiEdit3, FiKey, FiLink, FiHash, FiClock } from "react-icons/fi";
import { CgSpinner } from "react-icons/cg";
import { Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/segmented";
import { SiteChip } from "@/components/ui/site-chip";
import { useToast } from "@/components/ui/toast";
import { saveArticleAction, markArticleReadyAction } from "@/lib/content/article-actions";
import { wordCount } from "@/lib/content/article-body";
import { formatVolume, formatTime } from "@/lib/format";
import type { articles as articlesTable, articleVersions as versionsTable } from "@/lib/db/schema";
import type { Tone } from "@/components/ui/badge";

type Article = typeof articlesTable.$inferSelect;
type ArticleVersion = typeof versionsTable.$inferSelect;

const STATUS_TONE: Record<string, Tone> = {
  draft: "neutral",
  review: "accent",
  ready: "ok",
  published: "ok",
  updating: "accent",
  archived: "neutral",
  failed: "bad",
};

export function ArticleEditor({
  article,
  versions,
  targetKeyword,
  domain,
  faviconUrl,
}: {
  article: Article;
  versions: ArticleVersion[];
  targetKeyword: { keyword: string; volume: number | null } | null;
  domain: string;
  faviconUrl?: string | null;
}) {
  const { show } = useToast();
  const [title, setTitle] = useState(article.title);
  const [body, setBody] = useState(article.body);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [saving, setSaving] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);
  const [lastSaved, setLastSaved] = useState({ title: article.title, body: article.body, at: article.updatedAt });

  const hasUnsavedChanges = title !== lastSaved.title || body !== lastSaved.body;
  const words = useMemo(() => wordCount(body, "markdown"), [body]);
  const internalLinks = useMemo(() => (body.match(/\]\(\/[^)]*\)/g) ?? []).length, [body]);

  const seoChecks = useMemo(() => {
    const keywordLower = targetKeyword?.keyword.toLowerCase() ?? "";
    return [
      { label: "Title set", pass: title.trim().length > 0 },
      { label: "Meta description", pass: Boolean(article.metaDescription) },
      {
        label: "Keyword in an H2",
        pass: keywordLower
          ? body
              .split("\n")
              .some((line) => line.startsWith("## ") && line.toLowerCase().includes(keywordLower))
          : true,
      },
    ];
  }, [title, article.metaDescription, body, targetKeyword]);

  const save = useCallback(
    async (reason: "edit_explicit" | "edit_autosave") => {
      if (title === lastSaved.title && body === lastSaved.body) return;
      setSaving(true);
      const result = await saveArticleAction({ articleId: article.id, title, body, reason });
      setSaving(false);
      if (result.success) {
        setLastSaved({ title, body, at: new Date() });
        if (reason === "edit_explicit") show("Article saved", { variant: "success" });
      } else {
        show(result.error ?? "Couldn't save your changes", { variant: "error" });
      }
    },
    [article.id, title, body, lastSaved, show],
  );

  async function handleMarkReady() {
    if (hasUnsavedChanges) await save("edit_explicit");
    setMarkingReady(true);
    const result = await markArticleReadyAction(article.id);
    setMarkingReady(false);
    if (result.success) {
      show("Article marked as ready", { variant: "success" });
    } else {
      show(result.error ?? "Couldn't mark this article ready", { variant: "error" });
    }
  }

  // Warn before leaving with unsaved changes rather than silently dropping edits.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasUnsavedChanges) e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-paper/90 px-5 py-3 backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/app/articles"
            className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-ink-3 hover:text-ink"
          >
            <FiChevronLeft size={14} />
            Articles
          </Link>
          <span className="h-4 w-px shrink-0 bg-line" />
          <SiteChip domain={domain} faviconUrl={faviconUrl} size="sm" />
          <span className="hidden shrink-0 items-center gap-1.5 text-[12.5px] text-ink-3 sm:flex">
            {saving ? (
              <>
                <CgSpinner className="animate-spin" size={12} />
                Saving…
              </>
            ) : (
              `Saved ${formatTime(lastSaved.at)}`
            )}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Segmented
            options={[
              { value: "write", label: "Write" },
              { value: "preview", label: "Preview" },
            ]}
            value={mode}
            onChange={setMode}
          />
          {article.status === "draft" && (
            <Button size="sm" loading={markingReady} onClick={handleMarkReady}>
              Mark ready
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="mx-auto flex w-full max-w-[68ch] flex-1 flex-col gap-6 px-6 py-10">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => save("edit_autosave")}
            aria-label="Article title"
            className="border-none bg-transparent text-display-l font-bold leading-[1.05] tracking-[-0.03em] text-ink outline-none placeholder:text-ink-3"
          />

          {mode === "write" ? (
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onBlur={() => save("edit_autosave")}
              aria-label="Article body (Markdown)"
              className="min-h-[65vh] flex-1 resize-none border-none bg-transparent p-0 text-[17px] leading-[1.75] text-ink outline-none focus:border-none"
            />
          ) : (
            <article className="prose-article min-h-[65vh]">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {body}
              </ReactMarkdown>
            </article>
          )}

          <div className="flex items-center gap-3 border-t border-line pt-4">
            <Button size="sm" variant="secondary" onClick={() => save("edit_explicit")} loading={saving}>
              Save
            </Button>
            {hasUnsavedChanges && !saving && <span className="text-[12.5px] text-ink-3">Unsaved changes</span>}
          </div>
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-7 border-t border-line px-6 py-8 lg:w-72 lg:border-l lg:border-t-0">
          <div>
            <h3 className="eyebrow mb-2 text-ink-3">Status</h3>
            <Badge tone={STATUS_TONE[article.status]}>{article.status}</Badge>
          </div>

          {targetKeyword && (
            <div>
              <h3 className="eyebrow mb-2 flex items-center gap-1.5 text-ink-3">
                <FiKey size={11} />
                Target keyword
              </h3>
              <p className="mono text-[13.5px] text-ink">{targetKeyword.keyword}</p>
              {typeof targetKeyword.volume === "number" && (
                <p className="mono text-[12px] text-ink-3">{formatVolume(targetKeyword.volume)}/mo</p>
              )}
            </div>
          )}

          <div>
            <h3 className="eyebrow mb-2 text-ink-3">SEO checks</h3>
            <ul className="flex flex-col gap-1.5">
              {seoChecks.map((check) => (
                <li key={check.label} className="flex items-center gap-2 text-[13px]">
                  {check.pass ? (
                    <FiCheck size={13} className="shrink-0 text-ok" />
                  ) : (
                    <FiAlertCircle size={13} className="shrink-0 text-warn" />
                  )}
                  <span className={check.pass ? "text-ink-2" : "text-ink"}>{check.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-6">
            <div>
              <h3 className="eyebrow mb-1 flex items-center gap-1.5 text-ink-3">
                <FiLink size={11} />
                Links
              </h3>
              <p className="mono text-[13.5px] text-ink">{internalLinks}</p>
            </div>
            <div>
              <h3 className="eyebrow mb-1 flex items-center gap-1.5 text-ink-3">
                <FiHash size={11} />
                Words
              </h3>
              <p className="mono text-[13.5px] text-ink">{words.toLocaleString()}</p>
            </div>
          </div>

          {article.metaDescription && (
            <div>
              <h3 className="eyebrow mb-1.5 flex items-center gap-1.5 text-ink-3">
                <FiEdit3 size={11} />
                Meta description
              </h3>
              <p className="text-[13px] leading-relaxed text-ink-2">{article.metaDescription}</p>
            </div>
          )}

          {versions.length > 0 && (
            <div>
              <h3 className="eyebrow mb-2 flex items-center gap-1.5 text-ink-3">
                <FiClock size={11} />
                History
              </h3>
              <ul className="flex flex-col gap-1.5">
                {versions.slice(0, 8).map((v) => (
                  <li key={v.id} className="mono text-[11.5px] text-ink-3">
                    {formatTime(v.createdAt)} · {v.reason.replace(/_/g, " ")}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
