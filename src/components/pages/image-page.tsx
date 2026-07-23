import { ArenaTab } from "@/components/arena-tab";
import { PageHero } from "@/components/page-hero";
import { StaticSegmentedTabs } from "@/components/static-segmented-tabs";
import { getImageEditing, getTextToImage } from "@/lib/data";
import { formatRelativeFetched } from "@/lib/format";

export function ImagePage() {
  const t2i = getTextToImage();
  const edit = getImageEditing();

  return (
    <>
      <PageHero
        eyebrow="图像"
        title="图像 Arena 榜单"
        description="基于 Artificial Analysis 图像 Arena 的 Elo 排名，覆盖文生图与图像编辑。"
        meta={`快照 ${formatRelativeFetched(t2i.fetched_at)}`}
      />
      <StaticSegmentedTabs
        tabs={[
          {
            id: "t2i",
            label: "文生图",
            count: t2i.data.length,
            content: <ArenaTab rows={t2i.data} />,
          },
          {
            id: "edit",
            label: "图像编辑",
            count: edit.data.length,
            content: <ArenaTab rows={edit.data} />,
          },
        ]}
      />
    </>
  );
}
