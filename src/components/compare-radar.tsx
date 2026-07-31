import { useMemo, useRef } from "react";
import { curveLinearClosed, lineRadial, pointRadial } from "d3-shape";
import { scaleLinear } from "d3-scale";
import { rowValue, type ColumnId, type ExplorerRow } from "@/lib/explorer-config";
import type { Dict } from "@/i18n";

/**
 * 对比页的多模型雷达图。几何计算走 d3-shape/d3-scale，和模型详情页那张
 * 单模型雷达图（radar-chart.astro）用的是同一套库，只是这里在浏览器里
 * 跑——对比页本来就是已挂载的 island，选择状态存在 localStorage 里，
 * 数据没法在构建期算好。
 *
 * 半径不从圆心起——真实数据最低也落在 15% 处，圆心专留给「没测过」，
 * 和模型详情页那张图同一套约定。
 */

const AXES: Array<{ id: Exclude<ColumnId, "name">; key: keyof Dict["models"]["cols"] }> = [
  { id: "intelligence", key: "intelligence" },
  { id: "coding", key: "coding" },
  { id: "agentic", key: "agentic" },
  { id: "throughput", key: "speed" },
  { id: "value", key: "value" },
];
const N = AXES.length;
const ANGLE_STEP = (2 * Math.PI) / N;

const VB = 300;
const C = VB / 2;
const R = 96;
const MIN_R = 0.15 * R;

/**
 * 固定顺序的四色分类色板，跑过 dataviz 校验脚本（CVD 模拟 + 正常视觉 ΔE +
 * 对比度，--pairs all，因为对比页最多 4 个模型可能同时叠在一张图上，
 * 任意两个都要能分清）。颜色跟着模型身份走，见下面的 slot 分配逻辑——
 * 移除某个模型时，其余模型的颜色不能跟着挪位。
 */
const SERIES_COLORS = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)"];

type Props = {
  selected: ExplorerRow[];
  pool: ExplorerRow[];
  labels: { compare: Dict["compare"]; models: Dict["models"] };
};

const LABEL_POS: Array<{ dx: number; dy: number; anchor: "start" | "middle" | "end" }> = [
  { dx: 0, dy: -10, anchor: "middle" },
  { dx: 10, dy: -1, anchor: "start" },
  { dx: 8, dy: 13, anchor: "start" },
  { dx: -8, dy: 13, anchor: "end" },
  { dx: -10, dy: -1, anchor: "end" },
];

