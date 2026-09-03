import { addedDaysAgo } from "../data/demoWishlist";
import { CLUSTER_LABEL } from "../lib/decidePiles";
import { formatInr, type Product } from "../data/products";
import { ProductImage } from "./ProductImage";

export function StudioPairPicker({
  saved,
  selected,
  status,
  onToggle,
  onHang,
  onCompare,
  onAsk,
  onClear
}: {
  saved: Product[];
  selected: string[];
  status: string | null;
  onToggle: (id: string, cluster: string) => void;
  onHang: () => void;
  onCompare: () => void;
  onAsk: (id: string, cluster: string) => void;
  onClear: () => void;
}) {
  const left = saved.find((item) => item.id === selected[0]) ?? null;
  const right = saved.find((item) => item.id === selected[1]) ?? null;
  const kind = left ? CLUSTER_LABEL[left.cluster] ?? left.cluster : "";
  const compareCluster = left?.cluster ?? null;
  const ready = Boolean(left && right);
  const groups = saved.reduce<Array<{ cluster: string; items: Product[] }>>((acc, item) => {
    const row = acc.find((group) => group.cluster === item.cluster);
    if (row) row.items.push(item);
    else acc.push({ cluster: item.cluster, items: [item] });
    return acc;
  }, []);

  return (
    <section id="studio-save" className="mt-5">
      <div className="border border-white/20 bg-white/5 p-4">
        <p className="text-[11px] font-bold tracking-[0.18em] text-myntra-pink">
          YOUR SHORTLIST · {saved.length} LOOKS
        </p>
        <p className="text-sm text-white/80 mt-1 max-w-2xl">
          ASK THE COACH opens fit · wear · worth against a similar save. COMPARE lets you pick the
          second listing yourself.
        </p>
        {status ? <p className="mt-2 text-sm font-bold text-white">{status}</p> : null}
        {left && !right ? (
          <p className="mt-2 text-sm">
            <b>{left.brand}</b> is selected. Pick another {kind.toLowerCase()} — other kinds are dimmed.
          </p>
        ) : null}
      </div>

      {ready && left && right ? (
        <div className="sticky top-14 z-20 mt-3 flex flex-wrap items-center gap-3 bg-myntra-pink text-white px-4 py-3">
          <span className="text-sm font-bold">
            {left.brand} vs {right.brand}
          </span>
          <button type="button" className="bg-white text-myntra-pink font-bold px-4 py-2 text-[12px]" onClick={onCompare}>
            COMPARE SIDE BY SIDE
          </button>
          <button
            type="button"
            className="border border-white font-bold px-4 py-2 text-[12px]"
            onClick={onHang}
          >
            HANG THESE TWO
          </button>
          <button type="button" className="text-[12px] font-bold underline" onClick={onClear}>
            CLEAR
          </button>
        </div>
      ) : null}

      {groups.map((group) => {
        const label = CLUSTER_LABEL[group.cluster] ?? group.cluster;
        const blockedKind = Boolean(compareCluster && group.cluster !== compareCluster);
        return (
          <div key={group.cluster} className="mt-5">
            <div className="flex items-baseline gap-2 mb-2">
              <p className="text-[11px] font-bold tracking-[0.16em] text-white/55">{label.toUpperCase()}</p>
              <p className="text-[11px] text-white/40">{group.items.length}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.items.map((item) => {
                const isSelected = selected.includes(item.id);
                const blocked = blockedKind && !isSelected;
                const age = addedDaysAgo(item.id);
                return (
                  <article
                    key={item.id}
                    className={`bg-white text-myntra-dark p-3 flex flex-col gap-2 ${
                      isSelected ? "ring-2 ring-myntra-pink" : ""
                    } ${blocked ? "opacity-40" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      <ProductImage
                        product={item}
                        alt={item.brand}
                        className="w-14 h-[76px] object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold tracking-[0.12em] text-myntra-pink">{label}</p>
                        <h3 className="font-bold truncate text-[14px]">{item.brand}</h3>
                        <p className="text-[12px] text-myntra-muted truncate">{item.name}</p>
                        <p className="text-[12px] mt-0.5">
                          {formatInr(item.price)}
                          {age !== undefined ? (
                            <span className="text-myntra-muted">
                              {" "}
                              · {age}d
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="bg-myntra-pink text-white font-bold px-3 py-2 text-[12px]"
                        onClick={() => onAsk(item.id, item.cluster)}
                      >
                        ASK THE COACH
                      </button>
                      <button
                        type="button"
                        disabled={blocked}
                        title={
                          blocked
                            ? `Compare two of the same kind — pick another ${kind.toLowerCase()}`
                            : "Select this look for a same-kind compare"
                        }
                        className={`font-bold px-3 py-2 text-[12px] border ${
                          isSelected
                            ? "border-myntra-pink text-myntra-pink"
                            : "border-myntra-border text-myntra-dark"
                        } disabled:opacity-40`}
                        onClick={() => onToggle(item.id, item.cluster)}
                      >
                        {isSelected ? "SELECTED" : left && item.cluster === compareCluster ? "PICK" : "COMPARE"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
