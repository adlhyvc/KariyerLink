"use client";
import useSWR from "swr";
import JobCard from "./components/job-card";
import { Job, User } from "@/app/types";
import { fetcher } from "@/app/api/axiosInstance";
import { useMemo, useState } from "react";
import JobDetails from "./components/job-details";
import { Briefcase, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import ForYouSidebar from "./components/for-you-sidebar";

import { useAuthStore } from "@/app/stores/authStore";
import { getUserSkillSet } from "@/app/lib/user-skills";

function smartScore(job: Job, userSkills: Set<string>): number {
  if (userSkills.size === 0) return 0;
  const required = (job.requiredSkills || "")
    .split(/[,;|]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (required.length === 0) return 0;
  let owned = 0;
  for (const r of required) if (userSkills.has(r)) owned += 1;
  return owned / required.length;
}

function jobPostedTime(job: Job): number {
  const raw = job.postedDate || job.createdDate || job.endDate;
  if (!raw) return 0;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : 0;
}

export default function Jobs() {
  const { data, isLoading, error } = useSWR<Job[]>("/jobs", fetcher);
  const { t } = useTranslation();
  const auth = useAuthStore((s) => s.user);
  const { data: currentUser } = useSWR<User>(auth.id ? `/users/${auth.id}` : null, fetcher);
  const userSkills = useMemo(() => getUserSkillSet(currentUser), [currentUser]);

  const [feedMode, setFeedMode] = useState<"smart" | "newest">("smart");
  const [jobDetail, setJobDetails] = useState<Job>({
    companyId: "",
    description: "",
    id: "",
    title: "",
    companyName: "",
    endDate: "",
  });

  const sortedJobs = useMemo(() => {
    if (!data) return [];
    const groups = new Map<string, Job>();
    data.forEach(job => {
      const title = (job.title || "").trim().toLowerCase();
      const company = (job.companyName || "").trim().toLowerCase();
      if (!title) return;
      const key = `${title}||${company}`;
      
      const existing = groups.get(key);
      if (!existing || jobPostedTime(job) > jobPostedTime(existing)) {
        groups.set(key, job);
      }
    });

    const titlesWithCompany = new Set<string>();
    for (const job of groups.values()) {
      const company = (job.companyName || "").trim().toLowerCase();
      if (company && company !== "unknown" && company !== "—") {
         titlesWithCompany.add((job.title || "").trim().toLowerCase());
      }
    }

    const arr: Job[] = [];
    for (const job of groups.values()) {
      const company = (job.companyName || "").trim().toLowerCase();
      const title = (job.title || "").trim().toLowerCase();
      
      // Drop empty-company duplicates if we already have the real company for this title
      if ((!company || company === "unknown" || company === "—") && titlesWithCompany.has(title)) {
        continue;
      }
      arr.push(job);
    }
    if (feedMode === "smart" && userSkills.size > 0) {
      arr.sort((a, b) => {
        const sa = smartScore(a, userSkills);
        const sb = smartScore(b, userSkills);
        if (sb !== sa) return sb - sa;
        return jobPostedTime(b) - jobPostedTime(a);
      });
    } else {
      arr.sort((a, b) => jobPostedTime(b) - jobPostedTime(a));
    }
    return arr;
  }, [data, feedMode, userSkills]);

  if (isLoading) {
    return (
      <center className="mt-20">
        <Loader2 size={60} strokeWidth={3} className="animate-spin  " />
      </center>
    );
  }

  if (error) {
    return <>{error?.message}</>;
  }

  return (
    <div className="flex flex-row h-screen max-h-screen gap-6 w-full justify-between pt-24 px-8 lg:px-24">
      {/* Left side (Jobs List) */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pb-10 pr-2">
        <div className="flex flex-col mb-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            {t("jobPage.jobs")}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed max-w-md">
            Keşfetmeye hazır mısınız? Kariyerinize yön verecek, yeteneklerinize en uygun güncel
            fırsatları burada bulabilirsiniz.
          </p>
        </div>

        {sortedJobs.length === 0 && (
          <p className="text-sm text-muted-foreground">No jobs found.</p>
        )}
        {sortedJobs.map((job) => {
          const ss = userSkills.size > 0 ? smartScore(job, userSkills) : null;
          return (
            <JobCard
              key={job.id}
              job={job}
              setJobDetails={setJobDetails}
              userSkills={userSkills.size > 0 ? userSkills : undefined}
              score={ss !== null && feedMode === "smart" ? ss.toString() : undefined}
              isActive={jobDetail.id === job.id}
            />
          );
        })}
      </div>

      {/* Right side (Job Details or sidebar) */}
      <div className="flex-1 border-l border-primary/10 pl-6 h-full overflow-y-auto pb-10">
        {jobDetail.description !== "" ? (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setJobDetails({ companyId: "", description: "", id: "", title: "", companyName: "", endDate: "" })}
              className="self-start inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium py-1 cursor-pointer"
            >
              ← Geri Dön
            </button>
            <JobDetails job={jobDetail} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center text-center px-2 pt-4">
              <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-3">
                <Briefcase className="w-8 h-8 text-primary/40" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground/80 mb-1">
                Detayları İnceleyin
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                İlan detaylarını görüntülemek için sol taraftaki listeden bir iş ilanına tıklayın.
              </p>
            </div>
            <ForYouSidebar />

          </div>
        )}
      </div>
    </div>
  );
}
