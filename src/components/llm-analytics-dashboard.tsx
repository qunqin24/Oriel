"use client";

import { ChartPanel } from "@/components/charts/chart-panel";
import { LatencyQuadrant } from "@/components/charts/latency-quadrant";
import { ScatterPlot } from "@/components/charts/scatter-plot";
import { TimelineChart } from "@/components/charts/timeline-chart";
import { IndexLeaderboard } from "@/components/index-leaderboard";
import { VendorIcon } from "@/components/vendor-icon";
import { formatNumber, formatPrice } from "@/lib/format";
import type { LanguageModel } from "@/lib/types";

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

  // 2. 散点分布数据准备
  const priceScatterPoints = models
    .filter(
      (m) =>
        m.evaluations.artificial_analysis_intelligence_index != null &&
        m.pricing?.price_1m_output_tokens != null &&
        m.pricing.price_1m_output_tokens > 0
    )
    .map((m) => ({
      id: m.id,
      label: m.name,
      x: m.pricing!.price_1m_output_tokens!,
      y: m.evaluations.artificial_analysis_intelligence_index!,
    }));

  const speedScatterPoints = models
    .filter(
      (m) =>
        m.evaluations.artificial_analysis_intelligence_index != null &&
        m.performance?.median_output_tokens_per_second != null &&
        m.performance.median_output_tokens_per_second > 0
    )
    .map((m) => ({
      id: m.id,
      label: m.name,
      x: m.performance!.median_output_tokens_per_second!,
      y: m.evaluations.artificial_analysis_intelligence_index!,
    }));

  // 3. 厂商战力榜统计
  const vendorStatsMap = new Map<
    string,
    { count: number; scores: number[] }
  >();

  models.forEach((m) => {
    const vName = m.model_creator?.name;
    const score = m.evaluations.artificial_analysis_intelligence_index;
    if (!vName) return;
    if (!vendorStatsMap.has(vName)) {
      vendorStatsMap.set(vName, { count: 0, scores: [] });
    }
    const entry = vendorStatsMap.get(vName)!;
    entry.count += 1;
    if (score != null) {
      entry.scores.push(score);
    }
  });

  const vendorList = Array.from(vendorStatsMap.entries())
    .map(([name, data]) => {
      const avgScore =
        data.scores.length > 0
          ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
          : 0;
      return {
        name,
        count: data.count,
        avgScore,
      };
    })
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 10);

  return (
    <div className="llm-dashboard-wrapper">
      {/* 核心指标刻度条 */}
      <div className="llm-metrics-strip">
        <div className="llm-metric-card">
          <span className="llm-metric-label">收录语言模型</span>
          <span className="llm-metric-val">{totalModels} 款</span>
          <span className="llm-metric-sub">
            指数版本 v{intelligenceIndexVersion ?? "2.0"}
          </span>
        </div>

        <div className="llm-metric-card">
          <span className="llm-metric-label">包含研发厂商</span>
          <span className="llm-metric-val">{totalVendors} 家</span>
          <span className="llm-metric-sub">开源与商业闭源对比</span>
        </div>

        <div className="llm-metric-card">
          <span className="llm-metric-label">最高智能指数</span>
          <span className="llm-metric-val">
            {formatNumber(
              topIntelligenceModel?.evaluations
                .artificial_analysis_intelligence_index,
              0
            )}
          </span>
          <span className="llm-metric-sub" title={topIntelligenceModel?.name}>
            #1 {topIntelligenceModel?.name ?? "—"}
          </span>
        </div>

        <div className="llm-metric-card">
          <span className="llm-metric-label">最高生成速度</span>
          <span className="llm-metric-val">
            {formatNumber(
              topSpeedModel?.performance?.median_output_tokens_per_second,
              0
            )}{" "}
            TPS
          </span>
          <span className="llm-metric-sub" title={topSpeedModel?.name}>
            #1 {topSpeedModel?.name ?? "—"}
          </span>
        </div>

        <div className="llm-metric-card">
          <span className="llm-metric-label">最低输出单价</span>
          <span className="llm-metric-val">
            {formatPrice(lowestPriceModel?.pricing?.price_1m_output_tokens)}
          </span>
          <span className="llm-metric-sub" title={lowestPriceModel?.name}>
            / 1M Output Tokens
          </span>
        </div>
      </div>

      {/* 核心能力三大指数 Top 10并排 */}
      <section style={{ marginTop: "3rem" }}>
        <div className="section-head" style={{ marginBottom: "1.5rem" }}>
          <div className="section-title-group">
            <span className="section-tag">Core Indexes</span>
            <h2 className="section-title">核心能力全景指数</h2>
          </div>
          <p className="section-note">基于智能指数、编程指数与智能体决策指数的横向对比与排名</p>
        </div>
        <IndexLeaderboard models={models} />
      </section>

      {/* 新增大图表 1：智能时间演进趋势图 */}
      <section style={{ marginTop: "3rem" }}>
        <div className="section-head" style={{ marginBottom: "1.5rem" }}>
          <div className="section-title-group">
            <span className="section-tag">Evolution Timeline</span>
            <h2 className="section-title">AI 大模型智能演进突破时间线</h2>
          </div>
          <p className="section-note">观察各主要模型发布的时间轴与智能指数前沿边界推移</p>
        </div>
        <ChartPanel
          title="模型智能突破历史 (2024 - 2026)"
          note="虚线为前沿技术边界突破轨迹"
        >
          <TimelineChart data={models} />
        </ChartPanel>
      </section>

      {/* 新增大图表 2：首 Token 延迟 vs 生成速度象限图 */}
      <section style={{ marginTop: "3rem" }}>
        <div className="section-head" style={{ marginBottom: "1.5rem" }}>
          <div className="section-title-group">
            <span className="section-tag">Performance Matrix</span>
            <h2 className="section-title">响应延迟 vs 生成速度象限图</h2>
          </div>
          <p className="section-note">区分实时交互模型与高吞吐批处理模型</p>
        </div>
        <ChartPanel
          title="首 Token 延迟与生成速度象限分布"
          note="右下角为高速度且低延迟（极致实时交互区）"
        >
          <LatencyQuadrant models={models} />
        </ChartPanel>
      </section>

      {/* 图表主阵列区域：多维散点地图 */}
      <section style={{ marginTop: "3rem" }}>
        <div className="section-head" style={{ marginBottom: "1.5rem" }}>
          <div className="section-title-group">
            <span className="section-tag">Scatter Matrix</span>
            <h2 className="section-title">模型多维散点矩阵</h2>
          </div>
          <p className="section-note">直观洞察智能与价格、速度的性价比分布</p>
        </div>
        <div className="dual-grid">
          <ChartPanel
            title="智能 vs 输出价格"
            note="横轴为输出价格对数坐标"
          >
            <ScatterPlot
              points={priceScatterPoints}
              xLabel="输出价格（$/1M tokens）"
              yLabel="智能指数"
              logX
              formatX={(v) => `$${v}`}
              formatY={(v) => formatNumber(v, 0)}
              labelTopN={6}
            />
          </ChartPanel>

          <ChartPanel
            title="智能 vs 生成速度"
            note="横轴为生成速度对数坐标"
          >
            <ScatterPlot
              points={speedScatterPoints}
              xLabel="生成速度（Tokens / 秒）"
              yLabel="智能指数"
              logX
              formatX={(v) => formatNumber(v, 0)}
              formatY={(v) => formatNumber(v, 0)}
              labelTopN={6}
            />
          </ChartPanel>
        </div>
      </section>

      {/* 图表主阵列区域：主导厂商战力与模型分布 */}
      <section style={{ marginTop: "3rem" }}>
        <div className="section-head" style={{ marginBottom: "1.5rem" }}>
          <div className="section-title-group">
            <span className="section-tag">Vendor Matrix</span>
            <h2 className="section-title">主要厂商智能战力矩阵</h2>
          </div>
          <p className="section-note">各厂商大模型收录款数与智能指数平均分</p>
        </div>

        <div className="vendor-grid">
          {vendorList.map((v) => (
            <div className="vendor-card" key={v.name}>
              <div className="vendor-name flex items-center gap-2">
                <VendorIcon name={v.name} size={16} />
                <span>{v.name}</span>
              </div>
              <div className="vendor-stats">
                <span className="vendor-score">
                  平均分 {formatNumber(v.avgScore, 1)}
                </span>
                <span className="vendor-count">{v.count} 款模型</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
