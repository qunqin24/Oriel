import { METRICS, type MetricId } from "./metrics.ts";

/**
 * 探索器的表格配置。
 *
 * 这个文件**不能** import data.ts。探索器是客户端 island，
 * 任何被它 import 到的模块都会进浏览器包——把 data.ts 拉进来
 * 就等于把 585KB 的完整数据集打包发给每个访客。
 * 真正的行数据在 explorer.ts 里构建，只在构建期使用。
 */

export type ExplorerRow = {
  slug: string;
  name: string;
  creator: string;
  intelligence: number | null;
  coding: number | null;
  agentic: number | null;
  value: number | null;
  priceIn: number | null;
  priceOut: number | null;
  throughput: number | null;
  ttft: number | null;
  /** 原始日期字符串，排序时再转时间戳——比存毫秒数省一半字节。 */
  release: string | null;
  finance: number | null;
  strategy: number | null;
  legal: number | null;
  healthcare: number | null;
  engineering: number | null;
  economics: number | null;
  indexCost: number | null;
  taskCost: number | null;
};

export type ColumnId = MetricId | "name";

export const DIMENSIONS = [
  "overview",
  "intelligence",
  "coding",
  "agentic",
  "value",
  "speed",
  "domains",
  "cost",
] as const;

export type Dimension = (typeof DIMENSIONS)[number];

export type Focus = MetricId | readonly MetricId[] | null;

export const DOMAIN_METRICS = [
  "finance",
  "strategy",
  "legal",
  "healthcare",
  "engineering",
  "economics",
] as const satisfies readonly MetricId[];

/**
 * 每个维度显示哪些列，以及默认按哪列排序。
 *
 * 维度不只是换排序——它换的是「这一屏在回答什么问题」。
 * 看编程能力时不需要首字延迟，看速度时不需要智能体分数。
 * focus 非空时，没有该项数据的模型直接不进表。focus 可以是一组指标，
 * 此时只要其中任意一项有值就留下（行业评测各项覆盖不齐，不能只认其中一项）。
 */
export const DIMENSION_COLUMNS: Record<
  Dimension,
  { columns: ColumnId[]; sort: ColumnId; focus: Focus }
> = {
  overview: {
    columns: [
      "name",
      "intelligence",
      "coding",
      "agentic",
      "priceOut",
      "throughput",
      "release",
    ],
    sort: "intelligence",
    focus: null,
  },
  intelligence: {
    columns: ["name", "intelligence", "priceOut", "throughput", "release"],
    sort: "intelligence",
    focus: "intelligence",
  },
  coding: {
    columns: ["name", "coding", "intelligence", "priceOut", "release"],
    sort: "coding",
    focus: "coding",
  },
  agentic: {
    columns: ["name", "agentic", "intelligence", "priceOut", "release"],
    sort: "agentic",
    focus: "agentic",
  },
  value: {
    columns: ["name", "value", "intelligence", "priceOut", "release"],
    sort: "value",
    focus: "value",
  },
  speed: {
    columns: ["name", "throughput", "ttft", "priceOut", "intelligence"],
    sort: "throughput",
    focus: "throughput",
  },
  // 行业评测：六个领域并排。任何一项有分的模型都留在表里，
  // 默认按工程（覆盖最广的一项）排序，其余各列点表头即可重排。
  domains: {
    columns: [
      "name",
      "intelligence",
      "finance",
      "strategy",
      "legal",
      "healthcare",
      "engineering",
      "economics",
    ],
    sort: "engineering",
    focus: DOMAIN_METRICS,
  },
  cost: {
    columns: ["name", "indexCost", "taskCost", "intelligence", "priceOut", "release"],
    sort: "indexCost",
    focus: "indexCost",
  },
};

