import { loadThemes, type DiscoveryTheme } from "./artefacts";
import { sanitizeReviewText } from "./guardrails";
import type { Category } from "./schemas";

/**
 * RAG context for the coach (5c). Themes are filtered to the segments the
 * Phase 4 lock actually targets, and price-flagged themes are dropped before
 * anything reaches a prompt so the model is never handed a discount idea.
 */

const TARGET_SEGMENTS = ["S2", "S4"];

export function relevantThemes(themes: DiscoveryTheme[]): DiscoveryTheme[] {
  return themes.filter((theme) => {
    if (theme.barrierType === "price") return false;
    const hints = theme.segmentHints ?? [];
    return hints.length === 0 || hints.some((hint) => TARGET_SEGMENTS.includes(hint));
  });
}

/** Themes that speak to a given decision moment, most frequent first. */
export function themesForNode(
  themes: DiscoveryTheme[],
  node: "resolve" | "decide" | "revisit"
): DiscoveryTheme[] {
  return relevantThemes(themes)
    .filter((theme) => theme.metricNode === node)
    .sort((a, b) => (b.estimatedFrequency ?? 0) - (a.estimatedFrequency ?? 0));
}

export function themeIdsForCompare(themes: DiscoveryTheme[]): string[] {
  return themesForNode(themes, "decide")
    .filter((theme) => theme.barrierType === "compare")
    .map((theme) => theme.id);
}

/** Compact, sanitized context block for a prompt. Never includes price themes. */
export function ragContext(themes: DiscoveryTheme[], category: Category): string {
  const lines = relevantThemes(themes)
    .slice(0, 6)
    .map(
      (theme) =>
        `- ${theme.label} (${theme.metricNode}): ${sanitizeReviewText(theme.summary, 160)}`
    );
  return [`Category: ${category}`, "Discovery themes for this segment:", ...lines].join("\n");
}

let cache: DiscoveryTheme[] | null = null;

export async function cachedThemes(): Promise<DiscoveryTheme[]> {
  if (cache) return cache;
  cache = (await loadThemes()) ?? [];
  return cache;
}
