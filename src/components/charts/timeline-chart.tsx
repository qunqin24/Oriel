"use client";

import { formatNumber } from "@/lib/format";

type Point = {
  id: string;
  name: string;
  dateStr: string;
  timestamp: number;
  score: number;
  creator: string;
};

type Props = {
  data: {
    id: string;
    name: string;
    release_date: string | null;
    evaluations: {
      artificial_analysis_intelligence_index: number | null;
    };
    model_creator?: {
      name: string;
    };
  }[];
  highlightId?: string;
};

const W = 800;
const H = 360;
const PAD = { top: 25, right: 30, bottom: 45, left: 50 };
const LABEL_FONT_SIZE = 9.5;
const LABEL_LINE_HEIGHT = 15;
const LABEL_MAX_LENGTH = 30;

/** Stable SVG coords across Node/browser float differences (avoids hydration mismatch). */
const px = (n: number) => Math.round(n * 100) / 100;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const compactLabel = (name: string) => {
  if (name.length <= LABEL_MAX_LENGTH) return name;
  return `${name.slice(0, LABEL_MAX_LENGTH - 1).trimEnd()}…`;
};

const estimateLabelWidth = (label: string) =>
  px(
    [...label].reduce(
      (width, char) => width + (char.charCodeAt(0) > 255 ? 9 : 5.2),
      0
    )
  );

type LabelPlacement = {
  point: Point;
  text: string;
  width: number;
  cx: number;
  cy: number;
  side: "left" | "right";
  x: number;
  y: number;
};

function spreadLabelYs(labels: LabelPlacement[], minY: number, maxY: number) {
  const sorted = [...labels].sort((a, b) => a.cy - b.cy);

  sorted.forEach((label, index) => {
    const targetY = clamp(label.cy, minY, maxY);
    label.y =
      index === 0
        ? targetY
        : Math.max(targetY, sorted[index - 1].y + LABEL_LINE_HEIGHT);
  });

  if (sorted.length > 0 && sorted[sorted.length - 1].y > maxY) {
    sorted[sorted.length - 1].y = maxY;
    for (let index = sorted.length - 2; index >= 0; index -= 1) {
      sorted[index].y = Math.min(
        sorted[index].y,
        sorted[index + 1].y - LABEL_LINE_HEIGHT
      );
    }
  }

  if (sorted.length > 0 && sorted[0].y < minY) {
    sorted[0].y = minY;
    for (let index = 1; index < sorted.length; index += 1) {
      sorted[index].y = Math.max(
        sorted[index].y,
        sorted[index - 1].y + LABEL_LINE_HEIGHT
      );
    }
  }
}

