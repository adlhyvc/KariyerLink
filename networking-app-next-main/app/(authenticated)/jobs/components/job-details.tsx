import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Job } from "@/app/types";
import React from "react";
import Apply from "./apply";
import Link from "next/link";
import QuizBanner from "./quiz-banner";
import FamiliarSection from "./familiar-section";

type Props = {
  job: Job;
};

export default function JobDetails({ job }: Props) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-row justify-between items-center">
            <div>{job.title}</div>
            <div>
              <Apply jobId={job.id} quizEnabled={job.quizEnabled} />
            </div>
          </CardTitle>
          <CardDescription className="flex flex-col ">
            <Link href={`/company/${job.companyId}`}>{job.companyName}</Link>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quiz Banner — only shows if quiz is enabled */}
      <QuizBanner jobId={job.id} quizEnabled={job.quizEnabled} />

      <Card>
        <CardContent className="py-2">{job.description}</CardContent>
      </Card>

      {/* "You Should Be Familiar With" — shows for ALL jobs */}
      <FamiliarSection jobId={job.id} />
    </>
  );
}
