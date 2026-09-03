import type { Product } from "../data/products";
import { formatInr } from "../data/products";
import { pinByZone, type PinZone } from "./fittingRoom";
import { suggestSize } from "./sizeAdvice";
import { fitClarity } from "./wishlistBlockers";

export const ROOM_COACH_TABS = [
  { id: "fit", label: "Will it fit" },
  { id: "wear", label: "Where I'd wear it" },
  { id: "worth", label: "Is it worth it" }
] as const;

export type RoomCoachTab = (typeof ROOM_COACH_TABS)[number]["id"];

export type FitBand = "high" | "moderate" | "low";
export type WorthVerdict = "worth-it-now" | "worth-it-if" | "hold";

export interface RoomFitBrief {
  band: FitBand;
  sizePattern: string;
  suggestedSize: string;
  sizeWhy: string;
  signals: string[];
  bodyNotes: string[];
  returnRisk: string[];
}

export interface RoomWearBrief {
  occasions: Array<{ name: string; verdict: string }>;
  pairings: string[];
  cautions: string[];
}

export interface RoomWorthBrief {
  verdict: WorthVerdict;
  headline: string;
  priceInr: number;
  costPerWearInr: number;
  wearsAssumed: number;
  wearBasis: string;
  peerNote: string;
  qualitySignals: string[];
  whatWouldChangeIt: string[];
}

export interface RoomCoachLook {
  itemId: string;
  fit: RoomFitBrief;
  wear: RoomWearBrief;
  worth: RoomWorthBrief;
}

export interface RoomCompareScore {
  itemId: string;
  score: number;
  rationale: string;
}

export interface RoomCompareDimension {
  name: string;
  scores: RoomCompareScore[];
}

export interface RoomCompare {
  itemIds: string[];
  looks: RoomCoachLook[];
  dimensions: RoomCompareDimension[];
  recommendation: {
    itemId: string;
    rationale: string;
    runnerUpId: string | null;
    wouldChangeIf: string;
  };
}

export interface RoomCoachOptions {
  usual?: string;
  between?: boolean;
  occasionsPerMonth?: number;
  peers?: Product[];
}

const EVERYDAY_BROAD = 36;
const EVERYDAY = 24;
const MULTI_OCCASION = 8;
const SINGLE_OCCASION = 4;
const UNKNOWN_OCCASION = 6;

function clamp(value: number): number {
  return Math.max(1, Math.min(5, Number(value.toFixed(2))));
}

function hay(product: Product): string {
  return `${product.fitNote} ${product.reviews.map((review) => review.text).join(" ")}`.toLowerCase();
}

