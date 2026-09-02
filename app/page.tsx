import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="font-serif text-[var(--text-xl)] font-semibold text-[var(--text-primary)]">Bloggy</span>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-[var(--text-sm)] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Sign in
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center px-6 py-24 sm:px-10">
          <h1 className="max-w-xl font-serif text-[var(--text-4xl)] font-semibold leading-tight text-[var(--text-primary)]">
            Find what your customers are searching for.
          </h1>
          <p className="mt-5 max-w-lg text-[var(--text-lg)] text-[var(--text-secondary)]">
            Give Bloggy your website. It reads it, understands your business, researches the search
            landscape, and tells you exactly what to write next — then writes it.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link href="/signup">
              <Button>Analyze your website</Button>
            </Link>
          </div>
        </section>

        <section className="border-t border-[var(--border-subtle)] bg-[var(--surface-raised)]">
          <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-10 px-6 py-16 sm:grid-cols-3 sm:px-10">
            <Step
              number="01"
              title="Understand your business"
              description="Bloggy reads your site and builds a real picture of what you sell, who it's for, and how you talk about it."
            />
            <Step
              number="02"
              title="Find the gap"
              description="Real keyword and search-result data, checked against what your competitors already rank for and what you don't have yet."
            />
            <Step
              number="03"
              title="Write it"
              description="A structured brief, then a full article in your voice — ready for you to review, not a wall of generic text."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border-subtle)] px-6 py-6 text-[var(--text-xs)] text-[var(--text-muted)] sm:px-10">
        © {new Date().getFullYear()} Bloggy
      </footer>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div>
      <p className="mb-2 text-[var(--text-xs)] font-medium text-[var(--text-muted)]">{number}</p>
      <h3 className="mb-1.5 text-[var(--text-base)] font-medium text-[var(--text-primary)]">{title}</h3>
      <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">{description}</p>
    </div>
  );
}
