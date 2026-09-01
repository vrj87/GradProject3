"use client";

import { inr } from "@/lib/format";
import type { ProductRecord } from "@/lib/schemas";
import { ProductImage } from "./ProductImage";
import type { CompareMatrix, WishlistEntry } from "./types";

function scoreBar(score: number) {
  return (
    <div className="h-1.5 w-full rounded-full bg-[var(--color-canvas)]">
      <div
        className="h-1.5 rounded-full bg-[var(--color-accent)]"
        style={{ width: `${(score / 5) * 100}%` }}
      />
    </div>
  );
}

export function CompareTable({
  matrix,
  entries,
  products = [],
  onClose,
  onPick
}: {
  matrix: CompareMatrix;
  entries: WishlistEntry[];
  products?: ProductRecord[];
  onClose: () => void;
  onPick: (productId: string) => void;
}) {
  const byWishlist = new Map(entries.map((entry) => [entry.productId, entry]));
  const byCatalog = new Map(products.map((product) => [product.id, product]));
  const columns = matrix.itemIds
    .map((id) => {
      const product = byWishlist.get(id)?.product ?? byCatalog.get(id);
      return product ? { id, product } : null;
    })
    .filter((column): column is { id: string; product: ProductRecord } => Boolean(column));
  const winnerId = matrix.recommendation.itemId;
  const winner = columns.find((column) => column.id === winnerId);

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-black/40 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-5 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div>
            <p className="label">Side by side</p>
            <h3 className="text-xl font-bold">Finish this decision</h3>
          </div>
          <button className="btn-ghost ml-auto" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-40 p-2 text-left align-bottom label">Dimension</th>
                {columns.map((column) => (
                  <th key={column.id} className="p-2 text-left align-bottom">
                    <ProductImage
                      src={column.product.imageUrl}
                      alt={`${column.product.brand} ${column.product.name}`}
                      className="mb-2 h-16 w-12 rounded-md"
                    />
                    <span className="block text-xs text-[var(--color-muted)]">
                      {column.product.brand}
                    </span>
                    <span className="block font-semibold">{column.product.name}</span>
                    <span className="block text-xs text-[var(--color-muted)]">
                      {inr(column.product.priceInr)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.dimensions.map((dimension) => (
                <tr key={dimension.name} className="border-t border-[var(--color-line)]">
                  <th className="p-2 text-left align-top font-semibold">{dimension.name}</th>
                  {columns.map((column) => {
                    const cell = dimension.scores.find((score) => score.itemId === column.id);
                    return (
                      <td key={column.id} className="space-y-1 p-2 align-top">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{cell?.score ?? "—"}</span>
                          <span className="text-xs text-[var(--color-muted)]">/ 5</span>
                        </div>
                        {cell ? scoreBar(cell.score) : null}
                        <p className="text-xs text-[var(--color-muted)]">{cell?.rationale}</p>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl bg-[var(--color-accent-soft)] p-4">
          <p className="label text-[var(--color-accent)]">Recommendation</p>
          <p className="mt-1 font-semibold">{matrix.recommendation.rationale}</p>
          <p className="mt-2 text-sm text-[var(--color-ink)]">{matrix.recommendation.wouldChangeIf}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {winner && (
            <button className="btn-primary" onClick={() => onPick(winner.id)}>
              Move {winner.product.name} to bag
            </button>
          )}
          <button className="btn-ghost" onClick={onClose}>
            Keep thinking
          </button>
          <span className="text-xs text-[var(--color-muted)]">
            Evidence: {matrix.evidenceReviewIds.length} reviews
            {matrix.evidenceThemeIds.length > 0
              ? `, discovery themes ${matrix.evidenceThemeIds.join(", ")}`
              : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
