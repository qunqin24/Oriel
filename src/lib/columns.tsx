import { ModelNameCell, ModelNameWithBadges } from "@/components/model-name-cell";
import {
  formatDate,
  formatNumber,
  formatPrice,
  formatSeconds,
} from "@/lib/format";
import type {
  ArenaModel,
  ColumnDef,
  LanguageModel,
  SpeechToSpeechModel,
  SpeechToTextModel,
} from "@/lib/types";

export const languageColumns: ColumnDef<LanguageModel>[] = [
  {
    key: "name",
    label: "模型",
    primary: true,
    getValue: (r) => r.name,
    getSearchText: (r) =>
      `${r.name} ${r.model_creator?.name ?? ""} ${r.slug ?? ""}`,
    format: (_v, r) => (
      <ModelNameCell
        name={r.name}
        creator={r.model_creator?.name}
        href={`/llm/${r.id}`}
      />
    ),
  },
  {
    key: "intelligence",
    label: "智能指数",
    align: "right",
    getValue: (r) => r.evaluations.artificial_analysis_intelligence_index,
    format: (v) => formatNumber(v as number | null, 1),
  },
  {
    key: "coding",
    label: "编程",
    align: "right",
    getValue: (r) => r.evaluations.artificial_analysis_coding_index,
    format: (v) => formatNumber(v as number | null, 1),
  },
  {
    key: "agentic",
    label: "Agent",
    align: "right",
    getValue: (r) => r.evaluations.artificial_analysis_agentic_index,
    format: (v) => formatNumber(v as number | null, 1),
  },
  {
    key: "price_in",
    label: "输入 $/1M",
    align: "right",
    getValue: (r) => r.pricing?.price_1m_input_tokens,
    format: (v) => formatPrice(v as number | null),
  },
  {
    key: "price_out",
    label: "输出 $/1M",
    align: "right",
    getValue: (r) => r.pricing?.price_1m_output_tokens,
    format: (v) => formatPrice(v as number | null),
  },
  {
    key: "speed",
    label: "tok/s",
    align: "right",
    getValue: (r) => r.performance?.median_output_tokens_per_second,
    format: (v) => formatNumber(v as number | null, 1),
  },
  {
    key: "ttft",
    label: "首 token",
    align: "right",
    getValue: (r) => r.performance?.median_time_to_first_token_seconds,
    format: (v) => formatSeconds(v as number | null),
  },
  {
    key: "released",
    label: "发布",
    align: "right",
    getValue: (r) => r.release_date,
    format: (v) => formatDate(v as string | null),
  },
];

/** Arena / Elo boards — single Elo score as badge after name. */
export const arenaColumns: ColumnDef<ArenaModel>[] = [
  {
    key: "elo",
    label: "Elo",
    align: "left",
    getValue: (r) => r.elo,
    getSearchText: (r) => `${r.name} ${r.model_creator?.name ?? ""}`,
    format: (_v, r) => {
      const badges = [formatNumber(r.elo, 0)];
      if (r.ci_95 != null) badges.push(`±${formatNumber(r.ci_95, 0)}`);
      return (
        <ModelNameWithBadges
          name={r.name}
          creator={r.model_creator?.name}
          badges={badges}
        />
      );
    },
  },
];

/** Speech-to-speech keeps multiple scores as separate columns. */
export const speechToSpeechColumns: ColumnDef<SpeechToSpeechModel>[] = [
  {
    key: "name",
    label: "模型",
    primary: true,
    getValue: (r) => r.name,
    getSearchText: (r) => `${r.name} ${r.model_creator?.name ?? ""}`,
    format: (_v, r) => (
      <ModelNameCell name={r.name} creator={r.model_creator?.name} />
    ),
  },
  {
    key: "bba",
    label: "BBA",
    align: "right",
    getValue: (r) => r.bba_score,
    format: (v) => formatNumber(v as number | null, 2),
  },
  {
    key: "fdb",
    label: "FDB",
    align: "right",
    getValue: (r) => r.fdb_score,
    format: (v) => formatNumber(v as number | null, 2),
  },
  {
    key: "tau",
    label: "τ-Voice",
    align: "right",
    getValue: (r) => r.tau_voice_score,
    format: (v) => formatNumber(v as number | null, 2),
  },
];

/** Speech-to-text — single WER score as badge. */
export const speechToTextColumns: ColumnDef<SpeechToTextModel>[] = [
  {
    key: "wer",
    label: "AA WER",
    align: "left",
    getValue: (r) => r.aa_wer_index,
    getSearchText: (r) => `${r.name} ${r.model_creator?.name ?? ""}`,
    format: (v, r) => (
      <ModelNameWithBadges
        name={r.name}
        creator={r.model_creator?.name}
        badges={[v != null ? formatNumber(Number(v), 2) : "—"]}
      />
    ),
  },
];
