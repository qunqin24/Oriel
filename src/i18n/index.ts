import { zh } from "./zh.ts";
import { en } from "./en.ts";

export const LOCALES = ["zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "zh";

/**
 * zh 用 `as const` 写，值是字面量类型；直接拿它当字典类型会要求 en 的每个值
 * 与中文一字不差。Widen 把叶子放宽成 string，同时保留键的结构。
 */
type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

export type Dict = Widen<typeof zh>;

const DICTS: Record<Locale, Dict> = { zh, en };

export function t(locale: Locale): Dict {
  return DICTS[locale];
}

/** 从 URL 路径判断语言。/en 与 /en/... 是英文，其余都是中文。 */
export function localeFromPath(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "zh";
}

/**
 * 生成某语言下的链接。
 *
 * 刻意不用 astro:i18n 的 getRelativeLocaleUrl——它的尾斜杠行为受 trailingSlash
 * 配置影响，而站内链接必须完全可预测。这里的规则只有一条：中文在根，英文加 /en 前缀。
 */
export function href(locale: Locale, path: string): string {
  const clean = path === "" || path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? "/en" : `/en${clean}`;
}

/** 把当前路径换成另一种语言的对应路径，用于语言切换按钮。 */
export function swapLocale(pathname: string, target: Locale): string {
  const bare = pathname === "/en" ? "/" : pathname.replace(/^\/en(?=\/)/, "");
  return href(target, bare || "/");
}

/** 填充 {name} 占位符。 */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  );
}

export const HTML_LANG: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en",
};
