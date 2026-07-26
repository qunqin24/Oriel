# Oriel

Oriel（奥瑞尔）是一个独立 AI 模型观测站 —— *A window into machine intelligence*。

它汇总 Artificial Analysis 的公开评测，每天抓一次快照并**留档**，因此除了「现在谁最强」，还能回答「这几天发生了什么变化」。语言模型是重心，图像、视频、语音、音乐 11 个竞技场收敛在一页里。

站点是纯静态的，中英双语（中文在根路径，英文在 `/en/`）。

## 技术栈

Astro 7 + React 19 islands + Tailwind 4 + TypeScript，pnpm 管理依赖。

**Astro 7 超出多数模型的训练数据，改代码前请先读 [AGENTS.md](AGENTS.md)。**

## 常用命令

```bash
pnpm dev                # 本地开发
pnpm check              # Astro + TypeScript 检查
pnpm build              # 构建到 dist/
pnpm verify             # 校验构建产物（见下）
pnpm preview            # 预览生产构建
pnpm fetch:data         # 抓取当日快照（需要 AA_API_KEY）
pnpm backfill:history   # 从 git 历史回填快照存档
```

部署域名通过 `SITE_URL` 传入。设了才会产出 sitemap，hreflang 也才是绝对地址：

```bash
SITE_URL=https://your-domain pnpm build
```

## 数据

`scripts/fetch-data.ts` 每天 00:23 UTC 由 GitHub Action 运行，写两处：

- `data/*.json` —— 当日快照，覆盖写入（12 个榜单）
- `data/history/` —— **累积存档**
  - `YYYY-MM.json` 每月一个文件，每天一份紧凑快照（每模型 7 个数字，约 49KB/天）
  - `catalog.json` 模型名录，含已下架的，附 `first_seen` / `last_seen`
  - `events.json` 与前一日差分出的变化事件（新增 / 下架 / 分数 / 价格）

站点的时间维度全部建立在 `data/history/` 上。它是 2026-07 才开始积累的 —— 在此之前每天的抓取直接覆盖了前一天，最早的几天是用 `backfill-history.ts` 从 git commit 里捞回来的。

历史尚短时，趋势图与变化流会明说「历史积累中」，不会画一条误导性的线。

### 猫榜（第三方社区数据）

`/cat-board` 页面展示 [llm2014/llm_benchmark](https://github.com/llm2014/llm_benchmark) 的民间自费评测——不是 Oriel 自己的数据。`scripts/fetch-cat-board.ts` 从 `raw.githubusercontent.com` 拉取 logic/code/vision 三个类目各自最新一期的 CSV，写入 `data/cat-board.json`。

这份数据源没有 LICENSE、由个人独立维护、三个类目的表结构本身在源仓库历史上都变过（logic 的表头换过 4 次，code 从打分制改版成了 v3 的 Pass/Fail + 字母评级）。所以处理上刻意保守：

- 只取每个类目**最新一期**，不追历史、不画跨版本的趋势
- 单元格是源站已经格式化好的字符串，原样显示，不重新计分或解读
- `data/cat-board.json` 缺失或过期时页面优雅降级（显示「暂时不可用」），不影响其余 1000+ 页的构建
- GH Action 里这一步是 `continue-on-error`——第三方源挂了不该拖垮当天的主数据更新

## 结构

```
src/
  i18n/          中英字典（zh.ts 是形状定义，en.ts 由 TS 强制对齐）
  lib/           数据加载、指标定义、历史读取、格式化
  components/    UI（.astro 为主，React 仅用于必须交互的部分）
  views/         整页内容，被 zh 与 en 两套路由复用
  pages/         路由；src/pages/en/ 是英文镜像
scripts/         数据抓取、历史回填、产物校验
data/            快照与历史存档
```

## 验证

本项目不使用浏览器工具，验收一律走 CLI：

```bash
pnpm build && pnpm verify
```

`pnpm verify` 检查 60+ 项，包括页面数、双语一致性、内链完整性、产物体积，以及几件容易悄悄退化的事：

- **内容不依赖 JS** —— 全部内容都在 HTML 里，关掉 JS 也读得到（榜单的 586 行是全的、前沿图是内联 SVG）。首页、变化、媒体、方法、猫榜几页只加载 Astro 运行时（路由 13.3KB + 预取 2.4KB），不碰 React
- **稀疏度降级** —— 只有 198/586 个模型有编程指数，未评测必须显示「未评测」而不是留白或破折号
- **历史降级** —— 数据点不足时不画趋势线
- **第三方数据降级** —— 猫榜数据缺失或过期时页面显示提示，不影响其余页面构建
- **主题在软导航中存活** —— 模拟 `astro:before-swap` 的真实流程，确认深浅主题不会在切页时被清空

每日 Action 在提交数据前会跑这套检查，上游数据形状变了能在入库前拦住。
