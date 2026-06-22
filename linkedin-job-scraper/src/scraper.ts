import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as fs from 'fs';
import * as path from 'path';

puppeteer.use(StealthPlugin());

// Service URLs (local Docker)
const AI_SERVICE_URL = 'http://localhost:3030';
const JOB_SERVICE_URL = 'http://localhost:8040';

export interface ScrapedJob {
  jobId: string;
  query: string;
  title: string;
  company: string | null;
  companyLink: string | null;
  companyImgLink: string | null;
  location: string;
  date: string;
  dateText: string;
  /** ISO-8601 date the job was originally posted on LinkedIn (extracted from the detail page). Null if it could not be determined. */
  postedDate: string | null;
  link: string;
  applyLink: string | null;
  description: string;
  skills: string[];
  insights: string[];
  scrapedAt: string;
}

const OUTPUT_DIR = path.join(__dirname, "..", "output");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "jobs.json");

function loadExistingJobs(): Map<string, ScrapedJob> {
  const map = new Map<string, ScrapedJob>();
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
      for (const job of data) {
        map.set(job.jobId, job);
      }
    } catch (e) {
      console.error("Error reading existing jobs file, starting fresh:", e);
    }
  }
  return map;
}

function saveJobs(jobs: Map<string, ScrapedJob>): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  const data = Array.from(jobs.values());
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), "utf-8");
  console.log(`\n[SAVED] ${data.length} jobs to ${OUTPUT_FILE}`);
}

/**
 * Extract the original LinkedIn posting date from an open job detail page.
 *
 * Tries the most reliable sources first:
 *   1. JSON-LD `<script type="application/ld+json">` with `datePosted`.
 *   2. A `<time>` element with a `datetime` attribute.
 *   3. The visible relative-time text ("2 days ago", "Posted 1 week ago", etc.)
 *      which we then convert back to an absolute ISO date.
 */
async function extractPostedDate(detailPage: any): Promise<{ iso: string | null; text: string }> {
  try {
    const result = await detailPage.evaluate(() => {
      // 1. JSON-LD
      const ldNodes = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      for (const n of ldNodes) {
        try {
          const json = JSON.parse((n as HTMLElement).innerText);
          const candidates = Array.isArray(json) ? json : [json];
          for (const c of candidates) {
            if (c && typeof c.datePosted === 'string' && c.datePosted) {
              return { iso: c.datePosted as string, text: '' };
            }
          }
        } catch {
          // ignore malformed JSON-LD blocks
        }
      }

      // 2. <time datetime="...">
      const timeNode = document.querySelector('time[datetime]') as HTMLTimeElement | null;
      if (timeNode && timeNode.dateTime) {
        return { iso: timeNode.dateTime, text: (timeNode.innerText || '').trim() };
      }

      // 3. Relative-time text used by both authenticated & guest layouts
      const textNode =
        document.querySelector('.posted-time-ago__text') ||
        document.querySelector('.jobs-unified-top-card__posted-date') ||
        document.querySelector('.job-details-jobs-unified-top-card__primary-description-container time') ||
        document.querySelector('.topcard__flavor--metadata');
      const text = textNode ? (textNode as HTMLElement).innerText.trim() : '';
      return { iso: null, text };
    });

    if (result.iso) return result;

    // Convert relative text like "2 days ago" / "Posted 1 week ago" to an ISO date
    const iso = parseRelativeTime(result.text);
    return { iso, text: result.text };
  } catch {
    return { iso: null, text: '' };
  }
}

function parseRelativeTime(text: string): string | null {
  if (!text) return null;
  const m = text.toLowerCase().match(/(\d+)\s*(minute|hour|day|week|month|year)s?\s*ago/);
  if (!m) return null;
  const amount = parseInt(m[1], 10);
  const unit = m[2];
  const now = new Date();
  switch (unit) {
    case 'minute': now.setMinutes(now.getMinutes() - amount); break;
    case 'hour':   now.setHours(now.getHours() - amount); break;
    case 'day':    now.setDate(now.getDate() - amount); break;
    case 'week':   now.setDate(now.getDate() - amount * 7); break;
    case 'month':  now.setMonth(now.getMonth() - amount); break;
    case 'year':   now.setFullYear(now.getFullYear() - amount); break;
  }
  return now.toISOString();
}

/**
 * Extract skills from a job description using the AI service.
 */
