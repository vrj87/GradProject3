import { Link, useSearchParams } from "react-router-dom";
import { InsightsPanel } from "../components/InsightsPanel";
import { Phase2Panel } from "../components/Phase2Panel";
import { ProductCard } from "../components/ProductCard";
import { PRODUCTS } from "../data/products";

const CATS = [
  { label: "Ethnic Wear", to: "/shop/women?cat=ethnic", img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80" },
  { label: "Western Wear", to: "/shop/women?cat=western", img: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&q=80" },
  { label: "Footwear", to: "/shop/men?cat=footwear", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80" },
  { label: "Accessories", to: "/shop/women?cat=accessories", img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80" },
  { label: "Men", to: "/shop/men", img: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80" },
  { label: "Kids", to: "/shop/kids", img: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&q=80" }
];

export function Home() {
  const [params] = useSearchParams();
  const tab = params.get("tab");
  const deals = PRODUCTS.slice(0, 8);
  const ethnic = PRODUCTS.filter((item) => item.category === "ethnic");

  if (tab === "insights") {
    return <InsightsPanel />;
  }
  if (tab === "ranking") {
    return <Phase2Panel />;
  }

  return (
    <div>
      <section className="relative h-[340px] md:h-[420px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80"
          alt="End of Season Sale"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 to-transparent flex items-center px-10">
          <div className="text-white max-w-lg">
            <p className="uppercase tracking-[0.3em] text-xs">Big Fashion Festival</p>
            <h1 className="text-4xl md:text-5xl font-bold mt-2">Wishlist now. Decide with confidence.</h1>
            <p className="mt-3 text-white/80">
              Flat 50–80% on brands · Open Live Insights to see why shoppers stall on fit and compare.
            </p>
            <Link
              to="/shop/women"
              className="inline-block mt-5 bg-myntra-pink text-white font-bold px-6 py-2.5"
            >
              SHOP NOW
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-center font-bold tracking-[0.2em] text-myntra-muted mb-6">
          SHOP BY CATEGORY
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {CATS.map((cat) => (
            <Link key={cat.label} to={cat.to} className="text-center">
              <img src={cat.img} alt="" className="h-28 w-full object-cover rounded-full md:rounded-md" />
              <div className="mt-2 text-xs font-bold">{cat.label}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-myntra-bg py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-bold tracking-[0.2em] text-myntra-muted mb-6">DEALS OF THE DAY</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {deals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex justify-between items-end mb-6">
          <h2 className="font-bold tracking-[0.2em] text-myntra-muted">ETHNIC PICKS</h2>
          <Link to="/shop/women?cat=ethnic" className="text-myntra-pink text-sm font-bold">
            VIEW ALL
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ethnic.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
