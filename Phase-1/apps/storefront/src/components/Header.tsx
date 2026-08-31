import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PRODUCTS } from "../data/products";
import { matchesShopQuery } from "../lib/decidePiles";
import { STUDIO_ENTRY, onStudioNavClick } from "../lib/studioFlow";
import { useStore } from "../store";

const FEATURES = [{ label: "Studio", to: STUDIO_ENTRY }];

const SHOP_NAV = [
  { label: "Men", to: "/shop/men" },
  { label: "Women", to: "/shop/women" },
  { label: "Kids", to: "/shop/kids" },
  { label: "Home & Living", to: "/shop/home" },
  { label: "Beauty", to: "/shop/beauty" }
];

const PROFILE_LINKS = [
  { label: "Studio", to: STUDIO_ENTRY },
  { label: "Overview", to: "/profile" },
  { label: "Orders", to: "/orders" },
  { label: "Wishlist", to: "/wishlist" },
  { label: "Bag", to: "/bag" }
];

const hoverOnly = "[@media(hover:hover)]:hover:text-myntra-pink";
const hoverNav =
  "[@media(hover:hover)]:hover:border-myntra-pink [@media(hover:hover)]:hover:text-myntra-pink";

export function Header() {
  const { wishlist, bag } = useStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileLock = useRef(false);

  useEffect(() => {
    setMenu(false);
    setOpen(false);
    setProfileOpen(false);
    profileLock.current = true;
    const unlock = window.setTimeout(() => {
      profileLock.current = false;
    }, 400);
    return () => window.clearTimeout(unlock);
  }, [pathname]);

  useEffect(() => {
    if (!profileOpen) return;
    const close = () => setProfileOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [profileOpen]);

  function isActive(to: string) {
    const path = to.split("?")[0];
    return pathname === path || pathname.startsWith(`${path}/`);
  }

  const suggestions = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    return PRODUCTS.filter((item) => matchesShopQuery(item, q)).slice(0, 6);
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
        <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-[13px] lg:text-[14px] font-bold uppercase tracking-wide h-full shrink-0">
          {FEATURES.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={onStudioNavClick}
              className={`relative h-full flex items-center border-b-4 px-0.5 ${
                isActive(item.to)
                  ? "border-myntra-pink text-myntra-pink"
                  : `border-transparent text-myntra-pink ${hoverNav}`
              }`}
            >
              {item.label}
              <span className="ml-1 text-[9px] font-bold normal-case tracking-normal">NEW</span>
            </Link>
          ))}
          {SHOP_NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`relative h-full flex items-center border-b-4 whitespace-nowrap ${
                isActive(item.to)
                  ? "border-myntra-pink text-myntra-pink"
                  : `border-transparent ${hoverNav}`
              }`}
            >
              {item.label}
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
          <div
            className="relative"
            onMouseEnter={() => {
              if (!profileLock.current) setProfileOpen(true);
            }}
            onMouseLeave={() => {
              profileLock.current = false;
              setProfileOpen(false);
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <Link
              to="/profile"
              className={`text-center block ${
                isActive("/profile") || isActive("/orders") ? "text-myntra-pink" : hoverOnly
              }`}
              onClick={() => setProfileOpen(false)}
            >
              <UserIcon />
              <div className="mt-0.5">Profile</div>
            </Link>
            {profileOpen && (
              <div className="absolute right-0 top-full pt-2 z-50">
                <div className="bg-white border border-myntra-border shadow-card w-44 text-[13px] font-normal py-2">
                  {PROFILE_LINKS.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => {
                        setProfileOpen(false);
                        if (link.to.startsWith("/studio")) onStudioNavClick();
                      }}
                      className={`block px-4 py-2 hover:bg-myntra-bg ${
                        isActive(link.to) ? "font-bold text-myntra-pink" : ""
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Link
            to="/wishlist"
            className={`text-center relative ${isActive("/wishlist") ? "text-myntra-pink" : hoverOnly}`}
          >
            <HeartIcon filled={wishlist.length > 0} />
            <div className="mt-0.5">Wishlist</div>
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-myntra-pink text-white text-[10px] rounded-full min-w-[16px] px-1">
                {wishlist.length}
              </span>
            )}
          </Link>
          <Link
            to="/bag"
            className={`text-center relative ${isActive("/bag") ? "text-myntra-pink" : hoverOnly}`}
          >
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
              <p className="text-[11px] tracking-[0.18em] text-myntra-pink mb-1">ONLY HERE</p>
              {FEATURES.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => {
                    setMenu(false);
                    onStudioNavClick();
                  }}
                  className="py-3 border-b border-myntra-border text-myntra-pink flex items-center justify-between"
                >
                  {item.label}
                  <span className="text-[9px] font-bold">NEW</span>
                </Link>
              ))}
              <p className="text-[11px] tracking-[0.18em] text-myntra-muted mt-4 mb-1">SHOP</p>
              {SHOP_NAV.map((item) => (
                <Link key={item.label} to={item.to} onClick={() => setMenu(false)} className="py-3 border-b border-myntra-border">
                  {item.label}
                </Link>
              ))}
              <Link to="/wishlist" onClick={() => setMenu(false)} className="py-3 border-b border-myntra-border">
                Wishlist
              </Link>
              <Link to="/bag" onClick={() => setMenu(false)} className="py-3 border-b border-myntra-border">
                Bag
              </Link>
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
