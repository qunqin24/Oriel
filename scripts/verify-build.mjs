/**
 * 构建产物验收。
 *
 * 全部基于 dist/ 的静态文件，不启动浏览器——本项目的验证一律走 CLI。
 * 每日数据刷新的 GitHub Action 会在 build 之后跑这个脚本，
 * 上游数据形状变了（比如某个榜单突然全空）能在提交前拦住。
 *
 *   pnpm verify
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import vm from "node:vm";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const read = (p) => fs.readFileSync(path.join(DIST, p), "utf8");
const exists = (p) => fs.existsSync(path.join(DIST, p));

let pass = 0;
let fail = 0;
const check = (label, ok, detail = "") => {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}${detail ? "  — " + detail : ""}`);
  ok ? pass++ : fail++;
};

function countPages(dir) {
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) n += countPages(path.join(dir, entry.name));
    else if (entry.name === "index.html") n += 1;
  }
  return n;
}

console.log("\n【2】页面数");
const total = countPages(DIST);
const enTotal = countPages(path.join(DIST, "en"));
check(`总页面 ${total}`, total > 1000);
check(`英文页面 ${enTotal}（应为总数的一半）`, enTotal === total / 2);
const modelCount = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/language-models.json"), "utf8")
).data.length;
check(
  `模型详情页 ${modelCount} × 2`,
  fs.readdirSync(path.join(DIST, "models")).length - 1 === modelCount
);

console.log("\n【4】零 JS 可读性");
const home = read("index.html");
check("首页无 island", !home.includes("<astro-island"));
check(
  "前沿图 SVG 在 HTML 里",
  home.includes('viewBox="0 0 900 340"') && (home.match(/<circle/g) || []).length > 500,
  `${(home.match(/<circle/g) || []).length} 个散点`
);
check("前沿兜底表格存在", (home.match(/<tbody>/g) || []).length >= 1);
check(
  "主榜 Top 10 在 HTML 里",
  (home.match(/href="\/models\/[^"]+"/g) || []).length >= 10
);
// 这几页允许有 Astro 的预取脚本（2.4KB），但绝不能拉进 React 运行时。
for (const p of ["index.html", "changes/index.html", "media/index.html", "about/index.html"]) {
  const html = read(p);
  check(`${p} 无 React island`, !html.includes("<astro-island"));
  check(
    `${p} 未加载 React 运行时`,
    !/src="[^"]*\/(client|react|jsx-runtime)\.[A-Za-z0-9_-]+\.js"/.test(html)
  );
}
const models = read("models/index.html");
check(
  "探索器 SSR 出全部 586 行（关掉 JS 也能读）",
  (models.match(/<tr class="border-b border-rule\/50/g) || []).length === modelCount
);

console.log("\n【5】双语");
const enHome = read("en/index.html");
check('zh lang="zh-CN"', home.includes('<html lang="zh-CN"'));
check('en lang="en"', enHome.includes('<html lang="en"'));
check("zh 用中文导航", home.includes("语言模型") && !home.includes(">Language models<"));
check("en 用英文导航", enHome.includes("Language models") && !enHome.includes("观测台"));
const zhAlt = home.match(/hreflang="en" href="([^"]+)"/)?.[1];
const enAlt = enHome.match(/hreflang="zh-Hans" href="([^"]+)"/)?.[1];
check("hreflang 互指", zhAlt?.endsWith("/en") && enAlt?.endsWith("/"), `${zhAlt} ⇄ ${enAlt}`);
const zhModel = read("models/glm-4-5v/index.html");
const enModel = read("en/models/glm-4-5v/index.html");
check("模型页双语都存在且内容不同", zhModel.length > 0 && enModel.length > 0 && zhModel !== enModel);
// 吞吐量数值每天随上游刷新变化，不能硬编码具体数字——只校验中英文两页渲染的是同一个数。
const zhThroughput = zhModel.match(/([\d,.]+)\s*token\/秒/)?.[1];
const enThroughput = enModel.match(/([\d,.]+)\s*tokens\/sec/)?.[1];
check(
  "模型页数值一致（吞吐量）",
  !!zhThroughput && zhThroughput === enThroughput,
  `${zhThroughput} ⇄ ${enThroughput} tok/s`
);

console.log("\n【6】稀疏度降级");
// 动态挑一个三项评测全空的模型，不写死 slug——上游随时会改。
const allModels = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/language-models.json"), "utf8")
).data;
const sparseModel = allModels.find(
  (m) =>
    !m.evaluations.artificial_analysis_intelligence_index &&
    !m.evaluations.artificial_analysis_coding_index &&
    !m.evaluations.artificial_analysis_agentic_index &&
    !m.pricing
);
const sparse = sparseModel ? read(`models/${sparseModel.slug}/index.html`) : "";
check(`稀疏模型页能构建 (${sparseModel?.slug ?? "无此类模型"})`, !sparseModel || sparse.length > 1000);
check("显示「未评测」而不是空白", !sparseModel || sparse.includes("未评测"));
check(
  "无价格时显示说明而不是空区块",
  !sparseModel || sparse.includes("尚未发布该模型的这项数据")
);
check("不出现满屏破折号", !sparseModel || (sparse.match(/—/g) || []).length < 12);

console.log("\n【7】历史降级");
const days = Object.keys(
  JSON.parse(fs.readFileSync(path.join(ROOT, "data/history/2026-07.json"), "utf8")).snapshots
).length;
check(`历史 ${days} 天`, days >= 1);
check(
  "无变化的指标显示文字而不是平线",
  sparse.includes("天记录内无变化") || zhModel.includes("天记录内无变化")
);
const changes = read("changes/index.html");
const eventCount = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/history/events.json"), "utf8")
).events.length;
check(`变化页渲染了 ${eventCount} 条事件`, eventCount === 0 || changes.includes("条变化"));
check(
  "价格下降标为上涨色（对使用者是好事）",
  changes.includes("text-rise")
);

console.log("\n【额外】诚实性与主题");
const media = read("media/index.html");
check(
  "语音转文本标出并列数（该榜排不出先后）",
  media.includes("并列最优")
);
check("Elo 榜画出置信区间误差须", (media.match(/border-x border-mute/g) || []).length > 50);
const css = fs.readdirSync(path.join(DIST, "_astro")).find((f) => f.endsWith(".css"));
const cssText = fs.readFileSync(path.join(DIST, "_astro", css), "utf8");
// Tailwind 会把属性选择器的引号压掉，两种写法都算通过。
// 不校验具体色值——配色会调，这里只确认深色主题的变量块确实产出了。
// 简约白在 :root 上，是默认主题。
check(
  "深色主题变量存在",
  /\[data-theme=["']?dark["']?\][^{]*\{[^}]*--ground:/.test(cssText)
);
check(
  "dark: 变体已编译（主题图标切换靠它）",
  /\[data-theme=["']?dark["']?\][^{]*\{[^}]*display:(block|none)/.test(cssText)
);
check("默认主题是简约白", /:root\{[^}]*--ground:\s*#fff/i.test(cssText));
check("reduced-motion 已处理", cssText.includes("prefers-reduced-motion"));
check("跳到主内容链接存在", home.includes("跳到主要内容"));

// 首帧画布色：必须在样式表之前定好，否则深色主题每次导航会闪一次白底。
const headOnly = home.slice(0, home.indexOf("</head>"));
const scriptAt = headOnly.indexOf("__orielGround");
const cssAt = headOnly.indexOf('rel="stylesheet"');
check(
  "首帧脚本排在样式表之前",
  scriptAt !== -1 && cssAt !== -1 && scriptAt < cssAt
);

// 这两个色值是 global.css 里 --ground 的副本，必须一致，
// 否则首帧会是一个颜色、样式表加载完跳成另一个。
const inlineGround = Object.fromEntries(
  [...headOnly.matchAll(/(dark|light):\s*"(#[0-9a-f]{6})"/gi)].map((m) => [
    m[1],
    m[2].toLowerCase(),
  ])
);
const cssGround = {
  // 简约白在 :root（默认），深色在 [data-theme=dark]
  light: cssText.match(/:root\{[^}]*?--ground:\s*(#[0-9a-f]{3,6})/i)?.[1]?.toLowerCase(),
  dark: cssText
    .match(/\[data-theme=["']?dark["']?\][^{]*\{[^}]*?--ground:\s*(#[0-9a-f]{3,6})/i)?.[1]
    ?.toLowerCase(),
};
// Tailwind 可能把 #ffffff 压成 #fff，比较时归一化
const norm = (c) =>
  c && c.length === 4 ? "#" + [...c.slice(1)].map((x) => x + x).join("") : c;
check(
  "首帧画布色与 CSS 的 --ground 一致",
  inlineGround.dark === norm(cssGround.dark) &&
    inlineGround.light === norm(cssGround.light),
  `内联 ${inlineGround.light}/${inlineGround.dark} vs CSS ${norm(cssGround.light)}/${norm(cssGround.dark)}`
);

const themeHtml = read("index.html");
const head = themeHtml.slice(0, themeHtml.indexOf("</head>"));
const script = [...head.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1])
  .find((s) => s.includes("__orielGround"));

check("产物里能找到首帧主题脚本", !!script);

/** 最小 DOM：只实现这段脚本用到的部分。 */
function makeRoot() {
  return { dataset: {}, style: {} };
}

