import type { RankedTheme, Theme } from "./types.js";

export interface OpportunityTemplate {
  opportunityArea: string;
  themeIds: string[];
  keywords: string[];
  barrierTypes: string[];
  metricNode: string;
  excluded?: boolean;
}

export const TEMPLATE_ROWS: OpportunityTemplate[] = [
  {
    opportunityArea: "Fit & size confidence synthesis",
    themeIds: ["fit-size-anxiety", "size-fit-uncertainty", "fit-and-size-uncertainty"],
    keywords: ["fit", "size"],
    barrierTypes: ["fit"],
    metricNode: "resolve"
  },
  {
    opportunityArea: "Styling / occasion guidance",
    themeIds: ["styling-occasion", "style-occasion-uncertainty", "fit-style-uncertainty"],
    keywords: ["styling", "occasion", "style"],
    barrierTypes: ["style"],
    metricNode: "resolve"
  },
  {
    opportunityArea: "Wishlist compare & prioritization",
    themeIds: ["comparison-paralysis", "compare-and-decide"],
    keywords: ["compare", "comparison", "decide", "shortlist"],
    barrierTypes: ["compare"],
    metricNode: "decide"
  },
  {
    opportunityArea: "In-app social proof (review/try-on synthesis)",
    themeIds: ["review-trust-gap"],
    keywords: ["review", "try-on", "tryon", "youtube", "instagram", "trust"],
    barrierTypes: ["other"],
    metricNode: "resolve"
  },
  {
    opportunityArea: "Share-for-feedback",
    themeIds: ["social-validation"],
    keywords: ["social", "friend", "share", "whatsapp", "partner"],
    barrierTypes: ["social"],
    metricNode: "resolve"
  },
  {
    opportunityArea: "Wishlist revisit nudges (generic)",
    themeIds: ["wishlist-decay", "bookmark-vs-intent"],
    keywords: ["decay", "forget", "clutter", "bookmark", "revisit"],
    barrierTypes: ["bookmark", "other"],
    metricNode: "revisit"
  },
  {
    opportunityArea: "Price-drop / sale alerts",
    themeIds: ["sale-waitlist", "price-timing", "sale-waiting", "price-and-value-uncertainty"],
    keywords: ["sale", "price", "eoss", "discount"],
    barrierTypes: ["price"],
    metricNode: "—",
    excluded: true
  },
  {
    opportunityArea: "Back-in-stock alerts",
    themeIds: [],
    keywords: ["stock", "oos", "sold out", "availability"],
    barrierTypes: [],
    metricNode: "act"
  }
];

function haystack(theme: RankedTheme): string {
  return `${theme.themeId} ${theme.label} ${theme.barrierType} ${theme.metricNode}`.toLowerCase();
}

export function isPriceTheme(theme: RankedTheme): boolean {
  return theme.priceFlag || theme.barrierType === "price";
}

/** Score how well a ranked theme fills a Part 2 template. 0 = no match. */
export function matchScore(template: OpportunityTemplate, theme: RankedTheme): number {
  if (template.excluded) {
    return isPriceTheme(theme) ? 80 : 0;
  }
  if (isPriceTheme(theme)) return 0;

  if (template.themeIds.includes(theme.themeId)) return 100;

  const text = haystack(theme);
  const keywordHits = template.keywords.filter((keyword) => text.includes(keyword)).length;
  const barrierHit = template.barrierTypes.includes(theme.barrierType);
  const nodeHit = template.metricNode !== "—" && theme.metricNode === template.metricNode;

  if (keywordHits === 0 && !barrierHit) return 0;
  if (template.barrierTypes.length && !barrierHit && keywordHits < 2) return 0;

  return keywordHits * 20 + (barrierHit ? 25 : 0) + (nodeHit ? 15 : 0);
}

export function bestMatch(
  template: OpportunityTemplate,
  ranking: RankedTheme[],
  used: Set<string>
): { theme: RankedTheme; score: number } | null {
  let best: { theme: RankedTheme; score: number } | null = null;
  for (const theme of ranking) {
    if (used.has(theme.themeId)) continue;
    const score = matchScore(template, theme);
    if (score < 40) continue;
    if (
      !best ||
      score > best.score ||
      (score === best.score && theme.rank < best.theme.rank)
    ) {
      best = { theme, score };
    }
  }
  return best;
}

export function supportingMatches(
  template: OpportunityTemplate,
  ranking: RankedTheme[],
  primaryId: string
): RankedTheme[] {
  return ranking.filter(
    (theme) =>
      theme.themeId !== primaryId &&
      (template.themeIds.includes(theme.themeId) || matchScore(template, theme) >= 80)
  );
}

export function evidenceLabel(theme: Theme | undefined, sampleCapped?: boolean): string {
  const raw = theme?.confidence;
  const level =
    raw === "high" || raw === "medium" || raw === "low"
      ? raw
      : typeof raw === "number"
        ? raw >= 0.75
          ? "high"
          : raw >= 0.4
            ? "medium"
            : "low"
        : "medium";
  if (sampleCapped && level === "high") return "medium";
  return level;
}
