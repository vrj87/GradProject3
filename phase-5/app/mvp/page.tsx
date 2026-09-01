import { ShortlistRoom } from "@/components/ShortlistRoom";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MvpPage({
  searchParams
}: {
  searchParams: Promise<{ user?: string; embed?: string }>;
}) {
  const { user: requested, embed } = await searchParams;
  const embedded = embed === "1";
  let personas: Array<{ id: string; name: string; segmentTags: string }> = [];
  let dbError: string | null = null;

  try {
    personas = await prisma.user.findMany({
      select: { id: true, name: true, segmentTags: true },
      orderBy: { createdAt: "asc" }
    });
  } catch (error) {
    dbError = error instanceof Error ? error.message : String(error);
  }

  if (personas.length === 0) {
    return (
      <div className="card space-y-2 p-6">
        <h1 className="text-xl font-bold">No demo data yet</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Run <code className="rounded bg-[var(--color-canvas)] px-1.5 py-0.5">npm run backend:setup</code>{" "}
          inside <code>phase-5</code> to create and seed the SQLite database.
        </p>
        {dbError && <p className="text-xs text-[var(--color-stop)]">{dbError}</p>}
      </div>
    );
  }

  const initialUserId =
    personas.find((persona) => persona.id === requested)?.id ?? personas[0]!.id;

  return (
    <div className="space-y-6">
      {!embedded && (
        <header className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">Shortlist room</h1>
          <p className="max-w-3xl text-sm text-[var(--color-muted)]">
            Everything saved, in one place, with the three questions that keep a shortlist open: will
            it fit, where would I wear it, and is it worth the price. Buying and dropping both count as
            finishing the decision. Switch shopper to see who the coach is for.
          </p>
        </header>
      )}

      <ShortlistRoom personas={personas} initialUserId={initialUserId} />
    </div>
  );
}
