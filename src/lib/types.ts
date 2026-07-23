import React from "react";

export type ModelCreator = {
  id: string;
  name: string;
};

export type LanguageModel = {
  id: string;
  name: string;
  slug: string;
  release_date: string | null;
  model_creator: ModelCreator;
  evaluations: {
    artificial_analysis_intelligence_index: number | null;
    artificial_analysis_coding_index: number | null;
    artificial_analysis_agentic_index: number | null;
  };
  artificial_analysis_intelligence_index_cost: {
    total_cost: number | null;
    cost_per_task: { total_cost: number | null };
  } | null;
  pricing: {
    price_1m_input_tokens: number | null;
    price_1m_output_tokens: number | null;
    price_1m_cache_hit_tokens: number | null;
    price_1m_cache_write_tokens: number | null;
  } | null;
  performance: {
    median_output_tokens_per_second: number | null;
    median_time_to_first_token_seconds: number | null;
    median_time_to_first_answer_token_seconds: number | null;
    median_end_to_end_response_time_seconds: number | null;
  } | null;
};

export type ArenaModel = {
  id: string;
  name: string;
  slug?: string;
  model_creator: ModelCreator;
  elo: number;
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
  aa_wer_index: number | null;
};

export type DataEnvelope<T> = {
  fetched_at: string;
  intelligence_index_version?: number;
  data: T[];
};

export type ColumnDef<T> = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  getValue: (row: T) => string | number | null | undefined;
  /** Extra text used by table search (in addition to getValue). */
  getSearchText?: (row: T) => string;
  format?: (value: any, row: T) => string | React.ReactNode;
  primary?: boolean;
};
