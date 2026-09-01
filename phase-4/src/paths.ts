import path from "node:path";
import { fileURLToPath } from "node:url";

export function phase4Root(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

export function projectRoot(): string {
  return path.resolve(phase4Root(), "..");
}

export function phase1DiscoveryDir(): string {
  return path.join(projectRoot(), "Phase-1", "data", "discovery");
}

/** Phase 3 artefacts, written by `npm run survey --prefix Phase-1`. */
export function phase3SurveyDir(): string {
  return path.join(projectRoot(), "Phase-1", "data", "survey");
}

export function phase2DataDir(): string {
  return path.join(projectRoot(), "phase-2", "data");
}

export function phase4DataDir(): string {
  return path.join(phase4Root(), "data");
}

export function docsDir(): string {
  return path.join(projectRoot(), "docs");
}
