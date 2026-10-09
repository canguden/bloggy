"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

/** Floating pill nav, inset from the viewport edges — detaches and picks up a shadow on scroll. */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`sticky top-4 z-20 mx-auto w-full px-6 transition-[max-width] duration-300 ease-[var(--ease)] sm:px-10 ${
        scrolled ? "max-w-3xl" : "max-w-5xl"
      }`}
    >
      <nav
        className={`flex items-center justify-between rounded-full border border-line bg-paper/90 px-4 py-2.5 backdrop-blur-md transition-shadow duration-[var(--dur-transform)] ${
          scrolled ? "shadow-md" : ""
        }`}
      >
        <Link href="/" className="text-ink">
          <Logo size={48} />
        </Link>
        <div className="hidden items-center gap-6 sm:flex">
          <a href="#loop" className="text-[13px] font-medium text-ink-2 hover:text-ink">
            How it works
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/app">
            <Button size="sm">Dashboard</Button>
          </Link>
        </div>
      </nav>
    </div>
  );
}
