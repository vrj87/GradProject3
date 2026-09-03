import { useEffect, useState } from "react";
import { COACH_GENERATE_MS } from "./coachTiming";
import type { CoachLlmStatus } from "./coachLlm";
import type { PinZone } from "./fittingRoom";
import type { CoachInsightsResponse } from "./generateCoachInsights";

export type { CoachInsightsResponse, CoachLlmStatus };

async function postInsights(body: unknown, signal: AbortSignal): Promise<CoachInsightsResponse> {
  const response = await fetch("/api/coach/insights", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal
  });
  const payload = (await response.json()) as CoachInsightsResponse & { error?: string };
  if (!response.ok || payload.error || !payload.looks) {
    throw new Error(payload.error ?? "Coach unavailable.");
  }
  return payload;
}

export function useCoachStatus() {
  const [status, setStatus] = useState<CoachLlmStatus | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/coach/status", { signal: controller.signal })
      .then((response) => response.json() as Promise<CoachLlmStatus>)
      .then((payload) => {
        if (!controller.signal.aborted && payload?.provider) setStatus(payload);
      })
      .catch(() => {
        /* keep null — the insights call still reports the model */
      });
    return () => controller.abort();
  }, []);

  return status;
}

export function useCoachInsights(input: {
  itemIds: string[];
  peerIds?: string[];
  zone?: PinZone | null;
  usual: string;
  between: boolean;
}) {
  const key = `${input.itemIds.join(",")}|${input.peerIds?.join(",") ?? ""}|${input.zone ?? ""}|${input.usual}|${input.between}`;
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<CoachInsightsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setReady(false);
    setData(null);
    setError(null);
    const started = Date.now();

    void (async () => {
      try {
        const payload = await postInsights(
          {
            itemIds: input.itemIds,
            peerIds: input.peerIds,
            zone: input.zone ?? null,
            usual: input.usual,
            between: input.between
          },
          controller.signal
        );
        const wait = Math.max(0, COACH_GENERATE_MS - (Date.now() - started));
        await new Promise((resolve) => window.setTimeout(resolve, wait));
        if (!controller.signal.aborted) {
          setData(payload);
          setReady(true);
        }
      } catch (err) {
        if (controller.signal.aborted || (err instanceof Error && err.name === "AbortError")) return;
        const wait = Math.max(0, COACH_GENERATE_MS - (Date.now() - started));
        await new Promise((resolve) => window.setTimeout(resolve, wait));
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Coach unavailable.");
          setReady(true);
        }
      }
    })();

    return () => controller.abort();
    // key captures the request identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { ready, data, error };
}
