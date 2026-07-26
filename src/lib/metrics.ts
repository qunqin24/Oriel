import type { LanguageModel } from "./types.ts";
import type { Dict } from "@/i18n";
import type { Locale } from "@/i18n";
import {
  formatDate,
  formatNumber,
  formatPrice,
  formatSeconds,
  NO_VALUE,
} from "./format.ts";

/**
 * 指标的单一事实来源。
 *
 * 榜单、模型页、对比页都从这里取值、取方向、取格式化方式。
 * 旧站在三个地方各写一遍取值逻辑，结果同一个数在不同页面精度不一致。
 */

export type MetricId =
  | "intelligence"
  | "coding"
  | "agentic"
  | "value"
  | "priceIn"
  | "priceOut"
  | "throughput"
  | "ttft"
  | "release";

export type MetricDef = {
  id: MetricId;
  get: (model: LanguageModel) => number | null;
  higherIsBetter: boolean;
  label: (dict: Dict) => string;
  format: (value: number | null, locale: Locale) => string;
};

/**
 * 性价比 = 可用评测分的平均 ÷ 每百万输出 token 价格。
 *
 * 至少要有两项评测分才算——只有一项时这个比值噪音太大，
 * 一个只测过智能指数的便宜小模型会凭空登顶。
 */
export function valueScore(model: LanguageModel): number | null {
  const scores = [
    model.evaluations.artificial_analysis_intelligence_index,
    model.evaluations.artificial_analysis_coding_index,
    model.evaluations.artificial_analysis_agentic_index,
  ].filter((score): score is number => score != null && Number.isFinite(score));

  const price = model.pricing?.price_1m_output_tokens;
  if (scores.length < 2 || price == null || !Number.isFinite(price) || price <= 0) {
    return null;
  }
  return scores.reduce((sum, score) => sum + score, 0) / scores.length / price;
}

function releaseTime(model: LanguageModel): number | null {
  if (!model.release_date) return null;
  const time = Date.parse(model.release_date);
  return Number.isNaN(time) ? null : time;
}

export const METRICS: Record<MetricId, MetricDef> = {
  intelligence: {
    id: "intelligence",
    get: (m) => m.evaluations.artificial_analysis_intelligence_index,
    higherIsBetter: true,
    label: (d) => d.models.cols.intelligence,
    format: (v, l) => formatNumber(v, l, 1),
  },
  coding: {
    id: "coding",
    get: (m) => m.evaluations.artificial_analysis_coding_index,
    higherIsBetter: true,
    label: (d) => d.models.cols.coding,
    format: (v, l) => formatNumber(v, l, 1),
  },
  agentic: {
    id: "agentic",
    get: (m) => m.evaluations.artificial_analysis_agentic_index,
    higherIsBetter: true,
    label: (d) => d.models.cols.agentic,
    format: (v, l) => formatNumber(v, l, 1),
  },
  value: {
    id: "value",
    get: valueScore,
    higherIsBetter: true,
    label: (d) => d.models.cols.value,
    format: (v, l) => formatNumber(v, l, 1),
  },
  priceIn: {
    id: "priceIn",
    get: (m) => m.pricing?.price_1m_input_tokens ?? null,
    higherIsBetter: false,
    label: (d) => d.models.cols.priceIn,
    format: (v) => formatPrice(v),
  },
  priceOut: {
    id: "priceOut",
    get: (m) => m.pricing?.price_1m_output_tokens ?? null,
    higherIsBetter: false,
    label: (d) => d.models.cols.priceOut,
    format: (v) => formatPrice(v),
  },
  throughput: {
    id: "throughput",
    get: (m) => m.performance?.median_output_tokens_per_second ?? null,
    higherIsBetter: true,
    label: (d) => d.models.cols.speed,
    format: (v, l) => formatNumber(v, l, 0),
  },
  ttft: {
    id: "ttft",
    get: (m) => m.performance?.median_time_to_first_token_seconds ?? null,
    higherIsBetter: false,
    label: (d) => d.models.cols.ttft,
    format: (v) => formatSeconds(v),
  },
  release: {
    id: "release",
    get: releaseTime,
    higherIsBetter: true,
    label: (d) => d.models.cols.release,
    format: (v, l) => (v == null ? NO_VALUE : formatDate(new Date(v).toISOString(), l)),
  },
};

/** 某个指标有多少模型有数据。稀疏度要摆在明面上，不能靠满屏破折号暗示。 */
export function coverage(models: LanguageModel[], metric: MetricId): number {
  const get = METRICS[metric].get;
  return models.filter((model) => get(model) != null).length;
}

