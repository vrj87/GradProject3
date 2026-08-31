import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { DEMO_WISHLIST_IDS, DEMO_WISHLIST_SEED } from "./data/demoWishlist";
import { PRODUCTS, type Product } from "./data/products";
import {
  advanceOrder,
  buildOrders,
  cancelOrder,
  catchUpOrders,
  requestExchange,
  requestReturn,
  type PaymentMethod,
  type PlacedOrder
} from "./lib/placedOrders";

export interface BagItem {
  productId: string;
  size: string;
  qty: number;
  fromWishlist?: boolean;
}

interface Store {
  wishlist: string[];
  bag: BagItem[];
  orders: PlacedOrder[];
  toggleWishlist: (id: string) => void;
  removeFromWishlist: (id: string) => void;
  addToBag: (id: string, size: string, origin?: "wishlist" | "shop") => void;
  updateQty: (id: string, size: string, qty: number) => void;
  removeFromBag: (id: string, size: string) => void;
  moveToWishlist: (id: string, size: string) => void;
  placeOrder: (payment?: PaymentMethod) => PlacedOrder[];
  buyNow: (
    id: string,
    size: string,
    origin?: "wishlist" | "shop",
    payment?: PaymentMethod
  ) => PlacedOrder | null;
  advance: (orderId: string) => void;
  cancel: (orderId: string, reason: string) => void;
  startReturn: (orderId: string, reason: string) => void;
  startExchange: (orderId: string, size: string) => void;
  resetDemoWishlist: () => void;
  product: (id: string) => Product | undefined;
}

const Ctx = createContext<Store | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function persistBag(next: BagItem[]) {
  localStorage.setItem("myntra-bag", JSON.stringify(next));
  return next;
}

function persistOrders(next: PlacedOrder[]) {
  localStorage.setItem("myntra-orders", JSON.stringify(next));
  return next;
}

function persistWishlist(next: string[]) {
  localStorage.setItem("myntra-wishlist", JSON.stringify(next));
  localStorage.setItem("myntra-wishlist-seed", DEMO_WISHLIST_SEED);
  return next;
}

function loadWishlist(): string[] {
  try {
    const seeded = localStorage.getItem("myntra-wishlist-seed");
    if (seeded !== DEMO_WISHLIST_SEED) {
      return persistWishlist(DEMO_WISHLIST_IDS);
    }
    const raw = localStorage.getItem("myntra-wishlist");
    if (!raw) return persistWishlist(DEMO_WISHLIST_IDS);
    const parsed = JSON.parse(raw) as string[];
    return parsed.filter((id) => PRODUCTS.some((item) => item.id === id));
  } catch {
    return persistWishlist(DEMO_WISHLIST_IDS);
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>(() => loadWishlist());
  const [bag, setBag] = useState<BagItem[]>(() => load("myntra-bag", []));
  const [orders, setOrders] = useState<PlacedOrder[]>(() => {
    const stored = load<PlacedOrder[]>("myntra-orders", []);
    const caught = catchUpOrders(stored);
    return caught === stored ? stored : persistOrders(caught);
  });

  // The courier runs itself: every second, and again whenever the tab comes
  // back, orders move to whatever status their schedule has already reached.
  useEffect(() => {
    const tick = () => {
      setOrders((prev) => {
        const next = catchUpOrders(prev);
        return next === prev ? prev : persistOrders(next);
      });
    };

    const id = window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    tick();

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  const value = useMemo<Store>(
    () => ({
      wishlist,
      bag,
      orders,
      product: (id) => PRODUCTS.find((item) => item.id === id),
      toggleWishlist: (id) => {
        setWishlist((prev) => {
          const next = prev.includes(id)
            ? prev.filter((item) => item !== id)
            : [...prev, id];
          return persistWishlist(next);
        });
      },
      resetDemoWishlist: () => {
        setWishlist(persistWishlist(DEMO_WISHLIST_IDS));
      },
      removeFromWishlist: (id) => {
        setWishlist((prev) => persistWishlist(prev.filter((item) => item !== id)));
      },
      addToBag: (id, size, origin = "shop") => {
        setBag((prev) => {
          const existing = prev.find((item) => item.productId === id && item.size === size);
          const next = existing
            ? prev.map((item) =>
                item.productId === id && item.size === size
                  ? {
                      ...item,
                      qty: item.qty + 1,
                      fromWishlist: item.fromWishlist || origin === "wishlist"
                    }
                  : item
              )
            : [...prev, { productId: id, size, qty: 1, fromWishlist: origin === "wishlist" }];
          return persistBag(next);
        });
      },
      updateQty: (id, size, qty) => {
        setBag((prev) =>
          persistBag(
            qty <= 0
              ? prev.filter((item) => !(item.productId === id && item.size === size))
              : prev.map((item) =>
                  item.productId === id && item.size === size ? { ...item, qty } : item
                )
          )
        );
      },
      removeFromBag: (id, size) => {
        setBag((prev) =>
          persistBag(prev.filter((item) => !(item.productId === id && item.size === size)))
        );
      },
      moveToWishlist: (id, size) => {
        setWishlist((prev) => (prev.includes(id) ? prev : persistWishlist([...prev, id])));
        setBag((prev) =>
          persistBag(prev.filter((item) => !(item.productId === id && item.size === size)))
        );
      },
      placeOrder: (payment = "UPI") => {
        const created = buildOrders(bag, new Date(), payment);
        if (!created.length) return [];
        setOrders((prev) => persistOrders([...created, ...prev]));
        setBag(persistBag([]));
        return created;
      },
      /** Straight to an order, skipping the bag — the room can close the loop on its own. */
      buyNow: (id, size, origin = "shop", payment = "UPI") => {
        const [created] = buildOrders(
          [{ productId: id, size, qty: 1, fromWishlist: origin === "wishlist" }],
          new Date(),
          payment
        );
        if (!created) return null;
        setOrders((prev) => persistOrders([created, ...prev]));
        return created;
      },
      advance: (orderId) => {
        setOrders((prev) =>
          persistOrders(prev.map((order) => (order.id === orderId ? advanceOrder(order) : order)))
        );
      },
      cancel: (orderId, reason) => {
        setOrders((prev) =>
          persistOrders(
            prev.map((order) => (order.id === orderId ? cancelOrder(order, reason) : order))
          )
        );
      },
      startReturn: (orderId, reason) => {
        setOrders((prev) =>
          persistOrders(
            prev.map((order) => (order.id === orderId ? requestReturn(order, reason) : order))
          )
        );
      },
      startExchange: (orderId, size) => {
        setOrders((prev) =>
          persistOrders(
            prev.map((order) => (order.id === orderId ? requestExchange(order, size) : order))
          )
        );
      }
    }),
    [wishlist, bag, orders]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("StoreProvider missing");
  return ctx;
}
