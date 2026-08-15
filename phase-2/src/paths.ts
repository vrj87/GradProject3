import path from "node:path";
import { fileURLToPath } from "node:url";

export function phase2Root(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

export function projectRoot(): string {
  return path.resolve(phase2Root(), "..");
}

export function phase1DiscoveryDir(): string {
  return path.join(projectRoot(), "Phase-1", "data", "discovery");
}

export function phase2DataDir(): string {
  return path.join(phase2Root(), "data");
}
