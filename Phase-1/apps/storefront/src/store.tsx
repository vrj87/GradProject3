import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { DEMO_WISHLIST_IDS, DEMO_WISHLIST_SEED } from "./data/demoWishlist";
import { PRODUCTS, type Product } from "./data/products";

export interface BagItem {
  productId: string;
  size: string;
  qty: number;
}

interface Store {
  wishlist: string[];
  bag: BagItem[];
  toggleWishlist: (id: string) => void;
  removeFromWishlist: (id: string) => void;
  addToBag: (id: string, size: string) => void;
  updateQty: (id: string, size: string, qty: number) => void;
  removeFromBag: (id: string, size: string) => void;
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

  const value = useMemo<Store>(
    () => ({
      wishlist,
      bag,
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
      addToBag: (id, size) => {
        setBag((prev) => {
          const existing = prev.find((item) => item.productId === id && item.size === size);
          const next = existing
            ? prev.map((item) =>
                item.productId === id && item.size === size
                  ? { ...item, qty: item.qty + 1 }
                  : item
              )
            : [...prev, { productId: id, size, qty: 1 }];
          localStorage.setItem("myntra-bag", JSON.stringify(next));
          return next;
        });
      },
      updateQty: (id, size, qty) => {
        setBag((prev) => {
          const next =
            qty <= 0
              ? prev.filter((item) => !(item.productId === id && item.size === size))
              : prev.map((item) =>
                  item.productId === id && item.size === size ? { ...item, qty } : item
                );
          localStorage.setItem("myntra-bag", JSON.stringify(next));
          return next;
        });
      },
      removeFromBag: (id, size) => {
        setBag((prev) => {
          const next = prev.filter(
            (item) => !(item.productId === id && item.size === size)
          );
          localStorage.setItem("myntra-bag", JSON.stringify(next));
          return next;
        });
      }
    }),
    [wishlist, bag]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("StoreProvider missing");
  return ctx;
}
