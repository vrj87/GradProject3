import { describe, expect, it } from "vitest";
import { ORDERS } from "../../apps/storefront/src/data/orders";
import { addedDaysAgo } from "../../apps/storefront/src/data/demoWishlist";
import { productForOrder } from "../../apps/storefront/src/lib/orderProduct";
import {
  RETURN_WINDOW_DAYS,
  W2P_WINDOW_DAYS,
  adaptLegacy,
  advanceOrder,
  buildOrders,
  canCancel,
  canExchange,
  canReturn,
  cancelOrder,
  countsForW2P,
  eventIso,
  matchesFilter,
  orderBucket,
  DELIVERY_SCHEDULE_MS,
  PICKUP_MS,
  autoTracks,
  catchUpOrder,
  catchUpOrders,
  mergeOrderLists,
  msUntilNextStep,
  nextStepLine,
  requestExchange,
  requestReturn,
  returnWindowLeft,
  trackingSteps,
  w2pCount,
  w2pLine,
  type PlacedOrder
} from "../../apps/storefront/src/lib/placedOrders";

const NOW = new Date("2026-08-31T12:00:00.000Z");

function roomOrder(): PlacedOrder {
  const [order] = buildOrders(
    [{ productId: "w-kurta-1", size: "L", qty: 1, fromWishlist: true }],
    NOW
  );
  if (!order) throw new Error("no order");
  return order;
}

function deliver(order: PlacedOrder, at = NOW): PlacedOrder {
  let next = order;
  while (next.status !== "Delivered") next = advanceOrder(next, at);
  return next;
}

describe("placing the order ends the demo", () => {
  it("turns the bag into orders that keep size, payment, and wishlist origin", () => {
    const created = buildOrders(
      [
        { productId: "w-kurta-1", size: "L", qty: 1, fromWishlist: true },
        { productId: "w-sneaker-1", size: "UK 5", qty: 2 }
      ],
      NOW,
      "Card"
    );
    expect(created).toHaveLength(2);
    expect(created[0]?.size).toBe("L");
    expect(created[0]?.status).toBe("Placed");
    expect(created[0]?.payment).toBe("Card");
    expect(created[0]?.savedDaysAgo).toBe(addedDaysAgo("w-kurta-1"));
    expect(created[1]?.qty).toBe(2);
    expect(created[1]?.fromWishlist).toBe(false);
    expect(new Set(created.map((order) => order.id)).size).toBe(2);
  });

  it("counts a wishlisted purchase inside 30 days, and nothing else", () => {
    const [fromRoom, fromShop] = buildOrders(
      [
        { productId: "w-kurta-1", size: "L", qty: 1, fromWishlist: true },
        { productId: "w-kurta-2", size: "M", qty: 1 }
      ],
      NOW
    );
    expect(countsForW2P(fromRoom!)).toBe(true);
    expect(countsForW2P(fromShop!)).toBe(false);
    expect(w2pCount([fromRoom!, fromShop!])).toBe(1);
    expect(fromRoom!.savedDaysAgo).toBeLessThanOrEqual(W2P_WINDOW_DAYS);
  });

  it("never explains the purchase with a coupon", () => {
    const line = w2pLine(roomOrder());
    expect(line).toContain("W2P 30d counted");
    expect(line).toContain("No coupon");
    expect(line).not.toMatch(/discount|% off|sale/i);
  });

  it("leaves a save outside the window uncounted", () => {
    const stale = { ...roomOrder(), savedDaysAgo: W2P_WINDOW_DAYS + 1 };
    expect(countsForW2P(stale)).toBe(false);
    expect(w2pLine(stale)).toContain("does not count");
  });
});

