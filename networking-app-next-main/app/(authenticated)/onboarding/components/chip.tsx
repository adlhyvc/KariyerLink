"use client";

import { cn } from "@/app/lib/utils";

type Props = {
  label: string;
  selected: boolean;
  onToggle: () => void;
};

export default function Chip({ label, selected, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors capitalize",
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-input bg-background text-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}
