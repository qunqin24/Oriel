import { VendorIcon } from "@/components/vendor-icon";
import type { LanguageModel, ArenaModel } from "@/lib/types";

type ChampionCardProps = {
  href: string;
  categoryLabel: string;
  categoryEnLabel: string;
  count: number;
  model: LanguageModel | ArenaModel | undefined;
  metricLabel: string;
  scoreDisplay: string;
  badgeTag?: string;
  subMetrics?: { label: string; value: string }[];
};

export function ChampionCard({
  href,
  categoryLabel,
  categoryEnLabel,
  count,
  model,
  metricLabel,
  scoreDisplay,
  badgeTag = "#1 Champion",
  subMetrics,
}: ChampionCardProps) {
  const creatorName = model?.model_creator?.name ?? "未知厂商";
  const modelName = model?.name ?? "暂无数据";

  return (
    <a href={href} className="champion-card group">
      <div className="champion-card-top">
        <div className="champion-badge">
          <span className="champion-badge-dot" />
          <span className="champion-badge-text">{badgeTag}</span>
        </div>
        <span className="champion-count">{count} 款模型</span>
      </div>

      <div className="champion-card-meta">
        <span className="champion-category">{categoryLabel}</span>
        <span className="champion-category-en">{categoryEnLabel}</span>
      </div>

      <div className="champion-card-main">
        <h3
          className="champion-name"
          title={modelName}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
        >
          <VendorIcon name={creatorName} size={20} />
          <span className="truncate">{modelName}</span>
        </h3>
        <p className="champion-creator">{creatorName}</p>

        {subMetrics && subMetrics.length > 0 ? (
          <div className="champion-submetrics">
            {subMetrics.map((m) => (
              <span className="champion-submetric-chip" key={m.label}>
                <strong>{m.label}:</strong> {m.value}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="champion-card-footer">
        <div className="champion-score-box">
          <span className="champion-score-label">{metricLabel}</span>
          <span className="champion-score-val">{scoreDisplay}</span>
        </div>
        <div className="champion-arrow-btn" aria-hidden>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3.333 8h9.334M8.667 3.333L13.333 8l-4.666 4.667" />
          </svg>
        </div>
      </div>
    </a>
  );
}
