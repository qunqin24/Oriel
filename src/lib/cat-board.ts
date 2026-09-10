/**
 * 猫榜——llm2014/llm_benchmark 的民间自费评测数据。
 *
 * 这不是 Oriel 自己的评测，是第三方社区数据，来源仓库没有 LICENSE、
 * 由个人独立维护、表结构历史上已经改过好几次。所以这里的加载必须是
 * 防御性的：data/cat-board.json 可能不存在（还没跑过 fetch:cat-board）、
 * 可能过期（拉取失败，Action 里 continue-on-error）、可能类别缺失。
 * 任何一种情况下页面都应该优雅降级，而不是让整个 1000+ 页的构建失败。
 *
 * 用 import.meta.glob 而不是静态 import，理由与 history.ts 一致。
 */
import type { Locale } from "@/i18n";

const files = import.meta.glob("../../data/cat-board.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

export type CatBoardCategory = {
  reportDate: string;
  headers: string[];
  rows: string[][];
};

export type CatBoardData = {
  fetched_at: string;
  source_repo: string;
  source_site: string;
  categories: Partial<Record<"logic" | "code" | "vision", CatBoardCategory>>;
};

const raw = Object.values(files)[0] as CatBoardData | undefined;

export const CAT_BOARD: CatBoardData | null = raw ?? null;

export function catBoardCategory(
  id: "logic" | "code" | "vision"
): CatBoardCategory | null {
  return CAT_BOARD?.categories[id] ?? null;
}

/**
 * 已知表头的中英双语对照。
 *
 * 源数据的表头本身不统一——logic/vision 用中文表头，code_v3 用英文表头
 * （"Model" 而不是"模型"），且历史上换过好几次——所以两种语言都要翻，
 * 而不是只在英文页面翻、中文页面原样透传源表头。翻不到的表头原样显示，
 * 不因为一次表头改动就让页面出现空白列名。
 */
const HEADER_LABELS: Record<string, { zh: string; en: string }> = {
  模型: { zh: "模型", en: "Model" },
  Model: { zh: "模型", en: "Model" },
  极限分数: { zh: "极限分数", en: "Peak score" },
  中位分数: { zh: "中位分数", en: "Median score" },
  中位差距: { zh: "中位差距", en: "Peak–median gap" },
  变更: { zh: "变更", en: "Change" },
  较上次变更: { zh: "变更", en: "Change" },
  "平均耗时(秒)": { zh: "平均耗时(秒)", en: "Avg. time (s)" },
  "平均耗时/s": { zh: "平均耗时(秒)", en: "Avg. time (s)" },
  Token: { zh: "Token", en: "Tokens" },
  平均Token: { zh: "平均 Token", en: "Avg. tokens" },
  "测试成本(元)": { zh: "测试成本(元)", en: "Cost (CNY)" },
  成本: { zh: "成本(元)", en: "Cost (CNY)" },
  "价格(元/百万)": { zh: "价格(元/百万)", en: "Price (CNY/1M)" },
  发布时间: { zh: "发布时间", en: "Released" },
  // 这一列的值是"这次测试有没有开启模型的思考/推理模式"，不是模型
  // 本身支不支持推理——同一个模型常常会出现两行，一行推理关一行推理开。
  // 表头写短一点（"推理模式"在窄列里会换行成两截）。
  Think: { zh: "推理", en: "Reasoning" },

  // code_v3 的项目分类名。源仓库自己没给这几个配中文——连作者的双语
  // 前端也是英文原样展示，没有官方译名可抄。字母后缀是题目编号，照抄
  // 源站的编号习惯保留。"Simple Model(H)" 具体所指没有任何文档说明，
  // 这里是按字面直译，不是确认过的准确含义。
  "MacOS App(C)": { zh: "MacOS 应用(C)", en: "MacOS App(C)" },
  "Flutter(D)": { zh: "Flutter(D)", en: "Flutter(D)" },
  "Web(E)": { zh: "Web 应用(E)", en: "Web(E)" },
  "Game(F)": { zh: "游戏(F)", en: "Game(F)" },
  "Rust App(G)": { zh: "Rust 应用(G)", en: "Rust App(G)" },
  "Simple Model(H)": { zh: "简单模型(H)", en: "Simple Model(H)" },
  "iOS+Server(I)": { zh: "iOS+服务端(I)", en: "iOS+Server(I)" },
  Unprompted: { zh: "无提示完成", en: "Unprompted" },
  "IDE/CLI": { zh: "使用工具", en: "IDE/CLI" },
};

export function headerLabel(header: string, locale: Locale): string {
  return HEADER_LABELS[header]?.[locale] ?? header;
}

export function isThinkHeader(header: string): boolean {
  return header.trim().toLowerCase() === "think";
}

/**
 * Think 列的取值语义抄自源站前端（isThinkRow）：
 * "1" 或 "true"（大小写不敏感）算开启推理，其余（含空值）都算没开启。
 */
export function isThinkOn(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true";
}

/**
 * 模型名 -> 厂商标识，用来复用 vendor-icons.ts 那套 lobe 图标。
 *
 * 猫榜的数据只有模型名，没有 model_creator 字段，所以这里按家族前缀
 * 反推厂商，返回值必须是 VENDOR_ICON_SLUGS 的 key（站点别处用的同一批
 * 厂商名），才能解析到图标。返回值 null 表示上游没收录或无法判断，
 * 组件会退化成首字母头像，不硬凑一个不准确的图标。
 *
 * 顺序即优先级，锚定在字符串开头，避免 "MiMo" 被 "MiniMax" 之类误伤。
 * 源站模型命名会变（社区独立维护），新增家族时补一条，不在表里的自然降级。
 */
const MODEL_VENDORS: Array<[RegExp, string]> = [
  [/^GPT/i, "OpenAI"],
  [/^(Fable|Opus|Sonnet)/i, "Anthropic"],
  [/^(Gemini|Gemma)/i, "Google"],
  [/^Qwen/i, "Alibaba"],
  [/^DeepSeek/i, "DeepSeek"],
  [/^Kimi/i, "Kimi"],
  [/^GLM/i, "Z AI"],
  [/^Grok/i, "SpaceXAI"],
  [/^Seed/i, "ByteDance Seed"],
  [/^MiniMax/i, "MiniMax"],
  [/^(Hy3|Hunyuan)/i, "Tencent"],
  [/^Ling/i, "InclusionAI"],
  [/^MiMo/i, "Xiaomi"],
  [/^Step/i, "StepFun"],
  [/^ERNIE/i, "Baidu"],
  [/^LongCat/i, "LongCat"],
  [/^Mistral/i, "Mistral"],
  [/^Muse/i, "Meta"],
];

export function catBoardVendor(model: string): string | null {
  const name = model.trim();
  for (const [pattern, vendor] of MODEL_VENDORS) {
    if (pattern.test(name)) return vendor;
  }
  return null;
}

/**
 * 分数列与变更列的表头识别。
 *
 * logic 与 vision 都有「极限分数 / 中位分数」，code_v3 没有——识别不到就
 * 不画条形、不画区间图，页面对第三种表结构保持原样。
 *
 * 变更列在源数据里叫过「变更」也出现过「较上次变更」，两种都认。
 */
const PEAK_HEADERS = new Set(["极限分数"]);
const MEDIAN_HEADERS = new Set(["中位分数"]);
const GAP_HEADERS = new Set(["中位差距"]);
const CHANGE_HEADERS = new Set(["变更", "较上次变更"]);

export function scoreKind(header: string): "peak" | "median" | null {
  if (PEAK_HEADERS.has(header)) return "peak";
  if (MEDIAN_HEADERS.has(header)) return "median";
  return null;
}

export function isChangeHeader(header: string): boolean {
  return CHANGE_HEADERS.has(header);
}

/** 把「+25.1% / -3.2%」解析成正/负，缺失值（—、-、空）返回 null。 */
export function changeDirection(value: string): "up" | "down" | null {
  const trimmed = value.trim();
  if (!/\d/.test(trimmed)) return null;
  if (trimmed.startsWith("+")) return "up";
  if (trimmed.startsWith("-") || trimmed.startsWith("−")) return "down";
  return null;
}

export type CatBoardRangeRow = {
  name: string;
  /** 极限分数 */
  peak: number;
  /** 中位分数 */
  median: number;
  /** 源站已格式化好的「中位差距」，没有该列时为 null */
  gap: string | null;
};

/**
 * 抽出「极限分数 vs 中位分数」的区间数据，按极限分数降序。
 *
 * 这是猫榜最值得可视化的一组数：极限高但中位塌陷，说明模型不稳定；
 * 两个点的距离就是这个落差。数值解析失败的行直接跳过，不猜。
 * 表头里缺任一分数字段就返回 null，code_v3 那条路径不会走到这里。
 */
export function catBoardRange(
  category: CatBoardCategory
): { rows: CatBoardRangeRow[]; total: number } | null {
  const peakIndex = category.headers.findIndex((h) => PEAK_HEADERS.has(h));
  const medianIndex = category.headers.findIndex((h) => MEDIAN_HEADERS.has(h));
  if (peakIndex < 0 || medianIndex < 0) return null;

  const gapIndex = category.headers.findIndex((h) => GAP_HEADERS.has(h));
  const rows: CatBoardRangeRow[] = [];

  for (const row of category.rows) {
    const name = (row[0] ?? "").trim();
    const peak = Number.parseFloat(row[peakIndex] ?? "");
    const median = Number.parseFloat(row[medianIndex] ?? "");
    if (!name || !Number.isFinite(peak) || !Number.isFinite(median)) continue;
    rows.push({
      name,
      peak,
      median,
      gap: gapIndex >= 0 ? row[gapIndex]?.trim() || null : null,
    });
  }

  if (rows.length === 0) return null;
  rows.sort((a, b) => b.peak - a.peak);
  return { rows, total: rows.length };
}
