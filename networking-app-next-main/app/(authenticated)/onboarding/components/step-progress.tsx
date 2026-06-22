"use client";

import { cn } from "@/app/lib/utils";

type Props = {
  step: number;
  total: number;
  labels: string[];
};

export default function StepProgress({ step, total, labels }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {Array.from({ length: total }, (_, i) => i).map((i) => (
          <div key={i} className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                i < step ? "bg-primary w-full" : "w-0",
              )}
            />
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        {step} / {total} — {labels[step - 1] ?? ""}
      </div>
    </div>
  );
}
