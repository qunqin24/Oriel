"use client";

import { useMemo, useState } from "react";
import { CompareToggleButton } from "@/components/compare-toggle-button";
import { LlmAnalyticsDashboard } from "@/components/llm-analytics-dashboard";
import { LeaderboardTable } from "@/components/leaderboard-table";
import {
  ModelNameCell,
  ModelNameWithBadges,
} from "@/components/model-name-cell";
import { SegmentedTabs } from "@/components/segmented-tabs";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { VendorIcon } from "@/components/vendor-icon";
import {
  formatDate,
  formatNumber,
  formatPrice,
  formatSeconds,
} from "@/lib/format";
import type { ColumnDef, LanguageModel } from "@/lib/types";
import {
  getValueScore,
  getValueScoreMetrics,
} from "@/lib/value-score";

interface LlmClientViewProps {
  models: LanguageModel[];
  indexVersion?: number | string;
  fetchedAt?: string;
}

function pickTop(
  models: LanguageModel[],
  scoreOf: (m: LanguageModel) => number | null | undefined
): LanguageModel | null {
  return models.reduce<LanguageModel | null>((best, m) => {
    const score = scoreOf(m);
    if (score == null || !(score > 0)) return best;
    if (!best || score > (scoreOf(best) ?? -Infinity)) return m;
    return best;
  }, null);
}

function metricBoardColumn(
  key: string,
  label: string,
  getScore: (m: LanguageModel) => number | null | undefined,
  formatScore: (value: number) => string
): ColumnDef<LanguageModel> {
  return {
    key,
    label,
    align: "left",
    sortable: true,
    getValue: getScore,
    getSearchText: (m) =>
      `${m.name} ${m.model_creator?.name ?? ""} ${m.slug ?? ""}`,
    format: (val, m) => (
      <ModelNameWithBadges
        name={m.name}
        creator={m.model_creator?.name}
        href={`/llm/${m.id}`}
        badges={[val != null ? formatScore(Number(val)) : "—"]}
      />
    ),
  };
}

const compareColumn: ColumnDef<LanguageModel> = {
  key: "compare",
  label: "对比",
  getValue: () => "",
  sortable: false,
  align: "right",
  format: (_val, m) => (
    <CompareToggleButton
      size="sm"
      item={{
        id: m.id,
        name: m.name,
        creator: m.model_creator?.name ?? "",
      }}
    />
  ),
};

const nameColumn: ColumnDef<LanguageModel> = {
  key: "name",
  label: "模型",
  getValue: (m) => m.name,
  getSearchText: (m) =>
    `${m.name} ${m.model_creator?.name ?? ""} ${m.slug ?? ""}`,
  format: (_val, m) => (
    <ModelNameCell
      name={m.name}
      creator={m.model_creator?.name}
      href={`/llm/${m.id}`}
    />
  ),
  sortable: true,
  align: "left",
};

const releaseColumn: ColumnDef<LanguageModel> = {
  key: "release_date",
  label: "发布日期",
  getValue: (m) => m.release_date ?? "",
  format: (val) => formatDate(typeof val === "string" ? val : null),
  align: "right",
};

const intelligenceColumn: ColumnDef<LanguageModel> = {
  key: "intelligence",
  label: "综合智能",
  getValue: (m) => m.evaluations.artificial_analysis_intelligence_index,
  format: (val) => (val != null ? formatNumber(Number(val), 1) : "—"),
  align: "center",
};

const codingColumn: ColumnDef<LanguageModel> = {
  key: "coding",
  label: "编程",
  getValue: (m) => m.evaluations.artificial_analysis_coding_index,
  format: (val) => (val != null ? formatNumber(Number(val), 1) : "—"),
  align: "center",
};

const agenticColumn: ColumnDef<LanguageModel> = {
  key: "agentic",
  label: "智能体",
  getValue: (m) => m.evaluations.artificial_analysis_agentic_index,
  format: (val) => (val != null ? formatNumber(Number(val), 1) : "—"),
  align: "center",
};

const outputPriceColumn: ColumnDef<LanguageModel> = {
  key: "price_out",
  label: "输出价",
  getValue: (m) => m.pricing?.price_1m_output_tokens,
  format: (val) => formatPrice(val == null ? null : Number(val)),
  align: "right",
};

const inputPriceColumn: ColumnDef<LanguageModel> = {
  key: "price_in",
  label: "输入价",
  getValue: (m) => m.pricing?.price_1m_input_tokens,
  format: (val) => formatPrice(val == null ? null : Number(val)),
  align: "right",
};

const ttftColumn: ColumnDef<LanguageModel> = {
  key: "ttft",
  label: "首 Token",
  getValue: (m) => m.performance?.median_time_to_first_token_seconds,
  format: (val) => formatSeconds(val == null ? null : Number(val)),
  align: "right",
};

