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
} from "./types";

function asEnvelope<T>(raw: unknown): DataEnvelope<T> {
  return raw as DataEnvelope<T>;
}

function byEloDesc(a: ArenaModel, b: ArenaModel) {
  return (b.elo ?? -Infinity) - (a.elo ?? -Infinity);
}

function byIntelligenceDesc(a: LanguageModel, b: LanguageModel) {
  return (
    (b.evaluations.artificial_analysis_intelligence_index ?? -Infinity) -
    (a.evaluations.artificial_analysis_intelligence_index ?? -Infinity)
  );
}

export function getLanguageModels() {
  const envelope = asEnvelope<LanguageModel>(languageModels);
  return {
    ...envelope,
    data: [...envelope.data].sort(byIntelligenceDesc),
  };
}

export function getTextToImage() {
  const envelope = asEnvelope<ArenaModel>(textToImage);
  return { ...envelope, data: [...envelope.data].sort(byEloDesc) };
}

export function getImageEditing() {
  const envelope = asEnvelope<ArenaModel>(imageEditing);
  return { ...envelope, data: [...envelope.data].sort(byEloDesc) };
}

export function getTextToVideo() {
  const envelope = asEnvelope<ArenaModel>(textToVideo);
  return { ...envelope, data: [...envelope.data].sort(byEloDesc) };
}

export function getImageToVideo() {
  const envelope = asEnvelope<ArenaModel>(imageToVideo);
  return { ...envelope, data: [...envelope.data].sort(byEloDesc) };
}

export function getTextToVideoAudio() {
  const envelope = asEnvelope<ArenaModel>(textToVideoAudio);
  return { ...envelope, data: [...envelope.data].sort(byEloDesc) };
}

export function getImageToVideoAudio() {
  const envelope = asEnvelope<ArenaModel>(imageToVideoAudio);
  return { ...envelope, data: [...envelope.data].sort(byEloDesc) };
}

export function getTextToSpeech() {
  const envelope = asEnvelope<ArenaModel>(textToSpeech);
  return { ...envelope, data: [...envelope.data].sort(byEloDesc) };
}

export function getSpeechToSpeech() {
  const envelope = asEnvelope<SpeechToSpeechModel>(speechToSpeech);
  return {
    ...envelope,
    data: [...envelope.data].sort(
      (a, b) => (b.bba_score ?? -Infinity) - (a.bba_score ?? -Infinity)
    ),
  };
}

export function getSpeechToText() {
  const envelope = asEnvelope<SpeechToTextModel>(speechToText);
  return {
    ...envelope,
    data: [...envelope.data].sort(
      (a, b) => (a.aa_wer_index ?? Infinity) - (b.aa_wer_index ?? Infinity)
    ),
  };
}

export function getMusicInstrumental() {
  const envelope = asEnvelope<ArenaModel>(musicInstrumental);
  return { ...envelope, data: [...envelope.data].sort(byEloDesc) };
}

export function getMusicWithVocals() {
  const envelope = asEnvelope<ArenaModel>(musicWithVocals);
  return { ...envelope, data: [...envelope.data].sort(byEloDesc) };
}

export function getOverviewStats() {
  const llm = getLanguageModels();
  return {
    fetchedAt: llm.fetched_at,
    intelligenceIndexVersion: llm.intelligence_index_version,
    counts: {
      language: llm.data.length,
      image:
        getTextToImage().data.length + getImageEditing().data.length,
      video:
        getTextToVideo().data.length +
        getImageToVideo().data.length +
        getTextToVideoAudio().data.length +
        getImageToVideoAudio().data.length,
      speech:
        getTextToSpeech().data.length +
        getSpeechToSpeech().data.length +
        getSpeechToText().data.length,
      music:
        getMusicInstrumental().data.length +
        getMusicWithVocals().data.length,
    },
    top: {
      language: llm.data[0],
      image: getTextToImage().data[0],
      video: getTextToVideo().data[0],
      speech: getTextToSpeech().data[0],
      music: getMusicInstrumental().data[0],
    },
  };
}

export const NAV = [
  { href: "/", label: "总览" },
  { href: "/llm", label: "语言" },
  { href: "/image", label: "图像" },
  { href: "/video", label: "视频" },
  { href: "/speech", label: "语音" },
  { href: "/music", label: "音乐" },
] as const;
