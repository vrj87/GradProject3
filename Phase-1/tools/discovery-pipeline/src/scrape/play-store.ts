import type { RawReview } from "@myntra/discovery-core";
import { publicReviewUrl } from "@myntra/discovery-core";
import { nowIso, type ScrapeResult } from "./http.js";

const APP_ID = "com.myntra.android";

interface PlayReview {
  id?: string;
  text?: string;
  score?: number;
  url?: string;
}

export async function scrapePlayStore(): Promise<ScrapeResult> {
  try {
    const gplay = (await import("google-play-scraper")).default;
    const result = await gplay.reviews({
      appId: APP_ID,
      sort: gplay.sort.NEWEST,
      num: 150,
      lang: "en",
      country: "in"
    });
    const reviews: RawReview[] = (result.data as PlayReview[])
      .filter((row) => row.text?.trim())
      .map((row, index) => ({
        id: `playstore-${row.id ?? index}`,
        text: row.text ?? "",
        source: "play_store" as const,
        sourceId: row.id,
        url: publicReviewUrl({
          source: "play_store",
          sourceId: row.id,
          url: row.url
        }),
        rating: row.score ?? null,
        scrapedAt: nowIso()
      }));
    return { source: "play_store", reviews };
  } catch (error) {
    return {
      source: "play_store",
      reviews: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
