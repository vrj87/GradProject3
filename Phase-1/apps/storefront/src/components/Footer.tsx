import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-myntra-bg mt-10 text-[13px] text-myntra-muted">
      <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6 py-12">
        <div>
          <h4 className="font-bold text-myntra-dark mb-3 text-[12px] tracking-wide">ONLINE SHOPPING</h4>
          <Link to="/shop/men" className="block py-0.5 hover:text-myntra-dark">Men</Link>
          <Link to="/shop/women" className="block py-0.5 hover:text-myntra-dark">Women</Link>
          <Link to="/shop/kids" className="block py-0.5 hover:text-myntra-dark">Kids</Link>
          <Link to="/shop/home" className="block py-0.5 hover:text-myntra-dark">Home & Living</Link>
          <Link to="/shop/beauty" className="block py-0.5 hover:text-myntra-dark">Beauty</Link>
          <Link to="/studio" className="block py-0.5 hover:text-myntra-dark">Studio</Link>
        </div>
        <div>
          <h4 className="font-bold text-myntra-dark mb-3 text-[12px] tracking-wide">CUSTOMER POLICIES</h4>
          <p className="py-0.5">Contact Us</p>
          <p className="py-0.5">FAQ</p>
          <p className="py-0.5">T&C</p>
          <p className="py-0.5">Terms Of Use</p>
          <Link to="/orders" className="block py-0.5 hover:text-myntra-dark">Orders</Link>
          <p className="py-0.5">Track Orders</p>
          <p className="py-0.5">Shipping</p>
          <p className="py-0.5">Cancellation</p>
          <p className="py-0.5">Returns</p>
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
