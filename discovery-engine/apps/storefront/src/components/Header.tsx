import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PRODUCTS } from "../data/products";
import { useStore } from "../store";

const NAV = [
  { label: "Men", to: "/shop/men" },
  { label: "Women", to: "/shop/women" },
  { label: "Kids", to: "/shop/kids" },
  { label: "Home & Living", to: "/shop/women" },
  { label: "Beauty", to: "/shop/women" }
];

export function Header() {
  const { wishlist, bag } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    return PRODUCTS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.category.includes(q)
    ).slice(0, 6);
  }, [query]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    setOpen(false);
    navigate(`/shop/women?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
      <div className="bg-myntra-bg text-[11px] text-myntra-muted px-6 py-1 flex justify-end gap-5">
        <span>Offers</span>
        <span>Gift Cards</span>
        <span>Myntra Insider</span>
      </div>
      <div className="flex items-center gap-6 px-6 h-[80px]">
        <Link to="/" className="shrink-0 font-bold text-[28px] tracking-tight text-myntra-pink">
          Myntra
        </Link>
        <nav className="hidden lg:flex items-center gap-6 text-[14px] font-bold uppercase tracking-wide">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="hover:text-myntra-pink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form onSubmit={onSearch} className="relative flex-1 max-w-xl">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search for products, brands and more"
            className="w-full bg-myntra-bg rounded-sm px-4 py-2.5 text-sm outline-none"
          />
          {open && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-myntra-border shadow-card">
              {suggestions.map((item) => (
                <Link
                  key={item.id}
                  to={`/product/${item.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-myntra-bg text-sm"
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
        <div className="flex items-center gap-6 text-[12px] font-bold">
          <Link to="/profile" className="text-center hover:text-myntra-pink">
            <div className="text-lg leading-none">👤</div>
            Profile
          </Link>
          <Link to="/wishlist" className="text-center hover:text-myntra-pink relative">
            <div className="text-lg leading-none">♡</div>
            Wishlist
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-myntra-pink text-white text-[10px] rounded-full px-1.5">
                {wishlist.length}
              </span>
            )}
          </Link>
          <Link to="/bag" className="text-center hover:text-myntra-pink relative">
            <div className="text-lg leading-none">👜</div>
            Bag
            {bag.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-myntra-pink text-white text-[10px] rounded-full px-1.5">
                {bag.reduce((sum, item) => sum + item.qty, 0)}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
