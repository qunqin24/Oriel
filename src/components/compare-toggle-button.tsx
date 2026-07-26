"use client";

import { useCompare, type CompareItem } from "@/lib/compare-store";

type Props = {
  item: CompareItem;
  className?: string;
  size?: "sm" | "md";
};

export function CompareToggleButton({
  item,
  className = "",
  size = "md",
}: Props) {
  const { has, toggle, count, max, ready } = useCompare();
  const active = ready && has(item.id);
  const full = count >= max && !active;

  const sizeCls =
    size === "sm"
      ? "text-[11px] px-2 py-1"
      : "text-xs px-4 py-2";

  return (
    <button
      type="button"
      disabled={!ready || full}
      onClick={() => {
        const ok = toggle(item);
        if (!ok) return;
      }}
      title={
        full
          ? `最多对比 ${max} 个模型`
          : active
            ? "从对比中移除"
            : "加入对比"
      }
      className={`font-semibold rounded-md whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${sizeCls} ${
        active
          ? "border border-oriel-gold/45 bg-oriel-gold/10 text-oriel-gold hover:bg-oriel-gold/15"
          : "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
      } ${className}`}
    >
      {active ? "已加入对比" : "+ 加入对比"}
    </button>
  );
}
