import type { PinZone } from "./fittingRoom";
import { generateCoachInsights, type CoachInsightsRequest } from "./generateCoachInsights";

const ZONES: PinZone[] = ["bust", "waist", "length", "foot", "overall"];

export function parseCoachInsightsBody(incoming: unknown): CoachInsightsRequest {
  const body = (incoming ?? {}) as {
    itemIds?: unknown;
    peerIds?: unknown;
    zone?: unknown;
    usual?: unknown;
    between?: unknown;
  };
  const zone = typeof body.zone === "string" && ZONES.includes(body.zone as PinZone) ? (body.zone as PinZone) : null;
  return {
    itemIds: Array.isArray(body.itemIds) ? body.itemIds.filter((id): id is string => typeof id === "string") : [],
    peerIds: Array.isArray(body.peerIds) ? body.peerIds.filter((id): id is string => typeof id === "string") : [],
    zone,
    usual: typeof body.usual === "string" ? body.usual : "M",
    between: body.between === true
  };
}

export async function runCoachInsights(
  incoming: unknown,
  env: Record<string, string | undefined> = process.env
) {
  return generateCoachInsights(parseCoachInsightsBody(incoming), env);
}
