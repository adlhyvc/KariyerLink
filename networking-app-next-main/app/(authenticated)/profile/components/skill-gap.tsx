"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import SkillTrack from "@/app/components/match/SkillTrack";
import { User } from "@/app/types";
import { Target } from "lucide-react";
import { useMemo } from "react";
import { parseCvData } from "@/app/lib/user-skills";

type Props = {
  user?: User;
  targetRole?: string;
};

const TARGET_REQUIREMENTS: Record<string, { skill: string; weight: number }[]> = {
  default: [
    { skill: "research", weight: 1 },
    { skill: "deep learning", weight: 1 },
    { skill: "mlops", weight: 1 },
    { skill: "aws", weight: 1 },
  ],
  "ml engineering": [
    { skill: "python", weight: 1 },
    { skill: "deep learning", weight: 1 },
    { skill: "mlops", weight: 1 },
    { skill: "aws", weight: 1 },
  ],
  "data science": [
    { skill: "python", weight: 1 },
    { skill: "pandas", weight: 1 },
    { skill: "scikit-learn", weight: 1 },
    { skill: "sql", weight: 1 },
  ],
  "full stack": [
    { skill: "react", weight: 1 },
    { skill: "node", weight: 1 },
    { skill: "typescript", weight: 1 },
    { skill: "postgresql", weight: 1 },
  ],
  "devops": [
    { skill: "docker", weight: 1 },
    { skill: "kubernetes", weight: 1 },
    { skill: "terraform", weight: 1 },
    { skill: "aws", weight: 1 },
  ],
};

function pickRequirements(role: string) {
  const key = role.toLowerCase();
  for (const k of Object.keys(TARGET_REQUIREMENTS)) {
    if (key.includes(k)) return TARGET_REQUIREMENTS[k];
  }
  return TARGET_REQUIREMENTS.default;
}

export default function SkillGap({ user, targetRole = "ML Engineering Lead" }: Props) {
  const data = useMemo(() => {
    const cv = parseCvData(user);
    const userSkillSet = new Set<string>();
    if (cv?.skills) {
      for (const s of cv.skills) userSkillSet.add(s.trim().toLowerCase());
    }
    if (user?.description) {
      for (const w of user.description.split(/[,;|\s]/)) {
        if (w) userSkillSet.add(w.trim().toLowerCase());
      }
    }
    const reqs = pickRequirements(targetRole);
    return reqs.map((r) => {
      const owns = userSkillSet.has(r.skill);
      const rolling = Math.floor(Math.random() * 0); // deterministic placeholder
      const value = owns ? 85 + rolling : 30 + rolling;
      return { skill: r.skill, value };
    });
  }, [user, targetRole]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xs uppercase tracking-wide text-primary flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5" />
          Skill Gap Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col gap-3">
        <div className="text-xs text-muted-foreground">Target role: {targetRole}</div>
        {data.map((d) => (
          <SkillTrack
            key={d.skill}
            label={<span className="capitalize">{d.skill}</span>}
            value={d.value}
          />
        ))}
      </CardContent>
    </Card>
  );
}
