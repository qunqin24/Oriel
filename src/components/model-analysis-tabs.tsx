"use client";

import { BarChart } from "@/components/charts/bar-chart";
import { ChartPanel } from "@/components/charts/chart-panel";
import { StaticSegmentedTabs } from "@/components/static-segmented-tabs";
import { VendorIcon } from "@/components/vendor-icon";
import {
  formatNumber,
  formatPrice,
  formatSeconds,
  rankAmong,
} from "@/lib/format";
import type { LanguageModel } from "@/lib/types";

type Props = {
  model: LanguageModel;
  peers: LanguageModel[];
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function includeCurrentModel(
  sortedModels: LanguageModel[],
  current: LanguageModel,
  limit = 10
) {
  const visible = sortedModels.slice(0, limit);
  if (visible.some((item) => item.id === current.id)) return visible;
  return [...visible.slice(0, Math.max(0, limit - 1)), current];
}

function IndexBar({
  label,
  value,
  medianValue,
  maxValue,
}: {
  label: string;
  value: number | null;
  medianValue: number | null;
  maxValue: number;
}) {
  if (value == null) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-foreground">{label}</span>
          <span className="font-mono text-muted-foreground">—</span>
        </div>
      </div>
    );
  }

  const scale = Math.max(maxValue, 1);
  const valuePct = Math.min(100, (value / scale) * 100);
  const medianPct =
    medianValue != null ? Math.min(100, (medianValue / scale) * 100) : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-baseline gap-3 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-mono font-semibold text-foreground">
          {formatNumber(value, 1)}
          {medianValue != null ? (
            <span className="text-muted-foreground font-normal ml-2">
              / 中位 {formatNumber(medianValue, 1)}
            </span>
          ) : null}
        </span>
      </div>
      <div className="relative h-2.5 bg-secondary rounded-sm overflow-visible">
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-sm"
          style={{ width: `${Math.max(valuePct, 1.2)}%` }}
        />
        {medianPct != null ? (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-oriel-gold rounded-full"
            style={{
              left: `${medianPct}%`,
              background: "var(--oriel-gold)",
            }}
            title={`行业中位 ${formatNumber(medianValue, 1)}`}
          />
        ) : null}
      </div>
    </div>
  );
}

