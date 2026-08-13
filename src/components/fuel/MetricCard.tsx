import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "primary" | "success" | "destructive";
};

const toneMap = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  destructive: "text-destructive",
} as const;

export function MetricCard({ label, value, unit, hint, icon: Icon, tone = "default" }: Props) {
  return (
    <div className="panel p-4 sm:p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <p className="min-w-0 truncate text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <Icon className="size-4 shrink-0 text-muted-foreground" />
      </div>
      <p className={`numeral mt-3 text-3xl font-semibold ${toneMap[tone]}`}>
        {value}
        {unit ? <span className="ml-1 text-sm text-muted-foreground">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
