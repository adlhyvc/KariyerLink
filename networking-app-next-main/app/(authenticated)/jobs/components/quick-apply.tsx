"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { ClipboardCheck, FileText, Sparkles } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";
import { Job } from "@/app/types";

type Props = {
  topJob?: Job | null;
};

export default function QuickApply({ topJob }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xs uppercase tracking-wide text-primary flex items-center gap-1.5">
          <ClipboardCheck className="h-3.5 w-3.5" />
          Quick Apply
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col gap-2">
        <p className="text-xs text-muted-foreground pb-1">
          AI-ready application toolkit for your top match.
        </p>
        <Button size="sm" className="justify-start">
          <Sparkles className="h-4 w-4 mr-2" />
          Generate AI cover letter
        </Button>
        <Button size="sm" variant="secondary" className="justify-start">
          <FileText className="h-4 w-4 mr-2" />
          Tailor my CV to this job
        </Button>
        {topJob?.quizEnabled ? (
          <Link href={`/jobs/quiz/${topJob.id}`}>
            <Button size="sm" variant="outline" className="w-full justify-start">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Practice for interview quiz
            </Button>
          </Link>
        ) : (
          <Button size="sm" variant="outline" className="justify-start" disabled>
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Practice for interview quiz
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
