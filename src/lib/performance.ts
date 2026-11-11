import type { LanguageModel } from "./types.ts";

/** Missing/non-finite measurements are never zero. A measured zero is valid. */
function measurement(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

/**
 * Live performance has one methodology: v3 means. Never fall back to legacy
 * medians, even when v3 is absent or partially null. Mixing methodologies would
 * make rankings and comparisons dishonest. Legacy values remain in the archive.
 * The free endpoint has no v3 end-to-end response time; do not estimate one.
 */
export function getPerformance(model: LanguageModel) {
  const performance = model.performance_v3;
  return {
    throughput: measurement(performance?.mean_output_tokens_per_second),
    ttft: measurement(performance?.mean_time_to_first_token_seconds),
    ttfat: measurement(performance?.mean_time_to_first_answer_token_seconds),
  };
}
