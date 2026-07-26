/**
 * 每日快照的紧凑存档格式与差分逻辑。
 *
 * 这个模块同时被抓取脚本（scripts/）和构建期前端（src/lib/history.ts）使用，
 * 所以只能是纯函数——不碰 fs、不碰 Astro 运行时、不 import 任何 JSON。
 *
 * 存储策略：按月分文件的**全量**快照，不做增量 delta。
 * 全量约 35KB/天、1MB/月；delta 能省一半空间，但重建逻辑是 bug 温床，
 * 在这个体积下不值得冒险。
 */

import type { LanguageModel } from "./types";

/** 每个模型每天存这 7 个数字，顺序固定，省掉重复的 key 名。 */
export const METRIC_KEYS = [
  "intelligence",
  "coding",
  "agentic",
  "priceIn",
  "priceOut",
  "throughput",
  "latency",
] as const;

export type MetricKey = (typeof METRIC_KEYS)[number];

type Tuple7<T> = [T, T, T, T, T, T, T];

/** 与 METRIC_KEYS 一一对应。null = 当天没有这项数据（不是 0）。 */
export type MetricTuple = Tuple7<number | null>;

export type HistorySnapshot = {
  /**
   * 智能指数版本。AA 换版时分数不可跨版本比较，
   * 趋势线必须在版本边界断开而不是连成一条误导性的曲线。
   */
  index_version: number | null;
  count: number;
  /** key 是模型 uuid（slug 会改，uuid 不会）。 */
  models: Record<string, MetricTuple>;
};

/** 一个月一个文件：data/history/2026-07.json */
export type HistoryMonth = {
  month: string;
  /** key 是 UTC 日期 "2026-07-26"。 */
  snapshots: Record<string, HistorySnapshot>;
};

export type ModelIdentity = {
  id: string;
  name: string;
  slug: string;
  creator: string;
};

/**
 * 每个模型的身份只存一份，不随快照重复。
 *
 * 快照里只有 id → 数字元组，没有名字。差分时需要知道下架模型叫什么，
 * 而它已经不在当天的数据里了——所以名录必须独立于快照长期保留。
 * 顺带白拿了 first_seen（Oriel 首次收录日）和 last_seen（判断是否已下架）。
 */
export type CatalogEntry = ModelIdentity & {
  first_seen: string;
  last_seen: string;
};

export type Catalog = Record<string, CatalogEntry>;

/** 用某一天的模型列表更新名录。名字会改（厂商改命名），以最新一次为准。 */
export function updateCatalog(
  catalog: Catalog,
  identities: ModelIdentity[],
  date: string
): Catalog {
  const next: Catalog = { ...catalog };
  for (const identity of identities) {
    const existing = next[identity.id];
    next[identity.id] = {
      ...identity,
      first_seen:
        existing && existing.first_seen < date ? existing.first_seen : date,
      last_seen: existing && existing.last_seen > date ? existing.last_seen : date,
    };
  }
  return next;
}

export function catalogIdentities(catalog: Catalog): Map<string, ModelIdentity> {
  return new Map(Object.entries(catalog).map(([id, entry]) => [id, entry]));
}

export type ChangeEventType = "added" | "removed" | "score" | "price";

export type ChangeEvent = {
  /** UTC 日期 "2026-07-26" */
  date: string;
  type: ChangeEventType;
  model: ModelIdentity;
  /** score / price 事件才有 */
  metric?: MetricKey;
  from?: number | null;
  to?: number | null;
  /** added 事件带上当时的智能指数，让变化流不用回查快照就能展示。 */
  intelligence?: number | null;
};

export type EventLog = {
  generated_at: string;
  /** 按日期倒序，同日内按类型与模型名排序。 */
  events: ChangeEvent[];
};

/**
 * 会产生变化事件的指标。
 *
 * 刻意排除 throughput 和 latency：它们是实测中位数，每天都在小幅漂移，
 * 纳入后会每天产生几百条噪音事件，把真正的新模型和降价淹掉。
 */
const EVENT_METRICS: readonly MetricKey[] = [
  "intelligence",
  "coding",
  "agentic",
  "priceIn",
  "priceOut",
];

const SCORE_METRICS: readonly MetricKey[] = ["intelligence", "coding", "agentic"];

