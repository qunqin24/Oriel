import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function MetricCard({ label, value, subValue, trend, trendValue, className = "" }: MetricCardProps) {
  return (
    <div className={`instrument-panel p-4 flex flex-col gap-1 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        {trend && trendValue && (
          <span className={`text-[10px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-sm border ${
            trend === "up" ? "border-positive/30 text-positive bg-positive/5" :
            trend === "down" ? "border-negative/30 text-negative bg-negative/5" :
            "border-border text-muted-foreground bg-muted/30"
          }`}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "−"} {trendValue}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 mt-1 min-w-0">
        <span className="text-2xl font-bold font-mono text-foreground tracking-tight truncate">{value}</span>
        {subValue && (
          <span className="text-[11px] text-muted-foreground font-medium truncate" data-tip={subValue}>{subValue}</span>
        )}
      </div>
    </div>
  );
}
