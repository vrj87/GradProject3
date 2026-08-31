import { Link, useSearchParams } from "react-router-dom";
import {
  STUDIO_FLOW,
  activateFlowStep,
  hrefForFlowStep,
  type StudioFlowId
} from "../lib/studioFlow";

export function StudioFlow({
  current,
  tone = "dark"
}: {
  current: StudioFlowId;
  tone?: "dark" | "light";
}) {
  const [params] = useSearchParams();
  const item = params.get("item");
  const occ = params.get("occ");
  const pile = params.get("pile");
  const currentIndex = STUDIO_FLOW.findIndex((step) => step.id === current);

  return (
    <ol className="flex w-full overflow-x-auto no-scrollbar items-stretch">
      {STUDIO_FLOW.map((step, index) => {
        const active = index === currentIndex;
        const done = index < currentIndex;
        const href = hrefForFlowStep(step.id, item, { occ, pile });
        const line =
          tone === "dark" ? (done || active ? "bg-myntra-pink" : "bg-white/20") : done || active ? "bg-myntra-pink" : "bg-myntra-border";
        return (
          <li key={step.id} className="flex min-w-[8.5rem] flex-1 items-center">
            <Link
              to={href}
              onClick={() => activateFlowStep(step.id)}
              className="flex items-center gap-2 min-h-[44px] pr-2"
            >
              <span
                className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[12px] font-bold ${
                  active
                    ? "bg-myntra-pink text-white"
                    : done
                      ? "bg-myntra-pink/80 text-white"
                      : tone === "dark"
                        ? "border border-white/35 text-white/80"
                        : "border border-myntra-border text-myntra-muted"
                }`}
              >
                {step.n}
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-[12px] font-bold leading-tight ${
                    active
                      ? tone === "dark"
                        ? "text-white"
                        : "text-myntra-pink"
                      : tone === "dark"
                        ? "text-white/85"
                        : done
                          ? "text-myntra-pink"
                          : "text-myntra-dark"
                  }`}
                >
                  {step.label}
                </span>
                <span
                  className={`hidden sm:block text-[10px] leading-tight mt-0.5 ${
                    tone === "dark" ? "text-white/55" : "text-myntra-muted"
                  }`}
                >
                  {step.hint}
                </span>
              </span>
            </Link>
            {index < STUDIO_FLOW.length - 1 && (
              <span className={`hidden md:block flex-1 h-px mr-2 ${line}`} aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