/** 排序方向的默认值取自 METRICS，避免和详情页、对比页的「最优」判定说法不一。 */
export const HIGHER_IS_BETTER: Record<MetricId, boolean> = {
  intelligence: METRICS.intelligence.higherIsBetter,
  coding: METRICS.coding.higherIsBetter,
  agentic: METRICS.agentic.higherIsBetter,
  finance: METRICS.finance.higherIsBetter,
  strategy: METRICS.strategy.higherIsBetter,
  legal: METRICS.legal.higherIsBetter,
  healthcare: METRICS.healthcare.higherIsBetter,
  engineering: METRICS.engineering.higherIsBetter,
  economics: METRICS.economics.higherIsBetter,
  indexCost: METRICS.indexCost.higherIsBetter,
  taskCost: METRICS.taskCost.higherIsBetter,
  value: METRICS.value.higherIsBetter,
  priceIn: METRICS.priceIn.higherIsBetter,
  priceOut: METRICS.priceOut.higherIsBetter,
  throughput: METRICS.throughput.higherIsBetter,
  ttft: METRICS.ttft.higherIsBetter,
  release: METRICS.release.higherIsBetter,
};

/*
 * 行数据在传给 island 时压成定长数组。
 *
 * 586 行 × 12 个字段名，光是重复的 key 名就有约 84KB，而 Astro 序列化 props 时
 * 还要做 HTML 转义（引号变成 &quot;），进一步膨胀。表格内容已经 SSR 成 HTML 了，
 * props 只是给水合用的同一份数据——不该再付一次字段名的钱。
 */
export const ROW_FIELDS = [
  "slug",
  "name",
  "creator",
  "intelligence",
  "coding",
  "agentic",
  "value",
  "priceIn",
  "priceOut",
  "throughput",
  "ttft",
  "release",
  "finance",
  "strategy",
  "legal",
  "healthcare",
  "engineering",
  "economics",
  "indexCost",
  "taskCost",
] as const;

export type PackedRow = [
  string, // slug
  string, // name
  string, // creator
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  string | null, // release
  number | null, // finance
  number | null, // strategy
  number | null, // legal
  number | null, // healthcare
  number | null, // engineering
  number | null, // economics
  number | null, // indexCost
  number | null, // taskCost
];

export function packRow(row: ExplorerRow): PackedRow {
  return [
    row.slug,
    row.name,
    row.creator,
    row.intelligence,
    row.coding,
    row.agentic,
    row.value,
    row.priceIn,
    row.priceOut,
    row.throughput,
    row.ttft,
    row.release,
    row.finance,
    row.strategy,
    row.legal,
    row.healthcare,
    row.engineering,
    row.economics,
    row.indexCost,
    row.taskCost,
  ];
}

export function unpackRow(packed: PackedRow): ExplorerRow {
  const [
    slug,
    name,
    creator,
    intelligence,
    coding,
    agentic,
    value,
    priceIn,
    priceOut,
    throughput,
    ttft,
    release,
    finance,
    strategy,
    legal,
    healthcare,
    engineering,
    economics,
    indexCost,
    taskCost,
  ] = packed;
  return {
    slug,
    name,
    creator,
    intelligence,
    coding,
    agentic,
    value,
    priceIn,
    priceOut,
    throughput,
    ttft,
    release,
    finance,
    strategy,
    legal,
    healthcare,
    engineering,
    economics,
    indexCost,
    taskCost,
  };
}

export function rowValue(row: ExplorerRow, column: ColumnId): number | null {
  if (column === "name") return null;
  if (column === "release") {
    if (!row.release) return null;
    const time = Date.parse(row.release);
    return Number.isNaN(time) ? null : time;
  }
  return row[column];
}

/** 该行在给定 focus 下是否有数据可看。focus 为空表示不过滤。 */
export function hasFocusData(row: ExplorerRow, focus: Focus): boolean {
  if (focus == null) return true;
  const ids: readonly MetricId[] = typeof focus === "string" ? [focus] : focus;
  return ids.some((id) => rowValue(row, id) != null);
}
