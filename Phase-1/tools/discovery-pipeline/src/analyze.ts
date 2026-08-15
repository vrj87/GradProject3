import type {
  ImpactLevel,
  LlmExtractionStats,
  NormalizedReview,
  ReviewChunk,
  Theme,
  ThemeQuote
} from "@myntra/discovery-core";
import {
  MONETARY_TERMS,
  RESEARCH_QUESTIONS,
  repairQuote,
  uniqueReviewIds
} from "@myntra/discovery-core";
import { enrichThemeFrequencies } from "./frequency.js";
import {
  chatJson,
  EXTRACTION_SYSTEM_PROMPT,
  type LlmProvider,
  type LlmProviderConfig,
  researchRubricBlock,
  resolveLlmProviders
} from "./llm.js";

export type ExtractionMethod = "groq" | "openai" | "rule-based" | "hybrid";

export interface ExtractionResult {
  themes: Theme[];
  method: ExtractionMethod;
  llmStats: LlmExtractionStats;
}

interface ThemeTemplate {
  id: string;
  label: string;
  summary: string;
  keywords: string[];
  researchQuestionIds: number[];
  barrierType: Theme["barrierType"];
  metricNode: Theme["metricNode"];
  segmentHints: Theme["segmentHints"];
  impactOnW2P: Theme["impactOnW2P"];
  nonMonetaryFeasibility: Theme["nonMonetaryFeasibility"];
  actionableInsight: string;
}

