import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PRODUCTS, type Product } from "../data/products";
import { studioAskCoach } from "../lib/studioFlow";

export function AskCoachLink({
  product,
  pool = PRODUCTS,
  className,
  children = "ASK THE COACH"
}: {
  product: Product;
  pool?: Array<{ id: string; cluster: string; gender?: string }>;
  className?: string;
  children?: ReactNode;
}) {
  const href = studioAskCoach(product.id, product.cluster, pool);
  if (!href) return null;
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}