export type Rank = { rank: number; total: number };

/** 在有该项数据的模型里排第几。没数据的不参与排名，也不占名次。 */
export function rankAmong(
  model: LanguageModel,
  models: LanguageModel[],
  metric: MetricId
): Rank | null {
  const { get, higherIsBetter } = METRICS[metric];
  const value = get(model);
  if (value == null) return null;

  const pool = models
    .map(get)
    .filter((v): v is number => v != null && Number.isFinite(v));
  if (pool.length === 0) return null;

  const better = pool.filter((v) => (higherIsBetter ? v > value : v < value)).length;
  return { rank: better + 1, total: pool.length };
}

/** 按指标排序，缺失值永远沉底——不管升序降序。 */
export function sortByMetric(
  models: LanguageModel[],
  metric: MetricId,
  direction: "asc" | "desc"
): LanguageModel[] {
  const get = METRICS[metric].get;
  return [...models].sort((a, b) => {
    const av = get(a);
    const bv = get(b);
    if (av == null && bv == null) return a.name.localeCompare(b.name);
    if (av == null) return 1;
    if (bv == null) return -1;
    return direction === "asc" ? av - bv : bv - av;
  });
}

export function bestBy(
  models: LanguageModel[],
  metric: MetricId
): LanguageModel | null {
  const { get, higherIsBetter } = METRICS[metric];
  let best: LanguageModel | null = null;
  let bestValue = higherIsBetter ? -Infinity : Infinity;
  for (const model of models) {
    const value = get(model);
    if (value == null || !Number.isFinite(value)) continue;
    if (higherIsBetter ? value > bestValue : value < bestValue) {
      best = model;
      bestValue = value;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ *
 * 能力前沿
 * ------------------------------------------------------------------ */

export type FrontierPoint = {
  slug: string;
  name: string;
  creator: string;
  /** 发布日期的毫秒时间戳 */
  time: number;
  date: string;
  intelligence: number;
  /** 该模型发布当天是否刷新了能力上界 */
  isFrontier: boolean;
};

/**
 * 每个「发布日期 + 智能指数」都有值的模型算一个点，
 * 按时间扫一遍，凡是刷新了历史最高分的就落在前沿线上。
 *
 * 前沿线是一条阶梯：能力上界只会被抬高，不会随某个弱模型的发布回落。
 */
export function frontier(models: LanguageModel[]): FrontierPoint[] {
  const points: FrontierPoint[] = [];
  for (const model of models) {
    const time = releaseTime(model);
    const intelligence = model.evaluations.artificial_analysis_intelligence_index;
    if (time == null || intelligence == null || !model.release_date) continue;
    points.push({
      slug: model.slug,
      name: model.name,
      creator: model.model_creator?.name ?? "",
      time,
      date: model.release_date,
      intelligence,
      isFrontier: false,
    });
  }

  // 同一天发布多个模型时，先看分高的——否则当天的低分模型会先把上界占掉。
  points.sort((a, b) => a.time - b.time || b.intelligence - a.intelligence);

  let ceiling = -Infinity;
  for (const point of points) {
    if (point.intelligence > ceiling) {
      point.isFrontier = true;
      ceiling = point.intelligence;
    }
  }
  return points;
}

/* ------------------------------------------------------------------ *
 * 同级更省的替代
 * ------------------------------------------------------------------ */

/**
 * 能力相当但更便宜的模型。
 *
 * 「相当」定义为智能指数不低于目标的 95%——差 5% 以内在实际使用中通常感觉不出来，
 * 但价格可能差一个数量级。这是本站最有实用价值的一个推导。
 */
export function cheaperAlternatives(
  model: LanguageModel,
  models: LanguageModel[],
  limit = 5
): LanguageModel[] {
  const intelligence = model.evaluations.artificial_analysis_intelligence_index;
  const price = model.pricing?.price_1m_output_tokens;
  if (intelligence == null || price == null || price <= 0) return [];

  const floor = intelligence * 0.95;
  return models
    .filter((candidate) => {
      if (candidate.id === model.id) return false;
      const candidateScore =
        candidate.evaluations.artificial_analysis_intelligence_index;
      const candidatePrice = candidate.pricing?.price_1m_output_tokens;
      return (
        candidateScore != null &&
        candidateScore >= floor &&
        candidatePrice != null &&
        candidatePrice > 0 &&
        candidatePrice < price
      );
    })
    .sort(
      (a, b) =>
        (a.pricing!.price_1m_output_tokens ?? 0) -
        (b.pricing!.price_1m_output_tokens ?? 0)
    )
    .slice(0, limit);
}
