import { Link, useLocation } from "react-router-dom";
import { STUDIO_ENTRY, onStudioNavClick } from "../lib/studioFlow";

const LINKS = [
  { label: "Studio", to: STUDIO_ENTRY },
  { label: "Overview", to: "/profile" },
  { label: "Orders", to: "/orders" },
  { label: "Wishlist", to: "/wishlist" },
  { label: "Bag", to: "/bag" }
];

export function AccountNav() {
  const { pathname } = useLocation();

  return (
    <aside className="bg-white border border-myntra-border p-3 md:p-4 text-sm h-fit">
      <div className="hidden md:block font-bold">Account</div>
      <p className="hidden md:block text-myntra-muted text-xs mt-1">Priya · Insider</p>
      <nav className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar text-[13px] md:mt-4">
        {LINKS.map((link) => {
          const path = link.to.split("?")[0];
          const active = pathname === path || (path !== "/" && pathname.startsWith(path));
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={link.label === "Studio" ? onStudioNavClick : undefined}
              className={`shrink-0 px-3 py-2 md:px-2 ${
                active
                  ? "text-myntra-pink font-bold bg-[#fff4f6]"
                  : "[@media(hover:hover)]:hover:text-myntra-pink"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
