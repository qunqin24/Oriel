import type { Locale } from "@/i18n";

/**
 * 数字与日期的格式化。
 *
 * 全部显式接收 locale——构建期会为两种语言各渲染一遍，
 * 依赖运行时区域设置会让 zh 和 en 的产物随构建机器变化。
 */

const INTL_LOCALE: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en-US",
};

/** 数据快照的展示时区，与 history-schema.snapshotDate、GitHub Action cron 一致。 */
export const SNAPSHOT_TIMEZONE = "Asia/Shanghai";

/** 缺失值统一显示成破折号，而不是 0 或空白——「没测」和「是 0」是两回事。 */
export const NO_VALUE = "—";

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function formatNumber(
  value: number | null | undefined,
  locale: Locale,
  digits = 1
): string {
  if (!isNumber(value)) return NO_VALUE;
  return value.toLocaleString(INTL_LOCALE[locale], {
    maximumFractionDigits: digits,
    minimumFractionDigits: Number.isInteger(value) ? 0 : Math.min(digits, 1),
  });
}

export function formatInteger(
  value: number | null | undefined,
  locale: Locale
): string {
  if (!isNumber(value)) return NO_VALUE;
  return Math.round(value).toLocaleString(INTL_LOCALE[locale]);
}

/**
 * 价格跨越四个数量级（$0.0001 到 $600），固定小数位不是塌就是溢。
 * 按量级调整精度，保证便宜的模型不显示成 $0.00。
 */
export function formatPrice(value: number | null | undefined): string {
  if (!isNumber(value)) return NO_VALUE;
  if (value === 0) return "$0";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(3)}`;
  if (value < 100) return `$${value.toFixed(2)}`;
  return `$${Math.round(value)}`;
}

export function formatSeconds(value: number | null | undefined): string {
  if (!isNumber(value)) return NO_VALUE;
  if (value < 1) return `${Math.round(value * 1000)}ms`;
  return `${value.toFixed(2)}s`;
}

export function formatDate(
  value: string | null | undefined,
  locale: Locale
): string {
  if (!value) return NO_VALUE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(INTL_LOCALE[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** 榜单和轨迹里用的紧凑日期：2026-07-26 → 07-26 */
export function formatDayMonth(value: string): string {
  return value.slice(5);
}

export function formatDateTime(
  value: string | null | undefined,
  locale: Locale
): string {
  if (!value) return NO_VALUE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(INTL_LOCALE[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

/** ISO 时间戳 → 本地化快照日期（北京时间日历日）。 */
export function formatSnapshotDate(
  value: string | null | undefined,
  locale: Locale
): string {
  if (!value) return NO_VALUE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(INTL_LOCALE[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: SNAPSHOT_TIMEZONE,
  });
}

/** ISO 时间戳 → 本地化快照日期时间（北京时间）。 */
export function formatSnapshotDateTime(
  value: string | null | undefined,
  locale: Locale
): string {
  if (!value) return NO_VALUE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(INTL_LOCALE[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: SNAPSHOT_TIMEZONE,
  });
}

/** 带符号的变化百分比，用于变化流。 */
export function formatDelta(
  from: number | null | undefined,
  to: number | null | undefined
): string {
  if (!isNumber(from) || !isNumber(to) || from === 0) return NO_VALUE;
  const pct = ((to - from) / Math.abs(from)) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(pct >= 10 || pct <= -10 ? 0 : 1)}%`;
}

export function formatYear(value: string | null | undefined): string {
  if (!value) return NO_VALUE;
  return value.slice(0, 4);
}
