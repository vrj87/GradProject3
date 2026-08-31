import { addedDaysAgo } from "../data/demoWishlist";

export const W2P_WINDOW_DAYS = 30;
export const RETURN_WINDOW_DAYS = 14;

export type OrderStatus =
  | "Placed"
  | "Packed"
  | "Shipped"
  | "Out for delivery"
  | "Delivered"
  | "Cancelled"
  | "Return requested"
  | "Returned"
  | "Exchange requested"
  | "Exchanged";

/** Happy path a parcel walks through. Cancel / return / exchange branch off it. */
export const DELIVERY_FLOW: OrderStatus[] = [
  "Placed",
  "Packed",
  "Shipped",
  "Out for delivery",
  "Delivered"
];

export const ORDER_FILTERS = [
  "All",
  "Active",
  "Delivered",
  "Returned",
  "Cancelled",
  "Exchanged"
] as const;

export type OrderFilter = (typeof ORDER_FILTERS)[number];

export const PAYMENT_METHODS = ["UPI", "Card", "Cash on delivery"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const CANCEL_REASONS = [
  "Ordered the wrong size",
  "Changed my mind about the look",
  "Found it cheaper elsewhere",
  "Delivery is taking too long"
] as const;

export const RETURN_REASONS = [
  "Fit is wrong — too small",
  "Fit is wrong — too loose",
  "Length is not what I expected",
  "Quality is not as described",
  "Received a different item"
] as const;

export interface OrderEvent {
  label: string;
  iso: string;
  note?: string;
}

export interface OrderLine {
  productId: string;
  size: string;
  qty: number;
  fromWishlist?: boolean;
}

export interface PlacedOrder {
  id: string;
  productId: string;
  size: string;
  qty: number;
  placedIso: string;
  savedDaysAgo: number | null;
  fromWishlist: boolean;
  status: OrderStatus;
  payment: PaymentMethod;
  events: OrderEvent[];
  reason?: string;
  exchangeSize?: string;
}

export function orderId(now: Date, index: number): string {
  const stamp = now.getTime().toString().slice(-9);
  return `4412-${stamp.slice(0, 6)}-${String(index + 1).padStart(4, "0")}`;
}

export function buildOrders(
  lines: OrderLine[],
  now = new Date(),
  payment: PaymentMethod = "UPI"
): PlacedOrder[] {
  const iso = now.toISOString();
  return lines.map((line, index) => ({
    id: orderId(now, index),
    productId: line.productId,
    size: line.size,
    qty: Math.max(1, line.qty),
    placedIso: iso,
    savedDaysAgo: line.fromWishlist ? addedDaysAgo(line.productId) ?? null : null,
    fromWishlist: Boolean(line.fromWishlist),
    status: "Placed",
    payment,
    events: [
      {
        label: "Order placed",
        iso,
        note: line.fromWishlist
          ? "Decided in the fitting room. No coupon was used."
          : "Bought straight from the shop."
      }
    ]
  }));
}

function withEvent(order: PlacedOrder, event: OrderEvent): PlacedOrder {
  return { ...order, events: [...order.events, event] };
}

export function eventIso(order: PlacedOrder, label: string): string | null {
  return order.events.find((event) => event.label === label)?.iso ?? null;
}

export function isTerminal(order: PlacedOrder): boolean {
  return ["Cancelled", "Returned", "Exchanged"].includes(order.status);
}

/** One "move it along" step, so the demo can reach any state without waiting days. */
export function nextStatus(order: PlacedOrder): OrderStatus | null {
  if (order.status === "Return requested") return "Returned";
  if (order.status === "Exchange requested") return "Exchanged";
  const index = DELIVERY_FLOW.indexOf(order.status);
  if (index < 0 || index === DELIVERY_FLOW.length - 1) return null;
  return DELIVERY_FLOW[index + 1] ?? null;
}

export function canAdvance(order: PlacedOrder): boolean {
  return nextStatus(order) !== null;
}

const ADVANCE_NOTE: Partial<Record<OrderStatus, string>> = {
  Packed: "Seller packed the item.",
  Shipped: "Handed to the courier.",
  "Out for delivery": "Arriving today.",
  Delivered: "Delivered. The return window is open for 14 days.",
  Returned: "Pickup done and refund raised to the original payment method.",
  Exchanged: "Replacement in the new size is on its way."
};

export function advanceOrder(order: PlacedOrder, now = new Date()): PlacedOrder {
  const next = nextStatus(order);
  if (!next) return order;
  return withEvent({ ...order, status: next }, {
    label: next,
    iso: now.toISOString(),
    note: ADVANCE_NOTE[next]
  });
}

/**
 * The demo courier. A real parcel takes days, so the whole journey is compressed
 * into a minute. Every offset is measured from a stored timestamp rather than
 * from a running timer, so a reload — or a visit an hour later — lands on the
 * status the clock had already reached instead of restarting the trip.
 */
export const DELIVERY_SCHEDULE_MS: Partial<Record<OrderStatus, number>> = {
  Packed: 8_000,
  Shipped: 20_000,
  "Out for delivery": 36_000,
  Delivered: 55_000
};

export const PICKUP_MS = 18_000;
export const REPLACEMENT_MS = 26_000;

function shiftIso(iso: string | null, ms: number): string | null {
  if (!iso) return null;
  const base = new Date(iso).getTime();
  if (Number.isNaN(base)) return null;
  return new Date(base + ms).toISOString();
}

/** When the clock intends a given status to land, ignoring where the order is now. */
export function scheduledIso(order: PlacedOrder, status: OrderStatus): string | null {
  if (status === "Returned") return shiftIso(eventIso(order, "Return requested"), PICKUP_MS);
  if (status === "Exchanged") return shiftIso(eventIso(order, "Exchange requested"), REPLACEMENT_MS);
  const offset = DELIVERY_SCHEDULE_MS[status];
  return offset === undefined ? null : shiftIso(order.placedIso, offset);
}

/** True while the courier still owes this order a move. */
export function autoTracks(order: PlacedOrder): boolean {
  return !isTerminal(order) && dueIso(order) !== null;
}

export function dueIso(order: PlacedOrder): string | null {
  if (isTerminal(order)) return null;
  const next = nextStatus(order);
  return next ? scheduledIso(order, next) : null;
}

export function msUntilNextStep(order: PlacedOrder, now = new Date()): number | null {
  const due = dueIso(order);
  if (!due) return null;
  return Math.max(0, new Date(due).getTime() - now.getTime());
}

export function countdown(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${String(seconds % 60).padStart(2, "0")}s`;
}

/** "Shipped in 12s" — the live line the tracking screens read out. */
export function nextStepLine(order: PlacedOrder, now = new Date()): string | null {
  const next = nextStatus(order);
  const left = msUntilNextStep(order, now);
  if (!next || left === null) return null;
  return left === 0 ? `${next} any moment now` : `${next} in ${countdown(left)}`;
}

/**
 * Applies every hop the clock has already passed, stamping each event at the
 * time it was due rather than at `now`, so a late catch-up still reads as a
 * normal delivery timeline. Manual skips stay intact: statuses only move
 * forward, never back.
 */
export function catchUpOrder(order: PlacedOrder, now = new Date()): PlacedOrder {
  let current = order;
  for (let hop = 0; hop <= DELIVERY_FLOW.length; hop += 1) {
    const due = dueIso(current);
    if (!due || new Date(due).getTime() > now.getTime()) return current;
    const moved = advanceOrder(current, new Date(due));
    if (moved === current) return current;
    current = moved;
  }
  return current;
}

/** Returns the same array when nothing moved, so React can skip the re-render. */
export function catchUpOrders(orders: PlacedOrder[], now = new Date()): PlacedOrder[] {
  let changed = false;
  const next = orders.map((order) => {
    const moved = catchUpOrder(order, now);
    if (moved !== order) changed = true;
    return moved;
  });
  return changed ? next : orders;
}

export function canCancel(order: PlacedOrder): boolean {
  return ["Placed", "Packed", "Shipped"].includes(order.status);
}

export function cancelOrder(order: PlacedOrder, reason: string, now = new Date()): PlacedOrder {
  if (!canCancel(order)) return order;
  return withEvent({ ...order, status: "Cancelled", reason }, {
    label: "Cancelled",
    iso: now.toISOString(),
    note: reason
  });
}

export function daysSince(iso: string | null, now = new Date()): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.floor((now.getTime() - then) / 86_400_000));
}

export function returnWindowLeft(order: PlacedOrder, now = new Date()): number {
  const since = daysSince(eventIso(order, "Delivered"), now);
  if (since === null) return 0;
  return Math.max(0, RETURN_WINDOW_DAYS - since);
}

export function canReturn(order: PlacedOrder, now = new Date()): boolean {
  return order.status === "Delivered" && returnWindowLeft(order, now) > 0;
}

export function canExchange(order: PlacedOrder, now = new Date()): boolean {
  return canReturn(order, now);
}

export function requestReturn(order: PlacedOrder, reason: string, now = new Date()): PlacedOrder {
  if (!canReturn(order, now)) return order;
  return withEvent({ ...order, status: "Return requested", reason }, {
    label: "Return requested",
    iso: now.toISOString(),
    note: `${reason} · pickup scheduled`
  });
}

export function requestExchange(order: PlacedOrder, size: string, now = new Date()): PlacedOrder {
  if (!canExchange(order, now) || size === order.size) return order;
  return withEvent({ ...order, status: "Exchange requested", exchangeSize: size }, {
    label: "Exchange requested",
    iso: now.toISOString(),
    note: `Size ${order.size} → ${size}. Same price, no coupon.`
  });
}

export interface TrackStep {
  label: OrderStatus;
  iso: string | null;
  done: boolean;
  current: boolean;
  /** When the courier expects to reach a step it has not reached yet. */
  due: string | null;
}

export function trackingSteps(order: PlacedOrder): TrackStep[] {
  if (order.status === "Cancelled") {
    const upto = order.events
      .map((event) => event.label)
      .filter((label): label is OrderStatus => DELIVERY_FLOW.includes(label as OrderStatus));
    const reached = new Set<OrderStatus>(["Placed", ...upto]);
    return [...DELIVERY_FLOW.filter((step) => reached.has(step)), "Cancelled"].map((label) => ({
      label: label as OrderStatus,
      iso: label === "Cancelled" ? eventIso(order, "Cancelled") : eventIso(order, label),
      done: true,
      current: label === "Cancelled",
      due: null
    }));
  }

  const after: OrderStatus[] =
    order.status === "Return requested" || order.status === "Returned"
      ? ["Return requested", "Returned"]
      : order.status === "Exchange requested" || order.status === "Exchanged"
        ? ["Exchange requested", "Exchanged"]
        : [];

  const steps = [...DELIVERY_FLOW, ...after];
  const activeIndex = steps.indexOf(order.status);
  return steps.map((label, index) => {
    const done = index <= activeIndex;
    return {
      label,
      iso: label === "Placed" ? order.placedIso : eventIso(order, label),
      done,
      current: index === activeIndex,
      due: done ? null : scheduledIso(order, label)
    };
  });
}

/** North star: a wishlisted item purchased inside 30 days. A cancel means no purchase. */
export function countsForW2P(order: PlacedOrder): boolean {
  if (!order.fromWishlist || order.savedDaysAgo === null) return false;
  if (order.status === "Cancelled") return false;
  return order.savedDaysAgo <= W2P_WINDOW_DAYS;
}

export function w2pCount(orders: PlacedOrder[]): number {
  return orders.filter(countsForW2P).length;
}

export function w2pLine(order: PlacedOrder): string {
  if (order.fromWishlist && order.status === "Cancelled") {
    return "Cancelled, so this save never became a purchase. It does not count for W2P 30d.";
  }
  if (!countsForW2P(order)) {
    return "Bought straight from the shop. This one does not count for W2P 30d.";
  }
  const days = order.savedDaysAgo ?? 0;
  const saved = days === 0 ? "saved today" : days === 1 ? "saved 1 day ago" : `saved ${days} days ago`;
  const tail =
    order.status === "Returned"
      ? " Returned afterwards — the fit call was wrong, and we log that against the bet."
      : "";
  return `W2P 30d counted · ${saved}, bought on day ${days} of ${W2P_WINDOW_DAYS}. No coupon was used.${tail}`;
}

export function orderBucket(status: OrderStatus): Exclude<OrderFilter, "All"> {
  if (status === "Cancelled") return "Cancelled";
  if (status === "Returned" || status === "Return requested") return "Returned";
  if (status === "Exchanged" || status === "Exchange requested") return "Exchanged";
  if (status === "Delivered") return "Delivered";
  return "Active";
}

export function matchesFilter(status: OrderStatus, filter: OrderFilter): boolean {
  return filter === "All" || orderBucket(status) === filter;
}

export function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Today";
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function formatOrderTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function arrivesBy(iso: string, days = 3): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "in 3 days";
  date.setDate(date.getDate() + days);
  return formatOrderDate(date.toISOString());
}

export function statusFooter(order: PlacedOrder, now = new Date()): string {
  switch (order.status) {
    case "Delivered": {
      const left = returnWindowLeft(order, now);
      return left > 0
        ? `Delivered · ${left} ${left === 1 ? "day" : "days"} left to return or exchange`
        : "Return window closed";
    }
    case "Cancelled":
      return order.reason ? `Cancelled · ${order.reason}` : "Cancelled";
    case "Return requested":
      return "Pickup scheduled · refund after the item is collected";
    case "Returned":
      return "Refund completed";
    case "Exchange requested":
      return order.exchangeSize
        ? `Exchange for size ${order.exchangeSize} is being arranged`
        : "Exchange is being arranged";
    case "Exchanged":
      return order.exchangeSize
        ? `Replacement delivered in size ${order.exchangeSize}`
        : "Replacement delivered";
    default: {
      const eta = scheduledIso(order, "Delivered");
      return eta
        ? `Tracking itself · delivering around ${formatOrderTime(eta)}`
        : `Arriving by ${arrivesBy(order.placedIso)}`;
    }
  }
}

/** Past demo orders render through the same card and detail view. */
export function adaptLegacy(row: {
  id: string;
  productId: string;
  size: string;
  qty: number;
  status: OrderStatus;
  placedOn: string;
  updatedOn: string;
  payment: string;
}): PlacedOrder {
  const placed = new Date(row.placedOn);
  const updated = new Date(row.updatedOn);
  const placedIso = Number.isNaN(placed.getTime()) ? new Date().toISOString() : placed.toISOString();
  const updatedIso = Number.isNaN(updated.getTime()) ? placedIso : updated.toISOString();
  const payment: PaymentMethod = row.payment === "Card" ? "Card" : "UPI";
  const events: OrderEvent[] = [{ label: "Order placed", iso: placedIso }];
  if (row.status !== "Cancelled") events.push({ label: "Delivered", iso: updatedIso });
  events.push({ label: row.status, iso: updatedIso });

  return {
    id: row.id,
    productId: row.productId,
    size: row.size,
    qty: row.qty,
    placedIso,
    savedDaysAgo: null,
    fromWishlist: false,
    status: row.status,
    payment,
    events
  };
}
