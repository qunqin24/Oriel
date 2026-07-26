import { ModelNameCell, ModelNameWithBadges } from "@/components/model-name-cell";
import { formatNumber } from "@/lib/format";
import type {
  ArenaModel,
  ColumnDef,
  SpeechToSpeechModel,
  SpeechToTextModel,
} from "@/lib/types";

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
