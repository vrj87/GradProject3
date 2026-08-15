import { Link } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { PRODUCTS } from "../data/products";
import { useStore } from "../store";

export function Wishlist() {
  const { wishlist } = useStore();
  const items = PRODUCTS.filter((item) => wishlist.includes(item.id));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">My Wishlist ({items.length} items)</h1>
      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-myntra-muted mb-4">Your wishlist is empty.</p>
          <Link to="/shop/women" className="text-myntra-pink font-bold">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
