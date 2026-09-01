import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data as Record<string, unknown>, { status });
}

export function bad(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function fromZod(error: ZodError, status = 400) {
  return NextResponse.json(
    {
      error: "Invalid payload.",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    },
    { status }
  );
}

/**
 * 5e webhook auth. An unset secret means the endpoint is closed rather than
 * open, so a misconfigured deploy fails safe.
 */
export function guardWebhook(request: Request) {
  const expected = process.env.N8N_WEBHOOK_SECRET;
  if (!expected) {
    return bad("Webhook is disabled because N8N_WEBHOOK_SECRET is not set.", 503);
  }
  if (request.headers.get("x-webhook-secret") !== expected) {
    return bad("Bad or missing x-webhook-secret.", 401);
  }
  return null;
}
