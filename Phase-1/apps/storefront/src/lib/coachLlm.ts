import type { RoomCoachLook, RoomCompare } from "./roomCoach";

export type CoachLlmProvider = "groq" | "openai" | "rule-based";

export interface CoachLlmConfig {
  provider: Exclude<CoachLlmProvider, "rule-based">;
  apiKey: string;
  model: string;
  url: string;
}

export interface CoachGenerationMeta {
  provider: CoachLlmProvider;
  model: string;
  latencyMs: number;
}

export interface CoachLlmStatus {
  provider: CoachLlmProvider;
  model: string;
  configured: boolean;
}

const INCENTIVE =
  /\b(discount|coupon|promo\s*code|% off|eoss|cashback|cheaper|bargain|price\s*drop|wait for (a )?(sale|price)|hurry|only \d+ left)\b/i;

export const COACH_SYSTEM_PROMPT = [
  "You are a Myntra shopping confidence coach for a stalled shortlister.",
  "Rewrite only the shopper-facing sentences. Keep every id, score, size, price, cost-per-wear, wearsAssumed, band, and verdict identical.",
  "Ground claims in the provided reviews and fit notes.",
  "Never mention discounts, coupons, sales, price drops, cashback, or urgency.",
  "Answer three questions: will it fit, where I would wear it, is it worth the wears — not a lower ticket.",
  "Reply with JSON only, same shape as the input."
].join(" ");

export function hasCoachIncentiveLanguage(text: string): boolean {
  return INCENTIVE.test(text);
}

/** Shopper quotes may mention a sale; only the coach's own sentences are guarded. */
export function coachAuthoredProse(
  looks: RoomCoachLook[],
  recommendation: RoomCompare["recommendation"] | null
): string {
  const parts: string[] = [];
  for (const look of looks) {
    parts.push(
      look.fit.sizePattern,
      look.fit.sizeWhy,
      ...look.wear.occasions.map((row) => row.verdict),
      ...look.wear.pairings,
      ...look.wear.cautions,
      look.worth.headline,
      look.worth.wearBasis,
      look.worth.peerNote,
      ...look.worth.whatWouldChangeIt
    );
  }
  if (recommendation) {
    parts.push(recommendation.rationale, recommendation.wouldChangeIf);
  }
  return parts.join("\n");
}

export function coachProviderLabel(provider: string): string {
  if (provider === "groq") return "Groq LPU";
  if (provider === "openai") return "OpenAI";
  return "the local coach";
}

export function coachEngineLabel(provider?: string): string {
  if (provider === "openai") return "OpenAI";
  if (provider === "rule-based") return "Local coach";
  return "Groq LPU";
}

export function coachBannerCopy(input: {
  generating: boolean;
  provider?: string;
  model?: string;
}): { kicker: string; title: string } {
  const provider = input.provider;
  const model = input.model ?? "storefront-review-synthesis";
  const llm = provider === "groq" || provider === "openai";
  const engine = coachEngineLabel(provider);
  if (input.generating) {
    if (!provider) {
      return { kicker: "GROQ LPU", title: "Connecting to Groq LPU…" };
    }
    return {
      kicker: engine.toUpperCase(),
      title: llm
        ? `Calling ${coachProviderLabel(provider)} · ${model}`
        : "Drafting the local read — no model key on the server yet"
    };
  }
  if (!provider) {
    return { kicker: "GROQ LPU", title: "Connecting to Groq LPU…" };
  }
  return {
    kicker: engine.toUpperCase(),
    title: llm ? `${coachProviderLabel(provider)} · ${model}` : "Local read · model rewrite was not applied"
  };
}

export function resolveCoachLlm(env: Record<string, string | undefined> = process.env): CoachLlmConfig | null {
  const groq = env.GROQ_API_KEY?.trim();
  if (groq) {
    return {
      provider: "groq",
      apiKey: groq,
      model: env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b",
      url: "https://api.groq.com/openai/v1/chat/completions"
    };
  }
  const openai = env.OPENAI_API_KEY?.trim();
  if (openai) {
    return {
      provider: "openai",
      apiKey: openai,
      model: env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      url: "https://api.openai.com/v1/chat/completions"
    };
  }
  return null;
}

function parseJsonObject(content: string): unknown {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error("invalid json");
  }
}