const TEMPLATES: ThemeTemplate[] = [
  {
    id: "fit-size-anxiety",
    label: "FitSizeAnxiety",
    summary: "Users stall on wishlisted items because they cannot tell if the size will fit.",
    keywords: ["fit", "size", "runs small", "runs large", "size chart", "tight", "loose"],
    researchQuestionIds: [2, 3, 7],
    barrierType: "fit",
    metricNode: "resolve",
    segmentHints: ["S2"],
    impactOnW2P: "high",
    nonMonetaryFeasibility: "high",
    actionableInsight:
      "Synthesize size and body-type review patterns so shoppers can resolve fit doubt without leaving the wishlist."
  },
  {
    id: "sale-waitlist",
    label: "WishlistAsSaleWaitlist",
    summary: "Users treat the wishlist as a list to buy during EOSS or BFF.",
    keywords: ["sale", "eoss", "bff", "discount", "50%", "wait for sale"],
    researchQuestionIds: [1, 4, 8],
    barrierType: "price",
    metricNode: "revisit",
    segmentHints: ["S3"],
    impactOnW2P: "medium",
    nonMonetaryFeasibility: "low",
    actionableInsight:
      "Segment sale-waiters separately; do not use discounts as the intervention — quantify how often price timing exceeds 30 days."
  },
  {
    id: "styling-occasion",
    label: "StylingOccasionMismatch",
    summary: "Users like an item but are unsure when to wear it or what to pair it with.",
    keywords: ["occasion", "wedding", "office", "festival", "pair", "styling", "wear it"],
    researchQuestionIds: [3, 7, 10],
    barrierType: "style",
    metricNode: "resolve",
    segmentHints: ["S1", "S2"],
    impactOnW2P: "high",
    nonMonetaryFeasibility: "high",
    actionableInsight:
      "Surface occasion fit and pairing notes from reviews so users can decide if the save matches a real event."
  },
  {
    id: "comparison-paralysis",
    label: "ComparisonParalysis",
    summary: "Users save many similar items and cannot narrow to one choice.",
    keywords: ["compare", "similar", "which one", "too many", "options", "decide between"],
    researchQuestionIds: [5, 2, 10],
    barrierType: "compare",
    metricNode: "decide",
    segmentHints: ["S4"],
    impactOnW2P: "high",
    nonMonetaryFeasibility: "high",
    actionableInsight:
      "Help users compare 2–3 same-category wishlist items on fit and review themes instead of adding more alternatives."
  },
  {
    id: "bookmark-vs-intent",
    label: "BookmarkVsIntent",
    summary: "Some saves are bookmarks or later-maybe items, not active purchase intent.",
    keywords: ["later", "bookmark", "maybe", "just saved", "moodboard", "inspiration"],
    researchQuestionIds: [1, 8, 9],
    barrierType: "bookmark",
    metricNode: "revisit",
    segmentHints: ["S1", "S4"],
    impactOnW2P: "medium",
    nonMonetaryFeasibility: "medium",
    actionableInsight:
      "Separate bookmark language from still-planning-to-buy language so W2P is not diluted by low-intent saves."
  },
  {
    id: "social-validation",
    label: "SocialValidation",
    summary: "Users wait for a friend or partner to approve occasion or high-ticket wear.",
    keywords: ["friend", "partner", "husband", "ask", "whatsapp", "share", "opinion"],
    researchQuestionIds: [6, 7, 3],
    barrierType: "social",
    metricNode: "resolve",
    segmentHints: ["S1"],
    impactOnW2P: "medium",
    nonMonetaryFeasibility: "medium",
    actionableInsight:
      "Offer in-app social-proof synthesis so users need fewer off-app approval loops before deciding."
  },
  {
    id: "review-trust-gap",
    label: "ReviewTrustGap",
    summary: "Users leave Myntra to check YouTube or Instagram try-ons before buying.",
    keywords: ["youtube", "instagram", "try on", "try-on", "reviews on", "checked reviews"],
    researchQuestionIds: [6, 7, 10],
    barrierType: "other",
    metricNode: "resolve",
    segmentHints: ["S2"],
    impactOnW2P: "high",
    nonMonetaryFeasibility: "medium",
    actionableInsight:
      "Bring synthesized try-on and review evidence into the wishlist so users do not have to leave the app."
  },
  {
    id: "price-timing",
    label: "PriceTiming",
    summary: "Users postpone because the current price feels too high, independent of fit.",
    keywords: ["expensive", "costly", "overpriced", "not worth", "wait for price"],
    researchQuestionIds: [2, 4, 7],
    barrierType: "price",
    metricNode: "resolve",
    segmentHints: ["S3"],
    impactOnW2P: "medium",
    nonMonetaryFeasibility: "low",
    actionableInsight:
      "Quantify price-timing separately from fit blockers; do not treat incentive alerts as the solution."
  },
  {
    id: "return-fear",
    label: "ReturnFearDelay",
    summary: "Easy returns lower risk but users still delay ordering from the wishlist.",
    keywords: ["return", "exchange", "try and buy", "try & buy", "send it back"],
    researchQuestionIds: [2, 4, 3],
    barrierType: "fit",
    metricNode: "resolve",
    segmentHints: ["S2"],
    impactOnW2P: "medium",
    nonMonetaryFeasibility: "high",
    actionableInsight:
      "Use return-reason patterns to raise pre-purchase confidence so try-and-buy is not the only decision strategy."
  },
  {
    id: "wishlist-decay",
    label: "WishlistDecay",
    summary: "Large wishlists lose salience; users forget what they saved.",
    keywords: ["forgot", "forget", "too many items", "clutter", "never look back", "old wishlist"],
    researchQuestionIds: [4, 8, 10],
    barrierType: "other",
    metricNode: "revisit",
    segmentHints: ["S4"],
    impactOnW2P: "medium",
    nonMonetaryFeasibility: "high",
    actionableInsight:
      "Prioritize a small cluster of still-relevant items so revisit leads to a decision, not another scroll."
  }
];

const BATCH_SIZE = 18;

function containsMonetary(text: string): boolean {
  const lower = text.toLowerCase();
  return MONETARY_TERMS.some((term) => lower.includes(term));
}

