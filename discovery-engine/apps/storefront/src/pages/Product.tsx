import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { PRODUCTS, discount, formatInr } from "../data/products";
import { useStore } from "../store";

export function ProductPage() {
  const { id } = useParams();
  const product = PRODUCTS.find((item) => item.id === id);
  const { wishlist, toggleWishlist, addToBag } = useStore();
  const [size, setSize] = useState(product?.sizes[0] ?? "");
  const [added, setAdded] = useState(false);

  if (!product) {
    return <p className="p-10">Product not found.</p>;
  }

  const similar = PRODUCTS.filter(
    (item) => item.category === product.category && item.id !== product.id
  ).slice(0, 4);
  const saved = wishlist.includes(product.id);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="grid grid-cols-2 gap-3">
          {product.images.map((src) => (
            <img key={src} src={src} alt="" className="w-full aspect-[3/4] object-cover" />
          ))}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{product.brand}</h1>
          <p className="text-myntra-muted text-lg">{product.name}</p>
          <div className="inline-block border border-myntra-border px-2 py-1 text-sm mt-3">
            {product.rating} ★ | {product.ratingCount} Ratings
          </div>
          <div className="mt-4 text-xl">
            <b>{formatInr(product.price)}</b>{" "}
            <span className="line-through text-myntra-muted text-base">
              {formatInr(product.mrp)}
            </span>{" "}
            <span className="text-myntra-gold font-bold">({discount(product)}% OFF)</span>
          </div>
          <p className="text-myntra-green text-sm font-bold mt-1">inclusive of all taxes</p>
          <div className="mt-6">
            <div className="font-bold text-sm mb-2">SELECT SIZE</div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSize(option)}
                  className={`min-w-12 h-12 rounded-full border px-3 ${size === option ? "border-myntra-pink text-myntra-pink" : "border-myntra-border"}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                addToBag(product.id, size);
                setAdded(true);
              }}
              className="flex-1 bg-myntra-pink text-white font-bold py-3"
            >
              {added ? "ADDED TO BAG" : "ADD TO BAG"}
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              className="flex-1 border border-myntra-border font-bold py-3"
            >
              {saved ? "WISHLISTED" : "WISHLIST"}
            </button>
          </div>
          <div className="mt-8 text-sm space-y-2">
            <h3 className="font-bold">PRODUCT DETAILS</h3>
            <p>{product.description}</p>
            <p>Seller: {product.seller}</p>
            <p>Colour: {product.colors.join(", ")}</p>
            <p>14 days return & exchange available</p>
          </div>
          <Link to="/?tab=insights" className="inline-block mt-6 text-myntra-pink text-sm font-bold">
            Why shoppers stall on fit & compare → Live Insights
          </Link>
        </div>
      </div>
      <section className="mt-12">
        <h2 className="font-bold mb-4">SIMILAR PRODUCTS</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {similar.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