async function parseJobSkills(description: string): Promise<string[]> {
  if (!description || description.trim().length < 20) return [];
  try {
    const res = await fetch(`${AI_SERVICE_URL}/jobs/parse-skills/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.skills || [];
    }
  } catch (e) {
    console.log(`  [WARN] Skill parsing failed: ${e}`);
  }
  return [];
}

/**
 * Push a scraped job to the job-service PostgreSQL database.
 */
async function pushJobToService(job: ScrapedJob): Promise<boolean> {
  try {
    const res = await fetch(`${JOB_SERVICE_URL}/scraped`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: job.title,
        description: job.description,
        requiredSkills: JSON.stringify(job.skills),
        sourceUrl: job.link,
        sourceJobId: job.jobId,
        location: job.location,
        companyName: job.company,
        companyId: null,
        postedDate: job.postedDate,
      }),
    });
    if (res.status === 409) {
      console.log(`  [DUP-DB] Job ${job.jobId} already in database`);
      return false;
    }
    return res.ok;
  } catch (e) {
    console.log(`  [WARN] Failed to push job to DB: ${e}`);
    return false;
  }
}

export interface ScrapeOptions {
  queries: string[];
  limitPerQuery?: number;
  applyLink?: boolean;
  skills?: boolean;
  locations?: string[];
  slowMo?: number;
}

async function scrapeJobsForQuery(
  page: any,
  query: string,
  location: string,
  limit: number,
  jobsMap: Map<string, ScrapedJob>,
  totalCounters: { processed: number; newJobs: number }
) {
  console.log(`\n[SEARCH] Searching for "${query}" in "${location}"...`);
  
  let geoIdParam = "";
  if (location.toLowerCase() === "turkey" || location.toLowerCase() === "turkiye" || location.toLowerCase() === "türkiye") {
      geoIdParam = "&geoId=102105699";
  }
  
  const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}${geoIdParam}&f_TPR=r2592000`; // Past month
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
  
  await page.waitForTimeout(5000); // Wait for results to load
  
  let jobsFoundForQuery = 0;
  let pageNum = 1;

  while (jobsFoundForQuery < limit) {
    // Scroll down the job list panel to load more jobs if needed
    await page.evaluate(() => {
        const pane = document.querySelector('.jobs-search-results-list');
        if (pane) pane.scrollTop = pane.scrollHeight;
    });
    
    await page.waitForTimeout(2000);
    
    // Check for both logged-in and guest selectors just in case
    let jobCards = await page.$$('.job-card-container');
    if (jobCards.length === 0) {
        jobCards = await page.$$('.base-search-card'); // Guest mode cards
    }
    
    if (jobCards.length === 0) {
        console.log(`  [WARN] No job cards found on page...`);
        await page.screenshot({ path: path.join(__dirname, '..', 'error-screenshot.png'), fullPage: true });
        console.log(`  [INFO] Saved screenshot to error-screenshot.png`);
        break;
    }
    
    console.log(`  Found ${jobCards.length} job cards on current page.`);
    
    for (const card of jobCards) {
        if (jobsFoundForQuery >= limit) break;
        
        try {
            // Extract the job link to visit instead of clicking it (which causes navigation)
            let jobLink = await card.evaluate((el: any) => {
                const anchor = el.querySelector('a');
                return anchor ? anchor.href : null;
            }).catch(() => null);

            let jobId = await card.evaluate((el: any) => el.getAttribute('data-job-id'));
            if (!jobId) {
                jobId = await card.evaluate((el: any) => el.getAttribute('data-entity-urn')?.split(':').pop());
            }

            if (!jobLink && jobId) {
                jobLink = `https://www.linkedin.com/jobs/view/${jobId}/`;
            }

            if (!jobId || !jobLink) {
                 continue;
            }
            
            if (jobsMap.has(jobId)) {
                console.log(`  [DUP] Skipped: Job ${jobId}`);
                continue;
            }
            
            // Extract basic details from card before navigating
            const title = await card.evaluate((el: any) => {
                const titleNode = el.querySelector('.job-card-list__title') || el.querySelector('.base-search-card__title');
                return titleNode ? titleNode.innerText.trim() : "Unknown Title";
            }).catch(() => "Unknown Title");

            const companyName = await card.evaluate((el: any) => {
                const coNode = el.querySelector('.job-card-container__primary-description') || el.querySelector('.base-search-card__subtitle');
                return coNode ? coNode.innerText.trim() : null;
            }).catch(() => null);

            const locationStr = await card.evaluate((el: any) => {
                const locNode = el.querySelector('.job-card-container__metadata-item') || el.querySelector('.job-search-card__location');
                return locNode ? locNode.innerText.trim() : "";
            }).catch(() => "");

            totalCounters.processed++;
            jobsFoundForQuery++;
            
            // Open job details in a new page to prevent detaching the list context
            const detailPage = await page.browser().newPage();
            await detailPage.goto(jobLink, { waitUntil: 'domcontentloaded' }).catch(() => {});
            await detailPage.waitForTimeout(2000);

            const description = await detailPage.evaluate(() => {
                const descNode = document.querySelector('.jobs-description-content__text') || document.querySelector('.show-more-less-html__markup') || document.querySelector('.description__text');
                return descNode ? (descNode as HTMLElement).innerText.trim() : "";
            }).catch(() => "");

            const { iso: postedDateIso, text: postedDateText } = await extractPostedDate(detailPage);

            await detailPage.close();
            
            // Extract skills from description using AI service
            const skills = await parseJobSkills(description);

            const job: ScrapedJob = {
                jobId,
                query,
                title,
                company: companyName,
                companyLink: null,
                companyImgLink: null,
                location: locationStr || location,
                date: new Date().toISOString().split('T')[0],
                dateText: postedDateText,
                postedDate: postedDateIso,
                link: jobLink,
                applyLink: null,
                description,
                skills,
                insights: [],
                scrapedAt: new Date().toISOString(),
            };
            
            jobsMap.set(jobId, job);
            totalCounters.newJobs++;
            
            // Push to PostgreSQL via job-service
            const pushed = await pushJobToService(job);
            
            console.log(`  [NEW] #${totalCounters.processed}: "${job.title}" at ${job.company || "N/A"} | Skills: ${skills.length} | DB: ${pushed ? 'OK' : 'SKIP'}`);
            
        } catch (e) {
            console.error(`  [ERR] Error processing a job card:`, e);
        }
    }
    
    if (jobsFoundForQuery >= limit) break;
    
    // Check next page pagination if we haven't reached limit
    const paginationButtons = await page.$$('.artdeco-pagination__indicator button');
    let clickedNext = false;
    for (const btn of paginationButtons) {
        const btnText = await btn.evaluate((el: any) => el.textContent?.trim());
        if (btnText === String(pageNum + 1)) {
            await btn.click();
            await page.waitForTimeout(3000);
            pageNum++;
            clickedNext = true;
            break;
        }
    }
    
    if (!clickedNext) {
        console.log(`  Reached last page for query.`);
        break; // No more pages
    }
  }
}

export async function scrapeJobs(options: ScrapeOptions): Promise<void> {
  const {
    queries,
    limitPerQuery = 25,
    locations = ["Worldwide"],
    slowMo = 50,
  } = options;

  const liAtCookie = process.env.LI_AT_COOKIE;
  if (!liAtCookie) {
    throw new Error("Missing LI_AT_COOKIE in environment variables.");
  }

  const jobsMap = loadExistingJobs();
  const startCount = jobsMap.size;
  const counters = { processed: 0, newJobs: 0 };

  console.log(`\n[START] Authenticated LinkedIn job scraper`);
  console.log(`  Search terms: ${queries.length}`);
  console.log(`  Locations: ${locations.join(", ")}`);
  console.log(`  Limit per query: ${limitPerQuery}`);
  console.log(`  Existing jobs in database: ${startCount}\n`);

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: slowMo,
    args: ["--lang=en-GB", "--no-sandbox", "--disable-setuid-sandbox", "--start-maximised"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  console.log(`  [AUTH] Authenticating with cookie...`);
  
  // Navigate to LinkedIn homepage to establish basic cookies and CSRF
  await page.goto('https://www.linkedin.com/', { waitUntil: 'domcontentloaded' });
  
  // Set the specific auth cookie along with proper domain
  await page.setCookie({
    name: 'li_at',
    value: liAtCookie,
    domain: '.www.linkedin.com',
    path: '/',
    secure: true,
    httpOnly: true,
  });

  console.log(`  [AUTH] Reloading to apply authentication...`);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Validate if login was actually successful by looking for the nav profile avatar
  const isLoggedIn = await page.evaluate(() => {
     return !!document.querySelector('.global-nav__me-photo');
  });

  if (!isLoggedIn) {
      console.log(`  [WARN] Cookie auth might have failed (nav avatar not found) - falling back to guest mode`);
  } else {
      console.log(`  [OK] Successfully authenticated into LinkedIn!`);
  }

  for (const query of queries) {
      for (const loc of locations) {
          await scrapeJobsForQuery(page, query, loc, limitPerQuery, jobsMap, counters);
      }
      // Save data immediately after finishing a single search query so the file updates live
      saveJobs(jobsMap);
  }

  console.log(`\n[DONE] Scraping complete!`);
  console.log(`   Total cards inspected: ${counters.processed}`);
  console.log(`   New jobs added: ${counters.newJobs}`);
  console.log(`   Total in database: ${jobsMap.size}`);

  await browser.close();
}
