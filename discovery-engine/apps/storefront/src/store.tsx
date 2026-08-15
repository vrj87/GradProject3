import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
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
  addToBag: (id: string, size: string) => void;
  updateQty: (id: string, size: string, qty: number) => void;
  removeFromBag: (id: string, size: string) => void;
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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>(() =>
    load("myntra-wishlist", [])
  );
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
          localStorage.setItem("myntra-wishlist", JSON.stringify(next));
          return next;
        });
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
