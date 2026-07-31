/**
 * 厂商名 -> lobehub/icons-static-svg 的图标 slug。
 *
 * 图标文件本身不在这里——构建前用 `pnpm sync:icons` 从
 * node_modules/@lobehub/icons-static-svg 拷贝进 public/vendor-icons/，
 * 组件只拼 /vendor-icons/{slug}.svg 这个静态路径，不在 JS 里内联 SVG。
 * 586 行的探索器表格里同一个厂商会出现几十次，内联的话每行都要付
 * 一次 SVG payload；走静态资源，浏览器只下载一次、缓存住。
 *
 * 没在这张表里的厂商——上游还没收录，或者本来就是小众/企业内部产品——
 * 组件会退化成首字母头像，不强行凑一个不准确的图标。
 */
export const VENDOR_ICON_SLUGS: Record<string, string> = {
  "AI21 Labs": "ai21",
  "Alibaba": "alibaba",
  "Allen Institute for AI": "ai2",
  "Amazon": "bedrock",
  "Anthropic": "anthropic",
  "Arcee AI": "arcee",
  "Baidu": "baidu",
  "ByteDance Seed": "bytedance",
  "Cohere": "cohere",
  "Deep Cogito": "deepcogito",
  "DeepSeek": "deepseek",
  "Google": "google",
  "IBM": "ibm",
  "InclusionAI": "antgroup",
  "Inception": "inception",
  "Kimi": "kimi",
  "KwaiKAT": "kwaikat",
  "Liquid AI": "liquid",
  "LongCat": "longcat",
  "Meta": "meta",
  "Microsoft": "microsoft",
  "MiniMax": "minimax",
  "Mistral": "mistral",
  "NVIDIA": "nvidia",
  "Nous Research": "nousresearch",
  "OpenAI": "openai",
  "OpenChat": "openchat",
  "Perplexity": "perplexity",
  "Snowflake": "snowflake",
  // 上游数据把 xAI 的厂商名写成了 "SpaceXAI"——不是真有这么个厂商，
  // Grok 系列模型全在这个 creator 名下，直接用 xAI 的图标。
  "SpaceXAI": "xai",
  "StepFun": "stepfun",
  "TII UAE": "tii",
  "Tencent": "tencent",
  "Upstage": "upstage",
  "Xiaomi": "xiaomimimo",
  "Z AI": "zai",
};

/**
 * 这些厂商没有真正的多色品牌版本可用（要么只有单色描边，要么彩色版
 * 是纯白只适合深色底）——不能指望 `fill="currentColor"` 自己跟主题变。
 *
 * `<img src="*.svg">` 加载的 SVG 是隔离文档，不继承宿主页面的
 * `color`，`currentColor` 在里面永远解析成初始值（黑），跟我们的
 * `data-theme` 毫无关系。真正能在两个主题下都看清楚，只能是预先烤好
 * 两份颜色、构建期存成两个文件，运行时用 CSS 的 `dark:` 变体切换可见性
 * ——和主题切换按钮那对太阳/月亮图标同一个套路，不依赖 JS。
 *
 * 见 scripts/sync-vendor-icons.ts：这些 slug 会生成
 * `{slug}-onlight.svg` / `{slug}-ondark.svg` 两个文件，而不是单一的
 * `{slug}.svg`。
 */
export const VENDOR_ICON_DUAL_TONE = new Set([
  "ai21",
  "anthropic",
  "ibm",
  "inception",
  "kimi",
  "kwaikat",
  "liquid",
  "nousresearch",
  "openai",
  "xai",
  "xiaomimimo",
  "zai",
]);

export function vendorIconSlug(creator: string): string | null {
  return VENDOR_ICON_SLUGS[creator] ?? null;
}

export function vendorInitial(creator: string): string {
  return creator.trim().charAt(0).toUpperCase() || "?";
}
