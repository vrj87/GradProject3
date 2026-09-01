import { daysSince } from "./format";

/**
 * Flow C from 5c: in-app age triggers only. No push, no email, no "your saved
 * item is on sale" — Appendix E flags "coach feels like spam" as a live risk,
 * so the cap is enforced here rather than left to the caller.
 */

export const PROMPT_COOLDOWN_DAYS = 3;

export type TriggerKind = "entry" | "fit-highlight" | "compare" | "decision-prompt";

export interface TriggerItem {
  addedAt: Date;
  lastPromptAt?: Date | null;
}

export interface Trigger {
  kind: TriggerKind | null;
  ageDays: number;
  message: string;
  suppressed: boolean;
  reason: string;
}

export function triggerFor(
  item: TriggerItem,
  context: { comparableCount: number },
  now = new Date()
): Trigger {
  const ageDays = daysSince(item.addedAt, now);

  let kind: TriggerKind | null = null;
  let message = "";

  if (ageDays >= 14) {
    kind = "decision-prompt";
    message = `Saved ${ageDays} days ago and still open. Decide it either way — buying and dropping both count.`;
  } else if (ageDays >= 7 && context.comparableCount >= 2) {
    kind = "compare";
    message = `You have ${context.comparableCount} similar saves. Compare them side by side instead of adding a fourth.`;
  } else if (ageDays >= 3) {
    kind = "fit-highlight";
    message = "Other shoppers have described the fit on this one. Worth two minutes before you decide.";
  } else if (ageDays >= 0) {
    kind = "entry";
    message = "Ask the coach what other shoppers found, whenever you are ready.";
  }

  if (kind === null) {
    return { kind: null, ageDays, message: "", suppressed: true, reason: "Item is not yet saved." };
  }

  // The entry point is a passive affordance, not a prompt, so it is never capped.
  if (kind !== "entry" && item.lastPromptAt) {
    const since = daysSince(item.lastPromptAt, now);
    if (since < PROMPT_COOLDOWN_DAYS) {
      return {
        kind,
        ageDays,
        message,
        suppressed: true,
        reason: `Prompted ${since} day${since === 1 ? "" : "s"} ago; the cap is one prompt per item every ${PROMPT_COOLDOWN_DAYS} days.`
      };
    }
  }

  return { kind, ageDays, message, suppressed: false, reason: `Day ${ageDays} trigger.` };
}
