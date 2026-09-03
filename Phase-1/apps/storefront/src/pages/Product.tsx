import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { ProductImage } from "../components/ProductImage";
import { ProductShopperFit } from "../components/ProductShopperFit";
import {
  CATEGORY_LABELS,
  DEPARTMENT_LABELS,
  PRODUCTS,
  formatInr,
  formatRatingCount,
  similarProducts
} from "../data/products";
import { AskCoachLink } from "../components/AskCoachLink";
import { useStore } from "../store";
import { studioRoom } from "../lib/studioFlow";

export function ProductPage() {
  const { id } = useParams();
  const product = PRODUCTS.find((item) => item.id === id);
  const { wishlist, toggleWishlist, addToBag } = useStore();
  const [size, setSize] = useState(product?.sizes[0] ?? "");
  const [added, setAdded] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [pin, setPin] = useState("560001");

  useEffect(() => {
    setSize(product?.sizes[0] ?? "");
    setAdded(false);
    setShowChart(false);
  }, [product?.id, product?.sizes]);

  if (!product) {
    return <p className="p-10">This product is no longer available.</p>;
  }

  const similar = similarProducts(product, 8);
  const saved = wishlist.includes(product.id);
  const apparel = !product.sizes[0]?.includes("UK") && product.sizes[0] !== "OS";

  return (
    <div className="max-w-[1200px] mx-auto px-3 md:px-4 py-4 md:py-6">
      <p className="hidden md:block text-[12px] text-myntra-muted mb-4">
        Home / {DEPARTMENT_LABELS[product.gender]} / {CATEGORY_LABELS[product.category]} / {product.brand}
      </p>
      <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-4 md:gap-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(product.images.length > 1 ? product.images : [product.image, product.image]).map((src, index) => (
            <ProductImage
              key={`${src}-${index}`}
              product={{ ...product, image: src }}
              className="w-full aspect-[3/4] object-cover bg-myntra-bg"
            />
          ))}
        </div>
        <div>
          <h1 className="text-[20px] md:text-[24px] font-bold">{product.brand}</h1>
          <p className="text-myntra-muted text-[16px] md:text-[18px]">{product.name}</p>
          <div className="inline-flex items-center gap-2 border border-myntra-border px-2 py-1 text-[14px] mt-3">
            <b>{product.rating}</b>
            <span className="text-myntra-green">★</span>
            <span className="text-myntra-muted">| {formatRatingCount(product.ratingCount)} Ratings</span>
          </div>
          <div className="border-t border-myntra-border mt-4 pt-4">
            <div className="text-[24px]">
              <b>MRP {formatInr(product.price)}</b>
            </div>
            <p className="text-myntra-green text-[13px] font-bold mt-1">inclusive of all taxes</p>
            <p className="text-myntra-muted text-[12px] mt-1">
              One price, no markdown. This store settles saves with fit, not a discount.
            </p>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <div className="font-bold text-[15px]">SELECT SIZE</div>
              <button
                type="button"
                className="text-myntra-pink text-[13px] font-bold"
                onClick={() => setShowChart((open) => !open)}
              >
                SIZE CHART &gt;
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSize(option)}
                  className={`min-w-[50px] h-[50px] rounded-full border px-3 text-sm font-bold ${size === option ? "border-myntra-pink text-myntra-pink" : "border-[#bfc0c6]"}`}
                >
                  {option}
                </button>
              ))}
            </div>
            {showChart && (
              <div className="mt-3 border border-myntra-border p-3 text-[12px] text-myntra-muted">
                {apparel
                  ? "XS 32 · S 34 · M 36 · L 38 · XL 40 · XXL 42 (chest / bust in inches). Compare with a garment that already fits you."
                  : "UK sizes as marked. If you are between sizes, read the size notes before you order."}
              </div>
            )}
          </div>

          <ProductShopperFit product={product} />
          <AskCoachLink
            product={product}
            className="md:hidden mt-4 block text-center bg-myntra-pink text-white font-bold py-3 text-[13px] tracking-wide"
          />

          <div className="hidden md:flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                addToBag(product.id, size);
                setAdded(true);
              }}
              className="flex-1 bg-myntra-pink text-white font-bold py-3.5 text-[14px] tracking-wide"
            >
              {added ? "ADDED TO BAG" : "ADD TO BAG"}
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              className={`flex-1 border font-bold py-3.5 text-[14px] tracking-wide ${saved ? "border-myntra-pink text-myntra-pink" : "border-[#d4d5d9]"}`}
            >
              {saved ? "WISHLISTED" : "WISHLIST"}
            </button>
          </div>
          <AskCoachLink
            product={product}
            className="hidden md:block mt-3 text-center bg-myntra-pink text-white font-bold py-3.5 text-[14px] tracking-wide"
          />
          {saved && (
            <Link
              to={studioRoom(product.id, "hang")}
              className="hidden md:block mt-3 text-center text-[12px] font-bold text-myntra-pink"
            >
              TRY THIS LOOK IN THE ROOM →
            </Link>
          )}

          <div className="mt-8">
            <h3 className="font-bold text-[15px] mb-2">DELIVERY OPTIONS</h3>
            <div className="flex border border-myntra-border max-w-xs">
              <input
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                className="flex-1 px-3 py-2 text-sm outline-none"
              />
              <span className="text-myntra-pink text-sm font-bold px-3 py-2">Check</span>
            </div>
            <p className="text-[13px] text-myntra-green font-bold mt-2">Get it by Tomorrow</p>
            <p className="text-[12px] text-myntra-muted">14 days return & exchange available</p>
          </div>

          <div className="mt-8 text-[13px] space-y-1.5">
            <h3 className="font-bold text-[15px] mb-2">PRODUCT DETAILS</h3>
            <p>{product.description}</p>
            <p>Fit: {product.fit}</p>
            <p>Material: {product.material}</p>
            <p>Occasion: {product.occasion}</p>
            <p>Colour: {product.colors.join(", ")}</p>
            <p>Seller: {product.seller}</p>
          </div>

          {product.reviews.length > 0 && (
            <div className="mt-8">
              <h3 className="font-bold text-[15px] mb-3">RATINGS & REVIEWS</h3>
              <div className="space-y-3">
                {product.reviews.map((review) => (
                  <div key={review.name} className="border-b border-myntra-border pb-3 text-[13px]">
                    <div className="flex items-center gap-2">
                      <span className="bg-myntra-green text-white text-[11px] font-bold px-1.5 py-0.5">
                        {review.rating} ★
                      </span>
                      <b>{review.name}</b>
                    </div>
                    <p className="text-[12px] text-myntra-muted mt-1">Size bought: {review.sizeBought}</p>
                    <p className="mt-1.5">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="md:hidden fixed inset-x-0 z-30 bg-white border-t border-myntra-border px-3 py-2 flex gap-2 bottom-14">
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          className={`flex-1 border font-bold py-3 text-[13px] ${saved ? "border-myntra-pink text-myntra-pink" : "border-[#d4d5d9]"}`}
        >
          {saved ? "WISHLISTED" : "WISHLIST"}
        </button>
        <button
          type="button"
          onClick={() => {
            addToBag(product.id, size);
            setAdded(true);
          }}
          className="flex-1 bg-myntra-pink text-white font-bold py-3 text-[13px]"
        >
          {added ? "ADDED TO BAG" : "ADD TO BAG"}
        </button>
      </div>
      <section className="mt-8 md:mt-12 pb-20 md:pb-0">
        <h2 className="font-bold text-[16px] mb-1">SIMILAR PRODUCTS</h2>
        <p className="text-[13px] text-myntra-muted mb-4">
          More like this — save a few if you are still choosing.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {similar.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
