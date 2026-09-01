export const COACH_EVENTS = [
  "coach_opened",
  "fit_viewed",
  "style_viewed",
  "value_viewed",
  "compare_started",
  "compare_completed",
  "uncertainty_resolved",
  "cart_add_simulated",
  "wishlist_revisit",
  "item_removed"
] as const;

export type CoachEventType = (typeof COACH_EVENTS)[number];

/** Which leading metric each event feeds (5d table). */
export const EVENT_METRIC: Record<CoachEventType, string> = {
  coach_opened: "Confidence feature engagement",
  fit_viewed: "Feature engagement",
  style_viewed: "Feature engagement",
  value_viewed: "Value confidence engagement",
  compare_started: "Compare starts",
  compare_completed: "Compare completion",
  uncertainty_resolved: "Uncertainty resolution",
  cart_add_simulated: "Wishlist resolution (proxy)",
  wishlist_revisit: "Time-to-first revisit",
  item_removed: "Decision completed by dropping"
};

export function isCoachEvent(value: string): value is CoachEventType {
  return (COACH_EVENTS as readonly string[]).includes(value);
}
