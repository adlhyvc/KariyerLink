import { cn } from "@/app/lib/utils";
import { ReactNode } from "react";

export type TimelineItem = {
  key: string;
  marker: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  body?: ReactNode;
};

type Props = {
  items: TimelineItem[];
  className?: string;
};

export default function Timeline({ items, className }: Props) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <li key={item.key} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className="absolute left-[15px] top-8 bottom-0 w-px bg-border"
              />
            )}
            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold">
              {item.marker}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">{item.title}</div>
              {item.subtitle && (
                <div className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</div>
              )}
              {item.meta && (
                <div className="text-[11px] text-muted-foreground mt-1">{item.meta}</div>
              )}
              {item.body && <div className="text-xs mt-2 text-foreground/80">{item.body}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
