import { Link, useLocation } from "react-router-dom";

const LINKS = [
  { label: "Overview", to: "/profile" },
  { label: "Orders", to: "/orders" },
  { label: "Wishlist", to: "/wishlist" },
  { label: "Bag", to: "/bag" },
  { label: "Studio", to: "/studio" }
];

export function AccountNav() {
  const { pathname } = useLocation();

  return (
    <aside className="bg-white border border-myntra-border p-3 md:p-4 text-sm h-fit">
      <div className="hidden md:block font-bold">Account</div>
      <p className="hidden md:block text-myntra-muted text-xs mt-1">Priya · Insider</p>
      <nav className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar text-[13px] md:mt-4">
        {LINKS.map((link) => {
          const active = pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`shrink-0 px-3 py-2 md:px-2 ${active ? "text-myntra-pink font-bold bg-[#fff4f6]" : "hover:text-myntra-pink"}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
