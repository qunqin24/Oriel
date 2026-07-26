import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

/*
 * 部署域名。sitemap 和 hreflang 需要绝对地址，Astro 只能从 site 拿到它。
 * 没设置时站点照常构建，只是不产出 sitemap，hreflang 退化为相对链接。
 *
 *   SITE_URL=https://oriel.example pnpm build
 */
const site = process.env.SITE_URL;

export default defineConfig({
  ...(site ? { site } : {}),

  devToolbar: { enabled: false },

  i18n: {
    locales: ["zh", "en"],
    defaultLocale: "zh",
    // 中文在根路径，英文在 /en/。静态构建下 src/pages/en/ 是显式镜像，
    // 不依赖任何运行时重写。
    routing: { prefixDefaultLocale: false },
  },

  build: {
    // 默认是 1，预渲染走串行循环。本站约 1200 个页面，不调这个值构建会慢很多。
    concurrency: 8,
  },

  /*
   * 站内链接在悬停时预取。
   *
   * 本站没有客户端路由，每次点击都是完整的页面导航——服务端只要 1-5ms，
   * 但浏览器要重新下载解析整页。悬停到点击之间通常有 100-300ms，
   * 足够把 HTML 拉进缓存，点击时就直接从缓存渲染。
   *
   * 策略必须是 hover 而不是 viewport：/models 一屏里有几百个模型链接，
   * viewport 会一次性预取几百个页面。
   */
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },

  integrations: [
    react(),
    ...(site
      ? [
          sitemap({
            i18n: {
              defaultLocale: "zh",
              locales: { zh: "zh-CN", en: "en" },
            },
          }),
        ]
      : []),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
