import { CATALOG } from "@/lib/catalog";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { toProductRecord } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category");

  try {
    const rows = await prisma.product.findMany({
      where: category ? { category } : undefined,
      orderBy: { name: "asc" }
    });
    if (rows.length > 0) {
      return ok({ source: "database", products: rows.map(toProductRecord) });
    }
  } catch {
    // Falls through to the catalog so the endpoint works before any seed.
  }

  const products = category ? CATALOG.filter((item) => item.category === category) : CATALOG;
  return ok({ source: "demo-catalog", products });
}
