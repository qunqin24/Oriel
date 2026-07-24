"use client";

import { useEffect, useMemo, useRef } from "react";
import { VendorIcon } from "@/components/vendor-icon";
import { useCompare } from "@/lib/compare-store";
import {
  formatDate,
  formatNumber,
  formatPrice,
  formatSeconds,
} from "@/lib/format";
import type { LanguageModel } from "@/lib/types";

type Props = {
  models: LanguageModel[];
};

type MetricRow = {
  key: string;
  label: string;
  get: (m: LanguageModel) => number | null;
  format: (v: number | null) => string;
  higherBetter?: boolean;
};

const METRICS: MetricRow[] = [
  {
    key: "intelligence",
    label: "综合智能",
    get: (m) => m.evaluations.artificial_analysis_intelligence_index,
    format: (v) => (v != null ? formatNumber(v, 1) : "—"),
    higherBetter: true,
  },
  {
    key: "coding",
    label: "编程指数",
    get: (m) => m.evaluations.artificial_analysis_coding_index,
    format: (v) => (v != null ? formatNumber(v, 1) : "—"),
    higherBetter: true,
  },
  {
    key: "agentic",
    label: "智能体指数",
    get: (m) => m.evaluations.artificial_analysis_agentic_index,
    format: (v) => (v != null ? formatNumber(v, 1) : "—"),
    higherBetter: true,
  },
  {
    key: "price_out",
    label: "输出价格 /M",
    get: (m) => m.pricing?.price_1m_output_tokens ?? null,
    format: (v) => formatPrice(v),
    higherBetter: false,
  },
  {
    key: "price_in",
    label: "输入价格 /M",
    get: (m) => m.pricing?.price_1m_input_tokens ?? null,
    format: (v) => formatPrice(v),
    higherBetter: false,
  },
  {
    key: "speed",
    label: "生成速度",
    get: (m) => m.performance?.median_output_tokens_per_second ?? null,
    format: (v) => (v != null ? `${formatNumber(v, 0)} tok/s` : "—"),
    higherBetter: true,
  },
  {
    key: "ttft",
    label: "首 Token 延迟",
    get: (m) => m.performance?.median_time_to_first_token_seconds ?? null,
    format: (v) => formatSeconds(v),
    higherBetter: false,
  },
  {
    key: "e2e",
    label: "端到端响应",
    get: (m) => m.performance?.median_end_to_end_response_time_seconds ?? null,
    format: (v) => formatSeconds(v),
    higherBetter: false,
  },
];

function bestIds(
  models: LanguageModel[],
  get: (m: LanguageModel) => number | null,
  higherBetter: boolean
): Set<string> {
  const scored = models
    .map((m) => ({ id: m.id, v: get(m) }))
    .filter((x): x is { id: string; v: number } => x.v != null);
  if (scored.length === 0) return new Set();
  const best = higherBetter
    ? Math.max(...scored.map((x) => x.v))
    : Math.min(...scored.map((x) => x.v));
  return new Set(scored.filter((x) => x.v === best).map((x) => x.id));
}

export function CompareClientView({ models }: Props) {
  const { items, remove, clear, add, ready } = useCompare();
  const syncedFromUrl = useRef(false);

  useEffect(() => {
    if (!ready || syncedFromUrl.current) return;
    syncedFromUrl.current = true;
    const raw = new URLSearchParams(window.location.search).get("ids");
    if (!raw) return;
    for (const id of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
      const m = models.find((x) => x.id === id || x.slug === id);
      if (m) {
        add({
          id: m.id,
          name: m.name,
          creator: m.model_creator?.name ?? "",
        });
      }
    }
  }, [ready, models, add]);

  const selected = useMemo(() => {
    return items
      .map((i) => models.find((m) => m.id === i.id))
      .filter((m): m is LanguageModel => !!m);
  }, [items, models]);

  useEffect(() => {
    if (!ready || !syncedFromUrl.current) return;
    const next = items.map((i) => i.id).join(",");
    const current = new URLSearchParams(window.location.search).get("ids") ?? "";
    if (next === current) return;
    window.history.replaceState(
      null,
      "",
      next ? `/compare?ids=${encodeURIComponent(next)}` : "/compare"
    );
  }, [items, ready]);

  if (!ready) {
    return (
      <div className="text-sm text-muted-foreground py-16 text-center">
        加载对比列表…
      </div>
    );
  }

  if (selected.length === 0) {
    return (
      <div className="instrument-panel p-12 flex flex-col items-center gap-4 text-center">
        <p className="text-foreground font-medium">还没有加入对比的模型</p>
        <p className="text-sm text-muted-foreground max-w-md">
          在语言模型榜单或详情页点击「加入对比」，最多可选 4 款并排比较。
        </p>
        <a
          href="/llm"
          className="text-xs font-semibold px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          去选模型
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          正在对比 {selected.length} 款模型 · 绿色为该行最优
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clear}
            className="text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5"
          >
            清空全部
          </button>
          <a
            href="/llm"
            className="text-xs font-semibold px-3 py-1.5 rounded-md border hairline-border bg-card hover:border-primary transition-colors"
          >
            + 继续添加
          </a>
        </div>
      </div>

      <div className="overflow-x-auto instrument-panel overscroll-x-contain">
        <table className="w-full table-fixed text-sm border-separate border-spacing-0 min-w-md sm:min-w-160">
          <colgroup>
            <col className="w-28 sm:w-36" />
            {selected.map((m) => (
              <col key={m.id} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-muted text-left px-2.5 sm:px-4 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border shadow-[1px_0_0_var(--border)]">
                指标
              </th>
              {selected.map((m) => (
                <th
                  key={m.id}
                  className="px-2.5 sm:px-4 py-3 border-b border-border bg-muted align-top overflow-hidden min-w-28 sm:min-w-36"
                >
                  <div className="flex flex-col gap-2 items-stretch min-w-0">
                    <div className="flex items-start gap-2 min-w-0">
                      <VendorIcon
                        name={m.model_creator?.name}
                        size={18}
                        className="shrink-0 mt-0.5"
                      />
                      <div className="min-w-0 flex-1 overflow-hidden text-left">
                        <a
                          href={`/llm/${m.id}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors block truncate"
                          title={m.name}
                        >
                          {m.name}
                        </a>
                        <span
                          className="text-[11px] font-mono text-muted-foreground block truncate"
                          title={m.model_creator?.name}
                        >
                          {m.model_creator?.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(m.id)}
                        className="text-muted-foreground hover:text-foreground text-sm shrink-0"
                        aria-label={`移除 ${m.name}`}
                      >
                        ×
                      </button>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {formatDate(m.release_date)}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric) => {
              const winners = bestIds(
                selected,
                metric.get,
                metric.higherBetter !== false
              );
              return (
                <tr key={metric.key} className="hover:bg-muted/20">
                  <th className="sticky left-0 z-10 bg-card text-left px-2.5 sm:px-4 py-3 text-muted-foreground font-medium border-b border-border shadow-[1px_0_0_var(--border)] text-[13px] sm:text-sm">
                    {metric.label}
                  </th>
                  {selected.map((m) => {
                    const raw = metric.get(m);
                    const win = raw != null && winners.has(m.id);
                    return (
                      <td
                        key={m.id}
                        className={`px-2.5 sm:px-4 py-3 border-b border-border font-mono text-xs sm:text-[13px] overflow-hidden ${
                          win
                            ? "text-emerald-700 font-semibold bg-emerald-50/60"
                            : "text-foreground"
                        }`}
                      >
                        <span className="block truncate" title={metric.format(raw)}>
                          {metric.format(raw)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
