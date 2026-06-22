import { cn } from "@/app/lib/utils";
import { Sparkles } from "lucide-react";
import { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
  className?: string;
  compact?: boolean;
};

export default function AiBox({ title, children, className, compact = false }: Props) {
  return (
    <div
      className={cn(
        "rounded-lg border border-primary/15 bg-primary/[0.03]",
        compact ? "p-3" : "p-4",
        className,
      )}
    >
      {title && (
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          {title}
        </div>
      )}
      <div className={cn("text-sm text-foreground/90 leading-relaxed", compact && "text-xs")}>
        {children}
      </div>
    </div>
  );
}
