export const MYNTRA_IOS_ID = "907394059";
export const MYNTRA_ANDROID_ID = "com.myntra.android";
export const APP_STORE_SLUG = "myntra-fashion-shopping-app";

export function storeListingUrl(source: string, country = "in"): string {
  if (source === "play_store") {
    return `https://play.google.com/store/apps/details?id=${MYNTRA_ANDROID_ID}&hl=en_IN`;
  }
  if (source === "app_store") {
    return `https://apps.apple.com/${country}/app/${APP_STORE_SLUG}/id${MYNTRA_IOS_ID}`;
  }
  if (source === "reddit") {
    return "https://www.reddit.com/r/IndianFashionAddicts/";
  }
  return "";
}

export function reviewLinkLabel(source: string): string {
  if (source === "play_store") return "View this review on Play Store";
  if (source === "app_store") return "See App Store reviews";
  if (source === "reddit") return "View this thread";
  return "View source";
}

export function publicReviewUrl(input: {
  source: string;
  sourceId?: string;
  url?: string;
  reviewId?: string;
}): string {
  if (input.source === "play_store") {
    const id = playReviewId(input);
    const base = `https://play.google.com/store/apps/details?id=${MYNTRA_ANDROID_ID}`;
    return id
      ? `${base}&reviewId=${encodeURIComponent(id)}&hl=en_IN`
      : `${base}&hl=en_IN`;
  }

  if (input.source === "app_store") {
    const country = countryFrom(input.url, input.reviewId) ?? "in";
    return `${storeListingUrl("app_store", country)}?see-all=reviews`;
  }

  if (input.source === "reddit") {
    if (input.url?.startsWith("http")) return input.url;
    if (input.url?.startsWith("/")) return `https://www.reddit.com${input.url}`;
    return storeListingUrl("reddit");
  }

  if (input.url?.startsWith("http") && !input.url.includes("/rss/")) {
    return input.url;
  }
  return storeListingUrl(input.source);
}

function playReviewId(input: {
  sourceId?: string;
  url?: string;
  reviewId?: string;
}): string {
  const fromQuery = input.url?.match(/[?&]reviewId=([^&]+)/i)?.[1];
  if (fromQuery) return decodeURIComponent(fromQuery);
  if (input.sourceId && !input.sourceId.startsWith("playstore-")) return input.sourceId;
  return input.reviewId?.match(/^playstore-(.+)$/)?.[1] ?? "";
}

function countryFrom(url?: string, reviewId?: string): string | undefined {
  const fromUrl = url?.match(/itunes\.apple\.com\/([a-z]{2})\//)?.[1];
  if (fromUrl) return fromUrl;
  const fromApps = url?.match(/apps\.apple\.com\/([a-z]{2})\//)?.[1];
  if (fromApps) return fromApps;
  return reviewId?.match(/^appstore-([a-z]{2})-/)?.[1];
}
