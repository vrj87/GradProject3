import { Link } from "react-router-dom";
import { AskCoachLink } from "./AskCoachLink";
import { ProductImage } from "./ProductImage";
import { formatInr, formatRatingCount, type Product } from "../data/products";
import { useStore } from "../store";

export function ProductCard({ product }: { product: Product }) {
  const { wishlist, toggleWishlist } = useStore();
  const saved = wishlist.includes(product.id);

  return (
    <article className="group relative bg-white">
      <div className="relative aspect-[3/4] overflow-hidden bg-myntra-bg">
        <Link to={`/product/${product.id}`} className="block h-full">
          <ProductImage
            product={product}
            className="h-full w-full object-cover group-hover:scale-[1.03] transition duration-300"
          />
        </Link>
        {product.badge && (
          <div className="absolute top-2 left-2 bg-white text-[11px] font-bold px-1.5 py-0.5 text-myntra-pink">
            {product.badge}
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-white/95 text-[11px] font-bold px-1.5 py-0.5 rounded-sm group-hover:hidden">
          {product.rating} ★ | {formatRatingCount(product.ratingCount)}
        </div>
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          className="md:hidden absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow text-lg leading-none"
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
        >
          <span className={saved ? "text-myntra-pink" : "text-myntra-dark"}>{saved ? "♥" : "♡"}</span>
        </button>
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          className="hidden md:flex absolute left-2 right-2 bottom-2 items-center justify-center gap-2 bg-white border border-myntra-border py-2 text-[12px] font-bold tracking-wide opacity-0 group-hover:opacity-100 transition"
        >
          <span className={saved ? "text-myntra-pink" : ""}>{saved ? "♥" : "♡"}</span>
          {saved ? "WISHLISTED" : "WISHLIST"}
        </button>
      </div>
      <Link to={`/product/${product.id}`} className="block pt-2.5 px-1">
        <div className="font-bold text-[14px] leading-tight">{product.brand}</div>
        <div className="text-myntra-muted text-[13px] truncate mt-0.5">{product.name}</div>
        <div className="text-[13px] mt-1.5">
          <b>{formatInr(product.price)}</b>
        </div>
      </Link>
      <AskCoachLink
        product={product}
        className="block px-1 pt-1.5 pb-1 text-[11px] font-bold tracking-wide text-myntra-pink"
      />
    </article>
  );
}
