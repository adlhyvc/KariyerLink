import "dotenv/config";
import { scrapeJobs } from "./scraper";
import { SEARCH_TERMS } from "./search-terms";

/** Fisher-Yates shuffle for randomizing search term order */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * LinkedIn Job Scraper - Entry Point
 * 
 * Usage:
 *   npm run scrape                    # Scrape all search terms
 *   npm run scrape -- --test          # Test with 1 term, 5 results
 *   npm run scrape -- --limit 10      # Set results per query
 *   npm run scrape -- --location "Turkey"  # Filter by location
 */

async function main() {
  const args = process.argv.slice(2);

  // Parse CLI arguments
  const isTest = args.includes("--test");
  const limitIdx = args.indexOf("--limit");
  const locationIdx = args.indexOf("--location");

  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : (isTest ? 5 : 25);
  const locations: string[] = (locationIdx !== -1 && args[locationIdx + 1])
    ? [args[locationIdx + 1]]
    : ["Worldwide"];

  // In test mode, use only first search term; otherwise shuffle for randomized order
  const queries = isTest ? [SEARCH_TERMS[0]] : shuffle([...SEARCH_TERMS]);

  console.log("═══════════════════════════════════════════");
  console.log("  LinkedIn Job Scraper");
  console.log("═══════════════════════════════════════════");
  console.log(`  Mode: ${isTest ? "TEST" : "FULL"}`);
  console.log(`  Queries: ${queries.length} search terms`);
  console.log(`  Limit/query: ${limit}`);
  console.log(`  Locations: ${locations.length > 0 ? locations.join(", ") : "Worldwide"}`);
  console.log("═══════════════════════════════════════════\n");

  if (!process.env.LI_AT_COOKIE) {
    console.error("[ERR] LI_AT_COOKIE not set in .env file!");
    console.error("      Please add your LinkedIn li_at cookie to the .env file.");
    process.exit(1);
  }

  await scrapeJobs({
    queries,
    limitPerQuery: limit,
    locations,
    skills: true,
    applyLink: false,
    slowMo: 300,
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
