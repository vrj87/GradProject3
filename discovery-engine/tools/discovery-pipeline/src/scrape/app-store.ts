import type { RawReview } from "@myntra/discovery-core";
import { fetchJson, nowIso, type ScrapeResult } from "./http.js";

const MYNTRA_IOS_ID = "907394059";
const COUNTRIES = ["in", "us", "gb"];
const PAGES = [1, 2, 3];

interface RssFeed {
  feed?: {
    entry?: Array<{
      id?: { label?: string };
      content?: { label?: string };
      title?: { label?: string };
      "im:rating"?: { label?: string };
    }>;
  };
}

function feedUrl(country: string, page: number): string {
  return `https://itunes.apple.com/${country}/rss/customerreviews/page=${page}/id=${MYNTRA_IOS_ID}/sortby=mostrecent/json`;
}

export async function scrapeAppStore(): Promise<ScrapeResult> {
  const reviews: RawReview[] = [];
  const errors: string[] = [];

  for (const country of COUNTRIES) {
    for (const page of PAGES) {
      const url = feedUrl(country, page);
      try {
        const data = await fetchJson<RssFeed>(url);
        const entries = data.feed?.entry ?? [];
        for (const [index, entry] of entries.entries()) {
          const text = [entry.title?.label, entry.content?.label]
            .filter(Boolean)
            .join(". ");
          if (!text) continue;
          reviews.push({
            id: `appstore-${country}-${page}-${entry.id?.label ?? index}`,
            text,
            source: "app_store",
            sourceId: entry.id?.label,
            url,
            rating: entry["im:rating"]?.label
              ? Number(entry["im:rating"].label)
              : null,
            scrapedAt: nowIso()
          });
        }
      } catch (error) {
        errors.push(
          `${country}/p${page}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  return {
    source: "app_store",
    reviews,
    error: errors.length ? errors.join("; ") : undefined
  };
}
