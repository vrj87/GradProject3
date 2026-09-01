import { loadDiscoveryStats, loadThemes } from "@/lib/artefacts";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const [stats, themes] = await Promise.all([loadDiscoveryStats(), loadThemes()]);

  return ok({
    available: Boolean(stats),
    corpus: stats
      ? { raw: stats.rawCount, normalized: stats.normalizedCount, themes: stats.validatedThemeCount }
      : null,
    extractionMethod: stats?.extractionMethod ?? null,
    lastRefresh: stats?.generatedAt ?? null,
    themeIds: (themes ?? []).map((theme) => theme.id)
  });
}
