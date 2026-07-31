import { useMemo } from "react";
import {
  HIGHER_IS_BETTER,
  rowValue,
  unpackRow,
  type ColumnId,
  type ExplorerRow,
  type PackedRow,
} from "@/lib/explorer-config";
import CompareRadar from "./compare-radar";
import VendorIcon from "./vendor-icon";
import {
  formatNumber,
  formatPrice,
  formatSeconds,
  NO_VALUE,
} from "@/lib/format";
import { removeCompare, useCompare } from "@/lib/compare-store";
import type { Dict, Locale } from "@/i18n";

type Props = {
  rows: PackedRow[];
  locale: Locale;
  labels: { compare: Dict["compare"]; models: Dict["models"] };
  modelBase: string;
  browseHref: string;
};

/** 对比表的行。与探索器共用 explorer-config 的取值与方向定义。 */
const METRIC_ROWS: Array<{ id: Exclude<ColumnId, "name">; key: keyof Dict["models"]["cols"] }> = [
  { id: "intelligence", key: "intelligence" },
  { id: "coding", key: "coding" },
  { id: "agentic", key: "agentic" },
  { id: "value", key: "value" },
  { id: "priceIn", key: "priceIn" },
  { id: "priceOut", key: "priceOut" },
  { id: "throughput", key: "speed" },
  { id: "ttft", key: "ttft" },
];

function display(
  row: ExplorerRow,
  metric: Exclude<ColumnId, "name">,
  locale: Locale
): string {
  switch (metric) {
    case "priceIn":
      return formatPrice(row.priceIn);
    case "priceOut":
      return formatPrice(row.priceOut);
    case "ttft":
      return formatSeconds(row.ttft);
    case "throughput":
      return formatNumber(row.throughput, locale, 0);
    case "release":
      return row.release ?? NO_VALUE;
    default:
      return formatNumber(row[metric], locale, 1);
  }
}

export default function CompareBoard({
  rows: packed,
  locale,
  labels,
  modelBase,
  browseHref,
}: Props) {
  const { entries } = useCompare();

  // 只需要按 slug 查最多 4 个，解包时直接建索引。
  const bySlug = useMemo(() => {
    const map = new Map<string, ExplorerRow>();
    for (const entry of packed) {
      const row = unpackRow(entry);
      map.set(row.slug, row);
    }
    return map;
  }, [packed]);

  const selected = entries
    .map((entry) => bySlug.get(entry.slug))
    .filter((row): row is ExplorerRow => row != null);

  // 雷达图的「全站均值」参照系需要完整分布，不只是选中的几个。
  const pool = useMemo(() => Array.from(bySlug.values()), [bySlug]);

  if (selected.length === 0) {
    return (
      <div className="panel px-5 py-12 text-center">
        <p className="text-sm text-fg">{labels.compare.empty}</p>
        <p className="mt-1 text-xs text-mute">{labels.compare.emptyHint}</p>
        <a
          href={browseHref}
          className="mt-4 inline-block rounded-sm border border-rule px-3 py-1.5 text-xs text-mute transition-colors hover:border-mute hover:text-fg"
        >
          {labels.compare.browse}
        </a>
      </div>
    );
  }

  return (
    <div>
      <CompareRadar selected={selected} pool={pool} labels={labels} />
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-rule align-bottom">
              <th scope="col" className="w-28 py-2 pr-3 text-left whitespace-nowrap">
                <span className="eyebrow">{labels.models.cols.name}</span>
              </th>
              {selected.map((row) => (
                <th key={row.slug} scope="col" className="min-w-[9rem] py-2 pl-3 text-left">
                  <a
                    href={`${modelBase}/${row.slug}`}
                    className="block text-fg transition-colors hover:text-gold"
                  >
                    {row.name}
                  </a>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-mute">
                    <VendorIcon name={row.creator} size={12} />
                    {row.creator}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCompare(row.slug)}
                    className="mt-1.5 text-[12px] text-mute transition-colors hover:text-fall"
                  >
                    {labels.compare.remove}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRIC_ROWS.map(({ id, key }) => {
              const values = selected.map((row) => rowValue(row, id));
              const present = values.filter(
                (value): value is number => value != null && Number.isFinite(value)
              );
              // 只有一列有数据时不标「最优」——跟自己比没有意义。
              const best =
                present.length > 1
                  ? HIGHER_IS_BETTER[id]
                    ? Math.max(...present)
                    : Math.min(...present)
                  : null;

              return (
                <tr key={id} className="border-b border-rule/50">
                  <th scope="row" className="py-2 pr-3 text-left font-normal text-mute whitespace-nowrap">
                    {labels.models.cols[key]}
                  </th>
                  {selected.map((row, index) => {
                    const value = values[index];
                    const isBest = best != null && value === best;
                    return (
                      <td
                        key={row.slug}
                        className={`data py-2 pl-3 ${
                          value == null
                            ? "text-mute/50"
                            : isBest
                              ? "text-gold"
                              : "text-fg"
                        }`}
                      >
                        {display(row, id, locale)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr>
              <th scope="row" className="py-2 pr-3 text-left font-normal text-mute whitespace-nowrap">
                {labels.models.cols.release}
              </th>
              {selected.map((row) => (
                <td key={row.slug} className="data py-2 pl-3 text-fg">
                  {row.release ?? NO_VALUE}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
