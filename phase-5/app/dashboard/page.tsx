import { EVENT_METRIC } from "@/lib/events";
import { buildFunnel } from "@/lib/metrics";
import { prisma } from "@/lib/prisma";
import { toSegmentUser } from "@/lib/repo";
import { coachEligibility } from "@/lib/segment";

export const dynamic = "force-dynamic";

function Stat({
  label,
  value,
  suffix,
  note
}: {
  label: string;
  value: string | number;
  suffix?: string;
  note?: string;
}) {
  return (
    <div className="card p-4">
      <p className="label">{label}</p>
      <p className="mt-1 text-2xl font-black">
        {value}
        {suffix ? <span className="text-base font-semibold text-[var(--color-muted)]">{suffix}</span> : null}
      </p>
      {note && <p className="mt-1 text-xs text-[var(--color-muted)]">{note}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const users = await prisma.user.findMany({ include: { wishlistItems: true } });
  const audience = users.map((user) => ({
    id: user.id,
    name: user.name,
    segmentTags: user.segmentTags,
    eligibility: coachEligibility(toSegmentUser(user, user.wishlistItems))
  }));

  const [items, events] = await Promise.all([
    prisma.wishlistItem.findMany(),
    prisma.coachEvent.findMany()
  ]);

  const funnel = buildFunnel(
    {
      eligibleUserIds: audience.filter((entry) => entry.eligibility.eligible).map((entry) => entry.id),
      items: items.map((item) => ({
        id: item.id,
        userId: item.userId,
        addedAt: item.addedAt,
        cartAddedAt: item.cartAddedAt,
        purchasedAt: item.purchasedAt,
        removedAt: item.removedAt
      })),
      events: events.map((event) => ({
        userId: event.userId,
        wishlistItemId: event.wishlistItemId,
        type: event.type,
        createdAt: event.createdAt
      }))
    },
    EVENT_METRIC
  );

  const seeded = events.filter((event) => event.metaJson.includes('"seeded":true')).length;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight">Funnel</h1>
        <p className="max-w-3xl text-sm text-[var(--color-muted)]">
          Leading metrics for the locked outcome. Shortlist-to-decision is the primary number;
          purchase rate is a proxy because purchases are simulated in this demo.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Eligible shoppers" value={funnel.eligibleUsers} note="Pass the Phase 4 segment contract" />
        <Stat label="Opened the coach" value={funnel.coachEngaged} suffix={` · ${funnel.rates.engagementRate}%`} />
        <Stat
          label="Resolved a doubt"
          value={funnel.uncertaintyResolved}
          suffix={` · ${funnel.rates.resolutionRate}%`}
          note="Of those who opened the coach"
        />
        <Stat
          label="Moved to bag"
          value={funnel.cartAddSimulated}
          suffix={` · ${funnel.rates.cartAddRate}%`}
          note="Simulated"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card space-y-3 p-5 lg:col-span-2">
          <p className="label">Decisions on saved items</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              ["Eligible items", funnel.decisions.eligibleItems],
              ["Completed", funnel.decisions.completed],
              ["To bag", funnel.decisions.cartAdded],
              ["Bought", funnel.decisions.purchased],
              ["Dropped", funnel.decisions.dropped]
            ].map(([label, value]) => (
              <div key={String(label)}>
                <p className="text-xs text-[var(--color-muted)]">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-canvas)]">
            <div
              className="h-2 bg-[var(--color-accent)]"
              style={{ width: `${funnel.rates.shortlistToDecisionRate}%` }}
            />
          </div>
          <p className="text-sm">
            <strong>{funnel.rates.shortlistToDecisionRate}%</strong> shortlist-to-decision rate.{" "}
            {funnel.labels.shortlistToDecisionRate}
          </p>
        </div>

        <div className="card space-y-3 p-5">
          <p className="label">Secondary</p>
          <p className="text-sm">
            Compare completion: <strong>{funnel.rates.compareCompletionRate}%</strong>
          </p>
          <p className="text-sm">
            Removal share of decisions: <strong>{funnel.rates.removalShareOfDecisions}%</strong>
          </p>
          <p className="text-sm">
            W2P proxy: <strong>{funnel.rates.w2pProxyRate}%</strong>
          </p>
          <p className="text-sm">
            Time to first revisit:{" "}
            <strong>
              {funnel.timeToFirstRevisitDays === null
                ? "no revisits yet"
                : `${funnel.timeToFirstRevisitDays} days`}
            </strong>
          </p>
          <p className="text-xs text-[var(--color-muted)]">{funnel.labels.w2pProxyRate}</p>
        </div>
      </section>

      <section className="card p-5">
        <p className="label">Audience</p>
        <table className="mt-2 w-full text-sm">
          <tbody>
            {audience.map((entry) => (
              <tr key={entry.id} className="border-t border-[var(--color-line)]">
                <th className="py-2 text-left font-medium">
                  {entry.name}
                  <span className="ml-2 text-xs text-[var(--color-muted)]">{entry.segmentTags}</span>
                </th>
                <td className="py-2">
                  <span
                    className={`chip ${
                      entry.eligibility.eligible
                        ? "bg-[color-mix(in_srgb,var(--color-good)_12%,white)] text-[var(--color-good)]"
                        : "bg-[var(--color-canvas)] text-[var(--color-muted)]"
                    }`}
                  >
                    {entry.eligibility.code}
                  </span>
                </td>
                <td className="py-2 text-right text-xs text-[var(--color-muted)]">
                  {entry.eligibility.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card p-5">
        <p className="label">Events</p>
        <table className="mt-2 w-full text-sm">
          <tbody>
            {funnel.eventCounts.map((row) => (
              <tr key={row.type} className="border-t border-[var(--color-line)]">
                <th className="py-2 text-left font-mono text-xs font-medium">{row.type}</th>
                <td className="py-2 font-semibold">{row.count}</td>
                <td className="py-2 text-right text-xs text-[var(--color-muted)]">{row.metric}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          {seeded} of {events.length} events came from the demo seed. Use the shortlist room to add
          live ones.
        </p>
      </section>
    </div>
  );
}
