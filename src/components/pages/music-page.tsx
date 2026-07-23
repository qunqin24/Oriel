import { ArenaTab } from "@/components/arena-tab";
import { PageHero } from "@/components/page-hero";
import { StaticSegmentedTabs } from "@/components/static-segmented-tabs";
import { getMusicInstrumental, getMusicWithVocals } from "@/lib/data";
import { formatRelativeFetched } from "@/lib/format";

export function MusicPage() {
  const instrumental = getMusicInstrumental();
  const vocals = getMusicWithVocals();

  return (
    <>
      <PageHero
        eyebrow="音乐"
        title="音乐 Arena 榜单"
        description="纯音乐生成与带人声音乐的 Elo 排名。"
        meta={`快照 ${formatRelativeFetched(instrumental.fetched_at)}`}
      />
      <StaticSegmentedTabs
        tabs={[
          {
            id: "instrumental",
            label: "纯音乐",
            count: instrumental.data.length,
            content: <ArenaTab rows={instrumental.data} />,
          },
          {
            id: "vocals",
            label: "带人声",
            count: vocals.data.length,
            content: <ArenaTab rows={vocals.data} />,
          },
        ]}
      />
    </>
  );
}
