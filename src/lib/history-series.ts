import { readMetric, type HistorySnapshot, type MetricKey } from "./history-schema.ts";

const VERSION_INDEPENDENT: readonly MetricKey[] = [
  "priceIn",
  "priceOut",
  "throughput",
  "latency",
  "throughputMean",
  "latencyMean",
  "answerLatencyMean",
];

export type SeriesPoint = { date: string; value: number };

/**
 * 单个模型某项指标的时间序列，按指数版本切段。
 *
 * 换版后分数不可跨版本比较，所以返回的是若干独立段落而不是一条线——
 * 调用方各画各的，中间自然断开。价格与实测性能不受版本影响，只会被缺失数据切断。
 */
export function buildMetricSeries(
  snapshots: Array<{ date: string; snapshot: HistorySnapshot }>,
  modelId: string,
  metric: MetricKey
): SeriesPoint[][] {
  // 只有价格和实测性能与指数版本无关。分数类（含行业指数）同属一套评测；
  // 评测成本取决于指数包含哪些题，换版后同样不可跨版本比较。
  const affectedByVersion = !VERSION_INDEPENDENT.includes(metric);

  const segments: SeriesPoint[][] = [];
  let current: SeriesPoint[] = [];
  let version: number | null | undefined;

  for (const { date, snapshot } of snapshots) {
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

