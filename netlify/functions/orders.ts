type Event = { httpMethod?: string; body?: string | null };

function json(status: number, body: unknown) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

/**
 * Production has no shared disk. The browser keeps orders in localStorage;
 * this endpoint only acknowledges the Vite-shaped contract so the UI does not error.
 */
export async function handler(event: Event) {
  const method = event.httpMethod ?? "GET";
  if (method === "OPTIONS") return { statusCode: 204, body: "" };
  if (method === "GET") return json(200, { orders: [] });
  if (method !== "PUT") return json(405, { error: "Method not allowed." });

  let incoming: unknown;
  try {
    incoming = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Body must be JSON." });
  }

  const list = Array.isArray(incoming)
    ? incoming
    : Array.isArray((incoming as { orders?: unknown })?.orders)
      ? (incoming as { orders: unknown[] }).orders
      : null;
  if (!list) return json(400, { error: "Expected an orders array." });
  return json(200, { orders: list });
}
