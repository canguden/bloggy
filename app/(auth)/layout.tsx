import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center font-serif text-2xl font-semibold text-[var(--text-primary)]">
          Bloggy
        </Link>
        <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-8 shadow-[var(--shadow-sm)]">
          {children}
        </div>
      </div>
    </div>
  );
}
