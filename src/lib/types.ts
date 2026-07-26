/**
 * Artificial Analysis 快照的数据形状。
 *
 * 这些类型描述的是 data/*.json 里实际存在的字段，不是 API 文档里承诺的字段。
 * 大量字段是 nullable 且覆盖率很低（见 src/lib/metrics.ts 的 describeCoverage），
 * 任何消费方都必须假设它们会是 null。
 */

export type ModelCreator = {
  id: string;
  name: string;
};

export type LanguageModel = {
  id: string;
  /** 唯一，586/586 无重复，可直接做 URL。 */
  slug: string;
  name: string;
  /** 唯一 100% 覆盖的非平凡字段——时间轴就建立在它上面。 */
  release_date: string | null;
  model_creator: ModelCreator;
  evaluations: {
    /** 573/586 有值 */
    artificial_analysis_intelligence_index: number | null;
    /** 198/586 有值 */
    artificial_analysis_coding_index: number | null;
    /** 171/586 有值 */
    artificial_analysis_agentic_index: number | null;
  };
  artificial_analysis_intelligence_index_cost: {
    total_cost: number | null;
    cost_per_task: { total_cost: number | null };
  } | null;
  /** 396/586 有值 */
  pricing: {
    price_1m_input_tokens: number | null;
    price_1m_output_tokens: number | null;
    price_1m_cache_hit_tokens: number | null;
    price_1m_cache_write_tokens: number | null;
  } | null;
  /** 306/586 有值 */
  performance: {
    median_output_tokens_per_second: number | null;
    median_time_to_first_token_seconds: number | null;
    median_time_to_first_answer_token_seconds: number | null;
    median_end_to_end_response_time_seconds: number | null;
  } | null;
};

/** 竞技场式榜单：11 个媒体榜单全都是这个形状，只有一个 elo 值。 */
export type ArenaModel = {
  id: string;
  name: string;
  slug?: string;
  model_creator: ModelCreator;
  elo: number;
  /** 95% 置信区间半宽。旧版站点忽略了它，把 elo 当确定值展示。 */
  ci_95: number | null;
};

export type SpeechToSpeechModel = {
  id: string;
  name: string;
  slug: string;
  model_creator: ModelCreator;
  bba_score: number | null;
  fdb_score: number | null;
  tau_voice_score: number | null;
};

export type SpeechToTextModel = {
  id: string;
  name: string;
  model_creator: ModelCreator;
  /** 词错误率指数，越低越好。 */
  aa_wer_index: number | null;
};

export type DataEnvelope<T> = {
  fetched_at: string;
  intelligence_index_version?: number;
  data: T[];
};

/** 排名列表的行。语言模型榜和 11 个媒体竞技场都归约到这个形状。 */
export type RankRow = {
  name: string;
  creator: string;
  value: number | null;
  /** 已格式化的显示值——格式化需要 locale，不适合放进组件里做。 */
  display: string;
  href?: string;
  /** 95% 置信区间半宽，有则画误差须。 */
  ci?: number | null;
};