function overlayLook(base: RoomCoachLook, next: unknown): RoomCoachLook {
  if (!next || typeof next !== "object") return base;
  const row = next as Partial<RoomCoachLook> & {
    fit?: Partial<RoomCoachLook["fit"]>;
    wear?: Partial<RoomCoachLook["wear"]>;
    worth?: Partial<RoomCoachLook["worth"]>;
  };
  return {
    itemId: base.itemId,
    fit: {
      ...base.fit,
      sizePattern: typeof row.fit?.sizePattern === "string" ? row.fit.sizePattern : base.fit.sizePattern,
      sizeWhy: typeof row.fit?.sizeWhy === "string" ? row.fit.sizeWhy : base.fit.sizeWhy,
      signals: Array.isArray(row.fit?.signals) ? row.fit.signals.filter((item) => typeof item === "string") : base.fit.signals,
      bodyNotes: Array.isArray(row.fit?.bodyNotes)
        ? row.fit.bodyNotes.filter((item) => typeof item === "string")
        : base.fit.bodyNotes,
      returnRisk: Array.isArray(row.fit?.returnRisk)
        ? row.fit.returnRisk.filter((item) => typeof item === "string")
        : base.fit.returnRisk
    },
    wear: {
      occasions: Array.isArray(row.wear?.occasions)
        ? base.wear.occasions.map((occasion, index) => ({
            name: occasion.name,
            verdict:
              typeof row.wear?.occasions?.[index]?.verdict === "string"
                ? row.wear.occasions[index]!.verdict
                : occasion.verdict
          }))
        : base.wear.occasions,
      pairings: Array.isArray(row.wear?.pairings)
        ? row.wear.pairings.filter((item) => typeof item === "string")
        : base.wear.pairings,
      cautions: Array.isArray(row.wear?.cautions)
        ? row.wear.cautions.filter((item) => typeof item === "string")
        : base.wear.cautions
    },
    worth: {
      ...base.worth,
      headline: typeof row.worth?.headline === "string" ? row.worth.headline : base.worth.headline,
      wearBasis: typeof row.worth?.wearBasis === "string" ? row.worth.wearBasis : base.worth.wearBasis,
      peerNote: typeof row.worth?.peerNote === "string" ? row.worth.peerNote : base.worth.peerNote,
      qualitySignals: Array.isArray(row.worth?.qualitySignals)
        ? row.worth.qualitySignals.filter((item) => typeof item === "string")
        : base.worth.qualitySignals,
      whatWouldChangeIt: Array.isArray(row.worth?.whatWouldChangeIt)
        ? row.worth.whatWouldChangeIt.filter((item) => typeof item === "string")
        : base.worth.whatWouldChangeIt
    }
  };
}

export function overlayCoachCopy(
  looks: RoomCoachLook[],
  recommendation: RoomCompare["recommendation"] | null,
  rewritten: unknown
): { looks: RoomCoachLook[]; recommendation: RoomCompare["recommendation"] | null } {
  if (!rewritten || typeof rewritten !== "object") return { looks, recommendation };
  const body = rewritten as {
    looks?: unknown[];
    recommendation?: { rationale?: string; wouldChangeIf?: string };
  };
  const rewrittenLooks = Array.isArray(body.looks) ? body.looks : [];
  const nextLooks = looks.map((look, index) => {
    const matched = rewrittenLooks.find((row) => {
      return Boolean(
        row &&
          typeof row === "object" &&
          "itemId" in row &&
          (row as { itemId?: unknown }).itemId === look.itemId
      );
    });
    return overlayLook(look, matched ?? rewrittenLooks[index]);
  });
  const nextRec = recommendation
    ? {
        ...recommendation,
        rationale:
          typeof body.recommendation?.rationale === "string"
            ? body.recommendation.rationale
            : recommendation.rationale,
        wouldChangeIf:
          typeof body.recommendation?.wouldChangeIf === "string"
            ? body.recommendation.wouldChangeIf
            : recommendation.wouldChangeIf
      }
    : null;
  return { looks: nextLooks, recommendation: nextRec };
}

export async function rewriteCoachWithLlm(input: {
  looks: RoomCoachLook[];
  recommendation: RoomCompare["recommendation"] | null;
  evidence: string;
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<{ looks: RoomCoachLook[]; recommendation: RoomCompare["recommendation"] | null; meta: CoachGenerationMeta }> {
  const started = Date.now();
  const env = input.env ?? process.env;
  const config = resolveCoachLlm(env);
  const fallbackMeta = (): CoachGenerationMeta => ({
    provider: "rule-based",
    model: "storefront-review-synthesis",
    latencyMs: Date.now() - started
  });
  const fallback = () => ({
    looks: input.looks,
    recommendation: input.recommendation,
    meta: fallbackMeta()
  });
  if (!config) return fallback();
  const { url, apiKey, model, provider } = config;

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    input.timeoutMs ?? (env.NETLIFY ? 8_000 : 20_000)
  );
  const fetchImpl = input.fetchImpl ?? fetch;
  const messages = [
    { role: "system", content: COACH_SYSTEM_PROMPT },
    {
      role: "user",
      content: `${input.evidence}\n\nRewrite this JSON for a stalled shortlister. Same shape. Same ids and numbers.\n${JSON.stringify(
        { looks: input.looks, recommendation: input.recommendation }
      )}`
    }
  ];

  async function complete(withJsonFormat: boolean) {
    return fetchImpl(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 4000,
        ...(withJsonFormat ? { response_format: { type: "json_object" } } : {}),
        messages
      })
    });
  }

  try {
    let response = await complete(true);
    if (!response.ok) response = await complete(false);
    if (!response.ok) return fallback();
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return fallback();
    const overlaid = overlayCoachCopy(input.looks, input.recommendation, parseJsonObject(content));
    if (hasCoachIncentiveLanguage(coachAuthoredProse(overlaid.looks, overlaid.recommendation))) {
      return fallback();
    }
    return {
      ...overlaid,
      meta: {
        provider,
        model,
        latencyMs: Date.now() - started
      }
    };
  } catch {
    return fallback();
  } finally {
    clearTimeout(timer);
  }
}