function keywordMatch(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (keyword.includes(" ")) {
    return text.includes(keyword);
  }
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

function reviewMatchesTemplate(template: ThemeTemplate, review: NormalizedReview): boolean {
  const lower = review.text.toLowerCase();
  return template.keywords.some((keyword) => keywordMatch(lower, keyword));
}

function quotesForTemplate(
  template: ThemeTemplate,
  reviews: NormalizedReview[]
): ThemeQuote[] {
  const hits: ThemeQuote[] = [];
  const usedSources = new Set<string>();
  const usedIds = new Set<string>();

  const candidates = reviews.filter((review) => reviewMatchesTemplate(template, review));

  const prioritized = [
    ...candidates.filter((review) => !usedSources.has(review.source)),
    ...candidates
  ];

  for (const review of prioritized) {
    if (usedIds.has(review.id)) continue;
    hits.push({
      text: review.text.slice(0, 280),
      reviewId: review.id,
      source: review.source,
      url: review.url
    });
    usedIds.add(review.id);
    usedSources.add(review.source);
    if (hits.length >= 3) break;
  }

  return hits;
}

function frequencyForTemplate(template: ThemeTemplate, reviews: NormalizedReview[]): number {
  const eligible = reviews.filter((review) => !review.excludedFromFrequency);
  if (eligible.length === 0) return 0;
  const hits = eligible.filter((review) => reviewMatchesTemplate(template, review));
  return Number((hits.length / eligible.length).toFixed(3));
}

export function ruleBasedThemes(reviews: NormalizedReview[]): Theme[] {
  return TEMPLATES.map((template) => {
    const quotes = quotesForTemplate(template, reviews);
    return {
      id: template.id,
      label: template.label,
      summary: template.summary,
      researchQuestionIds: template.researchQuestionIds,
      barrierType: template.barrierType,
      metricNode: template.metricNode,
      segmentHints: template.segmentHints,
      quotes,
      estimatedFrequency: frequencyForTemplate(template, reviews),
      impactOnW2P: template.impactOnW2P,
      nonMonetaryFeasibility: template.nonMonetaryFeasibility,
      confidence: "medium" as const,
      actionableInsight: template.actionableInsight
    };
  }).filter((theme) => !containsMonetary(theme.actionableInsight));
}

function chunkBatches(chunks: ReviewChunk[]): ReviewChunk[][] {
  const batches: ReviewChunk[][] = [];
  for (let index = 0; index < chunks.length; index += BATCH_SIZE) {
    batches.push(chunks.slice(index, index + BATCH_SIZE));
  }
  return batches;
}

function buildBatchPrompt(batch: ReviewChunk[], batchIndex: number, total: number): string {
  const sample = batch.map((chunk) => ({
    reviewId: chunk.reviewId,
    source: chunk.source,
    text: chunk.text.slice(0, 600)
  }));

  return `Batch ${batchIndex + 1}/${total}. Extract 2-4 distinct wishlist-conversion themes from these reviews.
Research rubric:
${researchRubricBlock()}

Each theme object must include:
id (kebab-case), label (PascalCase), summary, researchQuestionIds (1-10),
barrierType (fit|style|compare|price|bookmark|social|other),
metricNode (revisit|resolve|decide|act), segmentHints (S1-S4),
quotes (2-3 objects: text MUST be copied verbatim from the review, reviewId, source, url?),
estimatedFrequency (0-1), impactOnW2P, nonMonetaryFeasibility, confidence,
actionableInsight (>=20 chars, specific, non-monetary).

Return JSON: { "themes": Theme[] }
Reviews:
${JSON.stringify(sample, null, 2)}`;
}

function coerceImpactLevel(value: unknown, fallback: ImpactLevel = "medium"): ImpactLevel {
  if (value === "high" || value === "medium" || value === "low") return value;
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric >= 0.75) return "high";
  if (numeric >= 0.4) return "medium";
  return "low";
}

function sanitizeTheme(raw: Theme, reviewsById: Map<string, NormalizedReview>): Theme | null {
  if (!raw.id || !raw.label || !raw.summary) return null;
  if (containsMonetary(raw.actionableInsight ?? "")) return null;

  const quotes: ThemeQuote[] = [];
  let repairs = 0;

  for (const quote of raw.quotes ?? []) {
    const review = reviewsById.get(quote.reviewId);
    if (!review) continue;
    const repaired = repairQuote(quote, review);
    if (repaired) {
      quotes.push(repaired);
      if (repaired.text !== quote.text) repairs += 1;
    }
  }

  if (quotes.length < 2 || uniqueReviewIds(quotes) < 2) return null;

  return {
    id: raw.id,
    label: raw.label,
    summary: raw.summary,
    researchQuestionIds: (raw.researchQuestionIds ?? []).filter(
      (id) => id >= 1 && id <= 10
    ),
    barrierType: raw.barrierType ?? "other",
    metricNode: raw.metricNode ?? "resolve",
    segmentHints: raw.segmentHints ?? [],
    quotes,
    estimatedFrequency: Math.min(1, Math.max(0, Number(raw.estimatedFrequency) || 0)),
    impactOnW2P: coerceImpactLevel(raw.impactOnW2P),
    nonMonetaryFeasibility: coerceImpactLevel(raw.nonMonetaryFeasibility),
    confidence: coerceImpactLevel(raw.confidence),
    actionableInsight: raw.actionableInsight ?? ""
  };
}

