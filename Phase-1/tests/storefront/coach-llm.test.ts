import { describe, expect, it } from "vitest";
import { PRODUCTS } from "../../apps/storefront/src/data/products";
import {
  coachBannerCopy,
  hasCoachIncentiveLanguage,
  overlayCoachCopy,
  resolveCoachLlm,
  rewriteCoachWithLlm
} from "../../apps/storefront/src/lib/coachLlm";
import { generateCoachInsights } from "../../apps/storefront/src/lib/generateCoachInsights";
import { buildCoachLook, buildRoomCompare } from "../../apps/storefront/src/lib/roomCoach";

function sku(id: string) {
  const product = PRODUCTS.find((item) => item.id === id);
  if (!product) throw new Error(`missing ${id}`);
  return product;
}

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(body)
  } as Response);
}

describe("storefront coach LLM", () => {
  it("stays rule-based when no key is set", () => {
    expect(resolveCoachLlm({})).toBeNull();
    expect(resolveCoachLlm({ GROQ_API_KEY: "  " })).toBeNull();
  });

  it("prefers Groq over OpenAI", () => {
    const config = resolveCoachLlm({
      GROQ_API_KEY: "gsk_test",
      OPENAI_API_KEY: "sk_test",
      GROQ_MODEL: "openai/gpt-oss-20b"
    });
    expect(config?.provider).toBe("groq");
    expect(config?.model).toBe("openai/gpt-oss-20b");
  });

  it("rejects incentive language", () => {
    expect(hasCoachIncentiveLanguage("Wait for a sale and grab 20% off")).toBe(true);
    expect(hasCoachIncentiveLanguage("About ₹42 a wear if you actually go to those weddings")).toBe(false);
  });

  it("overlays prose and keeps ids, sizes, and cost-per-wear", () => {
    const look = buildCoachLook(sku("w-kurta-1"));
    const overlaid = overlayCoachCopy(
      [look],
      null,
      {
        looks: [
          {
            itemId: "w-kurta-1",
            fit: { sizePattern: "Shoppers say the bust runs tight — take the larger size." },
            worth: { headline: "Keep it if those festive dates are real." }
          }
        ]
      }
    );
    expect(overlaid.looks[0]?.itemId).toBe("w-kurta-1");
    expect(overlaid.looks[0]?.fit.suggestedSize).toBe(look.fit.suggestedSize);
    expect(overlaid.looks[0]?.fit.band).toBe(look.fit.band);
    expect(overlaid.looks[0]?.worth.costPerWearInr).toBe(look.worth.costPerWearInr);
    expect(overlaid.looks[0]?.worth.verdict).toBe(look.worth.verdict);
    expect(overlaid.looks[0]?.fit.sizePattern).toMatch(/bust runs tight/);
  });

  it("returns the rule-based look when Groq is not configured", async () => {
    const look = buildCoachLook(sku("w-kurta-1"));
    const result = await rewriteCoachWithLlm({
      looks: [look],
      recommendation: null,
      evidence: "Libas kurta",
      env: {}
    });
    expect(result.meta.provider).toBe("rule-based");
    expect(result.looks[0]?.fit.sizePattern).toBe(look.fit.sizePattern);
  });

  it("keeps the rule-based look if the model mentions a coupon", async () => {
    const look = buildCoachLook(sku("w-kurta-1"));
    const result = await rewriteCoachWithLlm({
      looks: [look],
      recommendation: null,
      evidence: "Libas kurta",
      env: { GROQ_API_KEY: "gsk_test" },
      fetchImpl: () =>
        jsonResponse({
          choices: [{ message: { content: JSON.stringify({ looks: [{ worth: { headline: "Wait for a coupon" } }] }) } }]
        })
    });
    expect(result.meta.provider).toBe("rule-based");
    expect(result.looks[0]?.worth.headline).toBe(look.worth.headline);
  });

  it("does not discard Groq because a shopper quote mentioned cheaper or a sale", async () => {
    const look = buildCoachLook(sku("w-kurta-5"));
    expect(JSON.stringify(look).toLowerCase()).toMatch(/cheaper|sale/);
    const result = await rewriteCoachWithLlm({
      looks: [look],
      recommendation: null,
      evidence: "Kalini set. Neha G.: Looked cheaper in person. Saved it for the sale.",
      env: { GROQ_API_KEY: "gsk_test" },
      fetchImpl: () =>
        jsonResponse({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  looks: [
                    {
                      itemId: "w-kurta-5",
                      fit: { sizeWhy: "Notes call this roomy — try the smaller size if you want it closer." },
                      worth: { qualitySignals: ["A doubt in notes: “Looked cheaper in person than the photo. Saved it for the sale, still not sure.”"] }
                    }
                  ]
                })
              }
            }
          ]
        })
    });
    expect(result.meta.provider).toBe("groq");
    expect(result.looks[0]?.fit.sizeWhy).toMatch(/roomy/);
  });

  it("applies a clean rewrite from the model", async () => {
    const look = buildCoachLook(sku("w-kurta-1"));
    const result = await rewriteCoachWithLlm({
      looks: [look],
      recommendation: null,
      evidence: "Libas kurta",
      env: { GROQ_API_KEY: "gsk_test" },
      fetchImpl: () =>
        jsonResponse({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  looks: [
                    {
                      itemId: "w-kurta-1",
                      fit: { sizeWhy: "Between sizes, the notes point to the larger one." }
                    }
                  ]
                })
              }
            }
          ]
        })
    });
    expect(result.meta.provider).toBe("groq");
    expect(result.looks[0]?.fit.sizeWhy).toMatch(/larger one/);
    expect(result.looks[0]?.worth.priceInr).toBe(look.worth.priceInr);
  });

  it("builds a single-item insight without an LLM", async () => {
    const result = await generateCoachInsights({ itemIds: ["w-kurta-1"] }, {});
    if ("error" in result) throw new Error(result.error);
    expect(result.looks).toHaveLength(1);
    expect(result.meta.provider).toBe("rule-based");
    expect(result.recommendation).toBeNull();
  });

  it("builds a pair insight without an LLM", async () => {
    const local = buildRoomCompare(sku("w-kurta-1"), sku("w-kurta-2"));
    const result = await generateCoachInsights({ itemIds: ["w-kurta-1", "w-kurta-2"] }, {});
    if ("error" in result) throw new Error(result.error);
    expect(result.looks).toHaveLength(2);
    expect(result.recommendation?.itemId).toBe(local.recommendation.itemId);
  });

  it("names Groq LPU in the visible coach banner", () => {
    const generating = coachBannerCopy({
      generating: true,
      provider: "groq",
      model: "openai/gpt-oss-20b"
    });
    expect(generating.kicker).toBe("GROQ LPU");
    expect(generating.title).toBe("Calling Groq LPU · openai/gpt-oss-20b");
    expect(
      coachBannerCopy({ generating: false, provider: "groq", model: "openai/gpt-oss-20b" }).title
    ).toBe("Groq LPU · openai/gpt-oss-20b");
    expect(coachBannerCopy({ generating: true }).title).toMatch(/groq lpu/i);
  });

  it("parses the coach POST body the Netlify function also uses", async () => {
    const { parseCoachInsightsBody } = await import("../../apps/storefront/src/lib/coachHttp");
    const parsed = parseCoachInsightsBody({
      itemIds: ["w-kurta-1", 3, "w-kurta-2"],
      zone: "bust",
      usual: "M",
      between: true
    });
    expect(parsed.itemIds).toEqual(["w-kurta-1", "w-kurta-2"]);
    expect(parsed.zone).toBe("bust");
    expect(parsed.between).toBe(true);
  });
});
