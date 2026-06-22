"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import SkillTrack from "@/app/components/match/SkillTrack";
import { defaultFetcher } from "@/app/api/axiosInstance";
import { TrendingUp, Loader2 } from "lucide-react";
import useSWR from "swr";

type TrendingSkill = {
  skill: string;
  count: number;
  growth: number;
  share: number;
};

type TrendingResponse = {
  skills: TrendingSkill[];
  monthly?: { label: string; count: number }[];
};

export default function TrendingSkills() {
  const { data, isLoading } = useSWR<TrendingResponse>(
    "http://localhost:3030/skills/trending",
    defaultFetcher,
  );

  const skills = data?.skills?.slice(0, 4) ?? [];
  const monthly = data?.monthly ?? [];
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.count));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xs uppercase tracking-wide text-primary flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          Trending Skills
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        {isLoading && (
          <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading market signal...
          </div>
        )}

        {!isLoading && skills.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">No trend data available yet.</p>
        )}

        {skills.map((s) => (
          <SkillTrack
            key={s.skill}
            label={<span className="capitalize">{s.skill}</span>}
            value={Math.min(100, s.share)}
            hint={
              <span
                className={
                  s.growth >= 0
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-muted-foreground"
                }
              >
                {s.growth >= 0 ? "+" : ""}
                {s.growth}%
              </span>
            }
          />
        ))}

        {monthly.length > 0 && (
          <div className="flex items-end gap-1.5 h-12 mt-2">
            {monthly.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm bg-primary/30"
                  style={{ height: `${Math.max(6, (m.count / maxMonthly) * 100)}%` }}
                />
                <span className="text-[9px] text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
