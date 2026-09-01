import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { COACH_ORIGIN, coachEmbedSrc } from "../lib/studioFlow";

export function StudioCoach() {
  const [params] = useSearchParams();
  const src = coachEmbedSrc(params.get("user"));
  const [status, setStatus] = useState<"checking" | "up" | "down">("checking");

  useEffect(() => {
    const ac = new AbortController();
    const timer = window.setTimeout(() => ac.abort(), 2500);
    fetch(`${COACH_ORIGIN}/api/health`, { signal: ac.signal })
      .then((res) => setStatus(res.ok ? "up" : "down"))
      .catch(() => setStatus("down"))
      .finally(() => window.clearTimeout(timer));
    return () => {
      ac.abort();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div id="studio-view-coach" className="bg-[#1a1216] min-h-[70vh]">
      {status !== "up" && (
        <div className="max-w-6xl mx-auto px-4 pt-6">
          {status === "checking" ? (
            <p className="text-sm text-white/70">Opening the shortlist coach…</p>
          ) : (
            <div className="bg-white text-myntra-dark p-5">
              <p className="font-bold">Coach is not running on this machine.</p>
              <p className="text-sm text-myntra-muted mt-2">
                From the repo root run{" "}
                <code className="bg-myntra-bg px-1.5 py-0.5 text-[12px]">npm run phase5:dev</code>
                , then reopen this tab. Direct URL:{" "}
                <a className="font-bold text-myntra-pink" href={`${COACH_ORIGIN}/mvp`}>
                  {COACH_ORIGIN}/mvp
                </a>
              </p>
            </div>
          )}
        </div>
      )}
      {status !== "down" && (
        <iframe
          title="Shortlist coach"
          src={src}
          className="w-full min-h-[calc(100dvh-11rem)] border-0 bg-white mt-2"
        />
      )}
    </div>
  );
}