function run(storedTheme) {
  const listeners = {};
  const root = makeRoot();
  const store = new Map();
  if (storedTheme) store.set("oriel-theme", storedTheme);

  const context = {
    window: {},
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, v),
    },
    document: {
      documentElement: root,
      addEventListener: (name, fn) => {
        (listeners[name] ??= []).push(fn);
      },
    },
  };
  context.window.localStorage = context.localStorage;
  context.window.matchMedia = () => ({ matches: false });
  vm.createContext(context);
  vm.runInContext(script, context);

  return { root, listeners, context };
}

console.log("\n【客户端路由】");
for (const p of ["index.html", "changes/index.html", "models/index.html"]) {
  const html = read(p);
  check(
    `${p} 装了 ClientRouter`,
    /src="[^"]*ClientRouter[^"]*\.js"/.test(html)
  );
}
check(
  "主题挂在 before-swap 而不是 after-swap（after 会先闪一帧旧主题）",
  home.includes("astro:before-swap") && !home.includes("astro:after-swap")
);

console.log("\n【榜单返回时不闪总览】");
/*
 * /models 的静态 HTML 永远是「总览」那一屏。带 ?dim=… 回来时，
 * ClientRouter 先交换 DOM 再更新 location，交换后那一帧会被视图过渡
 * 完整持有——所以必须在交换前把探索器藏起来，等 React 渲染出目标维度
 * 再揭开。三个环节缺一不可，任何一环失配都会让总览重新闪出来。
 */
