import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function phase1Root(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../../..");
}

function parseEnvContent(raw: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const text = raw.replace(/^\uFEFF/, "");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && value) vars[key] = value;
  }
  return vars;
}

/** Load `.env` from Phase-1 and sibling discovery-engine. */
export function loadEnvFiles(): string[] {
  const root = phase1Root();
  const candidates = [
    path.join(root, ".env"),
    path.resolve(root, "../discovery-engine/.env")
  ];
  const loaded: string[] = [];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const vars = parseEnvContent(readFileSync(file, "utf8"));
    for (const [key, value] of Object.entries(vars)) {
      if (!process.env[key]) process.env[key] = value;
    }
    loaded.push(file);
  }
  return loaded;
}
