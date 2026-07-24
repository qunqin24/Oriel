"use client";

import { ChartPanel } from "@/components/charts/chart-panel";
import { BarChart } from "@/components/charts/bar-chart";
import { IndexLeaderboard } from "@/components/index-leaderboard";
import { formatNumber, formatPrice } from "@/lib/format";
import type { LanguageModel } from "@/lib/types";
import { getValueScoreMetrics } from "@/lib/value-score";

type Props = {
  models: LanguageModel[];
  intelligenceIndexVersion?: number;
};

export function LlmAnalyticsDashboard({
  models,
  intelligenceIndexVersion,
}: Props) {
  // 1. 核心指标数据计算
  const totalModels = models.length;
  const vendorsSet = new Set(
    models.map((m) => m.model_creator?.name).filter(Boolean)
  );
  const totalVendors = vendorsSet.size;

  // 最高智能模型
  const topIntelligenceModel = models.reduce<LanguageModel | null>(
    (acc, cur) => {
      const score = cur.evaluations.artificial_analysis_intelligence_index;
      if (score == null) return acc;
      if (
        !acc ||
        score >
          (acc.evaluations.artificial_analysis_intelligence_index ?? -Infinity)
      ) {
        return cur;
      }
      return acc;
    },
    null
  );

  // 最高速度模型
  const topSpeedModel = models.reduce<LanguageModel | null>((acc, cur) => {
    const speed = cur.performance?.median_output_tokens_per_second;
    if (speed == null) return acc;
    if (
      !acc ||
      speed > (acc.performance?.median_output_tokens_per_second ?? -Infinity)
    ) {
      return cur;
    }
    return acc;
  }, null);

  // 最低输出价格模型（且 > 0）
  const lowestPriceModel = models.reduce<LanguageModel | null>((acc, cur) => {
    const price = cur.pricing?.price_1m_output_tokens;
    if (price == null || price <= 0) return acc;
    if (!acc || price < (acc.pricing?.price_1m_output_tokens ?? Infinity)) {
      return cur;
    }
    return acc;
  }, null);

  // 2. 柱状图数据准备
  const yearlyPeakMap = new Map<number, LanguageModel>();
  models.forEach((model) => {
    if (!model.release_date) return;
    const year = new Date(model.release_date).getFullYear();
    const score =
      model.evaluations.artificial_analysis_intelligence_index;
    if (!Number.isFinite(year) || score == null) return;
    const current = yearlyPeakMap.get(year);
    if (
      !current ||
      score >
        (current.evaluations.artificial_analysis_intelligence_index ??
          -Infinity)
    ) {
      yearlyPeakMap.set(year, model);
    }
  });

  const yearlyPeakItems = [...yearlyPeakMap.entries()]
    .sort(([yearA], [yearB]) => yearA - yearB)
    .map(([year, model]) => ({
      label: model.name,
      value: model.evaluations.artificial_analysis_intelligence_index,
      creator: model.model_creator?.name,
      sub: `${year} 年发布峰值`,
    }));

  const topSpeedItems = models
    .filter(
      (model) =>
        model.performance?.median_output_tokens_per_second != null &&
        model.performance.median_output_tokens_per_second > 0
    )
    .sort(
      (a, b) =>
        (b.performance?.median_output_tokens_per_second ?? 0) -
        (a.performance?.median_output_tokens_per_second ?? 0)
    )
    .slice(0, 10)
    .map((model) => ({
      label: model.name,
      value: model.performance?.median_output_tokens_per_second ?? null,
      creator: model.model_creator?.name,
    }));

  const lowestLatencyItems = models
    .filter(
      (model) =>
        model.performance?.median_time_to_first_token_seconds != null &&
        model.performance.median_time_to_first_token_seconds > 0
    )
    .sort(
      (a, b) =>
        (a.performance?.median_time_to_first_token_seconds ?? Infinity) -
        (b.performance?.median_time_to_first_token_seconds ?? Infinity)
    )
    .slice(0, 10)
    .map((model) => ({
      label: model.name,
      value: model.performance?.median_time_to_first_token_seconds ?? null,
      creator: model.model_creator?.name,
    }));

  const valueEfficiencyItems = models
    .flatMap((model) => {
      const metrics = getValueScoreMetrics(model);
      return metrics ? [{ model, value: metrics.score }] : [];
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map(({ model, value }) => ({
      label: model.name,
      value,
      creator: model.model_creator?.name,
    }));

  const intelligenceThroughputItems = models
    .filter(
      (model) =>
        model.evaluations.artificial_analysis_intelligence_index != null &&
        model.performance?.median_output_tokens_per_second != null &&
        model.performance.median_output_tokens_per_second > 0
    )
    .map((model) => ({
      model,
      value:
        model.evaluations.artificial_analysis_intelligence_index! *
        model.performance!.median_output_tokens_per_second!,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map(({ model, value }) => ({
      label: model.name,
      value,
      creator: model.model_creator?.name,
    }));

  return (
    <div className="flex flex-col gap-8 sm:gap-12 min-w-0">
      {/* 核心指标刻度条 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <div className="instrument-panel p-3 sm:p-4 flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            收录语言模型
          </span>
          <span className="text-xl sm:text-2xl font-bold tracking-tight mono-data">
            {totalModels} 款
          </span>
          <span className="text-[11px] text-muted-foreground truncate">
            指数版本 v{intelligenceIndexVersion ?? "2.0"}
          </span>
        </div>

        <div className="instrument-panel p-3 sm:p-4 flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            包含研发厂商
          </span>
          <span className="text-xl sm:text-2xl font-bold tracking-tight mono-data">
            {totalVendors} 家
          </span>
          <span className="text-[11px] text-muted-foreground truncate">
            开源与商业闭源对比
          </span>
        </div>

        <div className="instrument-panel p-3 sm:p-4 flex flex-col gap-1 min-w-0 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            最高智能指数
          </span>
          <span className="text-xl sm:text-2xl font-bold tracking-tight mono-data">
            {formatNumber(
              topIntelligenceModel?.evaluations
                .artificial_analysis_intelligence_index,
              0
            )}
          </span>
          <span
            className="text-[11px] text-muted-foreground truncate"
            title={topIntelligenceModel?.name}
          >
            #1 {topIntelligenceModel?.name ?? "—"}
          </span>
        </div>

        <div className="instrument-panel p-3 sm:p-4 flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            最高生成速度
          </span>
          <span className="text-xl sm:text-2xl font-bold tracking-tight mono-data">
            {formatNumber(
              topSpeedModel?.performance?.median_output_tokens_per_second,
              0
            )}{" "}
            TPS
          </span>
          <span
            className="text-[11px] text-muted-foreground truncate"
            title={topSpeedModel?.name}
          >
            #1 {topSpeedModel?.name ?? "—"}
          </span>
        </div>

        <div className="instrument-panel p-3 sm:p-4 flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            最低输出单价
          </span>
          <span className="text-xl sm:text-2xl font-bold tracking-tight mono-data">
            {formatPrice(lowestPriceModel?.pricing?.price_1m_output_tokens)}
          </span>
          <span
            className="text-[11px] text-muted-foreground truncate"
            title={lowestPriceModel?.name}
          >
            / 1M Output Tokens
          </span>
        </div>
      </div>

      <section className="flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            Core Indexes
          </span>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            核心能力全景指数
          </h2>
          <p className="text-sm text-muted-foreground">
            基于智能指数、编程指数与智能体决策指数的横向对比与排名
          </p>
        </div>
        <IndexLeaderboard models={models} />
      </section>

      <section className="flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            Evolution Timeline
          </span>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            AI 大模型年度智能峰值
          </h2>
          <p className="text-sm text-muted-foreground">
            对比每个发布年份达到的最高智能指数
          </p>
        </div>
        <ChartPanel
          title="年度最高智能指数"
          note="每根柱代表该年份发布模型的最高分"
        >
          <BarChart
            items={yearlyPeakItems}
            digits={1}
            barLabel="年度最高智能指数"
            showRank={false}
          />
        </ChartPanel>
      </section>

      <section className="flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            Performance Matrix
          </span>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            响应延迟与生成速度排行
          </h2>
          <p className="text-sm text-muted-foreground">
            分别查看最高生成速度与最低首 Token 延迟
          </p>
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
        </div>
      </section>

      <section className="flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            Efficiency Ranking
          </span>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            模型多维效率排行
          </h2>
          <p className="text-sm text-muted-foreground">
            用柱状排名对比智能、价格与生成速度的综合表现
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
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
          <ChartPanel title="智能吞吐 Top 10" note="智能指数 × 生成速度">
            <BarChart
              items={intelligenceThroughputItems}
              digits={0}
              barLabel="智能吞吐排行榜"
            />
          </ChartPanel>
        </div>
      </section>

    </div>
  );
}
