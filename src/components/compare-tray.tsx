import { clearCompare, removeCompare, useCompare } from "@/lib/compare-store";
import type { Dict } from "@/i18n";

type Props = {
  labels: Dict["compare"];
  compareHref: string;
};

/**
 * 已选模型的悬浮托盘。没选东西时完全不渲染——
 * 一个常驻的空托盘只会占掉移动端一条屏幕。
 */
export default function CompareTray({ labels, compareHref }: Props) {
  const { entries } = useCompare();

  if (entries.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3">
      <div className="panel pointer-events-auto flex max-w-full items-center gap-2 px-2 py-1.5 shadow-lg">
        <span className="eyebrow shrink-0 pl-1">{labels.tray}</span>

        <ul className="scrollbar-none flex min-w-0 items-center gap-1.5 overflow-x-auto">
          {entries.map((entry) => (
            <li key={entry.slug} className="shrink-0">
              <button
                type="button"
                onClick={() => removeCompare(entry.slug)}
                title={`${labels.remove}: ${entry.name}`}
                className="flex max-w-[11rem] items-center gap-1.5 rounded-sm border border-rule px-1.5 py-1 text-[12px] text-mute transition-colors hover:border-mute hover:text-fg"
              >
                <span className="truncate">{entry.name}</span>
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={clearCompare}
          className="shrink-0 px-1.5 py-1 text-[12px] text-mute transition-colors hover:text-fg"
        >
          {labels.clear}
        </button>

        <a
          href={compareHref}
          className="shrink-0 rounded-sm border border-gold/50 px-2 py-1 text-[12px] text-gold transition-colors hover:bg-gold/10"
        >
          {labels.open}
        </a>
      </div>
    </div>
  );
}
