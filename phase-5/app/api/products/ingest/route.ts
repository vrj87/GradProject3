import { bad, fromZod, ok } from "@/lib/http";
import { IngestError, ingestProduct } from "@/lib/product-ingest";
import { upsertProduct } from "@/lib/repo";
import { IngestRequestSchema } from "@/lib/schemas";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return bad("Body must be JSON.");
  }

  const parsed = IngestRequestSchema.safeParse(payload);
  if (!parsed.success) return fromZod(parsed.error);

  try {
    const result = await ingestProduct(parsed.data);
    await upsertProduct(result.product);
    return ok(result);
  } catch (error) {
    if (error instanceof IngestError) return bad(error.message, error.status);
    if (error instanceof ZodError) return fromZod(error, 422);
    return bad("Ingest failed.", 500);
  }
}
