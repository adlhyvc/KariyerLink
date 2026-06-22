import { cn } from "@/app/lib/utils";
import { ReactNode } from "react";

type Props = {
  label: ReactNode;
  value: number;
  hint?: ReactNode;
  tone?: "primary" | "warn" | "danger" | "success";
  className?: string;
};

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  primary: "bg-primary",
  success: "bg-emerald-500",
  warn: "bg-amber-500",
  danger: "bg-red-500",
};

export default function SkillTrack({
  label,
  value,
  hint,
  tone = "primary",
  className,
}: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const autoTone: Props["tone"] =
    tone === "primary"
      ? clamped >= 75
        ? "success"
        : clamped >= 45
          ? "primary"
          : clamped >= 25
            ? "warn"
            : "danger"
      : tone;
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex justify-between text-xs">
        <span className="text-foreground/90">{label}</span>
        <span className="font-medium text-muted-foreground">{hint ?? `${clamped}%`}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", TONE[autoTone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
