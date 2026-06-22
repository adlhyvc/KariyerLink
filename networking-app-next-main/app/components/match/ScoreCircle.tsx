import { cn } from "@/app/lib/utils";

type Props = {
  score: number;
  label?: string;
  size?: number;
  className?: string;
};

export default function ScoreCircle({ score, label = "match", size = 72, className }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const inner = Math.round(size * 0.75);
  const ringStyle: React.CSSProperties = {
    width: size,
    height: size,
    background: `conic-gradient(hsl(var(--primary)) 0% ${clamped}%, hsl(var(--muted)) ${clamped}% 100%)`,
  };
  const innerStyle: React.CSSProperties = {
    width: inner,
    height: inner,
  };
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center shrink-0 relative",
        className,
      )}
      style={ringStyle}
      aria-label={`${clamped}% ${label}`}
    >
      <div
        className="rounded-full bg-background flex flex-col items-center justify-center"
        style={innerStyle}
      >
        <span className="font-bold text-primary text-base leading-none">{clamped}%</span>
        {label && (
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
