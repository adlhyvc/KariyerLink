"use client";

import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import ScoreCircle from "@/app/components/match/ScoreCircle";
import SkillGapTag from "@/app/components/match/SkillGapTag";
import AiBox from "@/app/components/match/AiBox";
import { Job, User } from "@/app/types";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import { applyJob } from "@/app/api/job-application";
import { fetcher } from "@/app/api/axiosInstance";
import { saveJob, unsaveJob } from "@/app/api/saved-jobs";
import useSWR, { useSWRConfig } from "swr";
import AcceptanceBars, { AcceptanceData } from "./acceptance-bars";
import { useAuthStore } from "@/app/stores/authStore";
import { buildUserDescription } from "@/app/lib/user-skills";

import toast from "react-hot-toast";

type Props = {
  job: Job;
  similarity: number;
  user: User | undefined;
};

type Advice = {
  title: string;
  description: string;
  boostPct: number;
};

type SkillAnalysis = {
  jobSkillsAll: string[];
  userSkillsMatched: string[];
  jobSkillsMissing: string[];
};

export default function MatchCard({ job, similarity, user }: Props) {
  const auth = useAuthStore((s) => s.user);
  const { mutate: globalMutate } = useSWRConfig();
  const [acceptance, setAcceptance] = useState<AcceptanceData | null>(null);
  const [analysis, setAnalysis] = useState<SkillAnalysis | null>(null);
  const [advice, setAdvice] = useState<Advice[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  const { data: savedFlag, mutate: mutateSaved } = useSWR<{ saved: boolean }>(
    auth.id && job.id ? `/jobs/saved/check?userId=${auth.id}&jobId=${job.id}` : null,
    fetcher,
    { shouldRetryOnError: false },
  );
  const { data: isApplied, mutate: mutateApplied } = useSWR<boolean>(
    auth.id && job.id ? `/jobs/applications/check?userId=${auth.id}&jobId=${job.id}` : null,
    fetcher,
    { shouldRetryOnError: false },
  );

  const userDescription = useMemo(() => buildUserDescription(user), [user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    const payload = {
      userDescription,
      cvData: user.cvData || null,
      jobId: job.id,
      jobTitle: job.title,
      jobDescription: job.description,
      similarityScore: similarity,
    };
    Promise.all([
      axios.post("http://localhost:3030/matching/acceptance/", payload),
      axios.post("http://localhost:3030/matching/advice/", payload),
    ])
      .then(([acc, adv]) => {
        if (!active) return;
        setAcceptance({
          technicalFit: acc.data.technicalFit,
          experienceFit: acc.data.experienceFit,
          cultureFit: acc.data.cultureFit,
          overall: acc.data.overall,
        });
        setAnalysis({
          jobSkillsAll: acc.data.jobSkillsAll ?? [],
          userSkillsMatched: acc.data.userSkillsMatched ?? [],
          jobSkillsMissing: acc.data.jobSkillsMissing ?? [],
        });
        setAdvice(adv.data.tips ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, job.id, job.title, job.description, userDescription, similarity]);

  const percent =
    similarity <= 1 ? Math.round(similarity * 100) : Math.round(similarity);

  const isSaved = savedFlag?.saved ?? false;

  const handleSave = async () => {
    try {
      if (isSaved) {
        await unsaveJob(auth.id, job.id);
      } else {
        await saveJob(auth.id, job.id);
      }
      mutateSaved();
      globalMutate(`/jobs/saved/list/${auth.id}`);
    } catch (e: any) {
      toast.error(e?.message || "Could not toggle saved");
    }
  };

  const handleApply = async () => {
    if (applying) return;
    if (job.quizEnabled && !isApplied) {
      window.location.href = `/jobs/quiz/${job.id}`;
      return;
    }
    setApplying(true);
    try {
      const res = await applyJob({ jobId: job.id, userId: auth.id });
      toast.success(res.data);
      mutateApplied();
    } catch (e: any) {
      toast.error(e?.message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-4">
          <ScoreCircle score={percent} label="match" />
          <div className="flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setShowDescription((v) => !v)}
              className="text-base font-bold tracking-tight hover:text-primary transition-colors text-left flex items-center gap-1.5 cursor-pointer"
            >
              {job.title}
              {showDescription ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </button>
            <div className="text-xs text-muted-foreground mt-0.5 truncate">
              {job.companyName || "—"}
              {job.location ? ` · ${job.location}` : ""}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button size="sm" onClick={handleApply} disabled={applying}>
                {applying ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : job.quizEnabled && !isApplied ? (
                  <ClipboardCheck className="h-4 w-4 mr-1.5" />
                ) : (
                  <Send className="h-4 w-4 mr-1.5" />
                )}
                {isApplied ? "Applied" : job.quizEnabled ? "Apply via Quiz" : "Apply"}
              </Button>
              <Button size="sm" variant="secondary" onClick={handleSave}>
                {isSaved ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 mr-1.5" />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4 mr-1.5" />
                    Save
                  </>
                )}
              </Button>
            </div>
            {job.quizEnabled && !isApplied && (
              <p className="text-[11px] text-amber-500 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                <ClipboardCheck className="h-3 w-3 shrink-0" />
                This job requires completing a quiz before applying.
              </p>
            )}
          </div>
        </div>

        {showDescription && job.description && (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
            {job.description}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Computing acceptance probability...
          </div>
        )}

        {!loading && acceptance && (
          <div className="rounded-lg border bg-card p-4">
            <AcceptanceBars data={acceptance} />
          </div>
        )}

        {!loading && advice.length > 0 && (
          <AiBox title="AI recommendations">
            <ul className="space-y-2">
              {advice.map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground">
                      {a.title}{" "}
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        +{a.boostPct}%
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">{a.description}</div>
                  </div>
                </li>
              ))}
            </ul>
          </AiBox>
        )}

        {!loading && analysis && analysis.jobSkillsAll.length > 0 && (
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Skills compared
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.userSkillsMatched.map((s) => (
                <SkillGapTag key={`o-${s}`} label={s} state="owned" />
              ))}
              {analysis.jobSkillsMissing.map((s) => (
                <SkillGapTag key={`m-${s}`} label={s} state="gap" />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
