/**
 * Batch Migration Script
 * Imports existing scraped jobs from jobs.json into the PostgreSQL database
 * and extracts skills using the AI service.
 * 
 * Usage: npx ts-node src/migrate-jobs.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const AI_SERVICE_URL = 'http://localhost:3030';
const JOB_SERVICE_URL = 'http://localhost:8040';

interface ScrapedJob {
  jobId: string;
  title: string;
  company: string | null;
  location: string;
  link: string;
  description: string;
  skills: string[];
  scrapedAt: string;
  postedDate?: string | null;
}

async function parseSkills(description: string): Promise<string[]> {
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
    // AI service might not be running
  }
  return [];
}

async function pushJob(job: ScrapedJob, skills: string[]): Promise<string> {
  try {
    const res = await fetch(`${JOB_SERVICE_URL}/scraped`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: job.title,
        description: job.description,
        requiredSkills: JSON.stringify(skills),
        sourceUrl: job.link,
        sourceJobId: job.jobId,
        location: job.location,
        companyName: job.company,
        companyId: null,
        postedDate: job.postedDate ?? null,
      }),
    });
    if (res.status === 409) return 'DUP';
    if (res.ok) return 'OK';
    return 'ERR';
  } catch (e) {
    return 'ERR';
  }
}

async function main() {
  const jobsFile = path.join(__dirname, '..', 'output', 'jobs.json');
  
  if (!fs.existsSync(jobsFile)) {
    console.error('No jobs.json file found!');
    process.exit(1);
  }

  const jobs: ScrapedJob[] = JSON.parse(fs.readFileSync(jobsFile, 'utf-8'));
  console.log(`\n═══════════════════════════════════════`);
  console.log(`  Batch Migration: ${jobs.length} jobs`);
  console.log(`═══════════════════════════════════════\n`);

  let ok = 0, dup = 0, err = 0, skillsParsed = 0;

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    
    // Parse skills from description
    const skills = await parseSkills(job.description);
    if (skills.length > 0) skillsParsed++;
    
    // Push to database
    const result = await pushJob(job, skills);
    
    if (result === 'OK') ok++;
    else if (result === 'DUP') dup++;
    else err++;

    // Progress report every 20 jobs
    if ((i + 1) % 20 === 0 || i === jobs.length - 1) {
      console.log(`  [${i + 1}/${jobs.length}] OK:${ok} DUP:${dup} ERR:${err} Skills:${skillsParsed}`);
    }
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  Migration Complete!`);
  console.log(`  Added: ${ok}`);
  console.log(`  Duplicates: ${dup}`);
  console.log(`  Errors: ${err}`);
  console.log(`  Jobs with skills: ${skillsParsed}`);
  console.log(`═══════════════════════════════════════\n`);
}

main().catch(console.error);
