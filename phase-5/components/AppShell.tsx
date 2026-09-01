"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { href: "/mvp", label: "Shortlist room" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/playground", label: "Evidence" }
];

export function AppShell({ children }: { children: ReactNode }) {
  const embed = useSearchParams().get("embed") === "1";

  if (embed) {
    return <main className="min-h-screen bg-[var(--color-canvas)] px-4 py-4">{children}</main>;
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3">
          <Link href="/mvp" className="text-lg font-black tracking-tight">
            shortlist<span className="text-[var(--color-accent)]">coach</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 font-medium text-[var(--color-muted)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <span className="ml-auto hidden text-xs text-[var(--color-muted)] sm:block">
            Phase 5 MVP · no discounts by design
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-5 pb-12 pt-4 text-xs text-[var(--color-muted)]">
        Research prototype. Prices are illustrative, purchases are simulated, and the coach never
        offers a discount, coupon, or price-drop alert — that constraint comes from the Phase 4
        problem lock.
      </footer>
    </>
  );
}