export default function CompareRadar({ selected, pool, labels }: Props) {
  const domains = useMemo(
    () =>
      AXES.map(({ id }) => {
        const values = pool
          .map((row) => rowValue(row, id))
          .filter((v): v is number => v != null && Number.isFinite(v));
        const domain: [number, number] = values.length
          ? [Math.min(...values), Math.max(...values)]
          : [0, 1];
        return { scale: scaleLinear().domain(domain).range([MIN_R, R]).clamp(true), values };
      }),
    [pool]
  );

  const slotsRef = useRef<Map<string, number>>(new Map());
  const slots = useMemo(() => {
    const prev = slotsRef.current;
    const used = new Set<number>();
    const next = new Map<string, number>();
    for (const row of selected) {
      const slot = prev.get(row.slug);
      if (slot != null) {
        next.set(row.slug, slot);
        used.add(slot);
      }
    }
    for (const row of selected) {
      if (next.has(row.slug)) continue;
      let slot = 0;
      while (used.has(slot)) slot++;
      next.set(row.slug, slot);
      used.add(slot);
    }
    slotsRef.current = next;
    return next;
  }, [selected.map((row) => row.slug).join(",")]);

  const radialLine = useMemo(
    () =>
      lineRadial<{ angle: number; r: number }>()
        .angle((d) => d.angle)
        .radius((d) => d.r)
        .curve(curveLinearClosed),
    []
  );

  const gridPaths = useMemo(
    () =>
      [0.25, 0.5, 0.75, 1].map(
        (frac) =>
          radialLine(AXES.map((_, i) => ({ angle: i * ANGLE_STEP, r: frac * R }))) ?? ""
      ),
    [radialLine]
  );

  const spokes = useMemo(
    () => AXES.map((_, i) => pointRadial(i * ANGLE_STEP, R)),
    []
  );

  const avgPath = useMemo(() => {
    const points = domains.map(({ values }, i) => {
      const avg = values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;
      return { angle: i * ANGLE_STEP, r: avg != null ? domains[i].scale(avg) : MIN_R };
    });
    return radialLine(points) ?? "";
  }, [domains, radialLine]);

  const series = useMemo(
    () =>
      selected.map((row) => {
        const points = AXES.map(({ id }, i) => {
          const value = rowValue(row, id);
          const hasData = value != null && Number.isFinite(value);
          const r = hasData ? domains[i].scale(value) : 0;
          const [x, y] = pointRadial(i * ANGLE_STEP, r);
          return { angle: i * ANGLE_STEP, r, x, y, hasData };
        });
        return {
          slug: row.slug,
          name: row.name,
          color: SERIES_COLORS[slots.get(row.slug) ?? 0],
          points,
          d: radialLine(points) ?? "",
        };
      }),
    [selected, domains, slots, radialLine]
  );

  if (selected.length === 0) return null;

  const ariaLabel = `${labels.compare.radarTitle}: ${series.map((s) => s.name).join(", ")}`;

  return (
    <div className="mb-10">
      <div className="rule-head mb-4">
        <h2 className="text-sm font-semibold tracking-tight text-fg">
          {labels.compare.radarTitle}
        </h2>
        <span className="data shrink-0 text-[12px] text-mute">{labels.compare.radarNote}</span>
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <svg
          viewBox={`0 0 ${VB} ${VB}`}
          width={VB}
          height={VB}
          className="shrink-0"
          role="img"
          aria-label={ariaLabel}
        >
          <g transform={`translate(${C},${C})`}>
            {gridPaths.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="var(--rule)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {spokes.map(([x, y], i) => (
              <line
                key={i}
                x1={0}
                y1={0}
                x2={x.toFixed(1)}
                y2={y.toFixed(1)}
                stroke="var(--rule)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            <path
              d={avgPath}
              fill="none"
              stroke="var(--mute)"
              strokeWidth={1.25}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />

            {series.map((s) => (
              <path
                key={s.slug}
                d={s.d}
                fill={s.color}
                fillOpacity={0.12}
                stroke={s.color}
                strokeWidth={1.75}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {series.map((s) =>
              s.points.map((p, i) =>
                p.hasData ? (
                  <circle
                    key={`${s.slug}-${i}`}
                    cx={p.x.toFixed(1)}
                    cy={p.y.toFixed(1)}
                    r={2.5}
                    fill={s.color}
                  />
                ) : (
                  <circle
                    key={`${s.slug}-${i}`}
                    cx={0}
                    cy={0}
                    r={2}
                    fill="var(--ground)"
                    stroke={s.color}
                    strokeWidth={1}
                    strokeDasharray="1.5 1.5"
                  />
                )
              )
            )}

            {AXES.map(({ key }, i) => {
              const [ox, oy] = pointRadial(i * ANGLE_STEP, R);
              const pos = LABEL_POS[i];
              const x = (ox + pos.dx).toFixed(1);
              const y = (oy + pos.dy).toFixed(1);
              return (
                <text
                  key={key}
                  x={x}
                  y={y}
                  textAnchor={pos.anchor}
                  className="eyebrow"
                  fill="var(--mute)"
                >
                  {labels.models.cols[key]}
                </text>
              );
            })}
          </g>
        </svg>

        <div className="flex flex-col gap-2 text-[12px]">
          {series.map((s) => (
            <div key={s.slug} className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-fg">{s.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-mute">
            <span className="h-0 w-3 shrink-0 border-t border-dashed border-mute" />
            <span>{labels.compare.radarAverage}</span>
          </div>
          <p className="mt-1 max-w-xs text-mute">{labels.compare.radarHint}</p>
        </div>
      </div>
    </div>
  );
}
