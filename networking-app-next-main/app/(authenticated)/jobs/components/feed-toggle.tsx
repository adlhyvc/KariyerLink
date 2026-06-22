"use client";

import { cn } from "@/app/lib/utils";

export type FeedMode = "smart" | "newest";

type Props = {
  value: FeedMode;
  onChange: (m: FeedMode) => void;
};

export default function FeedToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-1 rounded-md bg-muted p-1 w-fit">
      {(
        [
          { id: "smart", label: "Smart Feed" },
          { id: "newest", label: "Newest" },
        ] as { id: FeedMode; label: string }[]
      ).map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "px-3 py-1 rounded text-xs font-medium transition-colors",
            value === opt.id
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
