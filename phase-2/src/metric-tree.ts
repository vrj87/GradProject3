import type { MetricNode, MetricTree, RankedTheme, Theme } from "./types.js";

const NODE_DEFS: Array<{ node: MetricNode; definition: string }> = [
  {
    node: "revisit",
    definition: "% of wishlist adds where the user opens the wishlist within 30 days"
  },
  {
    node: "resolve",
    definition: "% of items where the blocking doubt (fit, style, trust) is resolved"
  },
  {
    node: "decide",
    definition: "Among users with 2+ similar items, % who narrow to one choice in 30d"
  },
  {
    node: "act",
    definition: "% of wishlisted items added to cart / purchased within 30d"
  }
];

export function buildMetricTree(ranking: RankedTheme[], themes: Theme[]): MetricTree {
  const eligible = ranking.filter((row) => !row.priceFlag && row.barrierType !== "price");
  const nodes = NODE_DEFS.map(({ node, definition }) => {
    const hits = eligible.filter((row) => row.metricNode === node);
    return {
      node,
      definition,
      themeIds: hits.map((row) => row.themeId),
      labels: hits.map((row) => row.label),
      highestScore: hits[0]?.score ?? null,
      covered: hits.length > 0
    };
  });

  return {
    northStar: "W2P 30d — users who purchase ≥1 wishlisted item within 30 days of adding it",
    product: "revisit × uncertainty resolution × shortlist-to-decision → cart/checkout",
    constraint: "No monetary incentives as the core lever",
    nodes,
    uncoveredNodes: nodes.filter((node) => !node.covered).map((node) => node.node),
    bookmarkSeparated: themes.some(
      (theme) => theme.barrierType === "bookmark" || theme.id.includes("bookmark")
    )
  };
}
