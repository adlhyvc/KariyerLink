import { Card } from "@/app/components/ui/card";
import { cn } from "@/app/lib/utils";
import { Job } from "@/app/types";
import { Briefcase, Clock, MapPin } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import MatchBadge from "@/app/components/match/MatchBadge";
import SkillGapTag from "@/app/components/match/SkillGapTag";
import { formatRelativeTime } from "@/app/lib/relative-time";

type Props = {
  job: Job;
  setJobDetails: Dispatch<SetStateAction<Job>>;
  score?: string;
  userSkills?: Set<string>;
  isActive?: boolean;
};

function pickDisplayDate(job: Job): string | null {
  return job.postedDate || job.createdDate || job.endDate || null;
}

function splitSkills(raw?: string): string[] {
  if (!raw) return [];
  // Strip JSON brackets and quotes in case requiredSkills is stored as '["css","git"]'
  const cleaned = raw.replace(/[\[\]"]/g, "");
  return cleaned
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function companyInitials(name?: string): string {
  if (!name) return "?";
  const parts = name
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function scoreToPercent(score?: string): number | null {
  if (score === undefined || score === null) return null;
  const n = parseFloat(score);
  if (!Number.isFinite(n)) return null;
  if (n <= 1) return Math.round(n * 100);
  return Math.round(n);
}

export default function JobCard({
  job,
  setJobDetails,
  score,
  userSkills,
  isActive,
}: Props) {
  const displayDate = pickDisplayDate(job);
  const skills = splitSkills(job.requiredSkills);
  const matchPercent = scoreToPercent(score);

  const ownedSkills: string[] = [];
  const missingSkills: string[] = [];
  if (userSkills && userSkills.size > 0) {
    for (const s of skills) {
      if (userSkills.has(s.toLowerCase())) ownedSkills.push(s);
      else missingSkills.push(s);
    }
  }

  return (
    <Card
      onClick={() => setJobDetails(job)}
      className={cn(
        "cursor-pointer p-4 transition-all hover:shadow-md hover:-translate-y-0.5",
        isActive && "ring-2 ring-primary/40",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
          {companyInitials(job.companyName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground truncate">
                {job.title}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {job.companyName || "—"}
              </div>
            </div>
            {matchPercent !== null && matchPercent > 0 && <MatchBadge score={matchPercent} />}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {job.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {job.experienceLevel === "high"
                ? "Senior"
                : job.experienceLevel === "low"
                  ? "Junior"
                  : "Any level"}
            </span>
            {displayDate && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(displayDate)}
              </span>
            )}
          </div>

          {(skills.length > 0 || missingSkills.length > 0) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {ownedSkills.slice(0, 3).map((s) => (
                <SkillGapTag key={`o-${s}`} label={s} state="owned" />
              ))}
              {missingSkills.slice(0, 3).map((s) => (
                <SkillGapTag key={`m-${s}`} label={s} state="neutral" />
              ))}
              {!userSkills &&
                skills.slice(0, 4).map((s) => (
                  <SkillGapTag key={`n-${s}`} label={s} state="neutral" />
                ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
