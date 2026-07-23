"use client";

import { formatNumber, formatSeconds } from "@/lib/format";
import type { LanguageModel } from "@/lib/types";

type Props = {
  models: LanguageModel[];
};

const W = 800;
const H = 380;
const PAD = { top: 25, right: 30, bottom: 45, left: 55 };

/** Stable SVG coords across Node/browser float differences (avoids hydration mismatch). */
const px = (n: number) => Math.round(n * 100) / 100;

export function LatencyQuadrant({ models }: Props) {
  const points = models
    .filter(
      (m) =>
        m.performance?.median_output_tokens_per_second != null &&
        m.performance.median_output_tokens_per_second > 0 &&
        m.performance?.median_time_to_first_token_seconds != null &&
        m.performance.median_time_to_first_token_seconds > 0
    )
    .map((m) => ({
      id: m.id,
      name: m.name,
      speed: m.performance!.median_output_tokens_per_second!,
      latency: m.performance!.median_time_to_first_token_seconds!,
    }));

  if (points.length === 0) return null;

  const minSpeed = Math.min(...points.map((p) => p.speed));
  const maxSpeed = Math.max(...points.map((p) => p.speed));
  const minLatency = Math.min(...points.map((p) => p.latency));
  const maxLatency = Math.max(...points.map((p) => p.latency));

  const logMinSpeed = Math.log10(minSpeed);
  const logMaxSpeed = Math.log10(maxSpeed);
  const logMinLatency = Math.log10(minLatency);
  const logMaxLatency = Math.log10(maxLatency);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const sx = (speed: number) =>
    px(
      PAD.left +
        ((Math.log10(speed) - logMinSpeed) / (logMaxSpeed - logMinSpeed || 1)) *
          innerW
    );
  const sy = (lat: number) =>
    px(
      PAD.top +
        innerH -
        ((Math.log10(lat) - logMinLatency) /
          (logMaxLatency - logMinLatency || 1)) *
          innerH
    );

  // 象限分割中位数
  const speedMid = Math.pow(10, (logMinSpeed + logMaxSpeed) / 2);
  const latencyMid = Math.pow(10, (logMinLatency + logMaxLatency) / 2);

  const midX = sx(speedMid);
  const midY = sy(latencyMid);

  // 热门标示模型
  const hotPoints = [...points]
    .sort((a, b) => b.speed - a.speed)
    .slice(0, 7);
  const hotIds = new Set(hotPoints.map((p) => p.id));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="scatter"
      role="img"
      aria-label="首 Token 延迟 vs 生成速度象限分布图"
    >
      {/* 象限分割线 */}
      <line
        x1={midX}
        x2={midX}
        y1={PAD.top}
        y2={H - PAD.bottom}
        stroke="var(--line-strong)"
        strokeDasharray="4 4"
        opacity="0.7"
      />
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={midY}
        y2={midY}
        stroke="var(--line-strong)"
        strokeDasharray="4 4"
        opacity="0.7"
      />

      {/* 象限区域文字标记 */}
      <text
        x={PAD.left + 10}
        y={PAD.top + 16}
        fill="var(--faint)"
        fontSize="10"
        fontFamily="var(--font-mono)"
      >
        低速度 / 高延迟 (慢速响应)
      </text>
      <text
        x={W - PAD.right - 10}
        y={PAD.top + 16}
        textAnchor="end"
        fill="var(--faint)"
        fontSize="10"
        fontFamily="var(--font-mono)"
      >
        高吞吐 / 高延迟 (批处理/推理)
      </text>
      <text
        x={W - PAD.right - 10}
        y={H - PAD.bottom - 10}
        textAnchor="end"
        fill="var(--accent)"
        fontWeight="600"
        fontSize="10.5"
        fontFamily="var(--font-mono)"
      >
        高速度 / 低延迟 (极致实时对话)
      </text>
      <text
        x={PAD.left + 10}
        y={H - PAD.bottom - 10}
        fill="var(--faint)"
        fontSize="10"
        fontFamily="var(--font-mono)"
      >
        低吞吐 / 低延迟 (轻量模型)
      </text>

      {/* 散点 */}
      {points.map((p) => {
        const cx = sx(p.speed);
        const cy = sy(p.latency);
        const hot = hotIds.has(p.id);

        return (
          <g key={p.id}>
            <circle
              cx={cx}
              cy={cy}
              r={hot ? 4 : 2.5}
              className={`scatter-dot ${hot ? "scatter-dot-hot" : ""}`}
            >
              <title>{`${p.name} — 速度: ${formatNumber(
                p.speed,
                0
              )} TPS, 首 Token 延迟: ${formatSeconds(p.latency)}`}</title>
            </circle>
            {hot && (
              <text
                x={cx + 6}
                y={cy + 3}
                className="scatter-label"
                style={{ fontSize: "9.5px" }}
              >
                {p.name}
              </text>
            )}
          </g>
        );
      })}

      {/* 坐标轴名称 */}
      <text
        x={PAD.left + innerW / 2}
        y={H - 6}
        className="scatter-axis"
        textAnchor="middle"
      >
        生成速度 (Tokens/秒, 对数坐标)
      </text>
      <text
        x={14}
        y={PAD.top + innerH / 2}
        className="scatter-axis"
        textAnchor="middle"
        transform={`rotate(-90 14 ${PAD.top + innerH / 2})`}
      >
        首 Token 延迟 (秒, 对数坐标)
      </text>
    </svg>
  );
}
