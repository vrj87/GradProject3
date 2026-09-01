import { Link } from "react-router-dom";
import { productForOrder } from "../lib/orderProduct";
import { orderBucket } from "../lib/placedOrders";
import { STUDIO_ENTRY, onStudioNavClick } from "../lib/studioFlow";
import { useStore } from "../store";

function scrollToPageTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
}

export function Footer() {
  const { orders } = useStore();
  const recent = orders.slice(0, 4);
  const inTransit = orders.find((order) => orderBucket(order.status) === "Active");

  return (
    <footer className="bg-myntra-bg mt-10 text-[13px] text-myntra-muted">
      <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6 py-12">
        <div>
          <h4 className="font-bold text-myntra-dark mb-3 text-[12px] tracking-wide">ONLY HERE</h4>
          <Link
            to={STUDIO_ENTRY}
            onClick={onStudioNavClick}
            className="block py-0.5 font-bold text-myntra-pink hover:text-myntra-dark"
          >
            Studio
          </Link>
          <p className="py-0.5 text-[12px]">Save → hang → keep one → see the bet</p>
        </div>
        <div>
          <h4 className="font-bold text-myntra-dark mb-3 text-[12px] tracking-wide">ONLINE SHOPPING</h4>
          <Link to="/shop/men" className="block py-0.5 hover:text-myntra-dark">Men</Link>
          <Link to="/shop/women" className="block py-0.5 hover:text-myntra-dark">Women</Link>
          <Link to="/shop/kids" className="block py-0.5 hover:text-myntra-dark">Kids</Link>
          <Link to="/shop/home" className="block py-0.5 hover:text-myntra-dark">Home & Living</Link>
          <Link to="/shop/beauty" className="block py-0.5 hover:text-myntra-dark">Beauty</Link>
        </div>
        <div>
          <h4 className="font-bold text-myntra-dark mb-3 text-[12px] tracking-wide">CUSTOMER POLICIES</h4>
          <p className="py-0.5">Contact Us</p>
          <p className="py-0.5">FAQ</p>
          <p className="py-0.5">T&C</p>
          <p className="py-0.5">Terms Of Use</p>
          <Link to="/orders" onClick={scrollToPageTop} className="block py-0.5 hover:text-myntra-dark">
            Orders{orders.length > 0 ? ` (${orders.length})` : ""}
          </Link>
          <Link
            to={inTransit ? `/orders/${inTransit.id}` : "/orders"}
            onClick={scrollToPageTop}
            className="block py-0.5 hover:text-myntra-dark"
          >
            Track Orders
          </Link>
          <p className="py-0.5">Shipping</p>
          <p className="py-0.5">Cancellation</p>
          <p className="py-0.5">Returns</p>
          {recent.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-bold text-myntra-dark text-[12px] tracking-wide">YOUR ORDERS</h4>
              {recent.map((order) => {
                const product = productForOrder(order);
                return (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    onClick={scrollToPageTop}
                    className="flex items-center gap-2 py-0.5 hover:text-myntra-dark"
                  >
                    <img src={product.image} alt="" className="w-8 h-10 object-cover shrink-0" />
                    <span className="min-w-0">
                      <span className="block truncate text-myntra-dark font-bold">{product.brand}</span>
                      <span className="block truncate text-[11px]">
                        {order.status} · {product.name}
                      </span>
                    </span>
                  </Link>
                );
              })}
              {orders.length > recent.length && (
                <Link to="/orders" onClick={scrollToPageTop} className="block text-[12px] font-bold text-myntra-pink">
                  View all {orders.length} orders →
                </Link>
              )}
            </div>
          )}
        </div>
        <div>
          <h4 className="font-bold text-myntra-dark mb-3 text-[12px] tracking-wide">EXPERIENCE MYNTRA APP</h4>
          <p>Get it on Google Play and the App Store.</p>
          <h4 className="font-bold text-myntra-dark mt-6 mb-3 text-[12px] tracking-wide">KEEP IN TOUCH</h4>
          <p>Instagram · Facebook · Twitter</p>
        </div>
        <div className="space-y-4 text-myntra-dark">
          <p><b>100% ORIGINAL</b> guarantee for all products at myntra.com</p>
          <p><b>Return within 14 days</b> of receiving your order</p>
        </div>
      </div>
      <div className="border-t border-myntra-border text-center py-4 text-[11px]">
        © 2026 www.myntra.com. All rights reserved.
      </div>
    </footer>
  );
}