function mergeThemes(existing: Theme[], incoming: Theme[]): Theme[] {
  const byKey = new Map<string, Theme>();

  for (const theme of [...existing, ...incoming]) {
    const key = theme.id || theme.label.toLowerCase();
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, theme);
      continue;
    }

    const quoteMap = new Map<string, ThemeQuote>();
    for (const quote of [...current.quotes, ...theme.quotes]) {
      quoteMap.set(`${quote.reviewId}:${quote.text.slice(0, 40)}`, quote);
    }
    const mergedQuotes = [...quoteMap.values()].slice(0, 4);

    byKey.set(key, {
      ...current,
      summary: current.summary.length >= theme.summary.length ? current.summary : theme.summary,
      researchQuestionIds: [
        ...new Set([...current.researchQuestionIds, ...theme.researchQuestionIds])
      ],
      quotes: mergedQuotes,
      estimatedFrequency: Math.max(current.estimatedFrequency, theme.estimatedFrequency),
      confidence:
        current.confidence === "high" || theme.confidence === "high"
          ? "high"
          : current.confidence === "medium" || theme.confidence === "medium"
            ? "medium"
            : "low",
      actionableInsight:
        current.actionableInsight.length >= theme.actionableInsight.length
          ? current.actionableInsight
          : theme.actionableInsight
    });
  }

  return [...byKey.values()];
}

async function extractBatch(
  config: LlmProviderConfig,
  batch: ReviewChunk[],
  batchIndex: number,
  total: number,
  reviewsById: Map<string, NormalizedReview>
): Promise<{ themes: Theme[]; quoteRepairs: number }> {
  const prompt = buildBatchPrompt(batch, batchIndex, total);
  const payload = await chatJson<{ themes?: Theme[] }>(
    config,
    EXTRACTION_SYSTEM_PROMPT,
    prompt
  );

  let quoteRepairs = 0;
  const themes: Theme[] = [];
  for (const raw of payload.themes ?? []) {
    const sanitized = sanitizeTheme(raw, reviewsById);
    if (sanitized) themes.push(sanitized);
  }
  return { themes, quoteRepairs };
}

function uncoveredQuestionIds(themes: Theme[]): number[] {
  const covered = new Set(themes.flatMap((theme) => theme.researchQuestionIds));
  return RESEARCH_QUESTIONS.map((question) => question.id).filter((id) => !covered.has(id));
}

function gapFillFromTemplates(
  gaps: number[],
  reviews: NormalizedReview[],
  existing: Theme[]
): Theme[] {
  const existingIds = new Set(existing.map((theme) => theme.id));
  const filled: Theme[] = [];

  for (const template of TEMPLATES) {
    if (!template.researchQuestionIds.some((id) => gaps.includes(id))) continue;
    if (existingIds.has(template.id)) continue;
    const quotes = quotesForTemplate(template, reviews);
    if (quotes.length < 2 || uniqueReviewIds(quotes) < 2) continue;
    filled.push({
      id: template.id,
      label: template.label,
      summary: template.summary,
      researchQuestionIds: template.researchQuestionIds,
      barrierType: template.barrierType,
      metricNode: template.metricNode,
      segmentHints: template.segmentHints,
      quotes,
      estimatedFrequency: frequencyForTemplate(template, reviews),
      impactOnW2P: template.impactOnW2P,
      nonMonetaryFeasibility: template.nonMonetaryFeasibility,
      confidence: "medium",
      actionableInsight: template.actionableInsight
    });
  }

  return filled;
}

