import { ArenaTab } from "@/components/arena-tab";
import { SpeechToSpeechBoard, SpeechToTextBoard } from "@/components/boards";
import { BarChart } from "@/components/charts/bar-chart";
import { ChartPanel } from "@/components/charts/chart-panel";
import { PageHero } from "@/components/page-hero";
import { StaticSegmentedTabs } from "@/components/static-segmented-tabs";
import {
  getSpeechToSpeech,
  getSpeechToText,
  getTextToSpeech,
} from "@/lib/data";
import { formatRelativeFetched } from "@/lib/format";

export function SpeechPage() {
  const tts = getTextToSpeech();
  const s2s = getSpeechToSpeech();
  const stt = getSpeechToText();

  return (
    <>
      <PageHero
        eyebrow="语音"
        title="语音模型榜单"
        description="TTS Arena Elo、语音对话基准分数，以及语音转写 AA WER 指数（越低越好）。"
        meta={`快照 ${formatRelativeFetched(tts.fetched_at)}`}
      />
      <StaticSegmentedTabs
        tabs={[
          {
            id: "tts",
            label: "文生语音",
            count: tts.data.length,
            content: <ArenaTab rows={tts.data} />,
          },
          {
            id: "s2s",
            label: "语音对话",
            count: s2s.data.length,
            content: (
              <div className="tab-stack">
                <ChartPanel
                  title="BBA 分数 Top 10"
                  note={`共 ${s2s.data.length} 个模型`}
                >
                  <BarChart
                    items={s2s.data.slice(0, 10).map((m) => ({
                      label: m.name,
                      value: m.bba_score,
                      creator: m.model_creator?.name,
                    }))}
                    digits={2}
                  />
                </ChartPanel>
                <SpeechToSpeechBoard rows={s2s.data} />
              </div>
            ),
          },
          {
            id: "stt",
            label: "语音转写",
            count: stt.data.length,
            content: (
              <div className="tab-stack">
                <ChartPanel
                  title="AA WER 指数（越低越好）"
                  note="词错误率综合指数"
                >
                  <BarChart
                    items={[...stt.data]
                      .filter((m) => m.aa_wer_index != null)
                      .sort(
                        (a, b) =>
                          (b.aa_wer_index ?? 0) - (a.aa_wer_index ?? 0)
                      )
                      .slice(0, 10)
                      .map((m) => ({
                        label: m.name,
                        value: m.aa_wer_index,
                        creator: m.model_creator?.name,
                      }))}
                    digits={2}
                  />
                </ChartPanel>
                <SpeechToTextBoard rows={stt.data} />
              </div>
            ),
          },
        ]}
      />
      <p className="note">
        语音转写按 AA WER 指数升序（错误率越低越好）。语音对话使用 BBA / FDB /
        τ-Voice 分数，而非 Elo。
      </p>
    </>
  );
}
