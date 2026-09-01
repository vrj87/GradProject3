import { describe, expect, it } from "vitest";
import { triggerFor } from "@/lib/age-triggers";
import { pct } from "@/lib/format";
import { buildFunnel } from "@/lib/metrics";

describe("divide-by-zero", () => {
  it("returns 0 rather than NaN or throwing", () => {
    expect(pct(1, 0)).toBe(0);
    expect(pct(0, 0)).toBe(0);
  });

  it("renders an empty funnel instead of crashing", () => {
    const funnel = buildFunnel({ eligibleUserIds: [], items: [], events: [] });
    expect(funnel.eligibleUsers).toBe(0);
    expect(funnel.rates.engagementRate).toBe(0);
    expect(funnel.rates.compareCompletionRate).toBe(0);
    expect(funnel.rates.shortlistToDecisionRate).toBe(0);
    expect(funnel.timeToFirstRevisitDays).toBeNull();
  });
});

describe("decision accounting", () => {
  it("counts a deliberate drop as a completed decision, not as churn", () => {
    const funnel = buildFunnel({
      eligibleUserIds: ["user-priya"],
      items: [
        {
          id: "a",
          userId: "user-priya",
          addedAt: new Date("2026-08-01"),
          removedAt: new Date("2026-08-10")
        },
        {
          id: "b",
          userId: "user-priya",
          addedAt: new Date("2026-08-01"),
          cartAddedAt: new Date("2026-08-12")
        },
        { id: "c", userId: "user-priya", addedAt: new Date("2026-08-01") }
      ],
      events: []
    });
    expect(funnel.decisions.completed).toBe(2);
    expect(funnel.decisions.dropped).toBe(1);
    expect(funnel.decisions.open).toBe(1);
    expect(funnel.rates.shortlistToDecisionRate).toBe(66.7);
    expect(funnel.rates.removalShareOfDecisions).toBe(50);
    expect(funnel.labels.shortlistToDecisionRate).toMatch(/deliberate drop/);
  });

  it("labels W2P as a proxy because purchases are simulated", () => {
    const funnel = buildFunnel({
      eligibleUserIds: ["user-priya"],
      items: [
        {
          id: "a",
          userId: "user-priya",
          addedAt: new Date("2026-08-01"),
          purchasedAt: new Date("2026-08-20")
        }
      ],
      events: [
        { userId: "user-priya", type: "coach_opened", createdAt: new Date("2026-08-02") },
        { userId: "user-priya", type: "cart_add_simulated", createdAt: new Date("2026-08-19") }
      ]
    });
    expect(funnel.rates.w2pProxyRate).toBe(100);
    expect(funnel.labels.w2pProxyRate).toMatch(/Proxy only/);
    expect(funnel.coachEngaged).toBe(1);
    expect(funnel.cartAddSimulated).toBe(1);
  });
});

describe("age triggers", () => {
  const now = new Date("2026-09-01T00:00:00Z");
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  it("walks day 0 → 3 → 7 compare → 14 decide", () => {
    expect(triggerFor({ addedAt: daysAgo(0) }, { comparableCount: 2 }, now).kind).toBe("entry");
    expect(triggerFor({ addedAt: daysAgo(3) }, { comparableCount: 2 }, now).kind).toBe("fit-highlight");
    expect(triggerFor({ addedAt: daysAgo(7) }, { comparableCount: 2 }, now).kind).toBe("compare");
    expect(triggerFor({ addedAt: daysAgo(7) }, { comparableCount: 1 }, now).kind).toBe("fit-highlight");
    expect(triggerFor({ addedAt: daysAgo(14) }, { comparableCount: 2 }, now).kind).toBe("decision-prompt");
  });

  it("caps non-entry prompts to one per item per 3 days", () => {
    const prompt = triggerFor(
      { addedAt: daysAgo(8), lastPromptAt: daysAgo(1) },
      { comparableCount: 3 },
      now
    );
    expect(prompt.kind).toBe("compare");
    expect(prompt.suppressed).toBe(true);
    expect(prompt.reason).toMatch(/cap is one prompt/);
  });

  it("does not cap the day-0 entry affordance", () => {
    const prompt = triggerFor(
      { addedAt: daysAgo(0), lastPromptAt: daysAgo(0) },
      { comparableCount: 2 },
      now
    );
    expect(prompt.kind).toBe("entry");
    expect(prompt.suppressed).toBe(false);
  });
});
