import languageModels from "../../data/language-models.json";
import textToImage from "../../data/media-text-to-image.json";
import imageEditing from "../../data/media-image-editing.json";
import textToVideo from "../../data/media-text-to-video.json";
import imageToVideo from "../../data/media-image-to-video.json";
import textToVideoAudio from "../../data/media-text-to-video-audio.json";
import imageToVideoAudio from "../../data/media-image-to-video-audio.json";
import textToSpeech from "../../data/media-text-to-speech.json";
import speechToSpeech from "../../data/media-speech-to-speech.json";
import speechToText from "../../data/media-speech-to-text.json";
import musicInstrumental from "../../data/media-music-instrumental.json";
import musicWithVocals from "../../data/media-music-with-vocals.json";

import type {
  ArenaModel,
  DataEnvelope,
  LanguageModel,
  SpeechToSpeechModel,
  SpeechToTextModel,
} from "./types.ts";
import type { Dict } from "@/i18n";

const llmEnvelope = languageModels as unknown as DataEnvelope<LanguageModel>;

/** 语言模型，按智能指数降序。没有指数的排在最后。 */
export const MODELS: LanguageModel[] = [...llmEnvelope.data].sort(
  (a, b) =>
    (b.evaluations.artificial_analysis_intelligence_index ?? -Infinity) -
    (a.evaluations.artificial_analysis_intelligence_index ?? -Infinity)
);

export const SNAPSHOT = {
  fetchedAt: llmEnvelope.fetched_at,
  indexVersion: llmEnvelope.intelligence_index_version ?? null,
};

const BY_SLUG = new Map(MODELS.map((model) => [model.slug, model]));
const BY_ID = new Map(MODELS.map((model) => [model.id, model]));

export function modelBySlug(slug: string): LanguageModel | undefined {
  return BY_SLUG.get(slug);
}

export function modelById(id: string): LanguageModel | undefined {
  return BY_ID.get(id);
}

export type Vendor = { name: string; count: number };

/** 厂商及其模型数，按模型数降序。 */
export const VENDORS: Vendor[] = (() => {
  const counts = new Map<string, number>();
  for (const model of MODELS) {
    const name = model.model_creator?.name;
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
})();

/* ------------------------------------------------------------------ *
 * 媒体竞技场
 *
 * 11 个榜单在原始数据里有三种形状（elo+ci、语音对话三项分、语音转文本 WER）。
 * 这里统一成一种行结构，让 /media 只需要一个渲染器——旧站为此写了四个页面。
 * ------------------------------------------------------------------ */

export type MediaRow = {
  id: string;
  name: string;
  creator: string;
  /** 主排序值。elo、bba_score 或 wer 指数。 */
  value: number | null;
  /** 95% 置信区间半宽，只有 Elo 榜有。 */
  ci: number | null;
  /** 次要分数，目前只有语音对话榜用到。 */
  extra: Array<{ label: string; value: number | null }>;
};

export type MediaBoard = {
  id: string;
  /** 取字典里的名字，避免把中英文硬编码进数据层。 */
  label: (dict: Dict) => string;
  unit: (dict: Dict) => string;
  /** 语音转文本的 WER 指数越低越好，其余越高越好。 */
  lowerIsBetter: boolean;
  rows: MediaRow[];
};

function arenaRows(raw: unknown): MediaRow[] {
  const envelope = raw as unknown as DataEnvelope<ArenaModel>;
  return [...envelope.data]
    .sort((a, b) => (b.elo ?? -Infinity) - (a.elo ?? -Infinity))
    .map((model) => ({
      id: model.id,
      name: model.name,
      creator: model.model_creator?.name ?? "",
      value: model.elo ?? null,
      ci: model.ci_95 ?? null,
      extra: [],
    }));
}

/** FDB 与 τ-voice 是指标缩写，不进字典——它们在两种语言里都这么写。 */
function speechToSpeechRows(): MediaRow[] {
  const envelope = speechToSpeech as unknown as DataEnvelope<SpeechToSpeechModel>;
  return [...envelope.data]
    .sort((a, b) => (b.bba_score ?? -Infinity) - (a.bba_score ?? -Infinity))
    .map((model) => ({
      id: model.id,
      name: model.name,
      creator: model.model_creator?.name ?? "",
      value: model.bba_score,
      ci: null,
      extra: [
        { label: "FDB", value: model.fdb_score },
        { label: "τ-voice", value: model.tau_voice_score },
      ],
    }));
}

function speechToTextRows(): MediaRow[] {
  const envelope = speechToText as unknown as DataEnvelope<SpeechToTextModel>;
  return [...envelope.data]
    .sort((a, b) => (a.aa_wer_index ?? Infinity) - (b.aa_wer_index ?? Infinity))
    .map((model) => ({
      id: model.id,
      name: model.name,
      creator: model.model_creator?.name ?? "",
      value: model.aa_wer_index,
      ci: null,
      extra: [],
    }));
}

export const MEDIA_BOARDS: MediaBoard[] = [
  {
    id: "text-to-image",
    label: (d) => d.media.boards.textToImage,
    unit: (d) => d.media.elo,
    lowerIsBetter: false,
    rows: arenaRows(textToImage),
  },
  {
    id: "image-editing",
    label: (d) => d.media.boards.imageEditing,
    unit: (d) => d.media.elo,
    lowerIsBetter: false,
    rows: arenaRows(imageEditing),
  },
  {
    id: "text-to-video",
    label: (d) => d.media.boards.textToVideo,
    unit: (d) => d.media.elo,
    lowerIsBetter: false,
    rows: arenaRows(textToVideo),
  },
  {
    id: "image-to-video",
    label: (d) => d.media.boards.imageToVideo,
    unit: (d) => d.media.elo,
    lowerIsBetter: false,
    rows: arenaRows(imageToVideo),
  },
  {
    id: "text-to-video-audio",
    label: (d) => d.media.boards.textToVideoAudio,
    unit: (d) => d.media.elo,
    lowerIsBetter: false,
    rows: arenaRows(textToVideoAudio),
  },
  {
    id: "image-to-video-audio",
    label: (d) => d.media.boards.imageToVideoAudio,
    unit: (d) => d.media.elo,
    lowerIsBetter: false,
    rows: arenaRows(imageToVideoAudio),
  },
  {
    id: "text-to-speech",
    label: (d) => d.media.boards.textToSpeech,
    unit: (d) => d.media.elo,
    lowerIsBetter: false,
    rows: arenaRows(textToSpeech),
  },
  {
    id: "speech-to-speech",
    label: (d) => d.media.boards.speechToSpeech,
    unit: (d) => d.media.score,
    lowerIsBetter: false,
    rows: speechToSpeechRows(),
  },
  {
    id: "speech-to-text",
    label: (d) => d.media.boards.speechToText,
    unit: (d) => d.media.wer,
    lowerIsBetter: true,
    rows: speechToTextRows(),
  },
  {
    id: "music-instrumental",
    label: (d) => d.media.boards.musicInstrumental,
    unit: (d) => d.media.elo,
    lowerIsBetter: false,
    rows: arenaRows(musicInstrumental),
  },
  {
    id: "music-with-vocals",
    label: (d) => d.media.boards.musicWithVocals,
    unit: (d) => d.media.elo,
    lowerIsBetter: false,
    rows: arenaRows(musicWithVocals),
  },
];

export const MEDIA_TOTAL = MEDIA_BOARDS.reduce(
  (sum, board) => sum + board.rows.length,
  0
);
