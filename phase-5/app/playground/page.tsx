import Link from "next/link";
import {
  loadDecisionTree,
  loadDiscoveryStats,
  loadProblemDefinition,
  loadRanking,
  loadSurveySummary,
  loadThemes
} from "@/lib/artefacts";

export const dynamic = "force-dynamic";

function Missing({ what, command }: { what: string; command: string }) {
  return (
    <p className="text-sm text-[var(--color-muted)]">
      {what} not found. Run <code className="rounded bg-[var(--color-canvas)] px-1.5 py-0.5">{command}</code>.
    </p>
  );
}

export default async function PlaygroundPage() {
  const [themes, ranking, stats, problem, tree, survey] = await Promise.all([
    loadThemes(),
    loadRanking(),
    loadDiscoveryStats(),
    loadProblemDefinition(),
    loadDecisionTree(),
    loadSurveySummary()
  ]);

  const outcome = (tree as { outcome?: string } | null)?.outcome ?? null;
  const fields = (problem as {
    fields?: { targetSegment?: { statement?: string }; productOutcome?: { statement?: string } };
    headline?: string;
  } | null) ?? null;
  const headline = fields?.headline;
  const targetSegment = fields?.fields?.targetSegment?.statement;
  const productOutcome = fields?.fields?.productOutcome?.statement;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight">Evidence behind this build</h1>
        <p className="max-w-3xl text-sm text-[var(--color-muted)]">
          Nothing on this page is written by hand. It reads the artefacts produced by the discovery
          pipeline, the questionnaire, and the Phase 4 lock, so the MVP and the write-up cannot drift
          apart.
        </p>
      </header>

      <section className="card space-y-3 p-5">
        <p className="label">Phase 4 — the locked problem</p>
        {problem ? (
          <>
            <p className="text-lg font-semibold">{headline ?? targetSegment}</p>
            {targetSegment && <p className="text-sm">{targetSegment}</p>}
            {productOutcome && <p className="text-sm">{productOutcome}</p>}
            <p className="text-sm">
              Decision tree outcome: <strong>{outcome}</strong>
            </p>
            <Link href="/api/problem-definition" className="text-sm text-[var(--color-accent)] underline">
              /api/problem-definition
            </Link>
          </>
        ) : (
          <Missing what="phase-4/data" command="npm run phase4:lock" />
        )}
      </section>

      <section className="card space-y-3 p-5">
        <p className="label">Phase 1 — discovery corpus</p>
        {stats ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Raw items", stats.rawCount],
              ["Normalized", stats.normalizedCount],
              ["Themes", stats.validatedThemeCount],
              ["Extraction", stats.extractionMethod]
            ].map(([label, value]) => (
              <div key={String(label)}>
                <p className="text-xs text-[var(--color-muted)]">{label}</p>
                <p className="text-xl font-bold">{String(value)}</p>
              </div>
            ))}
          </div>
        ) : (
          <Missing what="Phase-1/data/discovery" command="npm run phase1:1c" />
        )}
      </section>

      {ranking && ranking.length > 0 && (
        <section className="card p-5">
          <p className="label">Opportunity ranking</p>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {ranking.slice(0, 6).map((theme) => (
                <tr key={theme.themeId} className="border-t border-[var(--color-line)]">
                  <th className="py-2 text-left font-medium">
                    #{theme.rank} {theme.label}
                  </th>
                  <td className="py-2 text-xs text-[var(--color-muted)]">
                    {theme.barrierType} · {theme.metricNode}
                  </td>
                  <td className="py-2 text-right font-semibold">{theme.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {survey && (
        <section className="card space-y-2 p-5">
          <p className="label">Phase 3 — questionnaire</p>
          <p className="text-sm">
            {String((survey as { respondents?: number }).respondents ?? "?")} respondents.
            The questionnaire is what re-scoped this build: shoppers who named price as the barrier
            asked for information, not a lower price, when they were offered help.
          </p>
          <Link href="/api/research/questions" className="text-sm text-[var(--color-accent)] underline">
            /api/research/questions
          </Link>
        </section>
      )}

      {themes && themes.length > 0 && (
        <section className="card p-5">
          <p className="label">Themes used as coach context</p>
          <ul className="mt-2 space-y-2 text-sm">
            {themes.slice(0, 8).map((theme) => (
              <li key={theme.id} className="border-t border-[var(--color-line)] pt-2">
                <span className="font-semibold">{theme.label}</span>
                <span className="ml-2 text-xs text-[var(--color-muted)]">
                  {theme.barrierType} · {theme.metricNode}
                </span>
                <p className="text-[var(--color-muted)]">{theme.summary}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            Price-flagged themes are filtered out before anything reaches a prompt, so the coach is
            never handed a discount idea to work with.
          </p>
        </section>
      )}

      <section className="card space-y-2 p-5">
        <p className="label">Raw endpoints</p>
        <ul className="space-y-1 text-sm">
          {[
            ["/api/health", "Database, discovery, problem lock, LLM tier"],
            ["/api/discovery", "Themes, ranking, pipeline stats"],
            ["/api/discovery/status", "Corpus size and last refresh"],
            ["/api/problem-definition", "The Phase 4 lock, verbatim"],
            ["/api/research/questions", "Q1–Q10 coverage plus questionnaire result"],
            ["/api/products", "Demo catalog"],
            ["/api/dashboard", "Funnel JSON"]
          ].map(([href, description]) => (
            <li key={href}>
              <Link href={href!} className="font-mono text-[var(--color-accent)] underline">
                {href}
              </Link>
              <span className="ml-2 text-[var(--color-muted)]">{description}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