async function llmExtractThemes(
  reviews: NormalizedReview[],
  chunks: ReviewChunk[],
  providers: LlmProviderConfig[]
): Promise<{ themes: Theme[]; method: LlmProvider; llmStats: LlmExtractionStats }> {
  const reviewsById = new Map(reviews.map((review) => [review.id, review]));
  const batches = chunkBatches(chunks);
  let merged: Theme[] = [];
  let batchesProcessed = 0;
  let batchesFailed = 0;
  let quoteRepairs = 0;
  let usedProvider: LlmProvider = providers[0].provider;

  for (const config of providers) {
    merged = [];
    batchesProcessed = 0;
    batchesFailed = 0;
    quoteRepairs = 0;
    usedProvider = config.provider;

    for (let index = 0; index < batches.length; index += 1) {
      try {
        const result = await extractBatch(config, batches[index], index, batches.length, reviewsById);
        merged = mergeThemes(merged, result.themes);
        quoteRepairs += result.quoteRepairs;
        batchesProcessed += 1;
      } catch (error) {
        batchesFailed += 1;
        console.warn(`LLM batch ${index + 1} failed (${config.provider}):`, error);
      }
    }

    if (merged.length >= 4) break;
  }

  const rawThemeCount = merged.length;
  const gaps = uncoveredQuestionIds(merged);
  const gapFill = gapFillFromTemplates(gaps, reviews, merged);
  merged = mergeThemes(merged, gapFill);

  return {
    themes: enrichThemeFrequencies(merged, reviews),
    method: usedProvider,
    llmStats: {
      batchesProcessed,
      batchesFailed,
      rawThemeCount,
      themesMerged: merged.length,
      quoteRepairs,
      gapFillThemes: gapFill.length
    }
  };
}

function hybridWithRuleBased(
  llmThemes: Theme[],
  reviews: NormalizedReview[],
  method: ExtractionMethod
): { themes: Theme[]; method: ExtractionMethod } {
  const ruleThemes = ruleBasedThemes(reviews);
  const merged = mergeThemes(llmThemes, ruleThemes);
  const withQuotes = merged.filter(
    (theme) => theme.quotes.length >= 2 && uniqueReviewIds(theme.quotes) >= 2
  );
  return {
    themes: enrichThemeFrequencies(withQuotes, reviews),
    method: method === "rule-based" ? "rule-based" : "hybrid"
  };
}

export async function extractThemes(
  reviews: NormalizedReview[],
  chunks: ReviewChunk[]
): Promise<ExtractionResult> {
  const providers = resolveLlmProviders();
  const emptyStats: LlmExtractionStats = {
    batchesProcessed: 0,
    batchesFailed: 0,
    rawThemeCount: 0,
    themesMerged: 0,
    quoteRepairs: 0,
    gapFillThemes: 0
  };

  if (providers.length === 0 || chunks.length === 0) {
    const themes = ruleBasedThemes(reviews);
    const gaps = uncoveredQuestionIds(themes);
    const gapFill = gapFillFromTemplates(gaps, reviews, themes);
    const merged = enrichThemeFrequencies(mergeThemes(themes, gapFill), reviews);
    return {
      themes: merged.filter(
        (theme) => theme.quotes.length >= 2 && uniqueReviewIds(theme.quotes) >= 2
      ),
      method: "rule-based",
      llmStats: { ...emptyStats, gapFillThemes: gapFill.length, themesMerged: merged.length }
    };
  }

  try {
    const { themes, method, llmStats } = await llmExtractThemes(reviews, chunks, providers);
    const hybrid = hybridWithRuleBased(themes, reviews, method);
    return { themes: hybrid.themes, method: hybrid.method, llmStats };
  } catch (error) {
    console.warn("LLM extraction failed, using rule-based:", error);
    const themes = ruleBasedThemes(reviews);
    const gaps = uncoveredQuestionIds(themes);
    const gapFill = gapFillFromTemplates(gaps, reviews, themes);
    const merged = enrichThemeFrequencies(mergeThemes(themes, gapFill), reviews);
    return {
      themes: merged.filter(
        (theme) => theme.quotes.length >= 2 && uniqueReviewIds(theme.quotes) >= 2
      ),
      method: "rule-based",
      llmStats: emptyStats
    };
  }
}
