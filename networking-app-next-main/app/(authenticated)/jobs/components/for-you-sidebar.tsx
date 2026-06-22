"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import MatchBadge from "@/app/components/match/MatchBadge";
import AiBox from "@/app/components/match/AiBox";
import { useAuthStore } from "@/app/stores/authStore";
import { Job, User } from "@/app/types";
import axios from "axios";
import { Sparkles, Loader2, Briefcase } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/app/api/axiosInstance";
import { buildUserDescription } from "@/app/lib/user-skills";

type Recommendation = {
  job: Job;
  similarity_score: string;
};

function initials(name?: string): string {
  if (!name) return "?";
  const parts = name.replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function asPercent(score: string): number {
  const n = parseFloat(score);
  if (!Number.isFinite(n)) return 0;
  return n <= 1 ? Math.round(n * 100) : Math.round(n);
}

export default function ForYouSidebar() {
  const auth = useAuthStore((s) => s.user);
  const { data: user } = useSWR<User>(auth.id ? `/users/${auth.id}` : null, fetcher);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
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
      .post(`http://localhost:3030/recommendation/?user_description=${encodeURIComponent(description)}`)
      .then((res) => {
        const list: Recommendation[] = res.data?.recommended_jobs ?? [];
        setRecs(list.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xs uppercase tracking-wide text-primary flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          For You
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 pt-0">
        {loading && (
          <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Calculating matches...
          </div>
        )}

        {!loading && recs.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">
            Upload your CV to see personalized matches.
          </p>
        )}

        {recs.map((r) => (
          <Link
            key={r.job.id}
            href={`/jobs/recommendations`}
            className="flex items-center gap-3 py-2 border-b border-border last:border-b-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
          >
            <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
              {initials(r.job.companyName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">
                {r.job.companyName || "—"}
              </div>
              <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                <Briefcase className="h-2.5 w-2.5" />
                {r.job.title}
              </div>
            </div>
            <MatchBadge score={asPercent(r.similarity_score)} showLabel={false} />
          </Link>
        ))}

        {recs.length > 0 && (
          <div className="pt-3">
            <AiBox compact>
              These are the strongest semantic matches between your profile and currently
              open roles, weighted by skill overlap.
            </AiBox>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
