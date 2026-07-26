import { href, type Dict, type Locale } from "@/i18n";

export type NavKey =
  | "home"
  | "models"
  | "changes"
  | "media"
  | "catBoard"
  | "compare"
  | "about";

export type NavItem = {
  key: NavKey;
  path: string;
  label: (dict: Dict) => string;
};

export const NAV: NavItem[] = [
  { key: "home", path: "/", label: (d) => d.nav.home },
  { key: "models", path: "/models", label: (d) => d.nav.models },
  { key: "changes", path: "/changes", label: (d) => d.nav.changes },
  { key: "media", path: "/media", label: (d) => d.nav.media },
  { key: "catBoard", path: "/cat-board", label: (d) => d.nav.catBoard },
  { key: "compare", path: "/compare", label: (d) => d.nav.compare },
  { key: "about", path: "/about", label: (d) => d.nav.about },
];

export function navHref(item: NavItem, locale: Locale): string {
  return href(locale, item.path);
}

/** 模型详情页高亮「语言模型」，所以 models 用前缀匹配，首页必须精确匹配。 */
export function isActive(item: NavItem, activeKey: NavKey | undefined): boolean {
  return item.key === activeKey;
}