function occasionNames(product: Product): string[] {
  return product.occasion
    .split(/,|\/|&/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function everydayWear(product: Product): boolean {
  return /everyday|office|work|brunch|casual|weekend|training/.test(product.occasion.toLowerCase());
}

export function parseRoomWearsPerMonth(raw: string): number | undefined {
  const n = Number(String(raw).trim().replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 31) return undefined;
  return n;
}

function monthlyStats(priceInr: number, perMonth: number) {
  const wearsAssumed = Math.max(1, Math.round(perMonth * 12));
  return {
    wearsAssumed,
    costPerWearInr: Math.round(priceInr / wearsAssumed),
    wearBasis: `your own estimate of ${perMonth} wear${perMonth === 1 ? "" : "s"} a month over a year`
  };
}

function reviewWear(product: Product) {
  const texts = product.reviews.map((review) => review.text.toLowerCase());
  return {
    repeat: texts.filter((text) => /wear it (again|often)|already worn|third time|keeps wearing/.test(text)).length,
    fail: texts.filter((text) => /fell apart|colour ran|after one wash|poor quality|pilling/.test(text)).length,
    occasionOnly: texts.filter((text) => /only for (wedding|festive)|not everyday|not something i would wear often/.test(text))
      .length
  };
}

function estimateWears(product: Product, occasionsPerMonth?: number): { wears: number; basis: string } {
  if (occasionsPerMonth !== undefined) {
    const stats = monthlyStats(product.price, occasionsPerMonth);
    return { wears: stats.wearsAssumed, basis: stats.wearBasis };
  }

  const names = occasionNames(product);
  const daily = everydayWear(product);
  let wears: number;
  let basis: string;
  if (daily && names.length >= 2) {
    wears = EVERYDAY_BROAD;
    basis = `named for ${names.length} settings, including everyday wear`;
  } else if (daily) {
    wears = EVERYDAY;
    basis = "named as everyday or work wear";
  } else if (names.length >= 2) {
    wears = MULTI_OCCASION;
    basis = `named for ${names.join(" and ")}, none of them everyday`;
  } else if (names.length === 1) {
    wears = SINGLE_OCCASION;
    basis = `named only for ${names[0]}`;
  } else {
    wears = UNKNOWN_OCCASION;
    basis = "no occasion on the hanger yet, so this is a midpoint guess";
  }

  const wear = reviewWear(product);
  if (wear.repeat > 0) {
    wears = Math.round(wears * 1.25);
    basis += `, raised because a shopper reports wearing it more than once`;
  }
  if (wear.fail > 0) {
    wears = Math.max(1, Math.round(wears * 0.6));
    basis += `, cut because a shopper reports it failing early`;
  }
  if (wear.occasionOnly > 0) {
    wears = Math.min(wears, 6);
    basis += ", capped because a shopper calls it occasion-only";
  }
  return { wears, basis };
}

function fitBand(product: Product): FitBand {
  const note = product.fitNote.toLowerCase();
  const reviews = product.reviews.length;
  const trueSize = /\btrue to size\b|\btrue at the waist\b|\busually true\b/.test(note);
  if (reviews >= 3 && trueSize) return "high";
  if (reviews >= 2 && (trueSize || /size up|consider the larger|runs a little/.test(note))) return "moderate";
  if (reviews === 0) return "low";
  return reviews >= 2 ? "moderate" : "low";
}

function sizePattern(product: Product): string {
  const note = product.fitNote.toLowerCase();
  const mentioned = product.reviews.filter((review) =>
    /size|bust|snug|tight|roomy|true to size|length/.test(review.text.toLowerCase())
  );
  if (/runs (a little )?(small|snug)|size up|consider the larger/.test(note)) {
    return mentioned.length
      ? `Runs a little small — ${mentioned.length} of ${product.reviews.length} notes on this hanger mention sizing.`
      : "Runs a little small. The size note on the hanger is the action.";
  }
  if (/runs (a little )?(large|big)|roomy|try the smaller/.test(note)) {
    return "Runs a little roomy. If you are between sizes, the smaller one is the safer try.";
  }
  if (/\btrue to size\b|\btrue at the waist\b|\busually true\b/.test(note)) {
    return "Close to true to size. Keep the size you already wear unless a pin on the body says otherwise.";
  }
  return `${product.fit} fit. ${fitClarity(product).reason}.`;
}

export function buildFitBrief(
  product: Product,
  zone: PinZone | null,
  usual = "M",
  between = false
): RoomFitBrief {
  const advice = suggestSize(product, usual, between);
  const pin = zone ? pinByZone(product, zone) : null;
  const band = fitBand(product);
  const signals = product.reviews
    .filter((review) => /size|fit|bust|snug|tight|length|roomy|true/.test(review.text.toLowerCase()))
    .slice(0, 3)
    .map((review) => `“${review.text}” — ${review.name}, bought ${review.sizeBought}`);
  if (signals.length === 0) {
    signals.push(product.fitNote);
  }

  const bodyNotes: string[] = [];
  if (pin) bodyNotes.push(`${pin.label} on this hanger: ${pin.hint}`);
  else bodyNotes.push("Name a body zone on the silhouette to pin this read to bust, waist, length, or foot.");

  const text = hay(product);
  const returnRisk: string[] = [];
  if (/runs (a little )?(small|snug)|bust felt snug|sleeves felt tight/.test(text)) {
    returnRisk.push("Ordering your usual size carries exchange risk — shoppers mention a snug or small fit.");
  }
  if (/runs (a little )?(large|big)|roomy/.test(text) && !/true to size/.test(text)) {
    returnRisk.push("Shoppers call this roomy, so a smaller size may be the one you keep.");
  }
  if (band === "low" && returnRisk.length === 0) {
    returnRisk.push("Not enough notes on this hanger to estimate return risk either way.");
  }
  if (returnRisk.length === 0) {
    returnRisk.push("Nothing in the notes flags an obvious exchange. Still try the size on the hanger.");
  }

  return {
    band,
    sizePattern: sizePattern(product),
    suggestedSize: advice.size,
    sizeWhy: advice.why,
    signals,
    bodyNotes,
    returnRisk
  };
}

export function buildWearBrief(product: Product): RoomWearBrief {
  const names = occasionNames(product);
  const reviews = product.reviews;
  const occasions =
    names.length > 0
      ? names.map((name) => {
          const key = name.toLowerCase().split(/\s+/)[0] ?? name;
          const hits = reviews.filter((review) => review.text.toLowerCase().includes(key)).length;
          const verdict =
            hits >= 2
              ? `Shoppers named this more than once — ${hits} of ${reviews.length} notes.`
              : hits === 1
                ? "Mentioned once on this hanger — treat it as a hint, not a pattern."
                : `On the hanger as ${name}. No shopper note has used that word yet.`;
          return { name, verdict };
        })
      : [
          {
            name: "unclear",
            verdict: "No occasion is named on this hanger, so where you would wear it is still the open question."
          }
        ];

  const pairings: string[] = [];
  if (/palazzo|dupatta|set/.test(`${product.name} ${product.description}`.toLowerCase())) {
    pairings.push("Sold as a set — bottoms and dupatta are already the pairing.");
  }
  if (/jean|sneaker|heel|jutti|legging/.test(hay(product))) {
    pairings.push("Shopper notes already mention a pairing (denim, footwear, or bottoms).");
  }
  for (const review of reviews) {
    const match = review.text.match(/for a [^.]{8,40}/i);
    if (match) pairings.push(`“${match[0]}” — ${review.name}`);
  }
  if (pairings.length === 0) {
    pairings.push(`Catalog pairing is the named occasion: ${product.occasion}.`);
  }

  const cautions: string[] = [];
  if (/stiff|scratch|warm|crease|wrinkle|dry clean|polyester/.test(hay(product))) {
    const hit = product.reviews.find((review) =>
      /stiff|scratch|warm|crease|tight|sleeve/.test(review.text.toLowerCase())
    );
    cautions.push(hit ? `“${hit.text}”` : product.fitNote);
  }
  if (everydayWear(product) === false && /wedding|festive|reception|sangeet|puja/.test(product.occasion.toLowerCase())) {
    cautions.push("This reads as occasion wear, so it will not carry an everyday rotation.");
  }
  if (cautions.length === 0) {
    cautions.push("No shopper note flags a wear limit yet.");
  }

  return {
    occasions,
    pairings: [...new Set(pairings)].slice(0, 3),
    cautions: [...new Set(cautions)].slice(0, 3)
  };
}

function qualitySignals(product: Product): string[] {
  const out: string[] = [];
  for (const review of product.reviews) {
    const text = review.text.toLowerCase();
    if (review.rating >= 4 && /lovely|beautiful|closest|richer|quality/.test(text)) {
      out.push(`Holds up in notes: “${review.text}”`);
    } else if (review.rating <= 3 || /tight|stiff|snug|not sure/.test(text)) {
      out.push(`A doubt in notes: “${review.text}”`);
    }
  }
  if (out.length === 0) {
    out.push("No shopper describes how it holds up, so durability is unknown rather than good.");
  }
  return out.slice(0, 3);
}

export function buildCoachLook(
  product: Product,
  zone: PinZone | null = null,
  opts: RoomCoachOptions = {}
): RoomCoachLook {
  const usual = opts.usual ?? "M";
  const between = opts.between ?? false;
  const peers = (opts.peers ?? []).filter((item) => item.id !== product.id);
  return {
    itemId: product.id,
    fit: buildFitBrief(product, zone, usual, between),
    wear: buildWearBrief(product),
    worth: buildWorthBrief(product, peers, opts.occasionsPerMonth)
  };
}

export function buildWorthBrief(
  product: Product,
  peers: Product[] = [],
  occasionsPerMonth?: number
): RoomWorthBrief {
  const estimate = estimateWears(product, occasionsPerMonth);
  const perWear = Math.round(product.price / Math.max(1, estimate.wears));
  const other = peers.filter((item) => item.id !== product.id);
  const peerPerWear =
    other.length === 0
      ? null
      : Math.round(
          other.reduce((sum, item) => {
            const peerEstimate = estimateWears(item, occasionsPerMonth);
            return sum + item.price / Math.max(1, peerEstimate.wears);
          }, 0) / other.length
        );

  let peerNote =
    other.length === 0
      ? "This look is scored on its own, so cost per wear is the only reference."
      : `Against ${other.map((item) => item.brand).join(" and ")} on this rack, this is ${formatInr(perWear)} a wear${
          peerPerWear ? ` vs ${formatInr(peerPerWear)} for the other hanger` : ""
        }.`;

  const quality = qualitySignals(product);
  const wear = reviewWear(product);
  const names = occasionNames(product);
  const worseThanPeer = peerPerWear !== null && peerPerWear > 0 && perWear > peerPerWear * 1.25;
  const positives = quality.filter((line) => line.startsWith("Holds up"));

  let verdict: WorthVerdict;
  let headline: string;
  if (wear.fail > 0 && positives.length === 0) {
    verdict = "hold";
    headline = `Hold this one — at ${formatInr(product.price)} a shopper describes it failing before it earns its keep.`;
  } else if (names.length === 0 && occasionsPerMonth === undefined) {
    verdict = "worth-it-if";
    headline = `${formatInr(product.price)} is about ${formatInr(perWear)} a wear, but no occasion is named — say where you would wear it and this becomes a real answer.`;
  } else if (worseThanPeer) {
    verdict = "worth-it-if";
    headline = `About ${formatInr(perWear)} a wear, against ${formatInr(peerPerWear!)} on the other hanger — keep it only if you specifically want this look.`;
  } else if (positives.length > 0 && perWear <= 200) {
    verdict = "worth-it-now";
    headline = `${formatInr(product.price)} works out to roughly ${formatInr(perWear)} a wear across ${estimate.wears} wears, and the notes back the look up.`;
  } else {
    verdict = "worth-it-if";
    headline = `Roughly ${formatInr(perWear)} a wear across ${estimate.wears} wears — reasonable, if those occasions actually turn up.`;
  }

  const whatWouldChangeIt: string[] = [];
  if (occasionsPerMonth === undefined) {
    whatWouldChangeIt.push(
      `Type how often you would wear it. At one wear a month this is ${formatInr(
        Math.round(product.price / 12)
      )} a wear; at three it is ${formatInr(Math.round(product.price / 36))}.`
    );
  }
  if (!everydayWear(product) && names.length > 0) {
    whatWouldChangeIt.push(
      `If it also works for everyday, cost per wear falls to about ${formatInr(Math.round(product.price / EVERYDAY))}.`
    );
  }
  if (whatWouldChangeIt.length === 0) {
    whatWouldChangeIt.push("The next signal would have to come from actually wearing it.");
  }

  return {
    verdict,
    headline,
    priceInr: product.price,
    costPerWearInr: perWear,
    wearsAssumed: estimate.wears,
    wearBasis: estimate.basis,
    peerNote,
    qualitySignals: quality,
    whatWouldChangeIt
  };
}

const WEIGHTS: Record<string, number> = {
  "Will it fit": 1.3,
  "Where I'd wear it": 1.1,
  "Is it worth it": 1
};

function worthScoreValue(brief: RoomWorthBrief): number {
  if (brief.verdict === "worth-it-now") return 4.4;
  if (brief.verdict === "worth-it-if") return 3.2;
  return 2;
}

function wearScoreValue(brief: RoomWearBrief): number {
  const named = brief.occasions.filter((row) => row.name !== "unclear").length;
  return clamp(2.4 + named * 0.7);
}

export function buildRoomCompare(
  left: Product,
  right: Product,
  zone: PinZone | null = null,
  opts: RoomCoachOptions = {}
): RoomCompare {
  const usual = opts.usual ?? "M";
  const between = opts.between ?? false;
  const pair = [left, right];
  const looks: RoomCoachLook[] = pair.map((item) => {
    const peers = [left, right, ...(opts.peers ?? [])].filter((peer) => peer.id !== item.id);
    const uniquePeers = peers.filter((peer, index) => peers.findIndex((row) => row.id === peer.id) === index);
    return {
      itemId: item.id,
      fit: buildFitBrief(item, zone, usual, between),
      wear: buildWearBrief(item),
      worth: buildWorthBrief(item, uniquePeers, opts.occasionsPerMonth)
    };
  });

  const dimensions: RoomCompareDimension[] = [
    {
      name: "Will it fit",
      scores: looks.map((look) => ({
        itemId: look.itemId,
        score: clamp(
          (look.fit.band === "high" ? 4.4 : look.fit.band === "moderate" ? 3.3 : 2.1) + (zone ? 0.4 : 0)
        ),
        rationale: look.fit.sizePattern
      }))
    },
    {
      name: "Where I'd wear it",
      scores: looks.map((look) => ({
        itemId: look.itemId,
        score: wearScoreValue(look.wear),
        rationale: look.wear.occasions.map((row) => row.name).join(", ")
      }))
    },
    {
      name: "Is it worth it",
      scores: looks.map((look) => ({
        itemId: look.itemId,
        score: worthScoreValue(look.worth),
        rationale: look.worth.headline
      }))
    }
  ];

  const totals = pair
    .map((item) => {
      const total = dimensions.reduce((sum, dimension) => {
        const cell = dimension.scores.find((score) => score.itemId === item.id)?.score ?? 0;
        return sum + cell * (WEIGHTS[dimension.name] ?? 1);
      }, 0);
      return { id: item.id, brand: item.brand, total: Number(total.toFixed(2)) };
    })
    .sort((a, b) => b.total - a.total);

  const winner = totals[0]!;
  const runnerUp = totals[1] ?? null;
  const flip = runnerUp
    ? dimensions
        .map((dimension) => {
          const win = dimension.scores.find((score) => score.itemId === winner.id)?.score ?? 0;
          const run = dimension.scores.find((score) => score.itemId === runnerUp.id)?.score ?? 0;
          return { name: dimension.name, edge: run - win };
        })
        .sort((a, b) => b.edge - a.edge)[0]
    : null;

  return {
    itemIds: pair.map((item) => item.id),
    looks,
    dimensions,
    recommendation: {
      itemId: winner.id,
      runnerUpId: runnerUp?.id ?? null,
      rationale: runnerUp
        ? `${winner.brand} leads on will-it-fit and where you'd wear it — worth is cost per wear, not a lower ticket.`
        : `${winner.brand} is the only look with enough to call.`,
      wouldChangeIf:
        flip && flip.edge > 0 && runnerUp
          ? `${runnerUp.brand} already reads stronger on ${flip.name.toLowerCase()}. If that is the doubt that matters, keep that hanger instead.`
          : "If you still cannot keep one, name a body zone on the silhouette — the missing input is your doubt."
    }
  };
}
