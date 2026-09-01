import { pct } from "./format";
import type { CoachEventType } from "./events";

/**
 * 5d funnel. Two things matter here beyond arithmetic.
 *
 * 1. Every rate divides through `pct`, which returns 0 for an empty
 *    denominator, so an empty database renders instead of throwing.
 * 2. Phase 4 locked "a deliberate drop is a completed decision". Removals are
 *    counted as decisions, not as churn, otherwise the metric would reward
 *    pressure — which is the failure mode the whole lock is trying to avoid.
 */

export interface EventRow {
  userId: string;
  wishlistItemId?: string | null;
  type: string;
  createdAt: Date;
}

export interface ItemRow {
  id: string;
  userId: string;
  addedAt: Date;
  cartAddedAt?: Date | null;
  purchasedAt?: Date | null;
  removedAt?: Date | null;
}

export interface FunnelInput {
  eligibleUserIds: string[];
  items: ItemRow[];
  events: EventRow[];
}

export interface Funnel {
  eligibleUsers: number;
  coachEngaged: number;
  uncertaintyResolved: number;
  cartAddSimulated: number;
  rates: {
    engagementRate: number;
    resolutionRate: number;
    cartAddRate: number;
    compareCompletionRate: number;
    shortlistToDecisionRate: number;
    removalShareOfDecisions: number;
    w2pProxyRate: number;
  };
  decisions: {
    eligibleItems: number;
    completed: number;
    cartAdded: number;
    purchased: number;
    dropped: number;
    open: number;
  };
  timeToFirstRevisitDays: number | null;
  eventCounts: Array<{ type: string; count: number; metric: string | null }>;
  labels: Record<string, string>;
}

function usersWith(events: EventRow[], type: CoachEventType, within: Set<string>): number {
  const seen = new Set<string>();
  for (const event of events) {
    if (event.type === type && within.has(event.userId)) seen.add(event.userId);
  }
  return seen.size;
}

export function buildFunnel(input: FunnelInput, metricLabels: Record<string, string> = {}): Funnel {
  const eligible = new Set(input.eligibleUserIds);
  const items = input.items.filter((item) => eligible.has(item.userId));

  const coachEngaged = usersWith(input.events, "coach_opened", eligible);
  const uncertaintyResolved = usersWith(input.events, "uncertainty_resolved", eligible);
  const cartAddSimulated = usersWith(input.events, "cart_add_simulated", eligible);

  const compareStarts = input.events.filter((event) => event.type === "compare_started").length;
  const compareCompletions = input.events.filter(
    (event) => event.type === "compare_completed"
  ).length;

  const cartAdded = items.filter((item) => item.cartAddedAt).length;
  const purchased = items.filter((item) => item.purchasedAt).length;
  const dropped = items.filter((item) => item.removedAt).length;
  const completed = items.filter(
    (item) => item.cartAddedAt || item.purchasedAt || item.removedAt
  ).length;

  const revisitDeltas: number[] = [];
  const firstRevisit = new Map<string, Date>();
  for (const event of input.events) {
    if (event.type !== "wishlist_revisit" || !event.wishlistItemId) continue;
    const current = firstRevisit.get(event.wishlistItemId);
    if (!current || event.createdAt < current) firstRevisit.set(event.wishlistItemId, event.createdAt);
  }
  for (const item of items) {
    const revisit = firstRevisit.get(item.id);
    if (!revisit) continue;
    revisitDeltas.push((revisit.getTime() - item.addedAt.getTime()) / (24 * 60 * 60 * 1000));
  }

  const counts = new Map<string, number>();
  for (const event of input.events) {
    counts.set(event.type, (counts.get(event.type) ?? 0) + 1);
  }

  return {
    eligibleUsers: eligible.size,
    coachEngaged,
    uncertaintyResolved,
    cartAddSimulated,
    rates: {
      engagementRate: pct(coachEngaged, eligible.size),
      resolutionRate: pct(uncertaintyResolved, coachEngaged),
      cartAddRate: pct(cartAddSimulated, eligible.size),
      compareCompletionRate: pct(compareCompletions, compareStarts),
      shortlistToDecisionRate: pct(completed, items.length),
      removalShareOfDecisions: pct(dropped, completed),
      w2pProxyRate: pct(purchased, items.length)
    },
    decisions: {
      eligibleItems: items.length,
      completed,
      cartAdded,
      purchased,
      dropped,
      open: items.length - completed
    },
    timeToFirstRevisitDays:
      revisitDeltas.length === 0
        ? null
        : Number((revisitDeltas.reduce((a, b) => a + b, 0) / revisitDeltas.length).toFixed(2)),
    eventCounts: [...counts.entries()]
      .map(([type, count]) => ({ type, count, metric: metricLabels[type] ?? null }))
      .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type)),
    labels: {
      w2pProxyRate:
        "Proxy only. Purchases are simulated in this demo, so this is not a real W2P 30d figure.",
      shortlistToDecisionRate:
        "The locked Phase 4 outcome. Counts a deliberate drop as a completed decision, not a loss.",
      removalShareOfDecisions:
        "Guardrail. A high share is healthy if shoppers are resolving; watch it alongside return rate."
    }
  };
}
