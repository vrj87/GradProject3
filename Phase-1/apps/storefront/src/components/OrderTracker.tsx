import {
  formatOrderDate,
  formatOrderTime,
  trackingSteps,
  type PlacedOrder
} from "../lib/placedOrders";

export function OrderTracker({ order }: { order: PlacedOrder }) {
  const steps = trackingSteps(order);
  const notes = new Map(order.events.map((event) => [event.label, event.note]));

  return (
    <ol className="mt-4">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const cancelled = step.label === "Cancelled";
        return (
          <li key={`${step.label}-${index}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                  cancelled
                    ? "bg-[#f16565]"
                    : step.done
                      ? "bg-myntra-pink"
                      : "border border-myntra-border bg-white"
                }`}
              />
              {!last && (
                <span
                  className={`w-px flex-1 min-h-9 ${step.done ? "bg-myntra-pink" : "bg-myntra-border"}`}
                />
              )}
            </div>
            <div className={`pb-4 ${step.done ? "" : "opacity-50"}`}>
              <p className={`text-[13px] font-bold ${step.current ? "text-myntra-pink" : ""}`}>
                {step.label}
              </p>
              {step.iso ? (
                <p className="text-[11px] text-myntra-muted">
                  {formatOrderDate(step.iso)} · {formatOrderTime(step.iso)}
                </p>
              ) : (
                <p className="text-[11px] text-myntra-muted">
                  {step.due ? `Expected ${formatOrderTime(step.due)}` : "Pending"}
                </p>
              )}
              {notes.get(step.label) && (
                <p className="text-[12px] text-myntra-muted mt-0.5">{notes.get(step.label)}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
