import { loadEnvFiles } from "./load-env.js";
import { runExtract, runNormalize, runRefresh, runScrape } from "./refresh.js";

const envFiles = loadEnvFiles();
if (process.env.GROQ_API_KEY) {
  console.log(`env: Groq key loaded (${envFiles.length} file(s))`);
} else if (envFiles.length > 0) {
  console.warn(
    `env: found ${envFiles.length} .env file(s) but GROQ_API_KEY is missing — using rule-based extraction`
  );
} else {
  console.warn("env: no .env found — add GROQ_API_KEY to Phase-1/.env or discovery-engine/.env");
}

const command = process.argv[2] ?? "refresh";

async function main() {
  if (command === "1a" || command === "normalize") {
    await runNormalize();
    return;
  }
  if (command === "1b" || command === "scrape") {
    await runScrape();
    return;
  }
  if (command === "1c" || command === "extract") {
    await runExtract();
    return;
  }
  if (command === "1d" || command === "refresh") {
    await runRefresh();
    return;
  }
  console.error("Usage: tsx src/cli.ts [1a|1b|1c|1d|refresh|scrape]");
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
