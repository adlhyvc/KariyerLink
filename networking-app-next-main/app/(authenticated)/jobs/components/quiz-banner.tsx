"use client";

import { fetcher } from "@/app/api/axiosInstance";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { useAuthStore } from "@/app/stores/authStore";
import { QuizResultRecord } from "@/app/types";
import { ClipboardCheck, Trophy } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

type Props = {
  jobId: string;
  quizEnabled?: boolean;
};

export default function QuizBanner({ jobId, quizEnabled }: Props) {
  const user = useAuthStore((state) => state.user);

  const { data: quizResult, isLoading } = useSWR<QuizResultRecord>(
    quizEnabled ? `/jobs/quiz/result/${jobId}/${user.id}` : null,
    fetcher,
    { shouldRetryOnError: false }
  );

  if (!quizEnabled) return null;

  // User already took the quiz
  if (quizResult && !isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
        <Trophy size={18} className="text-green-600" />
        <span className="text-sm font-medium text-green-700 dark:text-green-300">
          Quiz completed
        </span>
        <Badge variant="secondary" className="ml-auto text-sm font-bold">
          {quizResult.score}/{quizResult.totalQuestions}
        </Badge>
      </div>
    );
  }

  // User hasn't taken the quiz yet
  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
      <div className="flex items-center gap-2">
        <ClipboardCheck size={18} className="text-amber-600" />
        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
          This job requires a skills quiz
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Take a 10-question quiz (15 min) to show the employer your skills
      </p>
      <Link href={`/jobs/quiz/${jobId}`}>
        <Button size="sm" className="w-full">
          Take Quiz & Apply
        </Button>
      </Link>
    </div>
  );
}
