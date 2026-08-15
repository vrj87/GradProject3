import { Link } from "react-router-dom";
import { discount, formatInr, type Product } from "../data/products";
import { useStore } from "../store";

export function ProductCard({ product }: { product: Product }) {
  const { wishlist, toggleWishlist } = useStore();
  const saved = wishlist.includes(product.id);

  return (
    <article className="group relative bg-white">
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-myntra-bg">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-[1.03] transition"
          />
          <div className="absolute bottom-2 left-2 bg-white/90 text-[11px] font-bold px-1.5 py-0.5">
            {product.rating} ★ | {product.ratingCount}
          </div>
        </div>
        <div className="p-2">
          <div className="font-bold text-sm">{product.brand}</div>
          <div className="text-myntra-muted text-sm truncate">{product.name}</div>
          <div className="text-sm mt-1">
            <b>{formatInr(product.price)}</b>{" "}
            <span className="line-through text-myntra-muted text-xs">
              {formatInr(product.mrp)}
            </span>{" "}
            <span className="text-myntra-gold text-xs">({discount(product)}% OFF)</span>
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggleWishlist(product.id)}
        className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow text-lg ${saved ? "text-myntra-pink" : "text-myntra-dark"}`}
        aria-label="Wishlist"
      >
        {saved ? "♥" : "♡"}
      </button>
    </article>
  );
}
