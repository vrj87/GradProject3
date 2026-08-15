import path from "node:path";
import { fileURLToPath } from "node:url";

export function engineRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../../..");
}

export function discoveryDir(root = engineRoot()): string {
  return path.join(root, "data", "discovery");
}

export function fixturesDir(root = engineRoot()): string {
  return path.join(root, "data", "fixtures");
}

export function collectInboxPath(root = engineRoot()): string {
  return path.join(root, "data", "collect", "inbox.json");
}

export const ARTEFACT_FILES = {
  raw: "raw-reviews.json",
  normalized: "normalized-reviews.json",
  chunks: "chunks.json",
  themes: "themes.json",
  validation: "validation-results.json",
  ranking: "opportunity-ranking.json",
  stats: "pipeline-stats.json",
  report: "report.html"
} as const;
