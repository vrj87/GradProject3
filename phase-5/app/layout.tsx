import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shortlist Coach — Phase 5 MVP",
  description:
    "Finish the decision on a shortlist: fit confidence, side-by-side compare, and a value read that never mentions a discount."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<main className="mx-auto max-w-6xl px-5 py-8">{children}</main>}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
