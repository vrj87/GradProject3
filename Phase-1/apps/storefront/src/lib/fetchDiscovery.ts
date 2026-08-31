import { publicReviewUrl } from "./sourceUrls";

export interface DiscoveryTheme {
  id: string;
  label: string;
  summary: string;
  researchQuestionIds?: number[];
  barrierType?: string;
  quotes: Array<{ text: string; source: string; reviewId: string; url?: string }>;
}

export interface RankRow {
  rank: number;
  label: string;
  themeId?: string;
  barrierType?: string;
  impactOnW2P: string;
  nonMonetaryFeasibility?: string;
  estimatedFrequency: number;
  score?: number;
  priceFlag?: boolean;
}

export interface DiscoveryVoice {
  id: string;
  text: string;
  source: string;
  rating: number | null;
  gatheredAt: string;
  url: string;
}

export interface DiscoveryPayload {
  themes: DiscoveryTheme[];
  ranking: RankRow[];
  stats: {
    rawCount: number;
    normalizedCount: number;
    droppedMinWords?: number;
    droppedIrrelevant?: number;
    droppedDuplicates?: number;
    extractionMethod?: string;
    readyForPhase2?: boolean;
    validatedThemeCount?: number;
    sourceCoverage?: Record<string, number>;
    generatedAt?: string;
    researchQuestionGaps?: number[];
    llmStats?: {
      batchesProcessed: number;
      batchesFailed: number;
      gapFillThemes: number;
    };
  };
  voices: DiscoveryVoice[];
}

export interface Phase2Payload {
  matrix: Array<{
    opportunityArea: string;
    impactOnW2P: string;
    feasibility?: string;
    frequency: string | number;
    metricNode?: string;
    rank: string | number;
    status: string;
    score?: number;
    themeId?: string;
  }>;
  nomination: {
    highestPotentialOpportunity: string;
    interviewSegment: string;
    segmentRationale: string;
    explicitlyNotPursuing: string[];
    caveats: string[];
    subMetricsMoved?: string[];
    interviewSeeds?: Array<{
      briefQuestion: number;
      prompt: string;
      linkedThemeIds: string[];
    }>;
  };
  tree?: {
    northStar?: string;
    product?: string;
    constraint?: string;
    nodes: Array<{
      node: string;
      covered: boolean;
      labels: string[];
      definition?: string;
    }>;
  } | null;
}

function withQuoteUrls(themes: DiscoveryTheme[]): DiscoveryTheme[] {
  return themes.map((theme) => ({
    ...theme,
    quotes: (theme.quotes ?? []).map((quote) => ({
      ...quote,
      url: publicReviewUrl({
        source: quote.source,
        url: quote.url,
        reviewId: quote.reviewId
      })
    }))
  }));
}

async function readJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("json")) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function loadDiscovery(): Promise<DiscoveryPayload | null> {
  const live = await readJson<DiscoveryPayload>("/api/discovery");
  if (live?.themes) return live;

  const [themes, ranking, stats, normalized] = await Promise.all([
    readJson<DiscoveryTheme[]>("/discovery/themes.json"),
    readJson<RankRow[]>("/discovery/opportunity-ranking.json"),
    readJson<DiscoveryPayload["stats"]>("/discovery/pipeline-stats.json"),
    readJson<Array<{
      id: string;
      text: string;
      source: string;
      url?: string;
      rating?: number | null;
      scrapedAt: string;
      wishlistRelevant?: boolean;
    }>>("/discovery/normalized-reviews.json")
  ]);
  if (!themes || !ranking || !stats) return null;

  const voices: DiscoveryVoice[] = (normalized ?? [])
    .filter((row) => row.wishlistRelevant !== false)
    .map((row) => ({
      id: row.id,
      text: row.text.replace(/`/g, "").trim(),
      source: row.source,
      rating: row.rating ?? null,
      gatheredAt: row.scrapedAt,
      url: publicReviewUrl({ source: row.source, url: row.url, reviewId: row.id })
    }));

  return {
    themes: withQuoteUrls(themes),
    ranking,
    stats,
    voices
  };
}

export async function loadPhase2(): Promise<Phase2Payload | null> {
  const live = await readJson<Phase2Payload>("/api/phase2");
  if (live?.nomination) return live;

  const [matrix, nomination, tree] = await Promise.all([
    readJson<Phase2Payload["matrix"]>("/phase2/filled-matrix.json"),
    readJson<Phase2Payload["nomination"]>("/phase2/nomination.json"),
    readJson<Phase2Payload["tree"]>("/phase2/metric-tree.json")
  ]);
  if (!matrix || !nomination) return null;
  return { matrix, nomination, tree };
}
