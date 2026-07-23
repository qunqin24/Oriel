export function formatNumber(
  value: number | null | undefined,
  digits = 1
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("zh-CN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: Number.isInteger(value) ? 0 : Math.min(digits, 1),
  });
}

export function formatPrice(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (value === 0) return "$0";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(3)}`;
  return `$${formatNumber(value, 2)}`;
}

export function formatSeconds(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (value < 1) return `${(value * 1000).toFixed(0)}ms`;
  return `${formatNumber(value, 2)}s`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelativeFetched(iso: string | undefined): string {
  if (!iso) return "未知";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Higher is better by default. Returns 1-based rank and "Top X%" label. */
export function rankAmong(
  value: number | null | undefined,
  pool: Array<number | null | undefined>,
  higherIsBetter = true
): { rank: number; total: number; topLabel: string } | null {
  if (value == null || Number.isNaN(value)) return null;
  const valid = pool.filter(
    (v): v is number => v != null && !Number.isNaN(v)
  );
  if (valid.length === 0) return null;

  const better = higherIsBetter
    ? valid.filter((v) => v > value).length
    : valid.filter((v) => v < value).length;
  const rank = better + 1;
  const topPct = Math.max(1, Math.ceil((rank / valid.length) * 100));
  return {
    rank,
    total: valid.length,
    topLabel: `Top ${topPct}%`,
  };
}