export function ModelAnalysisTabs({ model, peers }: Props) {
  const intScores = peers
    .map((m) => m.evaluations.artificial_analysis_intelligence_index)
    .filter((v): v is number => v != null);
  const codingScores = peers
    .map((m) => m.evaluations.artificial_analysis_coding_index)
    .filter((v): v is number => v != null);
  const agenticScores = peers
    .map((m) => m.evaluations.artificial_analysis_agentic_index)
    .filter((v): v is number => v != null);

  const intMedian = median(intScores);
  const codingMedian = median(codingScores);
  const agenticMedian = median(agenticScores);
  const scaleMax = Math.max(
    ...intScores,
    ...codingScores,
    ...agenticScores,
    1
  );

  const priceComparisonModels = includeCurrentModel(
    peers
      .filter(
        (peer) =>
          peer.pricing?.price_1m_output_tokens != null &&
          peer.pricing.price_1m_output_tokens > 0
      )
      .sort(
        (a, b) =>
          (a.pricing?.price_1m_output_tokens ?? Infinity) -
          (b.pricing?.price_1m_output_tokens ?? Infinity)
      ),
    model
  ).sort(
    (a, b) =>
      (a.pricing?.price_1m_output_tokens ?? Infinity) -
      (b.pricing?.price_1m_output_tokens ?? Infinity)
  );

  const priceBarItems = priceComparisonModels.map((peer) => ({
    label: peer.name,
    value: peer.pricing?.price_1m_output_tokens ?? null,
    creator: peer.model_creator?.name,
    highlight: peer.id === model.id,
  }));

  const speedComparisonModels = includeCurrentModel(
    peers
      .filter(
        (peer) =>
          peer.performance?.median_output_tokens_per_second != null &&
          peer.performance.median_output_tokens_per_second > 0
      )
      .sort(
        (a, b) =>
          (b.performance?.median_output_tokens_per_second ?? 0) -
          (a.performance?.median_output_tokens_per_second ?? 0)
      ),
    model
  ).sort(
    (a, b) =>
      (b.performance?.median_output_tokens_per_second ?? 0) -
      (a.performance?.median_output_tokens_per_second ?? 0)
  );

  const speedBarItems = speedComparisonModels.map((peer) => ({
    label: peer.name,
    value: peer.performance?.median_output_tokens_per_second ?? null,
    creator: peer.model_creator?.name,
    highlight: peer.id === model.id,
  }));

  const yearlyPeakMap = new Map<number, LanguageModel>();
  peers.forEach((peer) => {
    if (!peer.release_date) return;
    const year = new Date(peer.release_date).getFullYear();
    const score =
      peer.evaluations.artificial_analysis_intelligence_index;
    if (!Number.isFinite(year) || score == null) return;
    const current = yearlyPeakMap.get(year);
    if (
      !current ||
      score >
        (current.evaluations.artificial_analysis_intelligence_index ??
          -Infinity)
    ) {
      yearlyPeakMap.set(year, peer);
    }
  });

  const historyModels = [...yearlyPeakMap.values()];
  if (!historyModels.some((peer) => peer.id === model.id)) {
    historyModels.push(model);
  }
  historyModels.sort(
    (a, b) =>
      new Date(a.release_date ?? 0).getTime() -
      new Date(b.release_date ?? 0).getTime()
  );
  const historyBarItems = historyModels.map((peer) => ({
    label: peer.name,
    value: peer.evaluations.artificial_analysis_intelligence_index,
    creator: peer.model_creator?.name,
    sub: peer.release_date
      ? `${new Date(peer.release_date).getFullYear()} 年发布`
      : "发布日期未知",
    highlight: peer.id === model.id,
  }));

  const currentScore =
    model.evaluations.artificial_analysis_intelligence_index;
  const similar =
    currentScore == null
      ? []
      : peers
          .filter(
            (m) =>
              m.id !== model.id &&
              m.evaluations.artificial_analysis_intelligence_index != null &&
              Math.abs(
                m.evaluations.artificial_analysis_intelligence_index! -
                  currentScore
              ) <= 8
          )
          .sort(
            (a, b) =>
              Math.abs(
                (a.evaluations.artificial_analysis_intelligence_index ?? 0) -
                  currentScore
              ) -
              Math.abs(
                (b.evaluations.artificial_analysis_intelligence_index ?? 0) -
                  currentScore
              )
          )
          .slice(0, 10);

  const sameCreator = peers
    .filter(
      (m) =>
        m.id !== model.id &&
        m.model_creator?.id === model.model_creator?.id &&
        m.evaluations.artificial_analysis_intelligence_index != null
    )
    .sort(
      (a, b) =>
        (b.evaluations.artificial_analysis_intelligence_index ?? -Infinity) -
        (a.evaluations.artificial_analysis_intelligence_index ?? -Infinity)
    )
    .slice(0, 8);

  const costPerTask =
    model.artificial_analysis_intelligence_index_cost?.cost_per_task
      ?.total_cost;
  const totalEvalCost =
    model.artificial_analysis_intelligence_index_cost?.total_cost;

  const intRank = rankAmong(
    model.evaluations.artificial_analysis_intelligence_index,
    peers.map((m) => m.evaluations.artificial_analysis_intelligence_index)
  );

  return (
    <StaticSegmentedTabs
      tabs={[
        {
          id: "intelligence",
          label: "智能分解",
          content: (
            <div className="flex flex-col gap-6">
              <ChartPanel
                title="三项核心指数"
                note={
                  intRank
                    ? `综合智能排名 #${intRank.rank} / ${intRank.total}`
                    : undefined
                }
              >
                <div className="flex flex-col gap-6">
                  <IndexBar
                    label="综合智能"
                    value={
                      model.evaluations.artificial_analysis_intelligence_index
                    }
                    medianValue={intMedian}
                    maxValue={scaleMax}
                  />
                  <IndexBar
                    label="编程指数"
                    value={model.evaluations.artificial_analysis_coding_index}
                    medianValue={codingMedian}
                    maxValue={scaleMax}
                  />
                  <IndexBar
                    label="智能体指数"
                    value={model.evaluations.artificial_analysis_agentic_index}
                    medianValue={agenticMedian}
                    maxValue={scaleMax}
                  />
                  <p className="text-xs text-muted-foreground">
                    金色竖线为全库中位数，便于判断该模型相对行业基准的位置。
                  </p>
                </div>
              </ChartPanel>

              {sameCreator.length > 0 ? (
                <ChartPanel
                  title={`${model.model_creator?.name ?? "同厂"} 其他模型`}
                  note={`${sameCreator.length} 款`}
                >
                  <div className="flex flex-col gap-2">
                    {sameCreator.map((m) => (
                      <a
                        key={m.id}
                        href={`/llm/${m.id}`}
                        className="flex items-center justify-between gap-4 py-2 px-3 rounded-md hover:bg-muted/60 transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground truncate flex items-center gap-2 min-w-0">
                          <VendorIcon
                            name={m.model_creator?.name}
                            size={14}
                            className="shrink-0"
                          />
                          <span className="truncate">{m.name}</span>
                        </span>
                        <span className="font-mono text-xs text-muted-foreground shrink-0">
                          {formatNumber(
                            m.evaluations
                              .artificial_analysis_intelligence_index,
                            1
                          )}
                        </span>
                      </a>
                    ))}
                  </div>
                </ChartPanel>
              ) : null}
            </div>
          ),
        },
        {
          id: "cost",
          label: "成本性价比",
          content: (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="instrument-panel p-4 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    评测任务成本
                  </span>
                  <span className="text-2xl font-bold font-mono tracking-tight">
                    {costPerTask != null
                      ? `$${formatNumber(costPerTask, 4)}`
                      : "—"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    每任务均摊
                  </span>
                </div>
                <div className="instrument-panel p-4 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    评测总成本
                  </span>
                  <span className="text-2xl font-bold font-mono tracking-tight">
                    {totalEvalCost != null
                      ? `$${formatNumber(totalEvalCost, 0)}`
                      : "—"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Intelligence Index 全量
                  </span>
                </div>
                <div className="instrument-panel p-4 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    输出单价
                  </span>
                  <span className="text-2xl font-bold font-mono tracking-tight">
                    {formatPrice(model.pricing?.price_1m_output_tokens)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /M
                    </span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    输入 {formatPrice(model.pricing?.price_1m_input_tokens)}/M
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartPanel
                  title="输出价格最低对比"
                  note="Top 9 + 当前模型 · 金色为当前模型"
                >
                  <BarChart
                    items={priceBarItems}
                    valueFormat="price"
                    lowerIsBetter
                    barLabel="输出价格对比"
                  />
                </ChartPanel>
                <ChartPanel
                  title="生成速度最高对比"
                  note="Top 9 + 当前模型 · 金色为当前模型"
                >
                  <BarChart
                    items={speedBarItems}
                    digits={0}
                    valueSuffix=" TPS"
                    barLabel="生成速度对比"
                  />
                </ChartPanel>
              </div>
            </div>
          ),
        },
        {
          id: "history",
          label: "历史表现",
          content: (
            <ChartPanel
              title="年度智能峰值"
              note="按发布时间排列 · 金色为当前模型"
            >
              <BarChart
                items={historyBarItems}
                digits={1}
                barLabel="年度智能峰值"
                showRank={false}
              />
            </ChartPanel>
          ),
        },
        {
          id: "peers",
          label: "同类比较",
          content: (
            <ChartPanel
              title="相近智能水平模型"
              note={
                currentScore != null
                  ? `智能指数 ±8 · 基准 ${formatNumber(currentScore, 1)}`
                  : undefined
              }
            >
              {similar.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  暂无足够相近的对比模型
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-separate border-spacing-0">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="text-left font-semibold py-3 pl-4 pr-6 border-b border-border">
                          模型
                        </th>
                        <th className="text-right font-semibold py-3 px-4 border-b border-border">
                          智能
                        </th>
                        <th className="text-right font-semibold py-3 px-4 border-b border-border">
                          编程
                        </th>
                        <th className="text-right font-semibold py-3 px-4 border-b border-border">
                          输出价
                        </th>
                        <th className="text-right font-semibold py-3 pl-4 pr-4 border-b border-border">
                          首 Token
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Current model row first */}
                      <tr className="bg-primary/3">
                        <td className="py-3.5 pl-4 pr-6 border-b border-border">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <VendorIcon
                              name={model.model_creator?.name}
                              size={14}
                            />
                            <span className="font-semibold text-foreground truncate">
                              {model.name}
                            </span>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground shrink-0">
                              当前
                            </span>
                          </div>
                        </td>
                        <td className="text-right font-mono py-3.5 px-4 border-b border-border font-semibold">
                          {formatNumber(
                            model.evaluations
                              .artificial_analysis_intelligence_index,
                            1
                          )}
                        </td>
                        <td className="text-right font-mono py-3.5 px-4 border-b border-border">
                          {formatNumber(
                            model.evaluations.artificial_analysis_coding_index,
                            1
                          )}
                        </td>
                        <td className="text-right font-mono py-3.5 px-4 border-b border-border">
                          {formatPrice(model.pricing?.price_1m_output_tokens)}
                        </td>
                        <td className="text-right font-mono py-3.5 pl-4 pr-4 border-b border-border">
                          {formatSeconds(
                            model.performance
                              ?.median_time_to_first_token_seconds
                          )}
                        </td>
                      </tr>
                      {similar.map((m, index) => {
                        const isLast = index === similar.length - 1;
                        const cellBorder = isLast ? "" : "border-b border-border";
                        return (
                        <tr
                          key={m.id}
                          className="hover:bg-muted/40 transition-colors"
                        >
                          <td className={`py-3.5 pl-4 pr-6 ${cellBorder}`}>
                            <a
                              href={`/llm/${m.id}`}
                              className="flex items-center gap-2.5 min-w-0 hover:text-primary transition-colors"
                            >
                              <VendorIcon
                                name={m.model_creator?.name}
                                size={14}
                              />
                              <span className="font-medium truncate">
                                {m.name}
                              </span>
                            </a>
                          </td>
                          <td className={`text-right font-mono py-3.5 px-4 ${cellBorder}`}>
                            {formatNumber(
                              m.evaluations
                                .artificial_analysis_intelligence_index,
                              1
                            )}
                          </td>
                          <td className={`text-right font-mono py-3.5 px-4 ${cellBorder}`}>
                            {formatNumber(
                              m.evaluations.artificial_analysis_coding_index,
                              1
                            )}
                          </td>
                          <td className={`text-right font-mono py-3.5 px-4 ${cellBorder}`}>
                            {formatPrice(m.pricing?.price_1m_output_tokens)}
                          </td>
                          <td className={`text-right font-mono py-3.5 pl-4 pr-4 ${cellBorder}`}>
                            {formatSeconds(
                              m.performance?.median_time_to_first_token_seconds
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </ChartPanel>
          ),
        },
      ]}
    />
  );
}
