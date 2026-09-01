import { loadDecisionTree, loadProblemDefinition, loadSegmentContract } from "@/lib/artefacts";
import { bad, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Serves the Phase 4 lock verbatim. Phase 5 never restates the problem. */
export async function GET() {
  const problem = await loadProblemDefinition();
  if (!problem) {
    return bad("Phase 4 lock not found. Run npm run phase4:lock from the repo root.", 503);
  }

  return ok({
    problem,
    decisionTree: await loadDecisionTree(),
    segmentContract: await loadSegmentContract(),
    source: "phase-4/data/problem-definition.json"
  });
}
