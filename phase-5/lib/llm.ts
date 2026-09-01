import type { z } from "zod";
import { incentiveMatches } from "./guardrails";
import type { GenerationMeta } from "./schemas";

/**
 * Provider ladder from the Phase 5 LLM design: Groq, then OpenAI, then the
 * rule-based coach. The rule-based tier is not a degraded mode — it is the
 * default, and it is what the tests and the offline demo run on.
 *
 * An LLM is only ever allowed to *rewrite the wording* of an already-computed,
 * already-valid summary. It cannot introduce a claim, because the rewrite is
 * re-validated against the same Zod schema, and the schema rejects incentive
 * language. If anything fails, the rule-based object is returned untouched.
 */

export const SYSTEM_PROMPT = [
  "You are a Myntra shopping confidence coach.",
  "You MUST NOT offer discounts, coupons, sales, price drops, or any monetary incentive.",
  "You MUST NOT use urgency or scarcity pressure.",
  "Ground every claim in the provided review evidence. Use confidence bands, never guarantees.",
  "You may only rephrase the JSON you are given. Do not add, remove, or change any field, id, or number.",
  "Reply with the same JSON shape and nothing else."
].join(" ");

export type Provider = "groq" | "openai" | "rule-based";
export type EnvBag = Record<string, string | undefined>;

interface ProviderConfig {
  provider: Exclude<Provider, "rule-based">;
  url: string;
  model: string;
  key: string;
}

export function availableProvider(env: EnvBag = process.env): ProviderConfig | null {
  if (env.GROQ_API_KEY) {
    return {
      provider: "groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      model: env.GROQ_MODEL || "llama-3.3-70b-versatile",
      key: env.GROQ_API_KEY
    };
  }
  if (env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      url: "https://api.openai.com/v1/chat/completions",
      model: env.OPENAI_MODEL || "gpt-4o-mini",
      key: env.OPENAI_API_KEY
    };
  }
  return null;
}

export function describeProviders(env: EnvBag = process.env) {
  const active = availableProvider(env);
  return {
    active: active?.provider ?? ("rule-based" as Provider),
    groqConfigured: Boolean(env.GROQ_API_KEY),
    openaiConfigured: Boolean(env.OPENAI_API_KEY),
    note: active
      ? "An LLM may rephrase coach output. Every rewrite is re-validated and discarded if it drifts."
      : "No API key set. Every flow runs on the rule-based coach, which is the tested path."
  };
}

export interface RefineResult<T> {
  value: T;
  meta: GenerationMeta;
}

/**
 * Ids and numbers must survive a rewrite untouched, otherwise the "grounded in
 * evidence" promise is only decorative.
 */
function structurePreserved(before: unknown, after: unknown): boolean {
  const ids = (value: unknown) => JSON.stringify(value).match(/"[a-z]+-[a-z0-9-]+"/gi)?.sort() ?? [];
  const numbers = (value: unknown) => JSON.stringify(value).match(/-?\d+(\.\d+)?/g)?.sort() ?? [];
  return (
    JSON.stringify(ids(before)) === JSON.stringify(ids(after)) &&
    JSON.stringify(numbers(before)) === JSON.stringify(numbers(after))
  );
}

export async function refine<T>(options: {
  value: T;
  schema: z.ZodType<T>;
  instruction: string;
  evidenceIds: string[];
  env?: EnvBag;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<RefineResult<T>> {
  const { value, schema, instruction, evidenceIds, env = process.env, timeoutMs = 8000 } = options;
  const started = Date.now();
  const config = availableProvider(env);

  const ruleBased: RefineResult<T> = {
    value,
    meta: {
      provider: "rule-based",
      model: "phase5-review-synthesis",
      latencyMs: Date.now() - started,
      evidenceIds
    }
  };
  if (!config) return ruleBased;

  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(config.url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.key}`
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `${instruction}\n\nJSON:\n${JSON.stringify(value)}` }
        ]
      })
    });
    if (!response.ok) return ruleBased;

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return ruleBased;

    const candidate = JSON.parse(content);
    if (incentiveMatches(content).length > 0) return ruleBased;
    if (!structurePreserved(value, candidate)) return ruleBased;

    const parsed = schema.safeParse(candidate);
    if (!parsed.success) return ruleBased;

    return {
      value: parsed.data,
      meta: {
        provider: config.provider,
        model: config.model,
        latencyMs: Date.now() - started,
        evidenceIds
      }
    };
  } catch {
    return ruleBased;
  } finally {
    clearTimeout(timer);
  }
}
