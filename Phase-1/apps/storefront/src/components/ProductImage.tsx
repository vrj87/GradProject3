import type { CSSProperties } from "react";
import { fallbackImage } from "../data/productImages";
import type { Product } from "../data/products";

export function ProductImage({
  product,
  className,
  alt,
  style
}: {
  product: Product;
  className?: string;
  alt?: string;
  style?: CSSProperties;
}) {
  return (
    <img
      src={product.image}
      alt={alt ?? product.name}
      className={className}
      style={style}
      onError={(event) => {
        event.currentTarget.src = fallbackImage(product.gender);
      }}
    />
  );
}
