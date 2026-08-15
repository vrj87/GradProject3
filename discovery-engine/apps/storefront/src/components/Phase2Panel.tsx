import { useEffect, useState } from "react";

interface MatrixRow {
  opportunityArea: string;
  impactOnW2P: string;
  feasibility: string;
  evidenceStrength: string;
  frequency: string | number;
  metricNode: string;
  rank: string | number;
  status: string;
}

interface Nomination {
  highestPotentialOpportunity: string;
  interviewSegment: string;
  segmentRationale: string;
  explicitlyNotPursuing: string[];
  caveats: string[];
  readyForPhase3: boolean;
  priceFlagged: boolean;
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
        if (!res.ok) throw new Error("Run npm run phase2:rank from the repo root first.");
        return res.json();
      })
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="bg-myntra-bg min-h-[60vh]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-xs font-bold tracking-[0.2em] text-myntra-pink">PHASE 2</p>
        <h2 className="text-2xl font-bold mt-1">Opportunity ranking from live scrape</h2>
        <p className="text-myntra-muted mt-2 text-sm max-w-2xl">
          Scores are copied from Phase 1 files. Empty template rows stay unobserved — not guessed.
        </p>
        {error && <p className="text-myntra-pink mt-4">{error}</p>}
        {data && (
          <>
            <div className="bg-white border border-myntra-border p-5 my-6">
              <div className="text-xs text-myntra-muted">Nomination for Phase 3 interviews</div>
              <p className="font-bold text-lg mt-1">{data.nomination.highestPotentialOpportunity}</p>
              <p className="text-sm mt-2">
                <b>Segment:</b> {data.nomination.interviewSegment}
              </p>
              <p className="text-sm text-myntra-muted mt-1">{data.nomination.segmentRationale}</p>
              <p className="text-sm mt-3">
                <b>Not pursuing:</b> {data.nomination.explicitlyNotPursuing.join(" · ")}
              </p>
              {data.nomination.caveats.map((caveat) => (
                <p key={caveat} className="text-sm text-myntra-gold mt-2">
                  {caveat}
                </p>
              ))}
              <p className="text-xs mt-3">
                readyForPhase3: {data.nomination.readyForPhase3 ? "yes" : "no"}
                {data.nomination.priceFlagged ? " · price theme was #1 (flagged)" : ""}
              </p>
            </div>
            <div className="overflow-x-auto bg-white border border-myntra-border">
              <table className="w-full text-sm">
                <thead className="bg-myntra-bg text-left">
                  <tr>
                    <th className="p-3">Opportunity</th>
                    <th>Impact</th>
                    <th>Feasibility</th>
                    <th>Evidence</th>
                    <th>Freq</th>
                    <th>Node</th>
                    <th>Rank</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.matrix.map((row) => (
                    <tr key={row.opportunityArea} className="border-t border-myntra-border">
                      <td className="p-3">{row.opportunityArea}</td>
                      <td>{row.impactOnW2P}</td>
                      <td>{row.feasibility}</td>
                      <td>{row.evidenceStrength}</td>
                      <td>{row.frequency}</td>
                      <td>{row.metricNode}</td>
                      <td>{row.rank}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
