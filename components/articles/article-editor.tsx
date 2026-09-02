"use client";

import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { saveArticleAction, markArticleReadyAction } from "@/lib/content/article-actions";
import { wordCount } from "@/lib/content/article-body";
import type { articles as articlesTable, articleVersions as versionsTable } from "@/lib/db/schema";

type Article = typeof articlesTable.$inferSelect;
type ArticleVersion = typeof versionsTable.$inferSelect;

const STATUS_TONE: Record<string, "neutral" | "accent" | "success" | "danger"> = {
  draft: "neutral",
  review: "accent",
  ready: "success",
  published: "success",
  updating: "accent",
  archived: "neutral",
  failed: "danger",
};

export function ArticleEditor({
  article,
  versions,
  targetKeyword,
}: {
  article: Article;
  versions: ArticleVersion[];
  targetKeyword: string | null;
}) {
  const { show } = useToast();
  const [title, setTitle] = useState(article.title);
  const [body, setBody] = useState(article.body);
  const [saving, setSaving] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);
  const [lastSaved, setLastSaved] = useState({ title: article.title, body: article.body });

  const hasUnsavedChanges = title !== lastSaved.title || body !== lastSaved.body;

  const save = useCallback(
    async (reason: "edit_explicit" | "edit_autosave") => {
      if (title === lastSaved.title && body === lastSaved.body) return;
      setSaving(true);
      const result = await saveArticleAction({ articleId: article.id, title, body, reason });
      setSaving(false);
      if (result.success) {
        setLastSaved({ title, body });
        if (reason === "edit_explicit") show("Article saved", "success");
      } else {
        show(result.error ?? "Couldn't save your changes", "error");
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
      show("Article marked as ready", "success");
    } else {
      show(result.error ?? "Couldn't mark this article ready", "error");
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
    <div className="flex flex-1 flex-col lg:flex-row">
      <div className="flex flex-1 flex-col gap-4 border-b border-[var(--border-subtle)] p-6 lg:border-b-0 lg:border-r">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => save("edit_autosave")}
          className="h-auto border-none bg-transparent p-0 font-serif text-[var(--text-2xl)] font-semibold focus:border-none focus:outline-none"
          aria-label="Article title"
        />
        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onBlur={() => save("edit_autosave")}
            aria-label="Article body (Markdown)"
            className="min-h-[60vh] resize-none font-mono text-[var(--text-sm)] leading-relaxed"
          />
          <div className="min-h-[60vh] overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-4">
            <article className="prose-article">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {body}
              </ReactMarkdown>
            </article>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => save("edit_explicit")} loading={saving}>
            Save
          </Button>
          {hasUnsavedChanges && !saving && (
            <span className="text-[var(--text-xs)] text-[var(--text-muted)]">Unsaved changes</span>
          )}
        </div>
      </div>

      <aside className="flex w-full flex-col gap-6 p-6 lg:w-72 lg:shrink-0">
        <div>
          <h3 className="mb-2 text-[var(--text-xs)] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Status
          </h3>
          <div className="flex items-center gap-2">
            <Badge tone={STATUS_TONE[article.status]}>{article.status}</Badge>
            {article.status === "draft" && (
              <Button size="sm" variant="secondary" loading={markingReady} onClick={handleMarkReady}>
                Mark as ready
              </Button>
            )}
          </div>
        </div>

        {targetKeyword && (
          <div>
            <h3 className="mb-1 text-[var(--text-xs)] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Target keyword
            </h3>
            <p className="text-[var(--text-sm)] text-[var(--text-primary)]">{targetKeyword}</p>
          </div>
        )}

        <div>
          <h3 className="mb-1 text-[var(--text-xs)] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Word count
          </h3>
          <p className="text-[var(--text-sm)] text-[var(--text-primary)]">{wordCount(body, "markdown")}</p>
        </div>

        {article.metaDescription && (
          <div>
            <h3 className="mb-1 text-[var(--text-xs)] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Meta description
            </h3>
            <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">{article.metaDescription}</p>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-[var(--text-xs)] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            History
          </h3>
          <ul className="flex flex-col gap-2">
            {versions.slice(0, 8).map((v) => (
              <li key={v.id} className="text-[var(--text-xs)] text-[var(--text-muted)]">
                {new Date(v.createdAt).toLocaleString()} — {v.reason.replace("_", " ")}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
