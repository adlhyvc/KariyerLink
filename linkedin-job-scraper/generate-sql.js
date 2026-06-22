/**
 * Reads jobs.json and generates clean SQL INSERT statements
 * for the company and job tables in KariyerLink's PostgreSQL database.
 *
 * Usage:  node generate-sql.js
 * Output: seed-data.sql  (in the same folder)
 */

const fs = require('fs');
const INPUT  = path.join(__dirname, 'output', 'jobs.json');
const OUTPUT = path.join(__dirname, 'seed-data.sql');

// Read and parse
const raw = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));

// ── Helper: escape single quotes for SQL ──
function esc(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

// ── Helper: deterministic UUID from a string (so re-runs produce the same IDs) ──
function nameToUUID(name) {
  const hash = crypto.createHash('md5').update(name.toLowerCase().trim()).digest('hex');
  // Format as UUID: 8-4-4-4-12
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join('-');
}

// ── Step 1: Collect unique companies ──
const companyMap = new Map(); // name -> uuid

for (const job of raw) {
  const name = (job.company || '').trim();
  if (!name) continue;
  if (!companyMap.has(name)) {
    companyMap.set(name, nameToUUID(name));
  }
}

// ── Step 2: Filter jobs with clear, usable data ──
const cleanJobs = raw.filter(j => {
  const hasTitle = j.title && j.title.trim() && j.title !== 'Unknown Title';
  const hasCompany = j.company && j.company.trim();
  const hasDescription = j.description && j.description.trim().length > 30;
  return hasTitle && hasCompany && hasDescription;
});

console.log(`Total jobs in file : ${raw.length}`);
console.log(`Unique companies   : ${companyMap.size}`);
console.log(`Clean jobs (kept)  : ${cleanJobs.length}`);
console.log(`Skipped (unclear)  : ${raw.length - cleanJobs.length}`);

// ── Step 3: Build SQL ──
let sql = '';

sql += '-- ═══════════════════════════════════════════\n';
sql += '-- KariyerLink Seed Data (auto-generated)\n';
sql += '-- ═══════════════════════════════════════════\n\n';

// Companies
sql += '-- ── Companies ──\n';
for (const [name, uuid] of companyMap) {
  // Find the first location associated with this company to use as address
  const sample = raw.find(j => (j.company || '').trim() === name);
  const address = sample ? esc(sample.location || '') : '';

  sql += `INSERT INTO company (id, name, description, address, email, website, owner_id)\n`;
  sql += `VALUES ('${uuid}', '${esc(name)}', '', '${address}', '', '', NULL)\n`;
  sql += `ON CONFLICT (id) DO NOTHING;\n\n`;
}

// Jobs
sql += '\n-- ── Jobs ──\n';
for (const job of cleanJobs) {
  const jobUUID = nameToUUID(job.jobId);
  const companyUUID = companyMap.get(job.company.trim());
  const title = esc(job.title);
  
  // Truncate description to first 4000 chars to keep SQL manageable
  let desc = job.description || '';
  if (desc.length > 4000) desc = desc.substring(0, 4000) + '...';
  desc = esc(desc);

  const createdDate = job.scrapedAt || new Date().toISOString();

  sql += `INSERT INTO job (id, title, company_id, description, created_date, last_modified_date, end_date)\n`;
  sql += `VALUES ('${jobUUID}', '${title}', '${companyUUID}', '${desc}', '${createdDate}', '${createdDate}', NULL)\n`;
  sql += `ON CONFLICT (id) DO NOTHING;\n\n`;
}

fs.writeFileSync(OUTPUT, sql, 'utf-8');
console.log(`\nSQL written to: ${OUTPUT}`);
