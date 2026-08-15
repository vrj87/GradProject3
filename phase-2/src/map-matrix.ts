import type { MatrixRow, RankedTheme, Theme } from "./types.js";

export const TEMPLATE_ROWS: Array<{
  opportunityArea: string;
  themeIds: string[];
  metricNode: string;
  excluded?: boolean;
}> = [
  {
    opportunityArea: "Fit & size confidence synthesis",
    themeIds: ["fit-size-anxiety"],
    metricNode: "resolve"
  },
  {
    opportunityArea: "Styling / occasion guidance",
    themeIds: ["styling-occasion"],
    metricNode: "resolve"
  },
  {
    opportunityArea: "Wishlist compare & prioritization",
    themeIds: ["comparison-paralysis"],
    metricNode: "decide"
  },
  {
    opportunityArea: "In-app social proof (review/try-on synthesis)",
    themeIds: ["review-trust-gap"],
    metricNode: "resolve"
  },
  {
    opportunityArea: "Share-for-feedback",
    themeIds: ["social-validation"],
    metricNode: "resolve"
  },
  {
    opportunityArea: "Wishlist revisit nudges (generic)",
    themeIds: ["wishlist-decay"],
    metricNode: "revisit"
  },
  {
    opportunityArea: "Price-drop / sale alerts",
    themeIds: ["sale-waitlist", "price-timing"],
    metricNode: "—",
    excluded: true
  },
  {
    opportunityArea: "Back-in-stock alerts",
    themeIds: [],
    metricNode: "act"
  }
];

export function fillMatrix(
  ranking: RankedTheme[],
  themes: Theme[]
): MatrixRow[] {
  const byId = new Map(ranking.map((row) => [row.themeId, row]));
  const themeById = new Map(themes.map((theme) => [theme.id, theme]));
  const used = new Set<string>();

  const rows: MatrixRow[] = TEMPLATE_ROWS.map((template) => {
    if (template.excluded) {
      return {
        opportunityArea: template.opportunityArea,
        themeId: null,
        impactOnW2P: "—",
        feasibility: "Excluded (monetary)",
        evidenceStrength: "—",
        frequency: "—",
        metricNode: template.metricNode,
        rank: "Exclude",
        status: "excluded"
      };
    }

    const match = template.themeIds
      .map((id) => byId.get(id))
      .find((row): row is RankedTheme => Boolean(row));

    if (!match) {
      return {
        opportunityArea: template.opportunityArea,
        themeId: template.themeIds[0] ?? null,
        impactOnW2P: "unobserved",
        feasibility: "unobserved",
        evidenceStrength: "none — not in Phase 1 ranking",
        frequency: "—",
        metricNode: template.metricNode,
        rank: "—",
        status: "unobserved"
      };
    }

    used.add(match.themeId);
    const theme = themeById.get(match.themeId);
    return {
      opportunityArea: template.opportunityArea,
      themeId: match.themeId,
      impactOnW2P: match.impactOnW2P,
      feasibility: match.nonMonetaryFeasibility,
      evidenceStrength: theme?.confidence ?? "medium",
      frequency: match.estimatedFrequency,
      metricNode: match.metricNode,
      rank: match.rank,
      status: "filled"
    };
  });

  for (const extra of ranking) {
    if (used.has(extra.themeId)) continue;
    const theme = themeById.get(extra.themeId);
    rows.push({
      opportunityArea: extra.label,
      themeId: extra.themeId,
      impactOnW2P: extra.impactOnW2P,
      feasibility: extra.priceFlag
        ? "Excluded if incentive-led"
        : extra.nonMonetaryFeasibility,
      evidenceStrength: theme?.confidence ?? "medium",
      frequency: extra.estimatedFrequency,
      metricNode: extra.metricNode,
      rank: extra.rank,
      status: extra.priceFlag ? "excluded" : "filled"
    });
  }

  return rows;
}
