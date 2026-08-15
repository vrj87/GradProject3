import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import {
  CATS_BY_DEPT,
  CATEGORY_LABELS,
  DEPARTMENT_LABELS,
  PRODUCTS,
  type Category,
  type Gender
} from "../data/products";

export function Shop() {
  const { gender: deptParam = "women" } = useParams();
  const gender = (["men", "women", "kids", "home", "beauty"].includes(deptParam)
    ? deptParam
    : "women") as Gender;
  const availableCats = CATS_BY_DEPT[gender];
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").toLowerCase();
  const initialCat = params.get("cat") as Category | null;
  const [cats, setCats] = useState<Category[]>(initialCat ? [initialCat] : []);
  const [brands, setBrands] = useState<string[]>([]);
  const [sort, setSort] = useState("recommended");
  const [maxPrice, setMaxPrice] = useState(10000);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const brandOptions = useMemo(() => {
    const pool = q
      ? PRODUCTS
      : PRODUCTS.filter((item) => item.gender === (gender as Gender));
    return [...new Set(pool.map((item) => item.brand))].sort();
  }, [gender, q]);

  const items = useMemo(() => {
    let list = PRODUCTS.filter((item) => item.gender === (gender as Gender));
    if (q) {
      list = PRODUCTS.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.occasion.toLowerCase().includes(q) ||
          item.category.includes(q)
      );
    }
    if (cats.length) list = list.filter((item) => cats.includes(item.category));
    if (brands.length) list = list.filter((item) => brands.includes(item.brand));
    list = list.filter((item) => item.price <= maxPrice);
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === "discount") {
      list = [...list].sort((a, b) => b.mrp - b.price - (a.mrp - a.price));
    }
    return list;
  }, [gender, q, cats, brands, sort, maxPrice]);

  const heading = q
    ? `Search results for “${q}”`
    : cats.length === 1
      ? `${DEPARTMENT_LABELS[gender]} ${CATEGORY_LABELS[cats[0]]}`
      : DEPARTMENT_LABELS[gender];

  const filterProps = {
    cats,
    setCats,
    brands,
    setBrands,
    brandOptions,
    maxPrice,
    setMaxPrice
  };

  return (
    <div>
      <div className="max-w-[1400px] mx-auto px-4 pt-3 text-[12px] text-myntra-muted">
        <Link to="/" className="hover:text-myntra-dark">Home</Link>
        {" / "}
        <span>{DEPARTMENT_LABELS[gender]}</span>
        {cats[0] && (
          <>
            {" / "}
            {CATEGORY_LABELS[cats[0]]}
          </>
        )}
      </div>
      <div className="max-w-[1400px] mx-auto px-3 md:px-4 py-3 md:py-4 flex gap-0">
        <aside className="hidden md:block w-[252px] shrink-0 text-[13px] border-r border-myntra-border pr-4">
          <FilterFields {...filterProps} availableCats={availableCats} />
        </aside>
        <div className="flex-1 md:pl-5 min-w-0">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3 border-b border-myntra-border pb-3">
            <h1 className="text-[14px] md:text-[16px] capitalize">
              <b>{heading}</b>
              <span className="text-myntra-muted font-normal"> - {items.length} items</span>
            </h1>
            <div className="flex gap-2 w-full md:w-auto">
              <button
                type="button"
                className="md:hidden flex-1 border border-myntra-border py-2 text-[13px] font-bold"
                onClick={() => setFiltersOpen(true)}
              >
                FILTERS
              </button>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="flex-1 md:flex-none border border-myntra-border px-3 py-2 text-[13px]"
              >
                <option value="recommended">Sort by : Recommended</option>
                <option value="price-asc">Price : Low to High</option>
                <option value="price-desc">Price : High to Low</option>
                <option value="discount">Better Discount</option>
                <option value="rating">Customer Rating</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-6 md:gap-x-4 md:gap-y-8">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {items.length === 0 && (
            <p className="text-myntra-muted py-16 text-center">No products match these filters.</p>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setFiltersOpen(false)}>
          <div
            className="absolute bottom-0 inset-x-0 bg-white max-h-[80vh] overflow-auto p-4 safe-bottom"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <b>FILTERS</b>
              <button type="button" className="text-2xl w-10 h-10" onClick={() => setFiltersOpen(false)}>
                ×
              </button>
            </div>
            <FilterFields {...filterProps} availableCats={availableCats} />
            <button
              type="button"
              className="w-full mt-4 bg-myntra-pink text-white font-bold py-3"
              onClick={() => setFiltersOpen(false)}
            >
              APPLY
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterFields({
  cats,
  setCats,
  brands,
  setBrands,
  brandOptions,
  maxPrice,
  setMaxPrice,
  availableCats
}: {
  cats: Category[];
  setCats: (next: Category[] | ((prev: Category[]) => Category[])) => void;
  brands: string[];
  setBrands: (next: string[] | ((prev: string[]) => string[])) => void;
  brandOptions: string[];
  maxPrice: number;
  setMaxPrice: (value: number) => void;
  availableCats: Category[];
}) {
  return (
    <>
      <div className="font-bold uppercase text-[14px] mb-3">FILTERS</div>
      <div className="border-t border-myntra-border py-4">
        <div className="font-bold mb-2">CATEGORIES</div>
        {availableCats.map((cat) => (
          <label key={cat} className="flex items-center gap-2 py-2 min-h-11">
            <input
              type="checkbox"
              className="accent-myntra-pink w-4 h-4"
              checked={cats.includes(cat)}
              onChange={() =>
                setCats((prev) =>
                  prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
                )
              }
            />
            {CATEGORY_LABELS[cat]}
          </label>
        ))}
      </div>
      <div className="border-t border-myntra-border py-4">
        <div className="font-bold mb-2">BRAND</div>
        <div className="max-h-52 overflow-auto">
          {brandOptions.map((brand) => (
            <label key={brand} className="flex items-center gap-2 py-2 min-h-11">
              <input
                type="checkbox"
                className="accent-myntra-pink w-4 h-4"
                checked={brands.includes(brand)}
                onChange={() =>
                  setBrands((prev) =>
                    prev.includes(brand) ? prev.filter((item) => item !== brand) : [...prev, brand]
                  )
                }
              />
              {brand}
            </label>
          ))}
        </div>
      </div>
      <div className="border-t border-myntra-border py-4">
        <div className="font-bold mb-2">PRICE</div>
        <input
          type="range"
          min={400}
          max={10000}
          value={maxPrice}
          onChange={(event) => setMaxPrice(Number(event.target.value))}
          className="w-full accent-myntra-pink"
        />
        <div className="text-myntra-muted">Rs. 400 to Rs. {maxPrice.toLocaleString("en-IN")}</div>
      </div>
    </>
  );
}
