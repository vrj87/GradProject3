import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PRODUCTS } from "../data/products";
import { useStore } from "../store";

const NAV = [
  { label: "Men", to: "/shop/men" },
  { label: "Women", to: "/shop/women" },
  { label: "Kids", to: "/shop/kids" },
  { label: "Home & Living", to: "/shop/home" },
  { label: "Beauty", to: "/shop/beauty" },
  { label: "Studio", to: "/studio" }
];

export function Header() {
  const { wishlist, bag } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  const suggestions = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    return PRODUCTS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.category.includes(q) ||
        item.occasion.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [query]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    setOpen(false);
    setMenu(false);
    navigate(`/shop/women?q=${encodeURIComponent(query)}`);
  }

  const bagCount = bag.reduce((sum, item) => sum + item.qty, 0);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-2 md:gap-6 px-3 md:px-6 h-14 md:h-[80px] max-w-[1400px] mx-auto">
        <button
          type="button"
          className="md:hidden w-10 h-10 text-xl"
          aria-label="Open menu"
          onClick={() => setMenu(true)}
        >
          ☰
        </button>
        <Link to="/" className="shrink-0 font-bold text-[22px] md:text-[28px] tracking-tight text-myntra-pink leading-none">
          Myntra
        </Link>
        <nav className="hidden lg:flex items-center gap-7 text-[14px] font-bold uppercase tracking-wide h-full">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="relative h-full flex items-center border-b-4 border-transparent hover:border-myntra-pink hover:text-myntra-pink"
            >
              {item.label}
              {item.label === "Studio" && (
                <span className="absolute -top-0.5 -right-5 text-[9px] text-[#ff3f6c] font-bold">NEW</span>
              )}
            </Link>
          ))}
        </nav>
        <form onSubmit={onSearch} className="relative flex-1 max-w-xl">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-myntra-muted">
            <SearchIcon />
          </span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search for products, brands and more"
            className="w-full bg-myntra-bg rounded-sm pl-10 pr-3 py-2 md:py-2.5 text-[16px] md:text-sm outline-none"
          />
          {open && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-myntra-border shadow-card z-10 max-h-72 overflow-auto">
              {suggestions.map((item) => (
                <Link
                  key={item.id}
                  to={`/product/${item.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 hover:bg-myntra-bg text-sm"
                >
                  <img src={item.image} alt="" className="w-10 h-12 object-cover" />
                  <span>
                    <b>{item.brand}</b> {item.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </form>
        <div className="hidden md:flex items-center gap-7 text-[12px] font-bold">
          <div className="relative group">
            <Link to="/profile" className="text-center hover:text-myntra-pink block">
              <UserIcon />
              <div className="mt-0.5">Profile</div>
            </Link>
            <div className="hidden group-hover:block absolute right-0 top-full pt-2 z-50">
              <div className="bg-white border border-myntra-border shadow-card w-44 text-[13px] font-normal py-2">
                <Link to="/profile" className="block px-4 py-2 hover:bg-myntra-bg hover:font-bold">Overview</Link>
                <Link to="/orders" className="block px-4 py-2 hover:bg-myntra-bg hover:font-bold">Orders</Link>
                <Link to="/wishlist" className="block px-4 py-2 hover:bg-myntra-bg hover:font-bold">Wishlist</Link>
                <Link to="/bag" className="block px-4 py-2 hover:bg-myntra-bg hover:font-bold">Bag</Link>
                <Link to="/studio" className="block px-4 py-2 hover:bg-myntra-bg hover:font-bold">Studio</Link>
              </div>
            </div>
          </div>
          <Link to="/wishlist" className="text-center hover:text-myntra-pink relative">
            <HeartIcon filled={wishlist.length > 0} />
            <div className="mt-0.5">Wishlist</div>
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-myntra-pink text-white text-[10px] rounded-full min-w-[16px] px-1">
                {wishlist.length}
              </span>
            )}
          </Link>
          <Link to="/bag" className="text-center hover:text-myntra-pink relative">
            <BagIcon />
            <div className="mt-0.5">Bag</div>
            {bagCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-myntra-pink text-white text-[10px] rounded-full min-w-[16px] px-1">
                {bagCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {menu && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMenu(false)}>
          <div
            className="absolute left-0 top-0 bottom-0 w-[80%] max-w-xs bg-white p-5 overflow-auto pt-[max(1.25rem,env(safe-area-inset-top))]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <b className="text-myntra-pink text-xl">Myntra</b>
              <button type="button" className="text-2xl w-10 h-10" onClick={() => setMenu(false)} aria-label="Close menu">
                ×
              </button>
            </div>
            <nav className="flex flex-col text-[15px] font-bold uppercase">
              {NAV.map((item) => (
                <Link key={item.label} to={item.to} onClick={() => setMenu(false)} className="py-3 border-b border-myntra-border">
                  {item.label}
                </Link>
              ))}
              <Link to="/orders" onClick={() => setMenu(false)} className="py-3 border-b border-myntra-border">
                Orders
              </Link>
              <Link to="/profile" onClick={() => setMenu(false)} className="py-3">
                Profile
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="mx-auto" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19c.8-3.2 3.5-5 7-5s6.2 1.8 7 5" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="mx-auto"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M12 20s-7-4.4-9.2-8.2C1 8.6 3.2 5 7 5c2 0 3.3 1 5 3 1.7-2 3-3 5-3 3.8 0 6 3.6 4.2 6.8C19 15.6 12 20 12 20z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg className="mx-auto" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </svg>
  );
}