/**
 * 变化要大到能在界面上看出来才值得记。
 * 分数显示到 1 位小数，所以 0.05 以下的抖动不算变化；
 * 价格是离散定价，任何变动都是真事件。
 */
function isMeaningfulChange(
  metric: MetricKey,
  from: number | null,
  to: number | null
): boolean {
  if (from == null && to == null) return false;
  // null ↔ 有值 都是真事件：拿到首次评测，或指标被撤下。
  if (from == null || to == null) return true;
  const threshold = SCORE_METRICS.includes(metric) ? 0.05 : 1e-9;
  return Math.abs(to - from) > threshold;
}

function metricIndex(metric: MetricKey): number {
  return METRIC_KEYS.indexOf(metric);
}

export function toMetricTuple(model: LanguageModel): MetricTuple {
  return [
    model.evaluations?.artificial_analysis_intelligence_index ?? null,
    model.evaluations?.artificial_analysis_coding_index ?? null,
    model.evaluations?.artificial_analysis_agentic_index ?? null,
    model.pricing?.price_1m_input_tokens ?? null,
    model.pricing?.price_1m_output_tokens ?? null,
    model.performance?.median_output_tokens_per_second ?? null,
    model.performance?.median_time_to_first_token_seconds ?? null,
  ];
}

export function toIdentity(model: LanguageModel): ModelIdentity {
  return {
    id: model.id,
    name: model.name,
    slug: model.slug,
    creator: model.model_creator?.name ?? "",
  };
}

export function readMetric(tuple: MetricTuple, metric: MetricKey): number | null {
  return tuple[metricIndex(metric)] ?? null;
}

/** ISO 时间戳 → UTC 日期。快照按 UTC 日归档，与 GitHub Action 的 cron 一致。 */
export function snapshotDate(isoTimestamp: string): string {
  return new Date(isoTimestamp).toISOString().slice(0, 10);
}

/** "2026-07-26" → "2026-07" */
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function buildSnapshot(
  models: LanguageModel[],
  indexVersion: number | null
): HistorySnapshot {
  const entries: Record<string, MetricTuple> = {};
  for (const model of models) {
    entries[model.id] = toMetricTuple(model);
  }
  return {
    index_version: indexVersion,
    count: models.length,
    models: entries,
  };
}

/**
 * 对比相邻两天，产出变化事件。
 *
 * identities 用累积名录（catalogIdentities），因为下架的模型已经不在当天数据里，
 * 只能从名录里查它叫什么。
 */
export function diffSnapshots(args: {
  date: string;
  previous: HistorySnapshot;
  current: HistorySnapshot;
  identities: Map<string, ModelIdentity>;
}): ChangeEvent[] {
  const { date, previous, current, identities } = args;
  const events: ChangeEvent[] = [];

  for (const [id, tuple] of Object.entries(current.models)) {
    const identity = identities.get(id);
    if (!identity) continue;

    const before = previous.models[id];
    if (!before) {
      events.push({
        date,
        type: "added",
        model: identity,
        intelligence: readMetric(tuple, "intelligence"),
      });
      continue;
    }

    // 指数换版后分数不可比，跨版本的分数变动一律不记，否则会把
    // 一次全站重新标定伪装成几百个模型同时涨跌。
    const versionChanged = previous.index_version !== current.index_version;

    for (const metric of EVENT_METRICS) {
      if (versionChanged && SCORE_METRICS.includes(metric)) continue;
      const from = readMetric(before, metric);
      const to = readMetric(tuple, metric);
      if (!isMeaningfulChange(metric, from, to)) continue;
      events.push({
        date,
        type: SCORE_METRICS.includes(metric) ? "score" : "price",
        model: identity,
        metric,
        from,
        to,
      });
    }
  }

  for (const id of Object.keys(previous.models)) {
    if (current.models[id]) continue;
    const identity = identities.get(id);
    if (!identity) continue;
    events.push({ date, type: "removed", model: identity });
  }

  return events;
}

const TYPE_ORDER: Record<ChangeEventType, number> = {
  added: 0,
  removed: 1,
  price: 2,
  score: 3,
};

/** 日期倒序；同日内新增在前，然后是下架、价格、分数。 */
export function sortEvents(events: ChangeEvent[]): ChangeEvent[] {
  return [...events].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      TYPE_ORDER[a.type] - TYPE_ORDER[b.type] ||
      a.model.name.localeCompare(b.model.name)
  );
}
