"use client";

import { defaultFetcher } from "@/app/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { FamiliarWithData } from "@/app/types";
import { BookOpen, ExternalLink, Lightbulb, Wrench, Briefcase } from "lucide-react";
import useSWR from "swr";

type Props = {
  jobId: string;
};

export default function FamiliarSection({ jobId }: Props) {
  const { data, isLoading } = useSWR<FamiliarWithData>(
    `http://localhost:3030/quiz/familiar-for-job/?job_id=${jobId}`,
    defaultFetcher
  );

  if (isLoading || !data || !data.technologies || Object.keys(data.technologies).length === 0) {
    return null;
  }

  return (
    <Card className="mt-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb size={20} className="text-yellow-500" />
          You Should Be Familiar With
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Level: {data.level === "high" ? "Senior / Experienced" : "Junior / Entry Level"}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {Object.entries(data.technologies).map(([techName, techData]) => (
          <div key={techName} className="border rounded-lg p-3">
            <h4 className="font-semibold text-sm capitalize mb-2 text-primary">{techName}</h4>

            {/* Key Concepts */}
            {techData.concepts && techData.concepts.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                  <BookOpen size={12} /> Key Concepts
                </div>
                <div className="flex flex-wrap gap-1">
                  {techData.concepts.map((concept, i) => (
                    <span
                      key={i}
                      className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tools */}
            {techData.tools && techData.tools.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                  <Wrench size={12} /> Common Tools
                </div>
                <div className="flex flex-wrap gap-1">
                  {techData.tools.map((tool, i) => (
                    <span
                      key={i}
                      className="text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Typical Tasks */}
            {techData.typical_tasks && techData.typical_tasks.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                  <Briefcase size={12} /> Typical Tasks
                </div>
                <ul className="text-xs text-muted-foreground list-disc list-inside">
                  {techData.typical_tasks.slice(0, 4).map((task, i) => (
                    <li key={i}>{task}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resources */}
            {techData.resources && techData.resources.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                  <ExternalLink size={12} /> Learning Resources
                </div>
                <div className="flex flex-col gap-0.5">
                  {techData.resources.map((resource, i) => (
                    <a
                      key={i}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      {resource.title}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
