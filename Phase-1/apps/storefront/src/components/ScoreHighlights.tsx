import { Link } from "react-router-dom";
import { STUDIO_ENTRY, STUDIO_WHY } from "../lib/studioFlow";

const PILLARS = [
  {
    id: "creativity",
    kicker: "The room",
    title: "One body, two hangers — name the doubt, then keep a look",
    vs: "Instead of recs + a discount",
    points: [
      "A shared silhouette sits between the two garments. Bust, waist, length, or foot is one tap — both looks spotlight that zone.",
      "Keep one hanger. The other falls off. Size is from shopper notes, not % off. Drag a save onto a hanger to swap.",
      "Every item sells at MRP — no markdown, no coupon field anywhere on the path. Sale-waiting takes the look off the rack."
    ],
    to: STUDIO_ENTRY,
    cta: "OPEN THE ROOM →"
  },
  {
    id: "metrics",
    kicker: "Data & metrics",
    title: "W2P only moves if they come back, clear the doubt, pick one, then bag",
    vs: "Instead of sentiment with no formula",
    points: [
      "W2P 30d = buyers of ≥1 wishlist item in 30d ÷ people who saved ≥1 item.",
      "Blocker score = 0.4 × impact + 0.4 × non-monetary feasibility + 0.2 × frequency.",
      "Coupon taps, sale-alert clicks, and bookmark-only saves do not count as a win."
    ],
    to: "/studio?view=focus",
    cta: "SEE THE MATH →"
  },
  {
    id: "clarity",
    kicker: "Clarity of thought",
    title: "Fit is nominated. Interviews can still kill it.",
    vs: "Instead of locking a problem on day one",
    points: [
      "Public voice → ranked opportunities → non-sale bet. Empty cells stay empty.",
      "The questionnaire is the scrape key. We will not invent respondents.",
      "Kill if 4 of 6 talks would buy on a price drop even when size is already clear."
    ],
    to: "/studio?view=next",
    cta: "SEE THE GATES →"
  }
] as const;

export function ScoreHighlights({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="grid sm:grid-cols-3 gap-2">
        {PILLARS.map((pillar) => (
          <Link
            key={pillar.id}
            to={pillar.to}
            className="border border-white/20 bg-white/5 p-3 hover:bg-white/10"
          >
            <p className="text-[10px] font-bold tracking-[0.16em] text-myntra-pink">{pillar.kicker.toUpperCase()}</p>
            <p className="text-[13px] font-bold mt-1 leading-snug">{pillar.title}</p>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-myntra-bg min-h-[60vh]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-[11px] font-bold tracking-[0.18em] text-myntra-pink">WHAT CHANGED IN THIS BET</p>
        <h2 className="text-xl font-bold mt-1">The room, the math, and a problem we have not locked</h2>
        <p className="text-myntra-muted mt-2 text-sm max-w-2xl">
          Generic “recommend it and discount it” is the easy answer and fails the brief. Below is
          what we built instead — and how a save is allowed to become a purchase.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {PILLARS.map((pillar) => (
            <article key={pillar.id} className="bg-white border border-myntra-border p-5 flex flex-col">
              <p className="text-[11px] font-bold tracking-[0.18em] text-myntra-pink">{pillar.kicker.toUpperCase()}</p>
              <p className="text-[11px] text-myntra-muted mt-2">{pillar.vs}</p>
              <h3 className="font-bold text-lg mt-1 leading-snug">{pillar.title}</h3>
              <ul className="text-sm text-myntra-muted mt-3 space-y-2 flex-1">
                {pillar.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <Link to={pillar.to} className="inline-block mt-4 text-[12px] font-bold text-myntra-pink">
                {pillar.cta}
              </Link>
            </article>
          ))}
        </div>

        <div className="bg-white border border-myntra-pink p-5 mt-8">
          <p className="text-[11px] font-bold tracking-[0.18em] text-myntra-pink">IN THE SHOP</p>
          <p className="font-bold text-lg mt-1">The Fitting Room is the shopper ritual — not a coupon tap</p>
          <p className="text-sm text-myntra-muted mt-2 max-w-3xl">
            You do not fill a form, and you do not compare a grid of SKUs. You hang two similar
            saves on one body, name the doubt (bust, length, foot), and keep a single hanger. View
            Transitions keep the winner on the hook. Every look sits at one price — there is no
            markdown to compare. If they would only buy on a discount, the look leaves the hanger.
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <Link to={STUDIO_ENTRY} className="text-[13px] font-bold text-myntra-pink">
              OPEN THE ROOM →
            </Link>
            <Link to="/wishlist" className="text-[13px] font-bold text-myntra-pink">
              OPEN WISHLIST COMPARE →
            </Link>
            <Link to={STUDIO_WHY} className="text-[13px] font-bold text-myntra-pink">
              OPEN METRIC TREE →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
