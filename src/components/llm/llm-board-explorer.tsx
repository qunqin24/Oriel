"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CompareToggleButton } from "@/components/compare-toggle-button";
import {
  LeaderboardTableView,
  filterRows,
  sortRows,
  type SortDir,
} from "@/components/leaderboard-table";
import {
  ModelNameCell,
  ModelNameWithBadges,
} from "@/components/model-name-cell";
import {
  formatDate,
  formatNumber,
  formatPrice,
  formatSeconds,
} from "@/lib/format";
import type { ColumnDef, LanguageModel } from "@/lib/types";
import { getValueScore } from "@/lib/value-score";

export type LlmDim =
  | "overview"
  | "intelligence"
  | "coding"
  | "agentic"
  | "value"
  | "speed";

export type VendorCount = { name: string; count: number };

const SSR_ROW_LIMIT = 100;

const searchText = (m: LanguageModel) =>
  `${m.name} ${m.model_creator?.name ?? ""} ${m.slug ?? ""}`;

const placeholderToggle = (
  <span className="inline-flex items-center px-2 py-1 text-xs text-muted-foreground/50 border hairline-border rounded-md cursor-not-allowed select-none">
    + 加入对比
  </span>
);

const compareColumn = (
  hydrated: boolean
): ColumnDef<LanguageModel> => ({
  key: "compare",
  label: "对比",
  getValue: () => "",
  sortable: false,
  align: "right",
  format: (_val, m) =>
    hydrated ? (
      <CompareToggleButton
        size="sm"
        item={{
          id: m.id,
          name: m.name,
          creator: m.model_creator?.name ?? "",
        }}
      />
    ) : (
      placeholderToggle
    ),
});

