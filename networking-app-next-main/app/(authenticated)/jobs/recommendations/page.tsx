"use client";

import useSWR from "swr";
import { Job, User } from "@/app/types";
import { fetcher } from "@/app/api/axiosInstance";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/app/stores/authStore";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { Loader2, Sparkles } from "lucide-react";
import MatchCard from "../components/match-card";

import { buildUserDescription } from "@/app/lib/user-skills";

type JobRecommendation = {
  job: Job;
  similarity_score: string;
};

export default function Recommendations() {
  const [data, setData] = useState<JobRecommendation[]>([]);
  const auth = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState<boolean>(true);
  const { data: user } = useSWR<User>(auth.id ? `/users/${auth.id}` : null, fetcher);
  const { t } = useTranslation();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!user || hasFetched.current) return;
    hasFetched.current = true;

    const description = buildUserDescription(user);

    if (!description.trim()) {
      setLoading(false);
      return;
    }

    axios
      .post(
        `http://localhost:3030/recommendation/?user_description=${encodeURIComponent(description)}`,
      )
      .then((res) => {
        const recs: JobRecommendation[] = res.data?.recommended_jobs || [];

        const byKey = new Map<string, JobRecommendation>();
        for (const rec of recs) {
          const title = (rec?.job?.title || "").trim().toLowerCase();
          if (!title) continue;
          const company = (rec?.job?.companyName || "").trim().toLowerCase();
          const key = `${title}||${company}`;
          const existing = byKey.get(key);
          if (
            !existing ||
            parseFloat(rec.similarity_score) > parseFloat(existing.similarity_score)
          ) {
            byKey.set(key, rec);
          }
        }
        const titlesWithCompany = new Set<string>();
        for (const k of byKey.keys()) {
          const [titleKey, c] = k.split("||");
          if (c) titlesWithCompany.add(titleKey);
        }
        const deduped: JobRecommendation[] = [];
        for (const [k, rec] of byKey.entries()) {
          const [titleKey, c] = k.split("||");
          if (!c && titlesWithCompany.has(titleKey)) continue;
          deduped.push(rec);
        }
        deduped.sort(
          (a, b) => parseFloat(b.similarity_score) - parseFloat(a.similarity_score),
        );

        setData(deduped);
      })
      .catch((e) => {
        console.log("Recommendation error:", e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const topJob = data.length > 0 ? data[0].job : null;

  return (
    <div className="flex flex-row h-screen max-h-screen gap-6 w-full justify-between pt-24 px-8 lg:px-24">
      <div className="flex-1 flex flex-col gap-4 overflow-y-scroll pb-10 pr-2 no-scrollbar">
        <div className="flex flex-col mb-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            {t("jobPage.recommendedJobs")}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed max-w-md">
            Smart matching with semantic similarity, skill overlap and acceptance probability per
            role.
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-primary/10 mb-4 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            <p className="text-primary/70 font-medium tracking-wide">Calculating matches...</p>
          </div>
        )}

        {!loading && data.length === 0 && !user?.cvData && (
          <div className="flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed rounded-xl border-primary/20 bg-primary/5">
            <Sparkles className="w-10 h-10 text-primary/40 mb-3" />
            <p className="text-foreground/80 font-medium mb-1">No CV detected</p>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Upload your CV so we can compute personalised matches.
            </p>
            <a
              href="/profile/cv"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
            >
              Upload CV
            </a>
          </div>
        )}

        {!loading && data.length === 0 && user?.cvData && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-sm">
              No matching jobs found for your current profile.
            </p>
          </div>
        )}

        {data.map((rec) => (
          <MatchCard
            key={rec.job.id}
            job={rec.job}
            similarity={parseFloat(rec.similarity_score)}
            user={user}
          />
        ))}
      </div>


    </div>
  );
}
