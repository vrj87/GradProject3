import { useState } from "react";
import { Link } from "react-router-dom";
import { HomeFitInsight } from "../components/HomeFitInsight";
import { ProductCard } from "../components/ProductCard";
import { PRODUCTS, discount } from "../data/products";
import { useStore } from "../store";

const BANNERS = [
  {
    img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&q=80",
    kicker: "Myntra Studio · Live collection",
    title: "Live shopper voices",
    sub: "We collect public App Store and Play Store reviews, keep the ones about fit, and turn them into Fit Insight.",
    to: "/studio",
    cta: "SEE LIVE VOICES"
  },
  {
    img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80",
    kicker: "End Of Season Sale",
    title: "Flat 50–80% off",
    sub: "Wishlist now. Buy when the fit feels right.",
    to: "/shop/women"
  },
  {
    img: "https://images.unsplash.com/photo-1756483510831-34a18c266b93?w=1600&q=80",
    kicker: "Wedding Season",
    title: "Ethnic sets for every function",
    sub: "Save a few, compare fit, then pick one.",
    to: "/shop/women?cat=ethnic"
  },
  {
    img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1600&q=80",
    kicker: "Sneaker Edit",
    title: "White sneakers, side by side",
    sub: "Check size notes before you move to bag.",
    to: "/shop/women?cat=footwear"
  }
];

const CATS = [
  { label: "Studio", to: "/studio", img: "https://images.unsplash.com/photo-1768033976371-0e4ef195dfa2?w=600&q=80", badge: "NEW" },
  { label: "Women", to: "/shop/women", img: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80" },
  { label: "Men", to: "/shop/men", img: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80" },
  { label: "Kids", to: "/shop/kids", img: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&q=80" },
  { label: "Home & Living", to: "/shop/home", img: "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600&q=80" },
  { label: "Beauty", to: "/shop/beauty", img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80" },
  { label: "Ethnic Wear", to: "/shop/women?cat=ethnic", img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80" }
];

export function Home() {
  const [slide, setSlide] = useState(0);
  const { wishlist } = useStore();
  const banner = BANNERS[slide];
  const deals = [...PRODUCTS].sort((a, b) => discount(b) - discount(a)).slice(0, 8);
  const ethnic = PRODUCTS.filter((item) => item.gender === "women" && item.category === "ethnic").slice(0, 8);
  const western = PRODUCTS.filter((item) => item.gender === "women" && item.category === "western").slice(0, 8);
  const sneakers = PRODUCTS.filter((item) => item.cluster.includes("sneaker") || item.cluster.includes("run")).slice(0, 8);
  const men = PRODUCTS.filter((item) => item.gender === "men").slice(0, 8);
  const kids = PRODUCTS.filter((item) => item.gender === "kids").slice(0, 8);
  const home = PRODUCTS.filter((item) => item.gender === "home").slice(0, 8);
  const beauty = PRODUCTS.filter((item) => item.gender === "beauty").slice(0, 8);
  const saved = PRODUCTS.filter((item) => wishlist.includes(item.id)).slice(0, 8);
  const brands = [...new Map(PRODUCTS.map((item) => [item.brand, item])).values()].slice(0, 10);

  return (
    <div className="bg-white">
      <section className="relative h-[220px] sm:h-[320px] md:h-[420px] overflow-hidden">
        <img src={banner.img} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
        <div className="absolute inset-0 flex items-center px-4 sm:px-8 md:px-16">
          <div className="text-white max-w-xl">
            <p className="uppercase tracking-[0.25em] text-[10px] sm:text-[11px]">{banner.kicker}</p>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mt-2 leading-tight">{banner.title}</h1>
            <p className="mt-3 text-white/85 text-sm md:text-base">{banner.sub}</p>
            <Link to={banner.to} className="inline-block mt-5 bg-myntra-pink text-white font-bold px-7 py-2.5 text-sm">
              {banner.cta ?? "SHOP NOW"}
            </Link>
          </div>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {BANNERS.map((item, index) => (
            <button
              key={item.title}
              type="button"
              onClick={() => setSlide(index)}
              className={`h-1.5 rounded-full ${index === slide ? "w-8 bg-white" : "w-3 bg-white/50"}`}
              aria-label={`Banner ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <HomeFitInsight />

      <section className="max-w-[1200px] mx-auto px-4 py-10">
        <h2 className="text-center font-bold tracking-[0.22em] text-myntra-muted text-[14px] mb-6">
          SHOP BY CATEGORY
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
          {CATS.map((cat) => (
            <Link key={cat.label} to={cat.to} className="group">
              <div className="relative aspect-[3/4] overflow-hidden">
                <img src={cat.img} alt="" className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                {"badge" in cat && cat.badge && (
                  <span className="absolute top-2 left-2 bg-myntra-pink text-white text-[9px] font-bold px-1.5 py-0.5">
                    {cat.badge}
                  </span>
                )}
              </div>
              <div className={`mt-2 text-center text-[12px] font-bold ${cat.label === "Studio" ? "text-myntra-pink" : ""}`}>
                {cat.label}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-myntra-bg py-8">
        <div className="max-w-[1200px] mx-auto px-4">
          <h2 className="text-center font-bold tracking-[0.22em] text-myntra-muted text-[14px] mb-6">
            MEDAL-WORTHY BRANDS TO BAG
          </h2>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
            {brands.map((item) => (
              <Link key={item.brand} to={`/shop/${item.gender}?q=${encodeURIComponent(item.brand)}`} className="bg-white p-1 text-center">
                <img src={item.image} alt="" className="h-16 w-full object-cover" />
                <div className="mt-1 text-[10px] font-bold truncate">{item.brand}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {saved.length > 0 && (
        <ProductRow title="FROM YOUR WISHLIST" to="/wishlist" items={saved} />
      )}
      <ProductRow title="DEAL OF THE DAY" to="/shop/women" items={deals} light />
      <ProductRow title="ETHNIC WEAR" to="/shop/women?cat=ethnic" items={ethnic} />
      <ProductRow title="TRENDING IN WESTERN" to="/shop/women?cat=western" items={western} light />
      <ProductRow title="SNEAKERS & SPORTS" to="/shop/women?cat=footwear" items={sneakers} />
      <ProductRow title="TRENDING IN MEN" to="/shop/men" items={men} light />
      <ProductRow title="KIDS' FAVOURITES" to="/shop/kids" items={kids} />
      <ProductRow title="HOME & LIVING" to="/shop/home" items={home} light />
      <ProductRow title="BEAUTY & CARE" to="/shop/beauty" items={beauty} />
    </div>
  );
}

function ProductRow({
  title,
  to,
  items,
  light
}: {
  title: string;
  to: string;
  items: typeof PRODUCTS;
  light?: boolean;
}) {
  return (
    <section className={light ? "bg-myntra-bg py-10" : "py-10"}>
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex justify-between items-end mb-5">
          <h2 className="font-bold tracking-[0.18em] text-myntra-muted text-[14px]">{title}</h2>
          <Link to={to} className="text-myntra-pink text-xs font-bold">
            VIEW ALL
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
