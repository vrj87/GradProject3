import type { RawReview } from "@myntra/discovery-core";
import { fetchJson, nowIso, type ScrapeResult } from "./http.js";

const SUBREDDITS = ["myntra", "IndianFashionAddicts", "AskIndia", "IndiaFashion"];
const QUERIES = ["wishlist", "myntra size fit", "myntra return", "EOSS wishlist"];

interface RedditListing {
  data?: {
    children?: Array<{
      data?: {
        id?: string;
        body?: string;
        selftext?: string;
        title?: string;
        permalink?: string;
      };
    }>;
  };
}

interface PullPushResponse {
  data?: Array<{
    id?: string;
    body?: string;
    selftext?: string;
    title?: string;
    permalink?: string;
  }>;
}

function pushReview(
  reviews: RawReview[],
  item: {
    id?: string;
    body?: string;
    selftext?: string;
    title?: string;
    permalink?: string;
  },
  subreddit: string
) {
  const text = [item.title, item.body ?? item.selftext].filter(Boolean).join(". ");
  if (!text.trim()) return;
  reviews.push({
    id: `reddit-${subreddit}-${item.id ?? reviews.length}`,
    text,
    source: "reddit",
    sourceId: item.id,
    url: item.permalink
      ? item.permalink.startsWith("http")
        ? item.permalink
        : `https://www.reddit.com${item.permalink}`
      : undefined,
    rating: null,
    scrapedAt: nowIso()
  });
}

async function scrapeRedditOfficial(reviews: RawReview[], errors: string[]) {
  for (const subreddit of SUBREDDITS) {
    for (const query of QUERIES) {
      const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=new&limit=25`;
      try {
        const payload = await fetchJson<RedditListing>(url);
        for (const child of payload.data?.children ?? []) {
          if (child.data) pushReview(reviews, child.data, subreddit);
        }
      } catch (error) {
        errors.push(
          `reddit.com/${subreddit}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }
}

async function scrapePullPush(reviews: RawReview[], errors: string[]) {
  for (const subreddit of SUBREDDITS) {
    const url = `https://api.pullpush.io/reddit/search/comment/?q=${encodeURIComponent("wishlist OR size OR return OR EOSS OR fit")}&subreddit=${subreddit}&size=50`;
    try {
      const payload = await fetchJson<PullPushResponse>(url, 15000);
      for (const item of payload.data ?? []) {
        pushReview(reviews, item, subreddit);
      }
    } catch (error) {
      errors.push(
        `pullpush/${subreddit}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

export async function scrapeReddit(): Promise<ScrapeResult> {
  const reviews: RawReview[] = [];
  const errors: string[] = [];

  await scrapeRedditOfficial(reviews, errors);
  if (reviews.length === 0) {
    await scrapePullPush(reviews, errors);
  }

  return {
    source: "reddit",
    reviews,
    error: errors.length ? errors.join("; ") : undefined
  };
}
