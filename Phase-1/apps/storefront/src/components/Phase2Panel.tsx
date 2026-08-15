import { useEffect, useState } from "react";
import {
  friendlyImpact,
  friendlySegment,
  friendlyShare,
  friendlyTheme,
  isShopperFacingCaveat
} from "../lib/friendlyLabels";

interface MatrixRow {
  opportunityArea: string;
  impactOnW2P: string;
  frequency: string | number;
  rank: string | number;
  status: string;
}

interface Nomination {
  highestPotentialOpportunity: string;
  interviewSegment: string;
  segmentRationale: string;
  explicitlyNotPursuing: string[];
  caveats: string[];
}

interface Payload {
  matrix: MatrixRow[];
  nomination: Nomination;
}

export function Phase2Panel() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/phase2")
      .then((res) => {
        if (!res.ok) throw new Error("This view is not available right now.");
        return res.json();
      })
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  const seen = data?.matrix.filter((row) => row.status === "filled") ?? [];
  const waiting = data?.matrix.filter((row) => row.status === "unobserved") ?? [];
  const caveats = data?.nomination.caveats.filter(isShopperFacingCaveat) ?? [];

  return (
    <div className="bg-myntra-bg min-h-[60vh]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold">Where shoppers get stuck</h2>
        <p className="text-myntra-muted mt-2 text-sm max-w-2xl">
          Based on live reviews. We only highlight what shoppers actually mentioned.
        </p>
        {error && <p className="text-myntra-pink mt-4">{error}</p>}
        {data && (
          <>
            <div className="bg-white border border-myntra-border p-5 my-6">
              <div className="text-xs text-myntra-muted">Biggest sticking point</div>
              <p className="font-bold text-lg mt-1">
                {friendlyTheme(data.nomination.highestPotentialOpportunity)}
              </p>
              <p className="text-sm mt-2">
                {friendlySegment(data.nomination.interviewSegment)}
              </p>
              <p className="text-sm mt-3 text-myntra-muted">
                We are not using discounts or sale alerts.
              </p>
              {caveats.map((caveat) => (
                <p key={caveat} className="text-sm text-myntra-gold mt-2">
                  {caveat}
                </p>
              ))}
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
                </article>
              ))}
            </div>
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
