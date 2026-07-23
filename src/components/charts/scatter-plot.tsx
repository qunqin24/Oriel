type Point = {
  id: string;
  label: string;
  x: number;
  y: number;
};

type Props = {
  points: Point[];
  xLabel: string;
  yLabel: string;
  logX?: boolean;
  formatX?: (v: number) => string;
  formatY?: (v: number) => string;
  labelTopN?: number;
  /** Emphasize a specific point (e.g. current model on detail page). */
  highlightId?: string;
};

const W = 760;
const H = 420;
const PAD = { top: 20, right: 24, bottom: 44, left: 52 };

/** Stable SVG coords across Node/browser float differences (avoids hydration mismatch). */
const px = (n: number) => Math.round(n * 100) / 100;

function niceTicks(min: number, max: number, count = 5) {
  if (min === max) return [min];
  const step = (max - min) / (count - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(step)));
  const norm = step / mag;
  const nice = norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1;
  const s = nice * mag;
  const start = Math.ceil(min / s) * s;
  const ticks: number[] = [];
  for (let v = start; v <= max + 1e-9; v += s) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

export function ScatterPlot({
  points,
  xLabel,
  yLabel,
  logX = false,
  formatX = (v) => String(v),
  formatY = (v) => String(v),
  labelTopN = 6,
  highlightId,
}: Props) {
  const valid = points.filter((p) => p.y != null && p.x != null && (!logX || p.x > 0));
  if (valid.length === 0) return null;

  const xs = valid.map((p) => (logX ? Math.log10(p.x) : p.x));
  const ys = valid.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const sx = (x: number) =>
    px(PAD.left + ((x - xMin) / (xMax - xMin || 1)) * innerW);
  const sy = (y: number) =>
    px(PAD.top + innerH - ((y - yMin) / (yMax - yMin || 1)) * innerH);

  const yTicks = niceTicks(yMin, yMax, 5);
  const xTicks = logX
    ? [0.01, 0.03, 0.1, 0.3, 1, 3, 10, 30, 100].filter(
        (v) => Math.log10(v) >= xMin && Math.log10(v) <= xMax
      )
    : niceTicks(xMin, xMax, 6);

  const labeled = new Set(
    [...valid]
      .sort((a, b) => b.y - a.y)
      .slice(0, labelTopN)
      .map((p) => p.id)
  );
  if (highlightId) labeled.add(highlightId);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="scatter"
      role="img"
      aria-label={`${yLabel} vs ${xLabel}`}
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
          <text x={PAD.left - 10} y={sy(t) + 3} className="scatter-tick" textAnchor="end">
            {formatY(t)}
          </text>
        </g>
      ))}
      {xTicks.map((t) => {
        const tx = logX ? sx(Math.log10(t)) : sx(t);
        return (
          <g key={`x-${t}`}>
            <line
              x1={tx}
              x2={tx}
              y1={PAD.top}
              y2={H - PAD.bottom}
              className="scatter-grid scatter-grid-v"
            />
            <text x={tx} y={H - PAD.bottom + 18} className="scatter-tick" textAnchor="middle">
              {formatX(t)}
            </text>
          </g>
        );
      })}
      <text
        x={PAD.left + innerW / 2}
        y={H - 6}
        className="scatter-axis"
        textAnchor="middle"
      >
        {xLabel}
      </text>
      <text
        x={14}
        y={PAD.top + innerH / 2}
        className="scatter-axis"
        textAnchor="middle"
        transform={`rotate(-90 14 ${PAD.top + innerH / 2})`}
      >
        {yLabel}
      </text>
      {valid.map((p) => {
        const cx = sx(logX ? Math.log10(p.x) : p.x);
        const cy = sy(p.y);
        const isHighlight = highlightId === p.id;
        const hot = labeled.has(p.id);
        return (
          <g key={p.id}>
            {isHighlight ? (
              <circle
                cx={cx}
                cy={cy}
                r={10}
                fill="none"
                stroke="var(--oriel-gold)"
                strokeWidth={1.5}
                opacity={0.85}
              />
            ) : null}
            <circle
              cx={cx}
              cy={cy}
              r={isHighlight ? 5.5 : hot ? 4 : 2.6}
              className={`scatter-dot ${hot || isHighlight ? "scatter-dot-hot" : ""}`}
              style={isHighlight ? { fill: "var(--oriel-gold)" } : undefined}
            >
              <title>{`${p.label} — ${xLabel}: ${formatX(p.x)}, ${yLabel}: ${formatY(p.y)}`}</title>
            </circle>
            {hot || isHighlight ? (
              <text
                x={cx + 8}
                y={cy + 3}
                className="scatter-label"
                style={isHighlight ? { fontWeight: 600, fill: "var(--foreground)" } : undefined}
              >
                {p.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
