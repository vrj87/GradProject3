const THEME_TITLES: Record<string, string> = {
  FitSizeAnxiety: "Fit and size",
  "fit-size-anxiety": "Fit and size",
  "Fit & size confidence synthesis": "Fit and size",
  "FitSizeAnxiety → resolve": "Fit and size",
  ReturnFearDelay: "Worry about returns",
  "return-fear": "Worry about returns",
  "Styling / occasion guidance": "What to wear for an occasion",
  "styling-occasion": "What to wear for an occasion",
  "Wishlist compare & prioritization": "Choosing between saved items",
  "comparison-paralysis": "Choosing between saved items",
  "In-app social proof (review/try-on synthesis)": "Trusting reviews and try-ons",
  "review-trust-gap": "Trusting reviews and try-ons",
  "Share-for-feedback": "Asking friends before buying",
  "social-validation": "Asking friends before buying",
  "Wishlist revisit nudges (generic)": "Coming back to saved items",
  "wishlist-decay": "Coming back to saved items",
  "Price-drop / sale alerts": "Sale alerts",
  "Back-in-stock alerts": "Back-in-stock alerts"
};

const SOURCE_LABELS: Record<string, string> = {
  app_store: "App Store",
  play_store: "Play Store",
  reddit: "Community",
  ios: "App Store",
  android: "Play Store"
};

const SOURCE_BLURBS: Record<string, string> = {
  app_store: "Latest public Myntra reviews on the iPhone App Store.",
  play_store: "Latest public Myntra reviews on Google Play.",
  reddit: "Public threads where shoppers talk about saving and fit."
};

const IMPACT_LABELS: Record<string, string> = {
  high: "A big reason people wait",
  medium: "Often holds people back",
  low: "Comes up sometimes"
};

const SEGMENT_LABELS: Record<string, string> = {
  S2: "Shoppers who save items but wait because they are unsure about fit",
  S4: "Shoppers who keep comparing saved items",
  "S2 ∩ S4": "Shoppers who hesitate on fit and keep comparing"
};

export function friendlyTheme(value: string): string {
  if (THEME_TITLES[value]) return THEME_TITLES[value];
  const withoutArrow = value.split("→")[0].trim();
  if (THEME_TITLES[withoutArrow]) return THEME_TITLES[withoutArrow];
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function friendlySource(value: string): string {
  return SOURCE_LABELS[value] ?? value.replace(/[_-]+/g, " ");
}

export function friendlySourceBlurb(value: string): string {
  return SOURCE_BLURBS[value] ?? "Public comments from shoppers.";
}

export function friendlyWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function friendlyImpact(value: string): string {
  return IMPACT_LABELS[value.toLowerCase()] ?? "";
}

export function friendlySegment(value: string): string {
  return SEGMENT_LABELS[value] ?? "Shoppers who save items but have not bought yet";
}

export function friendlyShare(value: string | number): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  const pct = Math.round(value * 100);
  return `About ${pct}% of wishlist comments`;
}

export function isShopperFacingCaveat(text: string): boolean {
  return !/readyForPhase|Phase \d|Q gaps|themeId|metricNode|S2|S4|MVP|unobserved|nomination/i.test(
    text
  );
}