describe("order lifecycle", () => {
  it("walks placed → delivered one step at a time and logs each event", () => {
    const delivered = deliver(roomOrder());
    expect(delivered.status).toBe("Delivered");
    expect(delivered.events.map((event) => event.label)).toEqual([
      "Order placed",
      "Packed",
      "Shipped",
      "Out for delivery",
      "Delivered"
    ]);
    expect(advanceOrder(delivered, NOW).status).toBe("Delivered");
  });

  it("allows cancel before delivery only, and stops counting W2P after it", () => {
    const order = roomOrder();
    expect(canCancel(order)).toBe(true);
    const cancelled = cancelOrder(order, "Ordered the wrong size", NOW);
    expect(cancelled.status).toBe("Cancelled");
    expect(cancelled.reason).toBe("Ordered the wrong size");
    expect(countsForW2P(cancelled)).toBe(false);
    expect(w2pLine(cancelled)).toContain("never became a purchase");

    const delivered = deliver(order);
    expect(canCancel(delivered)).toBe(false);
    expect(cancelOrder(delivered, "Changed my mind", NOW).status).toBe("Delivered");
  });

  it("opens return and exchange only after delivery, inside the window", () => {
    const order = roomOrder();
    expect(canReturn(order)).toBe(false);
    expect(canExchange(order)).toBe(false);

    const delivered = deliver(order);
    expect(canReturn(delivered, NOW)).toBe(true);
    expect(returnWindowLeft(delivered, NOW)).toBe(RETURN_WINDOW_DAYS);

    const late = new Date(NOW.getTime() + (RETURN_WINDOW_DAYS + 1) * 86_400_000);
    expect(returnWindowLeft(delivered, late)).toBe(0);
    expect(canReturn(delivered, late)).toBe(false);
  });

  it("runs a return to refund and keeps the failed fit call visible", () => {
    const delivered = deliver(roomOrder());
    const requested = requestReturn(delivered, "Fit is wrong — too small", NOW);
    expect(requested.status).toBe("Return requested");
    const returned = advanceOrder(requested, NOW);
    expect(returned.status).toBe("Returned");
    expect(countsForW2P(returned)).toBe(true);
    expect(w2pLine(returned)).toContain("Returned afterwards");
  });

  it("exchanges into a different size only", () => {
    const delivered = deliver(roomOrder());
    expect(requestExchange(delivered, delivered.size, NOW).status).toBe("Delivered");
    const requested = requestExchange(delivered, "XL", NOW);
    expect(requested.status).toBe("Exchange requested");
    expect(requested.exchangeSize).toBe("XL");
    expect(advanceOrder(requested, NOW).status).toBe("Exchanged");
  });

  it("tracks the parcel and stops the trail where it was cancelled", () => {
    const shipped = advanceOrder(advanceOrder(roomOrder(), NOW), NOW);
    const steps = trackingSteps(shipped);
    expect(steps.find((step) => step.current)?.label).toBe("Shipped");
    expect(steps.filter((step) => step.done).map((step) => step.label)).toEqual([
      "Placed",
      "Packed",
      "Shipped"
    ]);

    const cancelled = cancelOrder(shipped, "Delivery is taking too long", NOW);
    const trail = trackingSteps(cancelled).map((step) => step.label);
    expect(trail).toEqual(["Placed", "Packed", "Shipped", "Cancelled"]);
    expect(trail).not.toContain("Delivered");
  });

  it("buckets every status for the orders filter", () => {
    const delivered = deliver(roomOrder());
    expect(orderBucket("Placed")).toBe("Active");
    expect(orderBucket("Out for delivery")).toBe("Active");
    expect(orderBucket("Return requested")).toBe("Returned");
    expect(orderBucket("Exchange requested")).toBe("Exchanged");
    expect(matchesFilter(delivered.status, "Delivered")).toBe(true);
    expect(matchesFilter(delivered.status, "Active")).toBe(false);
    expect(matchesFilter(delivered.status, "All")).toBe(true);
  });

});

