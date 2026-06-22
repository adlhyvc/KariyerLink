"use client";

import AiBox from "@/app/components/match/AiBox";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import axios from "axios";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  step: number;
  skills: string[];
  careerGoal?: string;
  title?: string;
};

export default function LiveSuggestion({ step, skills, careerGoal, title }: Props) {
  const [hint, setHint] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    axios
      .post("http://localhost:3030/onboarding/live-hint/", {
        step,
        skills,
        careerGoal,
        title,
      })
      .then((res) => {
        if (active) setHint(res.data?.hint ?? "");
      })
      .catch(() => {
        if (active) setHint("");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [step, skills, careerGoal, title]);

  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs uppercase tracking-wide text-primary flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Live AI suggestion
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Updates as you fill in the wizard.
        </p>
        <AiBox compact>
          {loading ? (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Analyzing...
            </span>
          ) : (
            hint || "AI will react to your inputs in real time."
          )}
        </AiBox>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Similar profiles work at
          </div>
          <div className="flex flex-col gap-1.5">
            <SimilarRow initials="AK" role="AI Engineer" company="Trendyol" />
            <SimilarRow initials="SY" role="ML Specialist" company="Getir" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SimilarRow({
  initials,
  role,
  company,
}: {
  initials: string;
  role: string;
  company: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
        {initials}
      </div>
      <span className="text-foreground">{role}</span>
      <span className="text-muted-foreground">→ {company}</span>
    </div>
  );
}
