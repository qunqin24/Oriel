import {
  formatDate,
  formatNumber,
  formatPrice,
  formatSeconds,
  rankAmong,
} from "@/lib/format";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { VendorIcon } from "@/components/vendor-icon";
import { ModelAnalysisTabs } from "@/components/model-analysis-tabs";
import type { LanguageModel } from "@/lib/types";

type PageProps = {
  model: LanguageModel;
  peers: LanguageModel[];
};

function buildSummary(model: {
  name: string;
  model_creator?: { name: string } | null;
  evaluations: {
    artificial_analysis_intelligence_index: number | null;
  };
  pricing: { price_1m_output_tokens: number | null } | null;
  performance: {
    median_time_to_first_token_seconds: number | null;
  } | null;
}) {
  const intIndex = model.evaluations.artificial_analysis_intelligence_index;
  const outPrice = model.pricing?.price_1m_output_tokens;
  const ttft = model.performance?.median_time_to_first_token_seconds;
  const creator = model.model_creator?.name ?? "未知机构";

  const capability =
    intIndex == null
      ? "评测数据尚不完整。"
      : intIndex >= 70
        ? "在复杂推理与通用能力上处于行业第一梯队。"
        : intIndex >= 50
          ? "在通用能力上表现稳健，适合多数生产场景。"
          : "更偏向成本敏感或特定任务场景。";

  const priceNote =
    outPrice == null
      ? ""
      : outPrice < 1
        ? `输出约 ${formatPrice(outPrice)}/M tokens，性价比突出。`
        : outPrice < 10
          ? `输出约 ${formatPrice(outPrice)}/M tokens，价格处于中游。`
          : `输出约 ${formatPrice(outPrice)}/M tokens，偏高端定位。`;

  const latencyNote =
    ttft != null && ttft >= 30
      ? " 首 Token 延迟较高，通常意味着深度推理或长思考链路。"
      : "";

  return `${model.name} 由 ${creator} 发布。${capability}${priceNote}${latencyNote}`;
}

