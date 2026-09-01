import { loadDiscoveryStats, loadRanking, loadThemes } from "@/lib/artefacts";
import { bad, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const [themes, ranking, stats] = await Promise.all([
    loadThemes(),
    loadRanking(),
    loadDiscoveryStats()
  ]);

  if (!themes || !ranking) {
    return bad("Phase 1 artefacts not found. Run npm run phase1:1c from the repo root.", 503);
  }

  return ok({ themes, ranking, stats, source: "Phase-1/data/discovery" });
}