for (const p of ["models/index.html", "en/models/index.html"]) {
  const html = read(p);
  const cid = html.match(/<div data-explorer-mount (data-astro-cid-[a-z0-9]+)>/)?.[1];
  check(`${p} 探索器有挂载点`, Boolean(cid), cid ?? "缺 data-explorer-mount");
  check(
    `${p} 隐藏规则的作用域与挂载点一致`,
    Boolean(cid) &&
      html.includes(`[${cid}][data-explorer-mount][data-pending]{visibility:hidden}`)
  );
  check(
    `${p} 在 before-swap 时标记待定（不能等到 after-swap）`,
    html.includes("astro:before-swap") && html.includes("data-explorer-mount")
  );
}
const explorerBundle = fs
  .readdirSync(path.join(DIST, "_astro"))
  .find((f) => f.startsWith("model-explorer.") && f.endsWith(".js"));
check(
  "岛屿水合后会揭开（否则内容永远藏着）",
  Boolean(explorerBundle) &&
    read(`_astro/${explorerBundle}`).includes("[data-explorer-mount][data-pending]")
);

console.log("\n【主题在软导航中的存活】");
{
  const { root } = run(null);
  check(
    "未存储偏好时默认简约白",
    root.dataset.theme === "light" &&
      root.style.backgroundColor === "#ffffff" &&
      root.style.colorScheme === "light",
    `theme=${root.dataset.theme} bg=${root.style.backgroundColor}`
  );
}
{
  const { root } = run("dark");
  check(
    "存储了 dark 时还原深色",
    root.dataset.theme === "dark" && root.style.backgroundColor === "#171c26",
    `theme=${root.dataset.theme} bg=${root.style.backgroundColor}`
  );
}


{
  const { listeners, context } = run("dark");
  check("注册了 astro:before-swap 监听", !!listeners["astro:before-swap"]?.length);

  // 模拟 ClientRouter：新文档的 <html> 是干净的，没有 data-theme
  const incoming = makeRoot();
  listeners["astro:before-swap"][0]({ newDocument: { documentElement: incoming } });
  check(
    "交换前已把主题写进新文档",
    incoming.dataset.theme === "dark" &&
      incoming.style.backgroundColor === "#171c26" &&
      incoming.style.colorScheme === "dark",
    `theme=${incoming.dataset.theme} bg=${incoming.style.backgroundColor}`
  );

  // swapRootAttributes 会把新文档的属性搬到当前根上——搬过去的已经是对的
  check(
    "搬过去的属性就是最终状态（不需要二次修正）",
    incoming.dataset.theme === "dark" && incoming.style.backgroundColor !== ""
  );

  // 重复执行不应重复注册（Astro 判定同内容脚本已执行，但防御性检查）
  vm.runInContext(script, context);
  check(
    "脚本重跑不会重复注册监听",
    listeners["astro:before-swap"].length === 1,
    `监听数 ${listeners["astro:before-swap"].length}`
  );
}