export function ModelPage({ model, peers }: PageProps) {
  const intIndex = model.evaluations.artificial_analysis_intelligence_index;
  const codingIndex = model.evaluations.artificial_analysis_coding_index;
  const agenticIndex = model.evaluations.artificial_analysis_agentic_index;
  const outPrice = model.pricing?.price_1m_output_tokens;
  const inPrice = model.pricing?.price_1m_input_tokens;
  const cacheHit = model.pricing?.price_1m_cache_hit_tokens;
  const ttft = model.performance?.median_time_to_first_token_seconds;
  const tps = model.performance?.median_output_tokens_per_second;
  const e2e = model.performance?.median_end_to_end_response_time_seconds;

  const intRank = rankAmong(
    intIndex,
    peers.map((m) => m.evaluations.artificial_analysis_intelligence_index)
  );
  const codingRank = rankAmong(
    codingIndex,
    peers.map((m) => m.evaluations.artificial_analysis_coding_index)
  );
  const latencyRank = rankAmong(
    ttft,
    peers.map((m) => m.performance?.median_time_to_first_token_seconds),
    false
  );

  const aaUrl = model.slug
    ? `https://artificialanalysis.ai/models/${model.slug}`
    : "https://artificialanalysis.ai/models";

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <a href="/llm" className="hover:text-foreground transition-colors">
          语言模型
        </a>
        <span aria-hidden>/</span>
        <span className="text-foreground truncate">{model.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 pb-6 border-b border-border">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={model.model_creator?.name || "Unknown"} />
          <StatusBadge label="LLM" variant="outline" />
          {intRank ? (
            <StatusBadge
              label={`#${intRank.rank}`}
              variant={intRank.rank <= 20 ? "positive" : "neutral"}
            />
          ) : null}
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 shrink-0">
            <VendorIcon name={model.model_creator?.name} size={28} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground wrap-break-word">
            {model.name}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-1">
          <button
            type="button"
            className="compare-toggle text-xs px-4 py-2 font-semibold rounded-md transition-colors"
            data-compare-toggle
            data-model-id={model.id}
            data-model-name={model.name}
            data-model-creator={model.model_creator?.name ?? ""}
          >
            + 加入对比
          </button>
          <a
            href={aaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-4 py-2 bg-secondary text-secondary-foreground border hairline-border rounded-md hover:bg-muted transition-colors"
          >
            查看评测来源 ↗
          </a>
        </div>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="综合智能"
          value={intIndex != null ? formatNumber(intIndex, 1) : "—"}
          trend={
            intRank && intRank.rank / intRank.total <= 0.25
              ? "up"
              : "neutral"
          }
          trendValue={intRank?.topLabel}
          subValue={intRank ? `第 ${intRank.rank} / ${intRank.total}` : undefined}
        />
        <MetricCard
          label="编程指数"
          value={codingIndex != null ? formatNumber(codingIndex, 1) : "—"}
          trend={
            codingRank && codingRank.rank / codingRank.total <= 0.25
              ? "up"
              : "neutral"
          }
          trendValue={codingRank?.topLabel}
          subValue={
            codingRank
              ? `第 ${codingRank.rank} / ${codingRank.total}`
              : undefined
          }
        />
        <MetricCard
          label="首 Token 延迟"
          value={formatSeconds(ttft)}
          trend={
            ttft == null
              ? "neutral"
              : ttft < 1
                ? "up"
                : ttft > 10
                  ? "down"
                  : "neutral"
          }
          trendValue={
            ttft == null
              ? undefined
              : ttft < 1
                ? "Fast"
                : ttft > 10
                  ? "Slow"
                  : latencyRank?.topLabel
          }
          subValue={
            e2e != null ? `端到端 ${formatSeconds(e2e)}` : undefined
          }
        />
        <MetricCard
          label="输出价格"
          value={
            outPrice != null ? `${formatPrice(outPrice)}/M` : "—"
          }
          trend={
            outPrice != null && outPrice < 1
              ? "up"
              : outPrice != null && outPrice > 15
                ? "down"
                : "neutral"
          }
          trendValue={
            outPrice == null
              ? undefined
              : outPrice < 1
                ? "Cost-effective"
                : outPrice > 15
                  ? "偏贵"
                  : "Standard"
          }
          subValue={
            inPrice != null ? `输入 ${formatPrice(inPrice)}/M` : undefined
          }
        />
      </div>

      {/* Summary */}
      <p className="text-base md:text-lg leading-relaxed text-foreground font-medium border-l-4 border-primary pl-4">
        {buildSummary(model)}
      </p>

      {/* Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="instrument-panel p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            模型信息
          </h3>
          <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-3 text-sm">
            <dt className="text-muted-foreground">发布日期</dt>
            <dd className="font-mono font-medium text-right text-foreground">
              {formatDate(model.release_date)}
            </dd>

            <dt className="text-muted-foreground">研发机构</dt>
            <dd className="font-medium text-right text-foreground flex items-center justify-end gap-1.5">
              <VendorIcon name={model.model_creator?.name} size={14} />
              {model.model_creator?.name || "—"}
            </dd>

            <dt className="text-muted-foreground">智能体指数</dt>
            <dd className="font-mono font-medium text-right text-foreground">
              {agenticIndex != null ? formatNumber(agenticIndex, 1) : "—"}
            </dd>

            <dt className="text-muted-foreground">Slug</dt>
            <dd className="font-mono text-xs text-right text-muted-foreground truncate max-w-50">
              {model.slug || "—"}
            </dd>
          </dl>
        </div>

        <div className="instrument-panel p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            经济与性能
          </h3>
          <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-3 text-sm">
            <dt className="text-muted-foreground">输入价格 (1M)</dt>
            <dd className="font-mono font-medium text-right text-foreground">
              {formatPrice(inPrice)}
            </dd>

            <dt className="text-muted-foreground">输出价格 (1M)</dt>
            <dd className="font-mono font-medium text-right text-foreground">
              {formatPrice(outPrice)}
            </dd>

            <dt className="text-muted-foreground">缓存命中 (1M)</dt>
            <dd className="font-mono font-medium text-right text-foreground">
              {formatPrice(cacheHit)}
            </dd>

            <dt className="text-muted-foreground">生成速度 (TPS)</dt>
            <dd className="font-mono font-medium text-right text-foreground">
              {tps != null ? `${formatNumber(tps, 0)} tok/s` : "—"}
            </dd>

            <dt className="text-muted-foreground">端到端响应</dt>
            <dd className="font-mono font-medium text-right text-foreground">
              {formatSeconds(e2e)}
            </dd>
          </dl>
        </div>
      </div>

      {/* Deep Analysis */}
      <div className="mt-2 border-t border-border pt-6">
        <div className="mb-2">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            深度分析
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            相对全库 {peers.length} 款模型的能力分解、性价比位置与相近对照。
          </p>
        </div>
        <ModelAnalysisTabs model={model} peers={peers} />
      </div>
    </div>
  );
}
