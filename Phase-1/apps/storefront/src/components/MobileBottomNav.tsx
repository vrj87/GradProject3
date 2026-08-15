import { Link, useLocation } from "react-router-dom";
import { useStore } from "../store";

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { wishlist, bag } = useStore();
  const bagCount = bag.reduce((sum, item) => sum + item.qty, 0);

  const items = [
    { to: "/", label: "Home", match: pathname === "/" },
    { to: "/studio", label: "Studio", match: pathname.startsWith("/studio") },
    { to: "/wishlist", label: "Wishlist", match: pathname.startsWith("/wishlist"), count: wishlist.length },
    { to: "/bag", label: "Bag", match: pathname.startsWith("/bag"), count: bagCount },
    { to: "/profile", label: "Profile", match: pathname === "/profile" || pathname === "/orders" }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-myntra-border safe-bottom">
      <div className="grid grid-cols-5 h-14">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`relative flex flex-col items-center justify-center text-[10px] font-bold ${item.match ? "text-myntra-pink" : "text-myntra-muted"}`}
          >
            <span className="text-base leading-none mb-0.5">{icon(item.label)}</span>
            {item.label}
            {item.count ? (
              <span className="absolute top-1 right-[18%] bg-myntra-pink text-white text-[9px] rounded-full min-w-[14px] px-1">
                {item.count}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function icon(label: string) {
  if (label === "Home") return "⌂";
  if (label === "Studio") return "✦";
  if (label === "Wishlist") return "♡";
  if (label === "Bag") return "👜";
  return "👤";
}
