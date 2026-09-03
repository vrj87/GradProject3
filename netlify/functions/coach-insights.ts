import { runCoachInsights } from "../../Phase-1/apps/storefront/src/lib/coachHttp";

type Event = { httpMethod?: string; body?: string | null };

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
  if (method !== "POST") return json(405, { error: "Method not allowed." });

  let incoming: unknown;
  try {
    incoming = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Body must be JSON." });
  }

  const result = await runCoachInsights(incoming, process.env);
  if (result && "error" in result) return json(400, result);
  return json(200, result);
}
