import {
  getImageToVideo,
  getLanguageModels,
  getMusicInstrumental,
  getOverviewStats,
  getTextToImage,
  getTextToSpeech,
  getTextToVideo,
} from "@/lib/data";
import {
  formatDate,
  formatNumber,
  formatPrice,
  formatSeconds,
} from "@/lib/format";
import { MetricCard } from "@/components/ui/metric-card";
import { VendorIcon } from "@/components/vendor-icon";
import { BarChart } from "@/components/charts/bar-chart";

type NamedEntry = {
  name: string;
  model_creator?: { name: string } | null;
};

function LeadingModel({
  name,
  creator,
}: {
  name: string;
  creator?: string | null;
}) {
  return (
    <span className="font-medium text-foreground truncate inline-flex items-center gap-1.5 min-w-0">
      <VendorIcon name={creator} size={14} className="shrink-0" />
      <span className="truncate" data-tip={name}>
        {name}
      </span>
    </span>
  );
}

function SectionHeader({
  title,
  note,
  bordered = false,
}: {
  title: string;
  note: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={`flex items-end justify-between gap-3 mb-1 sm:mb-2 ${
        bordered ? "border-b border-border pb-2" : ""
      }`}
    >
      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      <span className="terminal-label shrink-0">{note}</span>
    </div>
  );
}

/** ChartPanel 同款容器,但 note 是指向完整榜单页的链接。 */
function LeaderboardPanel({
  title,
  href,
  note,
  children,
}: {
  title: string;
  href: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="instrument-panel px-4 py-4 sm:px-6 sm:py-6 md:px-8 flex flex-col gap-3 sm:gap-4 min-w-0">
      <header className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <h3 className="terminal-label !text-[11px] text-foreground/80 leading-snug">
            {title}
          </h3>
          <a
            href={href}
            className="font-mono text-[11px] sm:text-xs text-muted-foreground hover:text-oriel-gold transition-colors px-2 py-0.5 rounded w-fit max-w-full border hairline-border"
          >
            {note}
          </a>
        </div>
      </header>
      <div className="pt-1 sm:pt-2 min-w-0 overflow-x-auto">{children}</div>
    </section>
  );
}

