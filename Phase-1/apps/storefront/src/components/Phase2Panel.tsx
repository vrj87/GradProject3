import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadPhase2, type Phase2Payload } from "../lib/fetchDiscovery";
import { STUDIO_ENTRY } from "../lib/studioFlow";
import {
  friendlyImpact,
  friendlyScoreRecipe,
  friendlySegment,
  friendlyShare,
  friendlyTheme,
  isShopperFacingCaveat
} from "../lib/friendlyLabels";

const NODE_LABELS: Record<string, string> = {
  revisit: "Come back",
  resolve: "Clear the doubt",
  decide: "Pick one",
  act: "Add to bag"
};

const LEADING = [
  {
    label: "Wishlist reopen rate",
    formula: "Users who open the wishlist within 30 days of a save ÷ users who saved ≥1 item",
    why: "If they never come back, resolve and decide never happen."
  },
  {
    label: "Uncertainty resolution rate",
    formula: "Items where the shopper says the size or occasion doubt is gone ÷ items that had a recorded doubt",
    why: "This is the nominated lever — not a cheaper price."
  },
  {
    label: "Shortlist-to-one rate",
    formula: "Users who narrow 2+ similar saves to one choice in 30 days ÷ users with 2+ similar saves",
    why: "A pile of kurtas is not a decision."
  },
  {
    label: "Wishlist cart-add rate",
    formula: "Wishlist items moved to bag within 30 days ÷ wishlisted items",
    why: "The last step before checkout. Coupon taps do not count."
  }
];

const GUARDRAILS = [
  "Do not count a coupon tap, sale-price click, or price-drop alert as success.",
  "Do not count bookmark-only saves as purchase intent.",
  "Do not hide a missing size behind a sale banner.",
  "Time-to-bag must not get worse while resolution goes up."
];

const KILL = [
  "Kill Fit Insight if 4 of 6 interviews say they would buy the same item as soon as the price drops, even when size is already clear.",
  "Kill the compare prompt if shoppers use it to hunt the deepest discount instead of settling fit or occasion.",
  "Kill the size note if time-to-bag rises after we show “runs small” without a usable size action.",
  "Change the problem if interviews show the shortlist is mostly a sale waitlist, not a fit waitlist."
];

