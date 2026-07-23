"use client";

import { VendorIcon } from "@/components/vendor-icon";
import { formatNumber } from "@/lib/format";

type BarItem = {
  label: string;
  value: number | null;
  sub?: string;
  creator?: string | null;
};

type Props = {
  items: BarItem[];
  /** Decimal places for values. Serializable — safe from Server Components. */
  digits?: number;
  barLabel?: string;
};

export function BarChart({ items, digits = 0 }: Props) {
  const max = Math.max(...items.map((i) => i.value ?? 0), 0);
  if (!Number.isFinite(max) || max <= 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => {
        const pct = item.value == null ? 0 : (item.value / max) * 100;
        return (
          <div
            className="flex items-center gap-4 text-sm"
            key={`${item.label}-${index}`}
          >
            <div
              className="flex w-1/3 min-w-40 items-center gap-2.5 truncate"
              title={item.label}
            >
              <span className="text-[10px] font-mono text-muted-foreground w-4 text-right shrink-0">
                {index + 1}
              </span>
              <VendorIcon
                name={item.creator}
                size={14}
                className="shrink-0"
              />
              <span className="font-medium text-foreground truncate">
                {item.label}
              </span>
            </div>
            <div className="flex-1 h-2.5 bg-secondary rounded-sm overflow-hidden flex items-center">
              <div
                className={`h-full rounded-sm transition-all ${index === 0 ? "bg-primary" : "bg-primary/40"}`}
                style={{ width: `${Math.max(pct, 1.2)}%` }}
              />
            </div>
            <div className="w-20 font-mono text-right font-medium text-foreground text-xs">
              {item.value == null ? "—" : formatNumber(item.value, digits)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