export function HomePage() {
  const stats = getOverviewStats();
  const llm = getLanguageModels();
  const { highlights } = stats;

  const languageItems = llm.data.slice(0, 10).map((m, i) => ({
    label: m.name,
    value: m.evaluations.artificial_analysis_intelligence_index,
    creator: m.model_creator?.name,
    highlight: i === 0,
  }));

  const mediaBoards = [
    {
      title: "图像 · 文生图",
      href: "/image",
      items: getTextToImage().data.slice(0, 5),
    },
    {
      title: "视频 · 文生视频",
      href: "/video",
      items: getTextToVideo().data.slice(0, 5),
    },
    {
      title: "语音 · 文生语音",
      href: "/speech",
      items: getTextToSpeech().data.slice(0, 5),
    },
    {
      title: "音乐 · 纯音乐",
      href: "/music",
      items: getMusicInstrumental().data.slice(0, 5),
    },
  ];

  const modalityCards: {
    title: string;
    href: string;
    count: number;
    top?: NamedEntry | null;
  }[] = [
    { title: "语言模型", href: "/llm", count: stats.counts.language, top: stats.top.language },
    { title: "图像生成", href: "/image", count: stats.counts.image, top: stats.top.image },
    { title: "视频生成", href: "/video", count: stats.counts.video, top: stats.top.video },
    { title: "语音模型", href: "/speech", count: stats.counts.speech, top: stats.top.speech },
    { title: "音乐生成", href: "/music", count: stats.counts.music, top: stats.top.music },
  ];

  return (
    <div className="flex flex-col gap-10 sm:gap-16 max-w-6xl mx-auto py-4 sm:py-10">
      {/* Hero */}
      <section className="relative flex flex-col gap-6 sm:gap-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl leading-[1.08] sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
            A window into
            <br />
            machine intelligence
            <span className="text-oriel-gold">.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mt-4 sm:mt-5 leading-relaxed max-w-2xl">
            独立观察与记录 AI 模型的能力、成本、速度与演进。打破黑盒迷雾,为模型选型提供精准的数据依据。
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <a
            href="/llm"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors w-full sm:w-auto"
          >
            查看语言模型榜单
          </a>
          <a
            href="/compare"
            className="inline-flex items-center justify-center px-5 py-2.5 border hairline-border text-foreground font-medium rounded-md hover:bg-secondary/50 transition-colors w-full sm:w-auto"
          >
            对比模型
          </a>
        </div>
        {/* 终端状态行 */}
        <div className="instrument-panel flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 font-mono text-[11px] sm:text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2 text-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-oriel-gold opacity-60"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-oriel-gold"></span>
            </span>
            数据快照 {formatDate(stats.fetchedAt)}
          </span>
          <span>收录 {formatNumber(stats.totalModels, 0)} 模型</span>
          <span>5 大模态 · 12 组数据集</span>
          <span className="hidden sm:inline">Oriel Index v{stats.intelligenceIndexVersion ?? "4.1"}</span>
          <span className="ml-auto hidden md:inline text-muted-foreground/70">
            来源 Artificial Analysis
          </span>
        </div>
      </section>

      {/* 今日观察摘要 */}
      <section className="flex flex-col gap-4">
        <SectionHeader title="今日观察摘要" note="Top Insights" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <a href="/llm" className="group">
            <MetricCard
              label="智能领先"
              value={formatNumber(
                highlights.topIntelligence?.evaluations
                  .artificial_analysis_intelligence_index,
                1
              )}
              subValue={highlights.topIntelligence?.name}
              className="h-full group-hover:border-oriel-gold/50 transition-colors cursor-pointer"
            />
          </a>
          <a href="/llm" className="group">
            <MetricCard
              label="编程领先"
              value={formatNumber(
                highlights.topCoding?.evaluations
                  .artificial_analysis_coding_index,
                1
              )}
              subValue={highlights.topCoding?.name}
              className="h-full group-hover:border-oriel-gold/50 transition-colors cursor-pointer"
            />
          </a>
          <a href="/llm" className="group">
            <MetricCard
              label="性价比优选"
              value={formatPrice(
                highlights.topValue?.pricing?.price_1m_output_tokens
              )}
              subValue={
                highlights.topValue
                  ? `${highlights.topValue.name} · 输出价/M`
                  : undefined
              }
              className="h-full group-hover:border-oriel-gold/50 transition-colors cursor-pointer"
            />
          </a>
          <a href="/llm" className="group">
            <MetricCard
              label="速度最快 (TTFT)"
              value={formatSeconds(
                highlights.fastest?.performance
                  ?.median_time_to_first_token_seconds
              )}
              subValue={highlights.fastest?.name}
              className="h-full group-hover:border-oriel-gold/50 transition-colors cursor-pointer"
            />
          </a>
          <a href="#modalities" className="group">
            <MetricCard
              label="收录模型"
              value={formatNumber(stats.totalModels, 0)}
              subValue="五大模态 · 12 组数据集"
              className="h-full group-hover:border-oriel-gold/50 transition-colors cursor-pointer"
            />
          </a>
        </div>
      </section>

      {/* 各模态榜单 */}
      <section className="flex flex-col gap-4">
        <SectionHeader title="各模态榜单" note="Leaderboards" bordered />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          <LeaderboardPanel
            title="语言 · 智能指数"
            href="/llm"
            note="Top 10 · 查看全部 →"
          >
            <BarChart
              items={languageItems}
              digits={1}
              barLabel="语言模型智能指数 Top 10"
            />
          </LeaderboardPanel>
          {mediaBoards.map((board) => (
            <LeaderboardPanel
              key={board.title}
              title={board.title}
              href={board.href}
              note="Top 5 · 查看全部 →"
            >
              <BarChart
                items={board.items.map((m, i) => ({
                  label: m.name,
                  value: m.elo,
                  creator: m.model_creator?.name,
                  highlight: i === 0,
                }))}
                digits={0}
                barLabel={`${board.title} Top 5`}
              />
            </LeaderboardPanel>
          ))}
          {/* 数据脉搏 */}
          <section className="instrument-panel px-4 py-4 sm:px-6 sm:py-6 md:px-8 flex flex-col gap-3 sm:gap-4 min-w-0">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground leading-snug">
                数据脉搏
              </h3>
              <p className="font-mono text-[11px] sm:text-xs px-2 py-0.5 rounded w-fit max-w-full bg-oriel-gold/15 text-foreground border border-oriel-gold/40">
                Oriel Index v{stats.intelligenceIndexVersion ?? "2.1"}
              </p>
            </header>
            <dl className="flex flex-col divide-y divide-border/60 pt-1 sm:pt-2 text-sm">
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">收录模型</dt>
                <dd className="mono-data font-medium text-foreground">
                  {formatNumber(stats.totalModels, 0)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">覆盖模态</dt>
                <dd className="mono-data font-medium text-foreground">
                  5 大模态 · 12 组数据集
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">数据快照</dt>
                <dd className="mono-data font-medium text-foreground">
                  {formatDate(stats.fetchedAt)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">数据来源</dt>
                <dd className="font-medium text-foreground text-right text-[13px]">
                  Artificial Analysis 独立评测
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </section>

      {/* 模态总览 */}
      <section id="modalities" className="flex flex-col gap-4 scroll-mt-20">
        <SectionHeader title="模态总览" note="Modalities" bordered />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {modalityCards.map((card) => (
            <a
              key={card.href}
              href={card.href}
              className="instrument-panel p-4 hover:border-oriel-gold/50 transition-colors group flex flex-col justify-between gap-4 min-h-28"
            >
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold text-sm text-foreground group-hover:text-oriel-gold transition-colors">
                  {card.title}
                </h3>
                <span className="font-mono text-xs text-muted-foreground shrink-0">
                  {card.count}
                </span>
              </div>
              <div className="pt-3 border-t hairline-border flex flex-col gap-1.5 text-xs">
                <span className="text-muted-foreground">当前领先</span>
                <LeadingModel
                  name={card.top?.name ?? "—"}
                  creator={card.top?.model_creator?.name}
                />
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
