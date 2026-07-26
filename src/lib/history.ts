import {
  METRIC_KEYS,
  readMetric,
  type Catalog,
  type CatalogEntry,
  type ChangeEvent,
  type EventLog,
  type HistoryMonth,
  type HistorySnapshot,
  type MetricKey,
} from "./history-schema.ts";

/**
 * data/history/ 的构建期读取。
 *
 * 全部走 import.meta.glob 而不是静态 import：历史目录可能还没生成
 * （比如新克隆的仓库还没跑过 backfill），那种情况下站点应该照常构建，
 * 只是所有时间维度的组件显示「历史积累中」。
 */

const historyFiles = import.meta.glob("../../data/history/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

function pick<T>(predicate: (fileName: string) => boolean): T[] {
  return Object.entries(historyFiles)
    .filter(([path]) => predicate(path.split("/").pop() ?? ""))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value as T);
}

const months = pick<HistoryMonth>((name) => /^\d{4}-\d{2}\.json$/.test(name));
const catalogs = pick<Catalog>((name) => name === "catalog.json");
const logs = pick<EventLog>((name) => name === "events.json");

export const CATALOG: Catalog = catalogs[0] ?? {};

/** 按日期升序的全部快照。 */
export const SNAPSHOTS: Array<{ date: string; snapshot: HistorySnapshot }> = months
  .flatMap((month) =>
    Object.entries(month.snapshots).map(([date, snapshot]) => ({ date, snapshot }))
  )
  .sort((a, b) => a.date.localeCompare(b.date));

export const SNAPSHOT_DATES: string[] = SNAPSHOTS.map((entry) => entry.date);

export const EVENTS: ChangeEvent[] = logs[0]?.events ?? [];

/**
 * 时间维度是否足够画趋势。
 *
 * 两个点能连成线但说明不了任何事；三个点起才值得画。
 * 低于这个数的地方一律显示「历史积累中」，而不是画一条误导性的直线。
 */
export const MIN_TREND_POINTS = 3;
export const hasTrend = SNAPSHOT_DATES.length >= MIN_TREND_POINTS;

export function catalogEntry(id: string): CatalogEntry | undefined {
  return CATALOG[id];
}

/** 每日收录量，用于侧栏的迷你趋势。 */
export const MODEL_COUNT_TREND: Array<{ date: string; count: number }> =
  SNAPSHOTS.map(({ date, snapshot }) => ({ date, count: snapshot.count }));

export type SeriesPoint = { date: string; value: number };

/**
 * 单个模型某项指标的时间序列，按指数版本切段。
 *
 * 换版后分数不可跨版本比较，所以返回的是若干独立段落而不是一条线——
 * 调用方各画各的，中间自然断开。价格类指标不受版本影响，永远只有一段。
 */
export function metricSeries(
  modelId: string,
  metric: MetricKey
): SeriesPoint[][] {
  const affectedByVersion =
    metric === "intelligence" || metric === "coding" || metric === "agentic";

  const segments: SeriesPoint[][] = [];
  let current: SeriesPoint[] = [];
  let version: number | null | undefined;

  for (const { date, snapshot } of SNAPSHOTS) {
    const tuple = snapshot.models[modelId];
    if (!tuple) {
      // 模型当天不在榜上（还没上架，或已下架）——断开而不是插值。
      if (current.length) segments.push(current);
      current = [];
      continue;
    }

    if (affectedByVersion && version !== undefined && snapshot.index_version !== version) {
      if (current.length) segments.push(current);
      current = [];
    }
    version = snapshot.index_version;

    const value = readMetric(tuple, metric);
    if (value == null) {
      if (current.length) segments.push(current);
      current = [];
      continue;
    }
    current.push({ date, value });
  }

  if (current.length) segments.push(current);
  return segments.filter((segment) => segment.length > 0);
}

/** 该模型是否有任何一项指标积累了足够画趋势的历史。 */
export function hasTrajectory(modelId: string): boolean {
  if (!hasTrend) return false;
  return METRIC_KEYS.some((metric) =>
    metricSeries(modelId, metric).some((segment) => segment.length >= MIN_TREND_POINTS)
  );
}

export type DayEvents = { date: string; events: ChangeEvent[] };

/** 变化流按天分组，最近的在前。 */
export function eventsByDay(limit?: number): DayEvents[] {
  const grouped = new Map<string, ChangeEvent[]>();
  for (const event of EVENTS) {
    const bucket = grouped.get(event.date);
    if (bucket) bucket.push(event);
    else grouped.set(event.date, [event]);
  }
  const days = [...grouped.entries()]
    .map(([date, events]) => ({ date, events }))
    .sort((a, b) => b.date.localeCompare(a.date));
  return limit == null ? days : days.slice(0, limit);
}

export function eventsForModel(modelId: string): ChangeEvent[] {
  return EVENTS.filter((event) => event.model.id === modelId);
}
