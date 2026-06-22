import { cn } from "@/app/lib/utils";

type Props = {
  score: number;
  className?: string;
  showLabel?: boolean;
};

function bucketClass(score: number) {
  if (score >= 85) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900";
  }
  if (score >= 70) {
    return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900";
  }
  if (score >= 50) {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900";
  }
  return "bg-muted text-muted-foreground border-border";
}

export default function MatchBadge({ score, className, showLabel = true }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        bucketClass(clamped),
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {clamped}%{showLabel ? " match" : ""}
    </span>
  );
}
