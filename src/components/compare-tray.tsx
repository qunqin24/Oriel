"use client";

import { VendorIcon } from "@/components/vendor-icon";
import { useCompare } from "@/lib/compare-store";

export function CompareTray() {
  const { items, count, max, remove, clear, ready } = useCompare();

  const isComparePage =
    typeof window !== "undefined" && window.location.pathname === "/compare";

  if (!ready || count === 0 || isComparePage) return null;

  const ids = items.map((i) => i.id).join(",");

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2">
      <div className="instrument-panel px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 shadow-lg">
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-x-auto">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground shrink-0">
            对比 {count}/{max}
          </span>
          {items.map((item) => (
            <div
              key={item.id}
              className="inline-flex items-center gap-1.5 shrink-0 rounded-md border hairline-border bg-secondary/60 pl-2 pr-1 py-1"
            >
              <VendorIcon name={item.creator} size={14} />
              <span
                className="text-xs font-medium max-w-[8rem] truncate"
                title={item.name}
              >
                {item.name}
              </span>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="text-muted-foreground hover:text-foreground px-1 text-sm leading-none"
                aria-label={`移除 ${item.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={clear}
            className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1.5"
          >
            清空
          </button>
          <a
            href={`/compare?ids=${ids}`}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            开始对比
          </a>
        </div>
      </div>
    </div>
  );
}