describe("the parcel tracks itself", () => {
  const at = (ms: number) => new Date(NOW.getTime() + ms);

  it("holds still until the first hop is due, and says what is coming", () => {
    const order = roomOrder();
    expect(autoTracks(order)).toBe(true);
    expect(msUntilNextStep(order, NOW)).toBe(DELIVERY_SCHEDULE_MS.Packed);
    expect(catchUpOrder(order, NOW)).toBe(order);
    expect(nextStepLine(order, NOW)).toBe("Packed in 8s");
  });

  it("walks the whole way on its own once the clock has passed", () => {
    const delivered = catchUpOrder(roomOrder(), at(60_000));
    expect(delivered.status).toBe("Delivered");
    expect(delivered.events.map((event) => event.label)).toEqual([
      "Order placed",
      "Packed",
      "Shipped",
      "Out for delivery",
      "Delivered"
    ]);
    expect(autoTracks(delivered)).toBe(false);
  });

  it("stamps each hop when it was due, not when the tab caught up", () => {
    const late = catchUpOrder(roomOrder(), at(6 * 3_600_000));
    expect(eventIso(late, "Packed")).toBe(at(DELIVERY_SCHEDULE_MS.Packed!).toISOString());
    expect(eventIso(late, "Delivered")).toBe(at(DELIVERY_SCHEDULE_MS.Delivered!).toISOString());
  });

  it("keeps the order after days have passed — catch-up never deletes it", () => {
    const placed = [roomOrder()];
    const later = catchUpOrders(placed, at(3 * 86_400_000));
    expect(later).toHaveLength(1);
    expect(later[0]?.id).toBe(placed[0]?.id);
    expect(later[0]?.status).toBe("Delivered");
  });

  it("unions two browsers' order lists without dropping either", () => {
    const a = roomOrder();
    const b = {
      ...roomOrder(),
      id: "4412-other-0001",
      productId: "w-sneaker-1",
      placedIso: at(1_000).toISOString()
    };
    const merged = mergeOrderLists([a], [b]);
    expect(merged.map((order) => order.id).sort()).toEqual([a.id, b.id].sort());
  });

  it("only moves one hop at a time as each offset lands", () => {
    expect(catchUpOrder(roomOrder(), at(9_000)).status).toBe("Packed");
    expect(catchUpOrder(roomOrder(), at(21_000)).status).toBe("Shipped");
    expect(catchUpOrder(roomOrder(), at(37_000)).status).toBe("Out for delivery");
  });

  it("never rewinds a manual skip ahead", () => {
    const skipped = advanceOrder(advanceOrder(advanceOrder(roomOrder(), at(1_000)), at(1_000)), at(1_000));
    expect(skipped.status).toBe("Out for delivery");
    expect(catchUpOrder(skipped, at(2_000)).status).toBe("Out for delivery");
    expect(catchUpOrder(skipped, at(60_000)).status).toBe("Delivered");
  });

  it("leaves cancelled, returned, and exchanged orders alone", () => {
    const cancelled = cancelOrder(roomOrder(), "Changed my mind about the look", NOW);
    expect(autoTracks(cancelled)).toBe(false);
    expect(catchUpOrder(cancelled, at(600_000))).toBe(cancelled);
    expect(nextStepLine(cancelled, NOW)).toBeNull();
  });

  it("finishes a return pickup by itself", () => {
    const requested = requestReturn(deliver(roomOrder()), "Fit is wrong — too small", NOW);
    expect(catchUpOrder(requested, at(PICKUP_MS - 1_000)).status).toBe("Return requested");
    expect(catchUpOrder(requested, at(PICKUP_MS)).status).toBe("Returned");
  });

  it("keeps the same array when no order moved, so the UI can skip re-rendering", () => {
    const orders = [roomOrder()];
    expect(catchUpOrders(orders, NOW)).toBe(orders);
    expect(catchUpOrders(orders, at(60_000))).not.toBe(orders);
  });

  it("shows an expected time on steps the parcel has not reached", () => {
    const steps = trackingSteps(roomOrder());
    const packed = steps.find((step) => step.label === "Packed");
    expect(packed?.done).toBe(false);
    expect(packed?.due).toBe(at(DELIVERY_SCHEDULE_MS.Packed!).toISOString());
    expect(steps.find((step) => step.label === "Placed")?.due).toBeNull();
  });
});

describe("legacy orders", () => {
  it("renders past demo orders through the same model without actions", () => {
    const legacy = ORDERS.map(adaptLegacy);
    expect(legacy.every((order) => order.fromWishlist === false)).toBe(true);
    expect(legacy.every((order) => countsForW2P(order) === false)).toBe(true);
    const returned = legacy.find((order) => order.status === "Returned");
    expect(returned).toBeTruthy();
    expect(trackingSteps(returned!).at(-1)?.label).toBe("Returned");
    const cancelled = legacy.find((order) => order.status === "Cancelled");
    expect(trackingSteps(cancelled!).map((step) => step.label)).not.toContain("Delivered");
  });
});

describe("order history display", () => {
  it("keeps a coach snapshot on the order so it still lists without a catalogue SKU", () => {
    const [order] = buildOrders(
      [
        {
          productId: "coach:p-kurta-silk",
          size: "M",
          qty: 1,
          fromWishlist: true,
          snapshot: {
            brand: "Soch",
            name: "Blended Silk Kurta Set",
            image: "https://example.com/silk.jpg",
            price: 4199
          }
        }
      ],
      NOW
    );
    expect(order?.snapshot?.name).toBe("Blended Silk Kurta Set");
    const product = productForOrder(order!);
    expect(product.brand).toBe("Soch");
    expect(product.name).toBe("Blended Silk Kurta Set");
    expect(product.price).toBe(4199);
  });
});

