import { loadDiscoveryStats, loadProblemDefinition } from "@/lib/artefacts";
import { ok } from "@/lib/http";
import { describeProviders } from "@/lib/llm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {};

  try {
    const [users, products, items, events] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.wishlistItem.count(),
      prisma.coachEvent.count()
    ]);
    checks.database = { ok: true, users, products, wishlistItems: items, events };
  } catch (error) {
    checks.database = {
      ok: false,
      hint: "Run npm run backend:setup to create and seed dev.db.",
      error: error instanceof Error ? error.message : String(error)
    };
  }

  const stats = await loadDiscoveryStats();
  checks.discovery = stats
    ? {
        ok: true,
        rawCount: stats.rawCount,
        normalizedCount: stats.normalizedCount,
        themes: stats.validatedThemeCount,
        extractionMethod: stats.extractionMethod
      }
    : { ok: false, hint: "Phase-1/data/discovery not found. Run npm run phase1:1c." };

  const problem = await loadProblemDefinition();
  checks.problemLock = problem
    ? { ok: true, outcome: (problem.decisionTree as { outcome?: string })?.outcome ?? null }
    : { ok: false, hint: "phase-4/data not found. Run npm run phase4:lock." };

  checks.llm = describeProviders();

  const healthy = Object.values(checks).every(
    (check) => typeof check !== "object" || check === null || (check as { ok?: boolean }).ok !== false
  );

  const res = ok({ status: healthy ? "ok" : "degraded", checks, at: new Date().toISOString() });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET");
  return res;
}
