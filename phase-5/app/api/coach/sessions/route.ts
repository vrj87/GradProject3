import { bad, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const userId = params.get("userId");
  const limit = Math.min(Number(params.get("limit") ?? 20), 100);
  if (!userId) return bad("userId is required.");

  const sessions = await prisma.coachSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit
  });

  return ok({
    sessions: sessions.map((session) => ({
      id: session.id,
      type: session.type,
      wishlistItemId: session.wishlistItemId,
      createdAt: session.createdAt,
      generationMeta: JSON.parse(session.generationMetaJson),
      output: JSON.parse(session.outputJson)
    }))
  });
}
