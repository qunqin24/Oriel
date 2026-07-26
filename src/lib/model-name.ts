/**
 * 模型名括号后缀里已知词汇的中文化。
 *
 * 括号内容是 Artificial Analysis 的 name 字段本身，不是独立字段，
 * 没有稳定的分隔规则——有的只有一个词 "(max)"，有的是复合描述
 * "(Adaptive Reasoning, High Effort)"，还混着日期戳 "(Dec '24)"、
 * 模型变体 "(ChatGPT)"、版本号 "(V1)"、模型尺寸 "(32B)"。
 * 硬翻整个括号风险很大：翻错一个日期或版本号，显示的名字就跟上游、
 * 跟其他榜单核对不上了。
 *
 * 所以只翻这份已核实的词表——基于 data/language-models.json 里实际出现的
 * 48 个括号词条整理，覆盖全部语义清晰的推理模式/强度等级/发布状态词，
 * 日期、版本号、模型代号一律原样保留，不猜、不强行覆盖。
 *
 * 只用于展示。搜索、排序、URL 一律用原始 name，不要在那些地方调用这个函数——
 * 用户搜 "high" 或分享一个带 ?q=high 的链接，必须还能命中原始字符串。
 */
const KNOWN_TOKENS: Record<string, string> = {
  reasoning: "推理",
  "non-reasoning": "非推理",
  "adaptive reasoning": "自适应推理",
  high: "高",
  medium: "中",
  low: "低",
  xhigh: "超高",
  minimal: "最低",
  max: "最大",
  "max effort": "最大强度",
  "high effort": "高强度",
  "medium effort": "中强度",
  "low effort": "低强度",
  "xhigh effort": "超高强度",
  vision: "视觉",
  preview: "预览",
  beta: "测试版",
  experimental: "实验性",
};

/**
 * 整段翻不出来时的兜底：段落里可能是「模型代号 + 普通词」的混合，
 * 比如 "Opus 4.8 Fallback"——"Opus 4.8" 是模型代号不能动，但 "Fallback"
 * 本身是个清晰独立的词，值得单独换掉。用 \b 词边界匹配，避免误伤
 * 模型代号里恰好包含这几个字母的情况（比如不会去匹配 "Max" 里的 "ax"）。
 */
const PARTIAL_WORDS: Array<[RegExp, string]> = [
  [/\bfallback\b/i, "回退"],
];

function translateToken(token: string): string {
  const trimmed = token.trim();
  const exact = KNOWN_TOKENS[trimmed.toLowerCase()];
  if (exact) return exact;

  let partial = trimmed;
  for (const [pattern, zh] of PARTIAL_WORDS) {
    partial = partial.replace(pattern, zh);
  }
  return partial;
}

/**
 * 把模型名里能识别的括号后缀翻成中文，翻不到的词原样保留在原括号里——
 * 一个括号里中英文混排（比如"(自适应推理, Dec '24)"）是预期行为，
 * 不是半成品：宁可翻一半，也不猜没把握的部分。
 */
export function localizeModelName(name: string): string {
  return name.replace(/\(([^)]+)\)/g, (_match, inner: string) => {
    const parts = inner.split(",").map((part) => translateToken(part));
    return `(${parts.join(", ")})`;
  });
}
