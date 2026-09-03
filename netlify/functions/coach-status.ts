import { coachLlmStatus } from "../../Phase-1/apps/storefront/src/lib/generateCoachInsights";

type Event = { httpMethod?: string };

function json(status: number, body: unknown) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

export async function handler(event: Event) {
  const method = event.httpMethod ?? "GET";
  if (method === "OPTIONS") return { statusCode: 204, body: "" };
  if (method !== "GET") return json(405, { error: "Method not allowed." });
  return json(200, coachLlmStatus(process.env));
}