const nameColumn: ColumnDef<LanguageModel> = {
  key: "name",
  label: "模型",
  getValue: (m) => m.name,
  getSearchText: searchText,
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

const valueColumn: ColumnDef<LanguageModel> = {
  key: "value",
  label: "性价比",
  getValue: (m) => getValueScore(m),
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

const speedColumn: ColumnDef<LanguageModel> = {
  key: "speed",
  label: "速度",
  getValue: (m) => m.performance?.median_output_tokens_per_second,
  format: (val) =>
    val == null ? "—" : `${formatNumber(Number(val), 0)} tok/s`,
  align: "right",
};

const ttftColumn: ColumnDef<LanguageModel> = {
  key: "ttft",
  label: "首 Token",
  getValue: (m) => m.performance?.median_time_to_first_token_seconds,
  format: (val) => formatSeconds(val == null ? null : Number(val)),
  align: "right",
};

const releaseColumn: ColumnDef<LanguageModel> = {
  key: "release_date",
  label: "发布日期",
  getValue: (m) => m.release_date ?? "",
  format: (val) => formatDate(typeof val === "string" ? val : null),
  align: "right",
};

/** 单指标维度:模型(带指标 badge)+ 价格/速度/发布/对比,比旧的"名字+1 badge"密度高。 */
function metricDimColumn(
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
    getSearchText: searchText,
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

function buildDimColumns(hydrated: boolean): Record<LlmDim, ColumnDef<LanguageModel>[]> {
  const compare = compareColumn(hydrated);
  return {
  overview: [
    nameColumn,
    intelligenceColumn,
    codingColumn,
    agenticColumn,
    valueColumn,
    outputPriceColumn,
    inputPriceColumn,
    speedColumn,
    ttftColumn,
    releaseColumn,
    compare,
  ],
  intelligence: [
    metricDimColumn(
      "intelligence",
      "综合智能",
      (m) => m.evaluations.artificial_analysis_intelligence_index,
      (v) => formatNumber(v, 1)
    ),
    outputPriceColumn,
    speedColumn,
    releaseColumn,
    compare,
  ],
  coding: [
    metricDimColumn(
      "coding",
      "编程",
      (m) => m.evaluations.artificial_analysis_coding_index,
      (v) => formatNumber(v, 1)
    ),
    outputPriceColumn,
    speedColumn,
    releaseColumn,
    compare,
  ],
  agentic: [
    metricDimColumn(
      "agentic",
      "智能体",
      (m) => m.evaluations.artificial_analysis_agentic_index,
      (v) => formatNumber(v, 1)
    ),
    outputPriceColumn,
    speedColumn,
    releaseColumn,
    compare,
  ],
  value: [
    metricDimColumn("value", "性价比", (m) => getValueScore(m), (v) =>
      formatNumber(v, 1)
    ),
    outputPriceColumn,
    speedColumn,
    releaseColumn,
    compare,
  ],
  speed: [
    metricDimColumn(
      "speed",
      "速度",
      (m) => m.performance?.median_output_tokens_per_second,
      (v) => `${formatNumber(v, 0)} tok/s`
    ),
    outputPriceColumn,
    ttftColumn,
    releaseColumn,
    compare,
  ],
  };
}

const DIM_DEFAULT_SORT: Record<LlmDim, { key: string; dir: SortDir }> = {
  overview: { key: "intelligence", dir: "desc" },
  intelligence: { key: "intelligence", dir: "desc" },
  coding: { key: "coding", dir: "desc" },
  agentic: { key: "agentic", dir: "desc" },
  value: { key: "value", dir: "desc" },
  speed: { key: "speed", dir: "desc" },
};

const DIM_LABELS: Record<LlmDim, string> = {
  overview: "总览",
  intelligence: "综合智能",
  coding: "编程",
  agentic: "智能体",
  value: "性价比",
  speed: "速度",
};

function syncUrl(
  dim: LlmDim,
  sortKey: string,
  sortDir: SortDir,
  q: string,
  vendors: string[]
) {
  const params = new URLSearchParams();
  if (dim !== "overview") params.set("dim", dim);
  const def = DIM_DEFAULT_SORT[dim];
  if (sortKey !== def.key) params.set("sort", sortKey);
  if (sortDir !== def.dir) params.set("dir", sortDir);
  if (q.trim()) params.set("q", q.trim());
  if (vendors.length) params.set("vendor", vendors.join(","));
  const qs = params.toString();
  const url = qs ? `/llm?${qs}` : "/llm";
  window.history.replaceState(null, "", url);
}

type Props = {
  models: LanguageModel[];
  vendors: VendorCount[];
  initialDim: LlmDim;
  initialSortKey?: string;
  initialSortDir?: SortDir;
  initialQuery?: string;
  initialVendors?: string[];
};

export function LlmBoardExplorer({
  models,
  vendors,
  initialDim,
  initialSortKey,
  initialSortDir,
  initialQuery = "",
  initialVendors = [],
}: Props) {
  const [dim, setDim] = useState<LlmDim>(initialDim);
  const [sortKey, setSortKey] = useState(
    initialSortKey ?? DIM_DEFAULT_SORT[initialDim].key
  );
  const [sortDir, setSortDir] = useState<SortDir>(
    initialSortDir ?? DIM_DEFAULT_SORT[initialDim].dir
  );
  const [query, setQuery] = useState(initialQuery);
  const [activeVendors, setActiveVendors] = useState<string[]>(initialVendors);
  const [expanded, setExpanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
    // SSG 下岛屿 props 是构建时默认值,浏览器地址栏的 query 才是真实状态 —— 以水合时的 location 为准
    const p = new URLSearchParams(window.location.search);
    const urlDim = p.get("dim") as LlmDim | null;
    const d = urlDim && urlDim in DIM_DEFAULT_SORT ? urlDim : "overview";
    const sk = p.get("sort");
    const sd = p.get("dir") === "asc" ? "asc" : undefined;
    setDim(d);
    setSortKey(sk ?? DIM_DEFAULT_SORT[d].key);
    setSortDir(sd ?? DIM_DEFAULT_SORT[d].dir);
    setQuery(p.get("q") ?? "");
    setActiveVendors(
      (p.get("vendor") ?? "").split(",").filter(Boolean)
    );
  }, []);

  const columns = useMemo(() => buildDimColumns(hydrated)[dim], [dim, hydrated]);

  const dimRows = useMemo(() => {
    if (dim === "overview") return models;
    const getter = columns[0].getValue;
    return models.filter((m) => getter(m) != null);
  }, [dim, models, columns]);

  const filtered = useMemo(() => {
    let list = dimRows;
    if (activeVendors.length) {
      const set = new Set(activeVendors);
      list = list.filter((m) => set.has(m.model_creator?.name ?? ""));
    }
    return filterRows(list, columns, query);
  }, [dimRows, columns, query, activeVendors]);

  const sorted = useMemo(
    () => sortRows(filtered, columns, sortKey, sortDir),
    [filtered, columns, sortKey, sortDir]
  );

  const visible = expanded ? sorted : sorted.slice(0, SSR_ROW_LIMIT);

  const update = useCallback(
    (
      next: Partial<{
        dim: LlmDim;
        sortKey: string;
        sortDir: SortDir;
        q: string;
        vendors: string[];
      }>
    ) => {
      const d = next.dim ?? dim;
      const sk = next.sortKey ?? sortKey;
      const sd = next.sortDir ?? sortDir;
      const q = next.q ?? query;
      const v = next.vendors ?? activeVendors;
      syncUrl(d, sk, sd, q, v);
    },
    [dim, sortKey, sortDir, query, activeVendors]
  );

  function onSort(key: string) {
    const col = columns.find((c) => c.key === key);
    if (!col || col.sortable === false) return;
    const def = DIM_DEFAULT_SORT[dim];
    let nextKey = sortKey;
    let nextDir = sortDir;
    if (sortKey === key) {
      nextDir = sortDir === "asc" ? "desc" : "asc";
    } else {
      nextKey = key;
      nextDir = def.dir;
    }
    setSortKey(nextKey);
    setSortDir(nextDir);
    update({ sortKey: nextKey, sortDir: nextDir });
  }

  function onDimChange(id: string) {
    const next = id as LlmDim;
    const def = DIM_DEFAULT_SORT[next];
    setDim(next);
    setSortKey(def.key);
    setSortDir(def.dir);
    setExpanded(false);
    update({ dim: next, sortKey: def.key, sortDir: def.dir });
  }

  function onQueryChange(q: string) {
    setQuery(q);
    update({ q });
  }

  function toggleVendor(name: string) {
    const next = activeVendors.includes(name)
      ? activeVendors.filter((v) => v !== name)
      : [...activeVendors, name];
    setActiveVendors(next);
    update({ vendors: next });
  }

  const vendorFilter = (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-none overscroll-x-contain -mx-1 px-1 py-0.5">
      {vendors.map((v) => {
        const active = activeVendors.includes(v.name);
        return (
          <button
            key={v.name}
            type="button"
            onClick={() => toggleVendor(v.name)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              active
                ? "border-oriel-gold/60 bg-oriel-gold/12 text-oriel-gold"
                : "hairline-border bg-card text-muted-foreground hover:text-foreground hover:border-oriel-gold/40"
            }`}
          >
            {v.name}
            <span
              className={`font-mono text-[10px] ${
                active ? "text-oriel-gold/80" : "text-muted-foreground"
              }`}
            >
              {v.count}
            </span>
          </button>
        );
      })}
    </div>
  );

  const tabs = (Object.keys(DIM_LABELS) as LlmDim[]).map((id) => ({
    id,
    label: DIM_LABELS[id],
    count:
      id === "overview"
        ? models.length
        : models.filter(
            (m) => buildDimColumns(false)[id][0].getValue(m) != null
          ).length,
    content: null,
  }));

  return (
    <div className="flex flex-col min-w-0">
      {/* 维度切换:链接式 tab 的客户端等价物,点击同步 URL ?dim= */}
      <div
        className="flex gap-1 border-b border-border overflow-x-auto scrollbar-none overscroll-x-contain -mx-1 px-1"
        role="tablist"
        aria-label="榜单维度"
      >
        {tabs.map((tab) => {
          const selected = tab.id === dim;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onDimChange(tab.id)}
              className={`shrink-0 px-3 sm:px-4 pb-2 pt-1 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 sm:gap-2 ${
                selected
                  ? "border-oriel-gold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span
                className={`px-1.5 py-0.5 text-[10px] rounded-md font-mono ${
                  selected
                    ? "bg-oriel-gold/15 text-oriel-gold"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 sm:mt-5">
        <LeaderboardTableView
          rows={visible}
          columns={columns}
          getRowKey={(m) => m.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSort}
          query={query}
          onQueryChange={onQueryChange}
          searchPlaceholder={`搜索${DIM_LABELS[dim]}榜…`}
          totalCount={dimRows.length}
          toolbarExtras={vendorFilter}
        />
        {!expanded && sorted.length > SSR_ROW_LIMIT ? (
          <div className="flex justify-center mt-3">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground border hairline-border bg-card rounded-md transition-colors"
            >
              展开全部 {sorted.length} 行(当前显示前 {SSR_ROW_LIMIT} 行)
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
