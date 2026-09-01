"use client";

import { inr } from "@/lib/format";
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
  onClose,
  onPick
}: {
  matrix: CompareMatrix;
  entries: WishlistEntry[];
  onClose: () => void;
  onPick: (entry: WishlistEntry) => void;
}) {
  const byProduct = new Map(entries.map((entry) => [entry.productId, entry]));
  const columns = matrix.itemIds.map((id) => byProduct.get(id)).filter(Boolean) as WishlistEntry[];
  const winner = matrix.recommendation.itemId
    ? byProduct.get(matrix.recommendation.itemId)
    : undefined;

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
                {columns.map((entry) => (
                  <th key={entry.id} className="p-2 text-left align-bottom">
                    <ProductImage
                      src={entry.product.imageUrl}
                      alt={`${entry.product.brand} ${entry.product.name}`}
                      className="mb-2 h-16 w-12 rounded-md"
                    />
                    <span className="block text-xs text-[var(--color-muted)]">
                      {entry.product.brand}
                    </span>
                    <span className="block font-semibold">{entry.product.name}</span>
                    <span className="block text-xs text-[var(--color-muted)]">
                      {inr(entry.product.priceInr)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.dimensions.map((dimension) => (
                <tr key={dimension.name} className="border-t border-[var(--color-line)]">
                  <th className="p-2 text-left align-top font-semibold">{dimension.name}</th>
                  {columns.map((entry) => {
                    const cell = dimension.scores.find((score) => score.itemId === entry.productId);
                    return (
                      <td key={entry.id} className="space-y-1 p-2 align-top">
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
            <button className="btn-primary" onClick={() => onPick(winner)}>
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
