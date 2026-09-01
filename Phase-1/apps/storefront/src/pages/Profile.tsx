import { Link } from "react-router-dom";
import { AccountNav } from "../components/AccountNav";
import { addedDaysAgo } from "../data/demoWishlist";
import { ORDERS } from "../data/orders";
import { PRODUCTS, formatInr } from "../data/products";
import { productForOrder } from "../lib/orderProduct";
import { adaptLegacy, w2pCount } from "../lib/placedOrders";
import { STUDIO_ENTRY } from "../lib/studioFlow";
import { useStore } from "../store";

const CLUSTER_COPY: Record<string, { title: string; wait: string }> = {
  "kurta-set": {
    title: "Festive kurta sets",
    wait: "Bust, length, and which cut to keep"
  },
  "white-sneaker": {
    title: "White sneakers",
    wait: "UK size feels different from brand to brand"
  },
  "midi-dress": {
    title: "Occasion dresses",
    wait: "Length, lining, and sitting comfort"
  },
  saree: {
    title: "Wedding saree",
    wait: "Drape and the unstitched blouse"
  },
  "casual-top": {
    title: "Tops",
    wait: "Length and bust"
  },
  "women-jeans": {
    title: "Jeans",
    wait: "Cut and waist"
  },
  heels: {
    title: "Heels",
    wait: "UK size and how long you can stand"
  }
};

export function Profile() {
  const { wishlist, orders, resetDemoWishlist } = useStore();
  const saved = PRODUCTS.filter((item) => wishlist.includes(item.id));
  const oldestDays = Math.max(0, ...saved.map((item) => addedDaysAgo(item.id) ?? 0));
  const daysLeft = Math.max(0, 30 - oldestDays);

  const groups = Object.entries(
    saved.reduce<Record<string, typeof saved>>((acc, item) => {
      const key = item.cluster;
      acc[key] = acc[key] ? [...acc[key], item] : [item];
      return acc;
    }, {})
  ).sort((a, b) => b[1].length - a[1].length);

  const bought = w2pCount(orders);
  const recentOrders = [...orders, ...ORDERS.map(adaptLegacy)]
    .map((order) => ({ order, product: productForOrder(order) }))
    .slice(0, 6);

  return (
    <div className="bg-myntra-bg min-h-[60vh]">
      <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-[220px_1fr] gap-4">
        <AccountNav />
        <div className="space-y-4">
          <section className="bg-white border border-myntra-border p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-myntra-muted">OVERVIEW</p>
                <h1 className="text-xl font-bold mt-1">Priya Sharma</h1>
                <p className="text-[13px] text-myntra-muted mt-0.5">Bengaluru · Myntra Insider</p>
              </div>
              <div className="text-[12px] text-myntra-muted text-right">
                <p>{ORDERS.length + orders.length} orders in the last year</p>
                {bought > 0 ? (
                  <Link to="/orders" className="font-bold text-myntra-pink">
                    {bought} bought from this shortlist, no coupon →
                  </Link>
                ) : (
                  <p>None from this shortlist yet</p>
                )}
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden bg-[#1a0a10] text-white p-5 md:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#ff3f6c55,transparent_46%)]" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-bold tracking-[0.24em] text-myntra-pink">MYNTRA STUDIO</p>
                <span className="bg-myntra-pink text-white text-[9px] font-bold px-1.5 py-0.5">
                  FIT INSIGHT
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mt-2 leading-tight">
                {saved.length > 0
                  ? `${saved.length} saved looks. Still deciding on fit.`
                  : "Your shortlist is empty."}
              </h2>
              <p className="text-white/75 text-sm mt-2 max-w-xl">
                {saved.length > 0
                  ? `Shoppers like you usually wait on size — not a sale. ${daysLeft} days left in the usual 30-day window to pick one.`
                  : "Restore the demo shortlist to see how shoppers compare similar saves without waiting for a sale."}
              </p>
              <div className="flex flex-wrap gap-3 mt-5">
                <Link to={STUDIO_ENTRY} className="bg-myntra-pink text-white font-bold px-5 py-2.5 text-sm">
                  OPEN STUDIO
                </Link>
                <Link
                  to="/studio?view=why"
                  className="border border-white/40 text-white font-bold px-5 py-2.5 text-sm hover:bg-white/10"
                >
                  WHY THIS ROOM
                </Link>
              </div>
            </div>
          </section>

          {groups.length > 0 && (
            <section className="bg-white border border-myntra-border">
              <div className="px-5 py-3 border-b border-myntra-border flex justify-between items-center">
                <h2 className="font-bold text-sm">Where the shortlist is stuck</h2>
                <Link to="/wishlist" className="text-[12px] font-bold text-myntra-pink">
                  VIEW ALL
                </Link>
              </div>
              <div className="divide-y divide-myntra-border">
                {groups.map(([cluster, items]) => {
                  const copy = CLUSTER_COPY[cluster] ?? {
                    title: items[0]?.name ?? "Saved items",
                    wait: items[0]?.fitNote ?? "Still comparing."
                  };
                  return (
                    <article key={cluster} className="p-5">
                      <div className="flex flex-wrap justify-between gap-2">
                        <div>
                          <h3 className="font-bold">{copy.title}</h3>
                          <p className="text-[12px] text-myntra-muted mt-0.5">
                            {items.length} similar saves · {copy.wait}
                          </p>
                        </div>
                        <Link
                          to={STUDIO_ENTRY}
                          className="text-[11px] font-bold text-myntra-pink self-start"
                        >
                          HANG THESE
                        </Link>
                      </div>
                      <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                        {items.map((item) => {
                          const days = addedDaysAgo(item.id);
                          return (
                            <Link
                              key={item.id}
                              to={`/product/${item.id}`}
                              className="shrink-0 w-[92px]"
                            >
                              <img src={item.image} alt="" className="w-[92px] h-[120px] object-cover" />
                              <div className="text-[11px] font-bold truncate mt-1">{item.brand}</div>
                              {days != null && (
                                <div className="text-[10px] text-myntra-muted">Saved {days}d ago</div>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <section className="bg-white border border-myntra-border">
            <div className="px-5 py-3 border-b border-myntra-border flex justify-between items-center">
              <h2 className="font-bold text-sm">Recent orders</h2>
              <Link to="/orders" className="text-[12px] font-bold text-myntra-pink">
                VIEW ALL
              </Link>
            </div>
            <p className="px-5 pt-3 text-[12px] text-myntra-muted">
              Placed orders stay here, including after they are delivered.
            </p>
            <div className="grid sm:grid-cols-3 gap-3 p-5">
              {recentOrders.map(({ order, product }) => (
                <Link key={order.id} to={`/orders/${order.id}`} className="flex gap-2">
                  <img src={product.image} alt="" className="w-12 h-16 object-cover" />
                  <div className="min-w-0 text-[12px]">
                    <div className="font-bold truncate">{product.brand}</div>
                    <div className="text-myntra-muted truncate">{product.name}</div>
                    <div className="mt-1">{formatInr(product.price)}</div>
                    <div className="text-myntra-muted">{order.status}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <p className="text-[11px] text-myntra-muted px-1">
            Login, OTP, and payments are not part of this demo.{" "}
            <button type="button" className="text-myntra-pink font-bold" onClick={resetDemoWishlist}>
              Restore demo shortlist
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
