import Link from "next/link";
import { FiTarget } from "react-icons/fi";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[42%] shrink-0 flex-col justify-between bg-ink p-10 text-ink-inv lg:flex">
        <Link href="/">
          <Logo onInk />
        </Link>
        <div className="max-w-sm">
          <p className="text-display-l font-bold leading-[1.05] tracking-[-0.03em]">
            Bloggy found <span className="text-white/50">14 opportunities</span> for basecamp.com.
          </p>
        </div>
        <div className="max-w-sm border-t border-white/15 pt-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
              <FiTarget size={12} />
            </span>
            <span className="mono text-[12.5px] text-white/50">basecamp.com</span>
          </div>
          <p className="text-[13.5px] leading-relaxed text-white/70">
            Every opportunity is scored from real search data — not a guess.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2 text-ink lg:hidden">
            <Logo />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
