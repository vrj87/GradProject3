import { sanitizeReviewText } from "./guardrails";
import {
  synthesizeOccasions,
  synthesizePairings,
  synthesizeWear,
  type OccasionSignal
} from "./review-synthesizer";
import {
  StyleOccasionSummarySchema,
  type ProductRecord,
  type StyleOccasionSummary
} from "./schemas";

function verdict(signal: OccasionSignal, total: number): string {
  if (signal.count >= 3) return `Repeatedly mentioned — ${signal.count} of ${total} reviewers wore it here.`;
  if (signal.count === 2) return `Mentioned twice, so it is a reasonable bet.`;
  return `Mentioned once — treat it as a hint, not a pattern.`;
}

const CAUTION_RULES: Array<{ pattern: RegExp; note: (text: string) => string }> = [
  { pattern: /dry clean only/i, note: () => "Reviewers flag dry clean only, which limits casual wear." },
  { pattern: /warm for summer|polyester and warm/i, note: () => "Called warm for Indian summers." },
  { pattern: /strictly occasion|not everyday|not something I would wear often/i, note: () => "Described as occasion-only, so it will not carry an everyday rotation." },
  { pattern: /creases quickly|wrinkles/i, note: () => "Creases easily, which shows up in photos." },
  { pattern: /scratch/i, note: () => "Fabric or trim reported as scratchy against skin." }
];

export function buildStyleOccasion(product: ProductRecord): StyleOccasionSummary {
  const reviews = product.reviews;
  const occasions = synthesizeOccasions(reviews);
  const pairings = synthesizePairings(reviews);
  const wear = synthesizeWear(reviews);

  const occasionFit =
    occasions.length > 0
      ? occasions.map((signal) => ({
          occasion: signal.occasion,
          verdict: verdict(signal, reviews.length)
        }))
      : [
          {
            occasion: "unclear",
            verdict:
              "No reviewer says where they wore it, so the occasion question is still open — that is the doubt to resolve before deciding."
          }
        ];

  const cautionNotes: string[] = [];
  for (const review of reviews) {
    const text = sanitizeReviewText(review.text);
    for (const rule of CAUTION_RULES) {
      if (rule.pattern.test(text)) cautionNotes.push(rule.note(text));
    }
  }
  if (wear.occasionOnly > 0 && occasions.some((signal) => signal.occasion === "everyday")) {
    cautionNotes.push("Reviewers disagree on whether this is everyday or occasion wear.");
  }

  return StyleOccasionSummarySchema.parse({
    productId: product.id,
    occasionFit,
    pairingSuggestions: [...new Set(pairings.suggestions)].slice(0, 4),
    cautionNotes: [...new Set(cautionNotes)],
    evidenceReviewIds: [
      ...new Set([...occasions.flatMap((signal) => signal.reviewIds), ...pairings.evidenceIds])
    ]
  });
}

/** How many distinct occasion types the reviews support — feeds the wear estimate. */
export function occasionBreadth(product: ProductRecord): {
  types: number;
  everyday: boolean;
  occasions: OccasionSignal[];
} {
  const occasions = synthesizeOccasions(product.reviews);
  return {
    types: occasions.length,
    everyday: occasions.some((signal) =>
      ["everyday", "office", "brunch or casual outing"].includes(signal.occasion)
    ),
    occasions
  };
}
