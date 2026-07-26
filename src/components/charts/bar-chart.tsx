import { VendorIcon } from "@/components/vendor-icon";
import { formatNumber, formatPrice, formatSeconds } from "@/lib/format";

type BarItem = {
  label: string;
  value: number | null;
  sub?: string;
  creator?: string | null;
  highlight?: boolean;
};

type Props = {
  items: BarItem[];
  /** Decimal places for values. Serializable — safe from Server Components. */
  digits?: number;
  barLabel?: string;
  valueFormat?: "number" | "price" | "seconds";
  valueSuffix?: string;
  lowerIsBetter?: boolean;
  showRank?: boolean;
};

export function BarChart({
  items,
  digits = 0,
  barLabel,
  valueFormat = "number",
  valueSuffix = "",
  lowerIsBetter = false,
  showRank = true,
}: Props) {
  const max = Math.max(...items.map((i) => i.value ?? 0), 0);
  const minPositive = Math.min(
    ...items
      .map((item) => item.value)
      .filter((value): value is number => value != null && value > 0)
  );
  if (!Number.isFinite(max) || max <= 0) return null;

  return (
    <div
      className="flex flex-col gap-2.5 sm:gap-3 min-w-0"
      aria-label={barLabel}
    >
      {items.map((item, index) => {
        const pct =
          item.value == null
            ? 0
            : lowerIsBetter && Number.isFinite(minPositive)
              ? (minPositive / item.value) * 100
              : (item.value / max) * 100;
        const formattedValue =
          item.value == null
            ? "—"
            : valueFormat === "price"
              ? formatPrice(item.value)
              : valueFormat === "seconds"
                ? formatSeconds(item.value)
                : `${formatNumber(item.value, digits)}${valueSuffix}`;

        return (
          <div
            className="flex items-center gap-2 sm:gap-4 text-sm min-w-0"
            key={`${item.label}-${index}`}
          >
            <div
              className="flex w-[42%] sm:w-1/3 min-w-0 max-w-44 sm:max-w-none sm:min-w-36 items-center gap-1.5 sm:gap-2.5"
              title={item.label}
            >
              {showRank ? (
                <span className="text-[10px] font-mono text-muted-foreground w-4 text-right shrink-0">
                  {index + 1}
                </span>
              ) : null}
              <VendorIcon
                name={item.creator}
                size={14}
                className="shrink-0"
              />
              <span className="flex flex-col min-w-0">
                <span
                  className={`text-foreground truncate text-[13px] sm:text-sm ${
                    item.highlight ? "font-semibold" : "font-medium"
                  }`}
                >
                  {item.label}
                </span>
                {item.sub ? (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {item.sub}
                  </span>
                ) : null}
              </span>
            </div>
            <div className="flex-1 h-2.5 bg-secondary rounded-sm overflow-hidden flex items-center min-w-12">
              <div
                className={`h-full rounded-sm transition-all ${
                  item.highlight
                    ? ""
                    : index === 0
                      ? "bg-primary"
                      : "bg-primary/40"
                }`}
                data-highlight={item.highlight ? "true" : undefined}
                style={{
                  width: `${Math.max(pct, 1.2)}%`,
                  background: item.highlight
                    ? "var(--oriel-gold)"
                    : undefined,
                }}
              />
            </div>
            <div className="w-12 sm:w-20 font-mono text-right font-medium text-foreground text-xs shrink-0">
              {formattedValue}
            </div>
          </div>
        );
      })}
    </div>
  );
}