const speedColumn: ColumnDef<LanguageModel> = {
  key: "speed",
  label: "速度",
  getValue: (m) => m.performance?.median_output_tokens_per_second,
  format: (val) =>
    val == null ? "—" : `${formatNumber(Number(val), 0)} tok/s`,
  align: "right",
};

export function LlmClientView({
  models,
  indexVersion,
  fetchedAt,
}: LlmClientViewProps) {
  const [view, setView] = useState("board");

  const intelligenceRows = useMemo(
    () =>
      models.filter(
        (m) => m.evaluations.artificial_analysis_intelligence_index != null
      ),
    [models]
  );
  const codingRows = useMemo(
    () =>
      models.filter(
        (m) => m.evaluations.artificial_analysis_coding_index != null
      ),
    [models]
  );
  const agenticRows = useMemo(
    () =>
      models.filter(
        (m) => m.evaluations.artificial_analysis_agentic_index != null
      ),
    [models]
  );
  const valueRows = useMemo(
    () =>
      models.filter(
        (model) => getValueScore(model) != null
      ),
    [models]
  );
  const speedRows = useMemo(
    () =>
      models.filter(
        (m) =>
          m.performance?.median_output_tokens_per_second != null &&
          m.performance.median_output_tokens_per_second > 0
      ),
    [models]
  );

  const topIntelligence = pickTop(
    models,
    (m) => m.evaluations.artificial_analysis_intelligence_index
  );
  const topCoding = pickTop(
    models,
    (m) => m.evaluations.artificial_analysis_coding_index
  );
  const topSpeed = pickTop(
    models,
    (m) => m.performance?.median_output_tokens_per_second
  );
  const topValue = pickTop(models, getValueScore);

  const highlights = [
    topIntelligence && {
      id: topIntelligence.id,
      label: "智能最高",
      name: topIntelligence.name,
      creator: topIntelligence.model_creator?.name,
      dot: "bg-emerald-500",
      detail: formatNumber(
        topIntelligence.evaluations.artificial_analysis_intelligence_index,
        1
      ),
    },
    topCoding && {
      id: topCoding.id,
      label: "编程最强",
      name: topCoding.name,
      creator: topCoding.model_creator?.name,
      dot: "bg-blue-500",
      detail: formatNumber(
        topCoding.evaluations.artificial_analysis_coding_index,
        1
      ),
    },
    topSpeed && {
      id: topSpeed.id,
      label: "速度最快",
      name: topSpeed.name,
      creator: topSpeed.model_creator?.name,
      dot: "bg-amber-500",
      detail: `${formatNumber(
        topSpeed.performance?.median_output_tokens_per_second,
        0
      )} tok/s`,
    },
    topValue && {
      id: topValue.id,
      label: "性价比最高",
      name: topValue.name,
      creator: topValue.model_creator?.name,
      dot: "bg-violet-500",
      detail: formatNumber(getValueScore(topValue), 1),
    },
  ].filter(Boolean) as {
    id: string;
    label: string;
    name: string;
    creator?: string;
    dot: string;
    detail: string;
  }[];

  return (
    <div className="flex flex-col gap-5 sm:gap-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-3 pb-5 sm:pb-6 border-b border-border">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          语言模型 (LLMs)
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
          按综合智能、编程、智能体与性价比拆分榜单，对比 {models.length}{" "}
          款语言模型的能力与成本。
        </p>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
          <span className="bg-secondary px-2 py-0.5 rounded text-secondary-foreground">
            指数 v{indexVersion ?? "2.1"}
          </span>
          <span>
            快照{" "}
            {fetchedAt
              ? new Date(fetchedAt).toISOString().split("T")[0]
              : "最新"}
          </span>
        </div>
      </div>

      {highlights.length > 0 ? (
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 sm:gap-3">
          {highlights.map((item) => (
            <a
              key={`${item.label}-${item.id}`}
              href={`/llm/${item.id}`}
              className="text-xs font-semibold px-3 py-2 sm:py-1.5 rounded-md border hairline-border bg-card hover:border-primary transition-colors flex items-center gap-2 min-w-0 sm:max-w-[min(100%,22rem)]"
              title={`${item.label}: ${item.name} (${item.detail})`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${item.dot}`} />
              <span className="text-muted-foreground font-medium shrink-0">
                {item.label}:
              </span>
              <VendorIcon
                name={item.creator}
                size={14}
                className="shrink-0"
              />
              <span className="truncate min-w-0">{item.name}</span>
            </a>
          ))}
        </div>
      ) : null}

      <div className="flex justify-start">
        <SegmentedControl
          options={[
            { label: "榜单", value: "board" },
            { label: "分析", value: "analysis" },
          ]}
          value={view}
          onChange={setView}
        />
      </div>

      {view === "board" ? (
        <SegmentedTabs
          tabs={[
            {
              id: "overview",
              label: "总览",
              count: models.length,
              content: (
                <LeaderboardTable
                  rows={models}
                  columns={[
                    nameColumn,
                    intelligenceColumn,
                    codingColumn,
                    agenticColumn,
                    outputPriceColumn,
                    inputPriceColumn,
                    speedColumn,
                    ttftColumn,
                    releaseColumn,
                    compareColumn,
                  ]}
                  getRowKey={(m) => m.id}
                  defaultSortKey="intelligence"
                  defaultSortDir="desc"
                  searchPlaceholder="搜索全部模型…"
                />
              ),
            },
            {
              id: "intelligence",
              label: "综合智能",
              count: intelligenceRows.length,
              content: (
                <LeaderboardTable
                  rows={intelligenceRows}
                  columns={[
                    metricBoardColumn(
                      "intelligence",
                      "综合智能",
                      (m) =>
                        m.evaluations.artificial_analysis_intelligence_index,
                      (v) => formatNumber(v, 1)
                    ),
                    compareColumn,
                  ]}
                  getRowKey={(m) => m.id}
                  defaultSortKey="intelligence"
                  defaultSortDir="desc"
                  searchPlaceholder="搜索综合智能榜…"
                />
              ),
            },
            {
              id: "coding",
              label: "编程",
              count: codingRows.length,
              content: (
                <LeaderboardTable
                  rows={codingRows}
                  columns={[
                    metricBoardColumn(
                      "coding",
                      "编程",
                      (m) => m.evaluations.artificial_analysis_coding_index,
                      (v) => formatNumber(v, 1)
                    ),
                    compareColumn,
                  ]}
                  getRowKey={(m) => m.id}
                  defaultSortKey="coding"
                  defaultSortDir="desc"
                  searchPlaceholder="搜索编程榜…"
                />
              ),
            },
            {
              id: "agentic",
              label: "智能体",
              count: agenticRows.length,
              content: (
                <LeaderboardTable
                  rows={agenticRows}
                  columns={[
                    metricBoardColumn(
                      "agentic",
                      "智能体",
                      (m) => m.evaluations.artificial_analysis_agentic_index,
                      (v) => formatNumber(v, 1)
                    ),
                    compareColumn,
                  ]}
                  getRowKey={(m) => m.id}
                  defaultSortKey="agentic"
                  defaultSortDir="desc"
                  searchPlaceholder="搜索智能体榜…"
                />
              ),
            },
            {
              id: "value",
              label: "性价比",
              count: valueRows.length,
              content: (
                <LeaderboardTable
                  rows={valueRows}
                  columns={[
                    {
                      key: "value_score",
                      label: "性价比",
                      align: "left",
                      sortable: true,
                      getValue: getValueScore,
                      getSearchText: (m) =>
                        `${m.name} ${m.model_creator?.name ?? ""}`,
                      format: (value, m) => {
                        const metrics = getValueScoreMetrics(m);
                        return (
                          <ModelNameWithBadges
                            name={m.name}
                            creator={m.model_creator?.name}
                            href={`/llm/${m.id}`}
                            badges={[
                              `性价比 ${formatNumber(
                                value == null ? null : Number(value),
                                1
                              )}`,
                              `基准均分 ${formatNumber(
                                metrics?.benchmarkAverage,
                                1
                              )}`,
                              `${metrics?.benchmarkCount ?? 0} 项基准`,
                              `出 ${formatPrice(
                                m.pricing?.price_1m_output_tokens
                              )}`,
                            ]}
                          />
                        );
                      },
                    },
                    compareColumn,
                  ]}
                  getRowKey={(m) => m.id}
                  defaultSortKey="value_score"
                  defaultSortDir="desc"
                  searchPlaceholder="搜索性价比榜…"
                />
              ),
            },
            {
              id: "speed",
              label: "速度",
              count: speedRows.length,
              content: (
                <LeaderboardTable
                  rows={speedRows}
                  columns={[
                    metricBoardColumn(
                      "speed",
                      "速度",
                      (m) =>
                        m.performance?.median_output_tokens_per_second,
                      (v) => `${formatNumber(v, 0)} tok/s`
                    ),
                    compareColumn,
                  ]}
                  getRowKey={(m) => m.id}
                  defaultSortKey="speed"
                  defaultSortDir="desc"
                  searchPlaceholder="搜索速度榜…"
                />
              ),
            },
          ]}
        />
      ) : (
        <LlmAnalyticsDashboard
          models={models}
          intelligenceIndexVersion={
            typeof indexVersion === "number"
              ? indexVersion
              : Number(indexVersion) || undefined
          }
        />
      )}
    </div>
  );
}
