import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ARTEFACT_FILES, discoveryDir, engineRoot } from "@myntra/discovery-core";

export async function ensureDirs(): Promise<void> {
  await mkdir(discoveryDir(engineRoot()), { recursive: true });
}

export async function writeJson(name: string, data: unknown): Promise<string> {
  const file = path.join(discoveryDir(), name);
  await writeFile(file, JSON.stringify(data, null, 2), "utf8");
  return file;
}

export async function readArtefact<T>(name: string): Promise<T> {
  const file = path.join(discoveryDir(), name);
  return JSON.parse(await readFile(file, "utf8")) as T;
}

export { ARTEFACT_FILES };
