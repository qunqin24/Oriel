"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bot,
  Brain,
  CalendarDays,
  Code2,
  Search,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";
import { VendorIcon } from "@/components/vendor-icon";
import { formatNumber, formatPrice, formatSeconds } from "@/lib/format";
import type { LanguageModel } from "@/lib/types";

type Props = {
  models: LanguageModel[];
};

type SortField = "intelligence" | "coding" | "agentic" | "speed" | "price";

const SORT_OPTIONS: {
  id: SortField;
  label: string;
  Icon: typeof Brain;
}[] = [
  { id: "intelligence", label: "综合智能", Icon: Brain },
  { id: "coding", label: "编程代码", Icon: Code2 },
  { id: "agentic", label: "智能体", Icon: Bot },
  { id: "speed", label: "生成速度", Icon: Zap },
  { id: "price", label: "价格升序", Icon: ArrowDownToLine },
];

export function ModelVisualGrid({ models }: Props) {
  const [search, setSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("all");
  const [sortBy, setSortBy] = useState<SortField>("intelligence");

  const vendors = useMemo(() => {
    const set = new Set<string>();
    models.forEach((m) => {
      if (m.model_creator?.name) set.add(m.model_creator.name);
    });
    return ["all", ...Array.from(set).sort()];
  }, [models]);

  const maxIntel = 100;
  const maxCoding = 100;
  const maxAgentic = 100;

  const filteredModels = useMemo(() => {
    return models
      .filter((m) => {
        const matchesSearch =
          search.trim() === "" ||
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          (m.model_creator?.name &&
            m.model_creator.name.toLowerCase().includes(search.toLowerCase()));

        const matchesVendor =
          selectedVendor === "all" || m.model_creator?.name === selectedVendor;

        return matchesSearch && matchesVendor;
      })
      .sort((a, b) => {
        if (sortBy === "intelligence") {
          return (
            (b.evaluations.artificial_analysis_intelligence_index ??
              -Infinity) -
            (a.evaluations.artificial_analysis_intelligence_index ?? -Infinity)
          );
        }
        if (sortBy === "coding") {
          return (
            (b.evaluations.artificial_analysis_coding_index ?? -Infinity) -
            (a.evaluations.artificial_analysis_coding_index ?? -Infinity)
          );
        }
        if (sortBy === "agentic") {
          return (
            (b.evaluations.artificial_analysis_agentic_index ?? -Infinity) -
            (a.evaluations.artificial_analysis_agentic_index ?? -Infinity)
          );
        }
        if (sortBy === "speed") {
          return (
            (b.performance?.median_output_tokens_per_second ?? -Infinity) -
            (a.performance?.median_output_tokens_per_second ?? -Infinity)
          );
        }
        if (sortBy === "price") {
          const priceA = a.pricing?.price_1m_output_tokens ?? Infinity;
          const priceB = b.pricing?.price_1m_output_tokens ?? Infinity;
          return priceA - priceB;
        }
        return 0;
      });
  }, [models, search, selectedVendor, sortBy]);

  return (
    <div className="model-visual-grid-container">
      <div className="model-grid-toolbar">
        <div className="model-search-box">
          <Search className="model-search-icon" size={15} strokeWidth={2} />
          <input
            type="text"
            placeholder="搜索模型或厂商..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="model-search-input font-sans"
          />
        </div>

        <div className="model-sort-switch font-sans">
          {SORT_OPTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`model-sort-btn ${sortBy === id ? "active" : ""}`}
              onClick={() => setSortBy(id)}
            >
              <Icon size={13} strokeWidth={2.25} aria-hidden />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="vendor-filter-strip font-sans">
        <span className="vendor-filter-title">厂商</span>
        <div className="vendor-chips-wrapper">
          {vendors.slice(0, 14).map((v) => (
            <button
              key={v}
              type="button"
              className={`vendor-chip ${selectedVendor === v ? "active" : ""}`}
              onClick={() => setSelectedVendor(v)}
            >
              {v === "all" ? (
                <Sparkles size={13} strokeWidth={2.25} aria-hidden />
              ) : (
                <VendorIcon name={v} size={14} />
              )}
              <span>{v === "all" ? "全部" : v}</span>
            </button>
          ))}
        </div>
        <span className="model-count-badge">
          {filteredModels.length} / {models.length}
        </span>
      </div>

      <div className="model-cards-grid">
        {filteredModels.map((m, idx) => {
          const intel = m.evaluations.artificial_analysis_intelligence_index;
          const coding = m.evaluations.artificial_analysis_coding_index;
          const agentic = m.evaluations.artificial_analysis_agentic_index;
          const speed = m.performance?.median_output_tokens_per_second;
          const ttft = m.performance?.median_time_to_first_token_seconds;
          const inPrice = m.pricing?.price_1m_input_tokens;
          const outPrice = m.pricing?.price_1m_output_tokens;
          const creator = m.model_creator?.name ?? "独立厂商";

          return (
            <article className="model-visual-card" key={m.id}>
              <header className="model-card-header">
                <div className="model-vendor-avatar" aria-hidden>
                  <VendorIcon name={creator} size={22} />
                  <span className="model-rank-badge">#{idx + 1}</span>
                </div>
                <div className="model-header-info">
                  <h3 className="model-title-text" title={m.name}>
                    {m.name}
                  </h3>
                  <div className="model-creator-tag">
                    <span className="model-meta-chip">
                      <span className="model-meta-chip-text">{creator}</span>
                    </span>
                    {m.release_date ? (
                      <span className="model-meta-chip">
                        <CalendarDays size={11} strokeWidth={2.25} aria-hidden />
                        <span className="model-meta-chip-text">
                          {m.release_date}
                        </span>
                      </span>
                    ) : null}
                  </div>
                </div>
              </header>

              <div className="model-card-meters">
                <div className="meter-row">
                  <span className="meter-label meter-label-intel">
                    <Brain size={12} strokeWidth={2.25} aria-hidden />
                    <span>智能</span>
                  </span>
                  <div className="meter-track">
                    <div
                      className="meter-fill intel"
                      style={{
                        width: `${intel ? Math.min((intel / maxIntel) * 100, 100) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="meter-val">
                    {intel != null ? formatNumber(intel, 1) : "—"}
                  </span>
                </div>

                <div className="meter-row">
                  <span className="meter-label meter-label-coding">
                    <Code2 size={12} strokeWidth={2.25} aria-hidden />
                    <span>编程</span>
                  </span>
                  <div className="meter-track">
                    <div
                      className="meter-fill coding"
                      style={{
                        width: `${coding ? Math.min((coding / maxCoding) * 100, 100) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="meter-val">
                    {coding != null ? formatNumber(coding, 1) : "—"}
                  </span>
                </div>

                <div className="meter-row">
                  <span className="meter-label meter-label-agentic">
                    <Bot size={12} strokeWidth={2.25} aria-hidden />
                    <span>Agent</span>
                  </span>
                  <div className="meter-track">
                    <div
                      className="meter-fill agentic"
                      style={{
                        width: `${agentic ? Math.min((agentic / maxAgentic) * 100, 100) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="meter-val">
                    {agentic != null ? formatNumber(agentic, 1) : "—"}
                  </span>
                </div>
              </div>

              <div className="model-card-footer-grid">
                <div className="footer-metric">
                  <span className="f-label">
                    <ArrowDownToLine size={11} strokeWidth={2.25} aria-hidden />
                    输入价格
                  </span>
                  <span className="f-val">
                    {inPrice != null ? formatPrice(inPrice) : "—"}
                  </span>
                </div>

                <div className="footer-metric">
                  <span className="f-label">
                    <ArrowUpFromLine size={11} strokeWidth={2.25} aria-hidden />
                    输出价格
                  </span>
                  <span className="f-val">
                    {outPrice != null ? formatPrice(outPrice) : "—"}
                  </span>
                </div>

                <div className="footer-metric">
                  <span className="f-label">
                    <Zap size={11} strokeWidth={2.25} aria-hidden />
                    生成速度
                  </span>
                  <span className="f-val">
                    {speed != null ? `${formatNumber(speed, 0)} TPS` : "—"}
                  </span>
                </div>

                <div className="footer-metric">
                  <span className="f-label">
                    <Timer size={11} strokeWidth={2.25} aria-hidden />
                    首 Token
                  </span>
                  <span className="f-val">
                    {ttft != null ? formatSeconds(ttft) : "—"}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {filteredModels.length === 0 && (
        <div className="empty-models-notice">
          未找到匹配“{search}”的语言模型数据
        </div>
      )}
    </div>
  );
}
