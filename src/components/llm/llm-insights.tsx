import { ChartPanel } from "@/components/charts/chart-panel";
import { BarChart } from "@/components/charts/bar-chart";
import { IndexLeaderboard } from "@/components/index-leaderboard";
import { MetricCard } from "@/components/ui/metric-card";
import { formatNumber, formatPrice } from "@/lib/format";
import type { LanguageModel } from "@/lib/types";
import { getValueScoreMetrics } from "@/lib/value-score";

type Props = {
  models: LanguageModel[];
  intelligenceIndexVersion?: number | string;
};

function bestBy(
  models: LanguageModel[],
  scoreOf: (m: LanguageModel) => number | null | undefined,
  lowerIsBetter = false
): LanguageModel | null {
  return models.reduce<LanguageModel | null>((best, m) => {
    const score = scoreOf(m);
    if (score == null || !Number.isFinite(score)) return best;
    if (!best) return m;
    const bestScore = scoreOf(best) ?? (lowerIsBetter ? Infinity : -Infinity);
    return lowerIsBetter
      ? score < bestScore
        ? m
        : best
      : score > bestScore
        ? m
        : best;
  }, null);
}

/** /llm 洞察区块:SSR 纯展示,复用 ChartPanel/BarChart/IndexLeaderboard。 */
export function LlmInsights({ models, intelligenceIndexVersion }: Props) {
  const totalModels = models.length;
  const totalVendors = new Set(
    models.map((m) => m.model_creator?.name).filter(Boolean)
  ).size;

  const topIntelligence = bestBy(
    models,
    (m) => m.evaluations.artificial_analysis_intelligence_index
  );
  const topSpeed = bestBy(
    models,
    (m) => m.performance?.median_output_tokens_per_second
  );
  const lowestPrice = bestBy(
    models,
    (m) => {
      const p = m.pricing?.price_1m_output_tokens;
      return p != null && p > 0 ? p : null;
    },
    true
  );

  // 年度智能峰值
  const yearlyPeakMap = new Map<number, LanguageModel>();
  for (const model of models) {
    if (!model.release_date) continue;
    const year = new Date(model.release_date).getFullYear();
    const score = model.evaluations.artificial_analysis_intelligence_index;
    if (!Number.isFinite(year) || score == null) continue;
    const current = yearlyPeakMap.get(year);
    if (
      !current ||
      score >
        (current.evaluations.artificial_analysis_intelligence_index ??
          -Infinity)
    ) {
      yearlyPeakMap.set(year, model);
    }
  }
  const yearlyPeakItems = [...yearlyPeakMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, model], i, arr) => ({
      label: model.name,
      value: model.evaluations.artificial_analysis_intelligence_index,
      creator: model.model_creator?.name,
      sub: `${year} 年发布峰值`,
      highlight: i === arr.length - 1,
    }));

  const topSpeedItems = models
    .filter(
      (m) =>
        m.performance?.median_output_tokens_per_second != null &&
        m.performance.median_output_tokens_per_second > 0
    )
    .sort(
      (a, b) =>
        (b.performance?.median_output_tokens_per_second ?? 0) -
        (a.performance?.median_output_tokens_per_second ?? 0)
    )
    .slice(0, 10)
    .map((m, i) => ({
      label: m.name,
      value: m.performance?.median_output_tokens_per_second ?? null,
      creator: m.model_creator?.name,
      highlight: i === 0,
    }));

  const lowestLatencyItems = models
    .filter(
      (m) =>
        m.performance?.median_time_to_first_token_seconds != null &&
        m.performance.median_time_to_first_token_seconds > 0
    )
    .sort(
      (a, b) =>
        (a.performance?.median_time_to_first_token_seconds ?? Infinity) -
        (b.performance?.median_time_to_first_token_seconds ?? Infinity)
    )
    .slice(0, 10)
    .map((m, i) => ({
      label: m.name,
      value: m.performance?.median_time_to_first_token_seconds ?? null,
      creator: m.model_creator?.name,
      highlight: i === 0,
    }));

  const valueEfficiencyItems = models
    .flatMap((m) => {
      const metrics = getValueScoreMetrics(m);
      return metrics ? [{ model: m, value: metrics.score }] : [];
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map(({ model, value }, i) => ({
      label: model.name,
      value,
      creator: model.model_creator?.name,
      highlight: i === 0,
    }));

  return (
    <div className="flex flex-col gap-8 sm:gap-12 min-w-0">
      {/* 数据概览 */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3 mb-1 sm:mb-2">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            数据概览
          </h2>
          <span className="text-xs text-muted-foreground font-mono shrink-0">
            Overview
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <MetricCard
            label="收录语言模型"
            value={formatNumber(totalModels, 0)}
            subValue={`指数版本 v${intelligenceIndexVersion ?? "4.1"}`}
          />
          <MetricCard
            label="研发厂商"
            value={formatNumber(totalVendors, 0)}
            subValue="开源与商业闭源对比"
          />
          <MetricCard
            label="最高智能指数"
            value={formatNumber(
              topIntelligence?.evaluations
                .artificial_analysis_intelligence_index,
              1
            )}
            subValue={topIntelligence?.name}
          />
          <MetricCard
            label="最高生成速度"
            value={`${formatNumber(
              topSpeed?.performance?.median_output_tokens_per_second,
              0
            )} TPS`}
            subValue={topSpeed?.name}
          />
          <MetricCard
            label="最低输出单价"
            value={formatPrice(
              lowestPrice?.pricing?.price_1m_output_tokens
            )}
            subValue={lowestPrice?.name}
          />
        </div>
      </section>

      {/* 核心能力全景 */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3 mb-1 sm:mb-2 border-b border-border pb-2">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            核心能力全景指数
          </h2>
          <span className="text-xs text-muted-foreground font-mono shrink-0">
            Core Indexes
          </span>
        </div>
        <IndexLeaderboard models={models} />
      </section>

      {/* 效率与演进 */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3 mb-1 sm:mb-2 border-b border-border pb-2">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            效率与演进
          </h2>
          <span className="text-xs text-muted-foreground font-mono shrink-0">
            Efficiency & Evolution
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <ChartPanel title="生成速度 Top 10" note="数值越高越快">
            <BarChart
              items={topSpeedItems}
              digits={0}
              valueSuffix=" TPS"
              barLabel="生成速度排行榜"
            />
          </ChartPanel>
          <ChartPanel title="首 Token 延迟最低 Top 10" note="数值越低越快">
            <BarChart
              items={lowestLatencyItems}
              valueFormat="seconds"
              lowerIsBetter
              barLabel="首 Token 延迟排行榜"
            />
          </ChartPanel>
          <ChartPanel
            title="智能性价比 Top 10"
            note="综合智能、编程、智能体均分 ÷ 输出单价"
          >
            <BarChart
              items={valueEfficiencyItems}
              digits={1}
              barLabel="智能性价比排行榜"
            />
          </ChartPanel>
          <ChartPanel
            title="年度智能峰值"
            note="每个发布年份的最高智能指数"
          >
            <BarChart
              items={yearlyPeakItems}
              digits={1}
              barLabel="年度最高智能指数"
              showRank={false}
            />
          </ChartPanel>
        </div>
      </section>
    </div>
  );
}
