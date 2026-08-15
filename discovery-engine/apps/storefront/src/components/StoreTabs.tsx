import { Link, useLocation } from "react-router-dom";

export function StoreTabs() {
  const { pathname, search } = useLocation();
  const tab = new URLSearchParams(search).get("tab");
  const insights = pathname === "/" && tab === "insights";
  const ranking = pathname === "/" && tab === "ranking";
  const shop = pathname !== "/" || (!insights && !ranking);

  return (
    <div className="bg-white border-b border-myntra-border sticky top-[108px] z-30">
      <div className="max-w-6xl mx-auto px-4 flex gap-8 text-sm font-bold">
        <Link
          to="/"
          className={`py-3 border-b-2 ${shop ? "border-myntra-pink text-myntra-pink" : "border-transparent text-myntra-muted"}`}
        >
          Shop
        </Link>
        <Link
          to="/?tab=insights"
          className={`py-3 border-b-2 ${insights ? "border-myntra-pink text-myntra-pink" : "border-transparent text-myntra-muted"}`}
        >
          Live Insights
        </Link>
        <Link
          to="/?tab=ranking"
          className={`py-3 border-b-2 ${ranking ? "border-myntra-pink text-myntra-pink" : "border-transparent text-myntra-muted"}`}
        >
          Opportunity ranking
        </Link>
      </div>
    </div>
  );
}
