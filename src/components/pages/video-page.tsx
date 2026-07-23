import { ArenaTab } from "@/components/arena-tab";
import { PageHero } from "@/components/page-hero";
import { StaticSegmentedTabs } from "@/components/static-segmented-tabs";
import {
  getImageToVideo,
  getImageToVideoAudio,
  getTextToVideo,
  getTextToVideoAudio,
} from "@/lib/data";
import { formatRelativeFetched } from "@/lib/format";

export function VideoPage() {
  const t2v = getTextToVideo();
  const i2v = getImageToVideo();
  const t2va = getTextToVideoAudio();
  const i2va = getImageToVideoAudio();

  return (
    <>
      <PageHero
        eyebrow="视频"
        title="视频 Arena 榜单"
        description="覆盖文生视频、图生视频，以及带音频的视频生成 Arena Elo 排名。"
        meta={`快照 ${formatRelativeFetched(t2v.fetched_at)}`}
      />
      <StaticSegmentedTabs
        tabs={[
          {
            id: "t2v",
            label: "文生视频",
            count: t2v.data.length,
            content: <ArenaTab rows={t2v.data} />,
          },
          {
            id: "i2v",
            label: "图生视频",
            count: i2v.data.length,
            content: <ArenaTab rows={i2v.data} />,
          },
          {
            id: "t2va",
            label: "文生视频 + 音频",
            count: t2va.data.length,
            content: <ArenaTab rows={t2va.data} />,
          },
          {
            id: "i2va",
            label: "图生视频 + 音频",
            count: i2va.data.length,
            content: <ArenaTab rows={i2va.data} />,
          },
        ]}
      />
    </>
  );
}