export function TimelineChart({ data, highlightId }: Props) {
  const points: Point[] = data
    .filter(
      (m) =>
        m.release_date &&
        m.evaluations.artificial_analysis_intelligence_index != null
    )
    .map((m) => {
      const date = new Date(m.release_date!);
      return {
        id: m.id,
        name: m.name,
        dateStr: m.release_date!,
        timestamp: date.getTime(),
        score: m.evaluations.artificial_analysis_intelligence_index!,
        creator: m.model_creator?.name ?? "未知",
      };
    })
    .filter((p) => !isNaN(p.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (points.length === 0) return null;

  const minTime = Math.min(...points.map((p) => p.timestamp));
  const maxTime = Math.max(...points.map((p) => p.timestamp));
  const minScore = Math.floor(Math.min(...points.map((p) => p.score)) / 5) * 5;
  const maxScore = Math.ceil(Math.max(...points.map((p) => p.score)) / 5) * 5;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const sx = (t: number) =>
    px(PAD.left + ((t - minTime) / (maxTime - minTime || 1)) * innerW);
  const sy = (s: number) =>
    px(
      PAD.top + innerH - ((s - minScore) / (maxScore - minScore || 1)) * innerH
    );

  const yTicks: number[] = [];
  for (let s = minScore; s <= maxScore; s += 10) {
    yTicks.push(s);
  }

  const minYear = new Date(minTime).getFullYear();
  const maxYear = new Date(maxTime).getFullYear();
  const yearTicks: { label: string; time: number }[] = [];

  for (let y = minYear; y <= maxYear; y++) {
    yearTicks.push({
      label: `${y}年`,
      time: new Date(`${y}-01-01`).getTime(),
    });
    yearTicks.push({
      label: `${y}年07月`,
      time: new Date(`${y}-07-01`).getTime(),
    });
  }
  const validYearTicks = yearTicks.filter(
    (t) => t.time >= minTime && t.time <= maxTime
  );

  const topPoints = [...points]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  const topIds = new Set(topPoints.map((p) => p.id));
  if (highlightId) {
    const highlighted = points.find((p) => p.id === highlightId);
    if (highlighted && !topIds.has(highlightId)) {
      topPoints.push(highlighted);
      topIds.add(highlightId);
    }
  }
  const labelPlacements: LabelPlacement[] = topPoints.map((point) => {
    const text = compactLabel(point.name);
    const width = estimateLabelWidth(text);
    const cx = sx(point.timestamp);
    const cy = sy(point.score);
    const side = cx > PAD.left + innerW * 0.58 ? "left" : "right";
    const desiredX = side === "left" ? cx - 8 : cx + 8;
    const x =
      side === "left"
        ? clamp(desiredX, PAD.left + width + 4, W - PAD.right - 4)
        : clamp(desiredX, PAD.left + 4, W - PAD.right - width - 4);

    return {
      point,
      text,
      width,
      cx,
      cy,
      side,
      x: px(x),
      y: cy,
    };
  });

  spreadLabelYs(
    labelPlacements.filter((label) => label.side === "left"),
    PAD.top + LABEL_FONT_SIZE,
    H - PAD.bottom - LABEL_FONT_SIZE
  );
  spreadLabelYs(
    labelPlacements.filter((label) => label.side === "right"),
    PAD.top + LABEL_FONT_SIZE,
    H - PAD.bottom - LABEL_FONT_SIZE
  );

  const labelPlacementById = new Map(
    labelPlacements.map((label) => [label.point.id, label])
  );

  let currentMax = -Infinity;
  const frontierPoints: Point[] = [];
  points.forEach((p) => {
    if (p.score > currentMax) {
      currentMax = p.score;
      frontierPoints.push(p);
    }
  });

  const pathD = frontierPoints
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${sx(p.timestamp)} ${sy(p.score)}`
    )
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="scatter"
      role="img"
      aria-label="大模型智能指数演进趋势图"
    >
      {yTicks.map((t) => (
        <g key={`y-${t}`}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={sy(t)}
            y2={sy(t)}
            className="scatter-grid"
          />
          <text
            x={PAD.left - 10}
            y={sy(t) + 4}
            className="scatter-tick"
            textAnchor="end"
          >
            {t}
          </text>
        </g>
      ))}

      {validYearTicks.map((t) => {
        const tx = sx(t.time);
        return (
          <g key={`x-${t.label}`}>
            <line
              x1={tx}
              x2={tx}
              y1={PAD.top}
              y2={H - PAD.bottom}
              className="scatter-grid scatter-grid-v"
            />
            <text
              x={tx}
              y={H - PAD.bottom + 18}
              className="scatter-tick"
              textAnchor="middle"
            >
              {t.label}
            </text>
          </g>
        );
      })}

      {frontierPoints.length > 1 && (
        <path
          d={pathD}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeDasharray="4 4"
          opacity="0.6"
        />
      )}

      {points.map((p) => {
        const cx = sx(p.timestamp);
        const cy = sy(p.score);
        const isHighlight = highlightId === p.id;
        const hot = topIds.has(p.id);
        const label = labelPlacementById.get(p.id);

        return (
          <g key={p.id}>
            {isHighlight ? (
              <circle
                cx={cx}
                cy={cy}
                r={11}
                fill="none"
                stroke="var(--oriel-gold)"
                strokeWidth={1.5}
                opacity={0.85}
              />
            ) : null}
            <circle
              cx={cx}
              cy={cy}
              r={isHighlight ? 5.5 : hot ? 4.5 : 2.5}
              className={`scatter-dot ${hot || isHighlight ? "scatter-dot-hot" : ""}`}
              style={isHighlight ? { fill: "var(--oriel-gold)" } : undefined}
            >
              <title>{`${p.name} (${p.dateStr}) — 智能指数: ${formatNumber(
                p.score,
                1
              )}`}</title>
            </circle>
            {hot && label && (
              <g aria-hidden="true" pointerEvents="none">
                <line
                  x1={cx}
                  y1={cy}
                  x2={label.side === "left" ? label.x + 3 : label.x - 3}
                  y2={label.y}
                  stroke="var(--line-strong)"
                  strokeWidth="0.8"
                  opacity="0.75"
                />
                <rect
                  x={label.side === "left" ? label.x - label.width - 3 : label.x - 3}
                  y={label.y - 7}
                  width={label.width + 6}
                  height="14"
                  rx="3"
                  fill="var(--bg)"
                  fillOpacity="0.9"
                  stroke="var(--line)"
                  strokeWidth="0.6"
                />
                <text
                  x={label.x}
                  y={label.y}
                  className="scatter-label"
                  textAnchor={label.side === "left" ? "end" : "start"}
                  dominantBaseline="middle"
                  style={{
                    fontSize: `${LABEL_FONT_SIZE}px`,
                    fontWeight: isHighlight ? 600 : undefined,
                  }}
                >
                  {label.text}
                </text>
              </g>
            )}
          </g>
        );
      })}

      <text
        x={PAD.left + innerW / 2}
        y={H - 6}
        className="scatter-axis"
        textAnchor="middle"
      >
        发布时间 (Release Date)
      </text>
      <text
        x={14}
        y={PAD.top + innerH / 2}
        className="scatter-axis"
        textAnchor="middle"
        transform={`rotate(-90 14 ${PAD.top + innerH / 2})`}
      >
        智能指数 (Intelligence Index)
      </text>
    </svg>
  );
}
