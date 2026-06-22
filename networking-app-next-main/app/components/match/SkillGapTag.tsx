import { cn } from "@/app/lib/utils";
import { AlertTriangle, Check } from "lucide-react";

type Props = {
  label: string;
  state?: "gap" | "owned" | "neutral";
  className?: string;
};

export default function SkillGapTag({ label, state = "neutral", className }: Props) {
  if (state === "gap") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900",
          className,
        )}
      >
        <AlertTriangle className="h-3 w-3" />
        {label}
      </span>
    );
  }
  if (state === "owned") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900",
          className,
        )}
      >
        <Check className="h-3 w-3" />
        {label}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border bg-primary/5 text-primary border-primary/15 px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}