{
  const { listeners, context, root } = run(null);
  // 模拟用户点了切换：写 localStorage + 改当前根
  context.localStorage.setItem("oriel-theme", "dark");
  root.dataset.theme = "dark";

  const incoming = makeRoot();
  listeners["astro:before-swap"][0]({ newDocument: { documentElement: incoming } });
  check(
    "切换后的选择在下一次导航中保持",
    incoming.dataset.theme === "dark" &&
      incoming.style.backgroundColor === "#171c26",
    `theme=${incoming.dataset.theme}`
  );
}

console.log("\n【猫榜】第三方社区数据");
check("/cat-board 页面存在", exists("cat-board/index.html"));
check("/en/cat-board 页面存在", exists("en/cat-board/index.html"));
if (exists("cat-board/index.html")) {
  const catHtml = read("cat-board/index.html");
  check("含来源仓库链接", catHtml.includes("llm2014/llm_benchmark"));
  check("无 React island（这页也不该加载 React）", !catHtml.includes("<astro-island"));
  check(
    "无 React 运行时",
    !/src="[^"]*\/(client|react|jsx-runtime)\.[A-Za-z0-9_-]+\.js"/.test(catHtml)
  );

  const catBoardFile = path.join(ROOT, "data", "cat-board.json");
  if (fs.existsSync(catBoardFile)) {
    const catBoard = JSON.parse(fs.readFileSync(catBoardFile, "utf8"));
    // 三个面板在源视图里顺序固定（logic → code → vision），用「下一个面板的
    // 起始位置」而不是固定字节数做右边界——固定窗口在表格大小不均时
    // 会截断大的、又会把小的那份和下一个面板的行混进来数。
    const order = ["logic", "code", "vision"];
    const starts = order.map((id) => catHtml.indexOf(`data-panel="${id}"`));
    order.forEach((id, index) => {
      const category = catBoard.categories?.[id];
      if (!category) return;
      const from = starts[index];
      const to = index + 1 < starts.length ? starts[index + 1] : catHtml.length;
      const chunk = catHtml.slice(from, to);
      const rendered = (chunk.match(/<tr class="border-b border-rule\/50">/g) || [])
        .length;
      check(
        `${id} 类目渲染了全部 ${category.rows.length} 行`,
        rendered === category.rows.length
      );
    });
  } else {
    // 没跑过 fetch:cat-board 时，页面必须能优雅降级，而不是构建失败。
    check("data/cat-board.json 缺失时页面仍显示降级提示", catHtml.includes("暂时不可用"));
  }
}

console.log("\n【额外】内链完整性");
const linkRe = /href="(\/(?:en\/)?(?:models|changes|media|compare|about)[^"#?]*)"/g;
const seen = new Set();
for (const file of ["index.html", "models/index.html", "changes/index.html", "media/index.html", "about/index.html"]) {
  for (const m of read(file).matchAll(linkRe)) seen.add(m[1]);
}
const broken = [...seen].filter((href) => {
  const clean = href.replace(/\/$/, "");
  return !exists(path.join(clean, "index.html")) && !exists(clean + ".html");
});
check(`站内链接全部有对应产物（检查 ${seen.size} 个）`, broken.length === 0, broken.slice(0, 5).join(", "));

console.log("\n【额外】体积");
for (const p of ["index.html", "models/index.html", "media/index.html"]) {
  const raw = read(p);
  const gz = zlib.gzipSync(raw).length;
  check(`${p} gzip ${(gz / 1024).toFixed(1)}KB`, gz < 70 * 1024);
}
const js = fs
  .readdirSync(path.join(DIST, "_astro"))
  .filter((f) => f.endsWith(".js"))
  .map((f) => ({ f, size: fs.statSync(path.join(DIST, "_astro", f)).size }));
const biggestApp = js.filter((x) => !x.f.startsWith("client.")).sort((a, b) => b.size - a.size)[0];
check(
  `最大业务 JS ${biggestApp.f} ${(biggestApp.size / 1024).toFixed(1)}KB（数据集未被打包）`,
  biggestApp.size < 40 * 1024
);

console.log(`\n────────────\n通过 ${pass} · 失败 ${fail}\n`);
process.exit(fail ? 1 : 0);
