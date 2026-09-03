import Link from "next/link";
import {
  FiSearch,
  FiDatabase,
  FiShield,
  FiCheckCircle,
  FiGlobe,
  FiTarget,
  FiEdit3,
  FiPlus,
  FiRefreshCw,
  FiTrendingUp,
} from "react-icons/fi";
import { getSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { LandingNav } from "@/components/landing/landing-nav";
import { HeroUrlForm } from "@/components/landing/hero-url-form";

export default async function LandingPage() {
  const session = await getSession();
  const hasSession = Boolean(session);

  return (
    <div className="flex flex-1 flex-col">
      <LandingNav hasSession={hasSession} />

      <main className="flex flex-1 flex-col">
        <section className="pt-32 pb-20 sm:pt-40">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-start px-6 sm:px-10">
            <h1 className="display max-w-2xl text-display-xl">
              Your customers are already{" "}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-weak px-3 py-1 align-middle text-[0.5em] font-semibold text-accent-ink">
                <FiSearch size="0.85em" />
                searching
              </span>
              <br />
              <strong>Bloggy finds out what</strong>, then writes it.
            </h1>

            <p className="mt-6 max-w-[46ch] text-[16px] leading-relaxed text-ink-2">
              Give Bloggy your website. It reads it, understands your business, researches real
              search demand, and tells you exactly what to write next.
            </p>

            <HeroUrlForm hasSession={hasSession} />
            {!hasSession && <p className="mt-2 text-[12.5px] text-ink-3">No credit card — just your URL.</p>}

            <div className="mt-8 flex flex-wrap gap-2">
              <CredChip icon={<FiDatabase size={12} />} label="Live DataForSEO data" />
              <CredChip icon={<FiShield size={12} />} label="SSRF-safe crawl" />
              <CredChip icon={<FiCheckCircle size={12} />} label="Every claim sourced" />
            </div>
          </div>

          <div className="mx-auto mt-16 w-full max-w-3xl px-6 sm:px-10">
            <div className="overflow-hidden rounded-2xl border border-line shadow-md">
              <ProductPreview />
            </div>
          </div>
        </section>

        <section className="border-t border-line py-20">
          <div className="mx-auto max-w-3xl px-6 sm:px-10">
            <p className="eyebrow mb-4 text-ink-3">The loop</p>
            <h2 className="mb-10 max-w-lg text-display-l font-bold leading-[1.05] tracking-[-0.03em] text-ink">
              One loop,{" "}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-weak px-3 py-1 align-middle text-[0.5em] font-semibold text-accent-ink">
                <FiRefreshCw size="0.85em" />
                automatic
              </span>
              .
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-4">
              <LoopStep icon={<FiGlobe size={16} />} number="01" title="Reads your site" description="Crawls what you publish and pulls out what your business actually does." />
              <LoopStep icon={<FiSearch size={16} />} number="02" title="Researches the SERP" description="Real keyword volume, difficulty, and competitor coverage — not guesses." />
              <LoopStep icon={<FiTarget size={16} />} number="03" title="Picks what to write" description="Scores every opportunity on demand, gap, and fit for your business." />
              <LoopStep icon={<FiEdit3 size={16} />} number="04" title="Writes it" description="A full article in your voice, ready for you to review and ship." />
            </div>
          </div>
        </section>

        <section className="border-t border-line py-20">
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-10 px-6 sm:grid-cols-2 sm:px-10">
            <div>
              <p className="eyebrow mb-4 text-ink-3">Not a keyword-to-text toy</p>
              <h2 className="text-display-l font-bold leading-[1.05] tracking-[-0.03em] text-ink">
                Every article starts from <span className="text-ink-3">evidence.</span>
              </h2>
              <p className="mt-4 max-w-sm text-[14.5px] leading-relaxed text-ink-2">
                Bloggy scores every opportunity before it writes a word — search demand, competition,
                how well it fits your business, commercial intent, and whether your site already
                covers it.
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-line p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] font-medium text-ink">Opportunity score</span>
                <span className="mono text-[22px] font-bold text-ok">87</span>
              </div>
              <div className="flex flex-col gap-2">
                <ScoreRow label="demand" value={78} />
                <ScoreRow label="competition" value={99} />
                <ScoreRow label="relevance" value={65} />
                <ScoreRow label="intent" value={55} />
                <ScoreRow label="gap" value={100} />
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-line py-20">
          <div className="mx-auto max-w-3xl px-6 sm:px-10">
            <p className="eyebrow mb-4 text-ink-3">Questions</p>
            <h2 className="mb-10 text-display-l font-bold leading-[1.05] tracking-[-0.03em] text-ink">
              Worth <span className="text-ink-3">asking.</span>
            </h2>
            <div className="flex flex-col divide-y divide-line border-y border-line">
              <Faq q="Does it publish directly to my site?" a="Not yet. Bloggy writes and scores articles for you to review and mark ready — publishing integrations are next." />
              <Faq q="Where does the keyword data come from?" a="DataForSEO — real search volume, difficulty, and SERP data, refreshed on a budget you control." />
              <Faq q="Is crawling my site safe?" a="Every fetch goes through a guarded HTTP layer that blocks private networks and validates redirects before following them." />
              <Faq q="What if Bloggy misreads my business?" a="Every summary is editable. Corrections create a new version — nothing is silently overwritten." />
              <Faq q="Do I need to know SEO?" a="No. Bloggy explains why each opportunity is worth writing about, in plain language." />
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-ink py-20 text-ink-inv">
          <div className="mx-auto flex max-w-3xl flex-col items-start px-6 sm:px-10">
            <h2 className="text-display-l font-bold leading-[1.05] tracking-[-0.03em]">
              Find out what{" "}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 align-middle text-[0.5em] font-semibold text-white">
                <FiTrendingUp size="0.85em" />
                ranks
              </span>{" "}
              next.
            </h2>
            <Link href={hasSession ? "/app" : "/signup"} className="mt-7">
              <Button variant="secondary" size="lg" className="border-white/25 bg-transparent text-ink-inv hover:bg-white/10">
                {hasSession ? "Go to dashboard" : "Analyze your website"}
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-6 py-6 text-[12.5px] text-ink-3 sm:px-10">
        © {new Date().getFullYear()} Bloggy
      </footer>
    </div>
  );
}

function CredChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line-2 px-3 py-1.5 text-[12px] font-medium text-ink-2 transition-colors duration-[var(--dur-color)] hover:border-ink-3 hover:text-ink">
      {icon}
      {label}
    </span>
  );
}

function LoopStep({
  icon,
  number,
  title,
  description,
}: {
  icon: React.ReactNode;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-paper-inset text-ink-2">
          {icon}
        </span>
        <span className="mono text-[11.5px] text-ink-3">{number}</span>
      </div>
      <h3 className="mb-1 text-[14px] font-semibold text-ink">{title}</h3>
      <p className="text-[13px] leading-relaxed text-ink-2">{description}</p>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-20 shrink-0 text-[11.5px] text-ink-3">{label}</span>
      <ProgressBar value={value} />
      <span className="mono w-7 shrink-0 text-right text-[11.5px] text-ink-2">{value}</span>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14.5px] font-medium text-ink">
        {q}
        <FiPlus size={14} className="shrink-0 text-ink-3 transition-transform duration-[var(--dur-transform)] group-open:rotate-45" />
      </summary>
      <p className="mt-2.5 max-w-lg text-[13.5px] leading-relaxed text-ink-2">{a}</p>
    </details>
  );
}

function ProductPreview() {
  return (
    <div className="bg-paper-sunken p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-ink">Opportunities</span>
        <span className="text-[11.5px] text-ink-3">4 found for basecamp.com</span>
      </div>
      <div className="flex flex-col gap-3">
        {[
          { title: "Integrating Basecamp with GitHub Marketplace Apps", score: 87 },
          { title: "Basecamp vs. Asana for Remote Teams", score: 74 },
          { title: "How to Set Up Client Access in Basecamp", score: 52 },
        ].map((row) => (
          <div key={row.title} className="flex items-center justify-between gap-4 rounded-[var(--radius-sm)] border border-line bg-paper px-4 py-3">
            <span className="truncate text-[13px] text-ink">{row.title}</span>
            <span
              className={`mono shrink-0 text-[16px] font-bold ${
                row.score >= 70 ? "text-ok" : row.score >= 40 ? "text-warn" : "text-bad"
              }`}
            >
              {row.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
