"use client";

import { fetcher } from "@/app/api/axiosInstance";
import { applyJob, deleteApplication } from "@/app/api/job-application";
import { Button } from "@/app/components/ui/button";
import { useAuthStore } from "@/app/stores/authStore";
import { ClipboardCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import useSWR from "swr";

type Props = {
  jobId: string;
  quizEnabled?: boolean;
};

import { useRouter } from "next/navigation";
import { QuizResultRecord } from "@/app/types";

export default function Apply({ jobId, quizEnabled }: Props) {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { t } = useTranslation();
  const {
    data: isApplied,
    isLoading: loadingApplied,
    mutate,
  } = useSWR(`/jobs/applications/check?userId=${user.id}&jobId=${jobId}`, fetcher);

  const { data: quizResult, isLoading: loadingQuiz } = useSWR<QuizResultRecord>(
    quizEnabled ? `/jobs/quiz/result/${jobId}/${user.id}` : null,
    fetcher,
    { shouldRetryOnError: false }
  );

  const toggleApply = async () => {
    try {
      console.log("toggleApply clicked:", { quizEnabled, quizResult, isApplied, jobId });
      if (quizEnabled && !quizResult && !isApplied) {
        router.push(`/jobs/quiz/${jobId}`);
        return;
      }

      if (isApplied) {
        const res = await deleteApplication(user.id, jobId);
        toast.success(res.data);
        mutate();
      } else {
        const res = await applyJob({ jobId: jobId, userId: user.id });
        toast.success(res.data);
        mutate();
      }
    } catch (error: any) {
      toast.error(error?.message);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      {loadingApplied || loadingQuiz ? (
        <Loader2 className="animate-spin" />
      ) : (
        <>
          {isApplied ? (
            <Button onClick={() => toggleApply()} variant={"secondary"}>
              {t("jobPage.withdrawApplication")}
            </Button>
          ) : (
            <Button onClick={() => toggleApply()}>
              {quizEnabled ? (
                <>
                  <ClipboardCheck className="h-4 w-4 mr-1.5" />
                  Apply via Quiz
                </>
              ) : (
                t("jobPage.apply")
              )}
            </Button>
          )}
          {quizEnabled && !isApplied && (
            <p className="text-[11px] text-amber-500 dark:text-amber-400 flex items-center gap-1">
              <ClipboardCheck className="h-3 w-3 shrink-0" />
              Quiz required
            </p>
          )}
        </>
      )}
    </div>
  );
}
