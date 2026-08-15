import { runRefresh, runScrape } from "./refresh.js";

const command = process.argv[2] ?? "refresh";

async function main() {
  if (command === "scrape") {
    await runScrape();
    return;
  }
  if (command === "refresh") {
    await runRefresh();
    return;
  }
  console.error("Usage: tsx src/cli.ts [refresh|scrape]");
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
