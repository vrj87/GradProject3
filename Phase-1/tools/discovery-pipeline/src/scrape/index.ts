import type { RawReview } from "@myntra/discovery-core";
import { scrapeAppStore } from "./app-store.js";
import { scrapePlayStore } from "./play-store.js";
import { scrapeReddit } from "./reddit.js";
import type { ScrapeResult } from "./http.js";

export async function scrapeAll(): Promise<{
  reviews: RawReview[];
  results: ScrapeResult[];
}> {
  const results = await Promise.all([
    scrapeAppStore(),
    scrapePlayStore(),
    scrapeReddit()
  ]);
  const reviews = results.flatMap((result) => result.reviews);
  return { reviews, results };
}
