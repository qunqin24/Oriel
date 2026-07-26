import { COMPARE_LIMIT, toggleCompare, useCompare } from "@/lib/compare-store";
import type { Dict } from "@/i18n";

type Props = {
  slug: string;
  name: string;
  creator: string;
  labels: Dict["compare"];
};

/** 模型详情页的加入对比按钮。与榜单里的按钮共用同一个 store。 */
export default function CompareButton({ slug, name, creator, labels }: Props) {
  const { slugs, isFull } = useCompare();
  const selected = slugs.has(slug);
  const blocked = isFull && !selected;

  return (
    <button
      type="button"
      disabled={blocked}
      onClick={() => toggleCompare({ slug, name, creator })}
      title={blocked ? `${labels.full} (${COMPARE_LIMIT})` : undefined}
      className={`rounded-sm border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
        selected
          ? "border-gold/50 text-gold"
          : "border-rule text-mute hover:border-mute hover:text-fg"
      }`}
    >
      {selected ? labels.added : labels.add}
    </button>
  );
}