export function Phase2Panel() {
  const [data, setData] = useState<Phase2Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPhase2()
      .then((payload) => {
        if (!payload) throw new Error("This view is not available right now.");
        setData(payload);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const seen = data?.matrix.filter((row) => row.status === "filled") ?? [];
  const waiting = data?.matrix.filter((row) => row.status === "unobserved") ?? [];
  const excluded = data?.matrix.filter((row) => row.status === "excluded") ?? [];
  const caveats = data?.nomination.caveats.filter(isShopperFacingCaveat) ?? [];

  return (
    <div className="bg-myntra-bg min-h-[60vh]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold">Where shoppers get stuck</h2>
        <p className="text-myntra-muted mt-2 text-sm max-w-2xl">
          North star: share of people who buy at least one saved item within 30 days of saving it.
          That only moves if they come back, clear the doubt, pick one, then add to bag.
        </p>
        <div className="grid sm:grid-cols-3 gap-3 mt-5">
          <div className="bg-white border border-myntra-pink p-3">
            <p className="text-[10px] font-bold tracking-[0.16em] text-myntra-pink">THE ROOM</p>
            <p className="text-[13px] font-bold mt-1">Fitting Room — no coupon in the score or the MVP</p>
          </div>
          <div className="bg-white border border-myntra-border p-3">
            <p className="text-[10px] font-bold tracking-[0.16em] text-myntra-pink">METRICS</p>
            <p className="text-[13px] font-bold mt-1">0.4 impact + 0.4 non-sale feasibility + 0.2 frequency</p>
          </div>
          <div className="bg-white border border-myntra-border p-3">
            <p className="text-[10px] font-bold tracking-[0.16em] text-myntra-pink">CLARITY</p>
            <p className="text-[13px] font-bold mt-1">Nominated until interviews confirm or kill</p>
          </div>
        </div>
        {error && <p className="text-myntra-pink mt-4">{error}</p>}
        {data && (
          <>
            <div className="bg-white border border-myntra-border p-5 my-6">
              <div className="text-xs text-myntra-muted">Biggest non-sale sticking point</div>
              <p className="font-bold text-lg mt-1">
                {friendlyTheme(data.nomination.highestPotentialOpportunity)}
              </p>
              <p className="text-sm mt-2">{friendlySegment(data.nomination.interviewSegment)}</p>
              <p className="text-sm mt-3 text-myntra-muted">
                Fit ranks first because it is common, it blocks the buy, and we can help without a
                discount. Sale-waiting is real — we still will not use coupons as the answer.
              </p>
              <Link to={STUDIO_ENTRY} className="inline-block mt-3 text-[12px] font-bold text-myntra-pink">
                OPEN THE ROOM →
              </Link>
              {data.nomination.explicitlyNotPursuing.length > 0 && (
                <p className="text-[12px] mt-3 text-myntra-muted">
                  Not pursuing:{" "}
                  {data.nomination.explicitlyNotPursuing
                    .map((item) => friendlyTheme(item))
                    .join(" · ")}
                </p>
              )}
              {caveats.map((caveat) => (
                <p key={caveat} className="text-sm text-myntra-gold mt-2">
                  {caveat}
                </p>
              ))}
            </div>

            <h3 className="font-bold mb-3">How a save becomes a purchase</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {(data.tree?.nodes ?? []).map((node) => (
                <div key={node.node} className="bg-white border border-myntra-border p-4">
                  <div className="text-xs text-myntra-muted">{NODE_LABELS[node.node] ?? node.node}</div>
                  <div className="font-bold mt-1">{node.covered ? "Seen in reviews" : "Not seen yet"}</div>
                  {node.definition && (
                    <p className="text-[12px] text-myntra-muted mt-2 leading-relaxed">{node.definition}</p>
                  )}
                  {node.labels.length > 0 && (
                    <p className="text-[11px] mt-2">{node.labels.map(friendlyTheme).join(" · ")}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-white border border-myntra-border p-5 mb-8">
              <h3 className="font-bold">North star and how we score a blocker</h3>
            <p className="text-[11px] font-bold tracking-[0.16em] text-myntra-pink mt-1">DATA & METRICS</p>
              <p className="text-sm mt-2">
                <b>W2P 30d</b> = users who buy ≥1 wishlisted item within 30 days of saving it ÷ users
                who saved ≥1 item. No coupon, cashback, or sale alert is allowed to move this number.
              </p>
              <p className="text-sm text-myntra-muted mt-2">
                Blocker score = 0.4 × impact + 0.4 × non-monetary feasibility + 0.2 × frequency,
                where high = 1, medium = 0.6, low = 0.3. Empty cells stay empty. Price-flagged rows
                are ranked, then set aside.
              </p>
              <p className="text-sm text-myntra-muted mt-2">
                Fit is nominated, not locked. Interviews can still kill it.
              </p>
            </div>

            <h3 className="font-bold mb-3">Heard in reviews</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {seen.map((row) => (
                <article key={row.opportunityArea} className="bg-white border border-myntra-border p-4">
                  {typeof row.rank === "number" && (
                    <div className="text-xs font-bold text-myntra-pink">#{row.rank}</div>
                  )}
                  <h4 className="font-bold text-lg mt-1">{friendlyTheme(row.opportunityArea)}</h4>
                  <p className="text-sm text-myntra-muted mt-1">{friendlyImpact(row.impactOnW2P)}</p>
                  <p className="text-sm mt-2">{friendlyShare(row.frequency)}</p>
                  <p className="text-[12px] text-myntra-muted mt-3 leading-relaxed">
                    {friendlyScoreRecipe({
                      score: typeof row.score === "number" ? row.score : undefined,
                      priceFlag: row.status === "excluded",
                      impactOnW2P: row.impactOnW2P,
                      nonMonetaryFeasibility: row.feasibility,
                      estimatedFrequency: typeof row.frequency === "number" ? row.frequency : undefined
                    })}
                  </p>
                </article>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="bg-white border border-myntra-border p-5">
                <h3 className="font-bold mb-2">What we would watch next</h3>
                <ul className="text-sm space-y-3">
                  {LEADING.map((item) => (
                    <li key={item.label}>
                      <b>{item.label}.</b> {item.why}
                      <span className="block text-[12px] text-myntra-muted mt-1">{item.formula}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white border border-myntra-border p-5">
                <h3 className="font-bold mb-2">What would not count as a win</h3>
                <ul className="text-sm space-y-2 text-myntra-muted">
                  {GUARDRAILS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white border border-myntra-border p-5 mb-8">
              <h3 className="font-bold mb-2">When we would kill this direction</h3>
              <ul className="text-sm space-y-2">
                {KILL.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            {excluded.length > 0 && (
              <div className="bg-white border border-myntra-border p-5 mb-4">
                <h3 className="font-bold mb-2">Left out on purpose</h3>
                <p className="text-sm text-myntra-muted">
                  {excluded.map((row) => friendlyTheme(row.opportunityArea)).join(" · ")}
                </p>
              </div>
            )}
            {waiting.length > 0 && (
              <div className="bg-white border border-myntra-border p-5">
                <h3 className="font-bold mb-2">Not enough comments yet</h3>
                <p className="text-sm text-myntra-muted">
                  {waiting.map((row) => friendlyTheme(row.opportunityArea)).join(" · ")}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
