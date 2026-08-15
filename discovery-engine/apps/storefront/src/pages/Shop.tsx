import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { PRODUCTS, type Category, type Gender } from "../data/products";

const CATS: Category[] = ["ethnic", "western", "footwear", "accessories"];

export function Shop() {
  const { gender = "women" } = useParams();
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").toLowerCase();
  const initialCat = params.get("cat") as Category | null;
  const [cats, setCats] = useState<Category[]>(initialCat ? [initialCat] : []);
  const [sort, setSort] = useState("recommended");
  const [maxPrice, setMaxPrice] = useState(8000);

  const items = useMemo(() => {
    let list = PRODUCTS.filter((item) => item.gender === (gender as Gender));
    if (q) {
      list = PRODUCTS.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q)
      );
    }
    if (cats.length) list = list.filter((item) => cats.includes(item.category));
    list = list.filter((item) => item.price <= maxPrice);
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [gender, q, cats, sort, maxPrice]);

  function toggleCat(cat: Category) {
    setCats((prev) =>
      prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
      <aside className="hidden md:block w-56 shrink-0 text-sm">
        <h2 className="font-bold uppercase mb-4">Filters</h2>
        <div className="border-t border-myntra-border py-4">
          <div className="font-bold mb-2">CATEGORIES</div>
          {CATS.map((cat) => (
            <label key={cat} className="flex items-center gap-2 py-1 capitalize">
              <input
                type="checkbox"
                checked={cats.includes(cat)}
                onChange={() => toggleCat(cat)}
              />
              {cat}
            </label>
          ))}
        </div>
        <div className="border-t border-myntra-border py-4">
          <div className="font-bold mb-2">PRICE</div>
          <input
            type="range"
            min={400}
            max={8000}
            value={maxPrice}
            onChange={(event) => setMaxPrice(Number(event.target.value))}
            className="w-full accent-myntra-pink"
          />
          <div className="text-myntra-muted">Up to ₹{maxPrice.toLocaleString("en-IN")}</div>
        </div>
      </aside>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-bold capitalize">
            {q ? `Search: ${q}` : `${gender} · ${items.length} items`}
          </h1>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="border border-myntra-border px-3 py-1 text-sm"
          >
            <option value="recommended">Sort: Recommended</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
          </select>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {items.length === 0 && (
          <p className="text-myntra-muted py-16 text-center">No products match these filters.</p>
        )}
      </div>
    </div>
  );
}
