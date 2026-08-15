import { readFile } from "node:fs/promises";
import type { RawReview } from "@myntra/discovery-core";
import { fixturesDir } from "@myntra/discovery-core";

export async function loadSeedFixtures(): Promise<RawReview[]> {
  try {
    const file = `${fixturesDir()}/seed-reviews.json`;
    return JSON.parse(await readFile(file, "utf8")) as RawReview[];
  } catch {
    return [];
  }
}

/** Merge live scrape with curated fixtures; fixtures fill gaps without replacing live ids. */
export function mergeCorpusWithStats(
  live: RawReview[],
  fixtures: RawReview[]
): { reviews: RawReview[]; fixtureAdded: number } {
  const byId = new Map<string, RawReview>();
  for (const review of live) {
    byId.set(review.id, review);
  }
  let fixtureAdded = 0;
  for (const review of fixtures) {
    if (!byId.has(review.id)) {
      byId.set(review.id, review);
      fixtureAdded += 1;
    }
  }
  return { reviews: [...byId.values()], fixtureAdded };
}

/** Ensure curated fixtures are present even when running 1a/1c on an older raw file. */
export async function supplementRawCorpus(raw: RawReview[]): Promise<{
  reviews: RawReview[];
  fixtureAdded: number;
}> {
  const fixtures = await loadSeedFixtures();
  return mergeCorpusWithStats(raw, fixtures);
}
