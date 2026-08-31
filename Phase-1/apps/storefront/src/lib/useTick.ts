import { useEffect, useState } from "react";

/** Re-renders on an interval so the demo courier countdowns stay live. */
export function useTick(ms = 1000, active = true): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(new Date()), ms);
    return () => window.clearInterval(id);
  }, [ms, active]);

  return now;
}
