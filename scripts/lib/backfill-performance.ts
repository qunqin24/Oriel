import { METRIC_KEYS, type HistorySnapshot } from "../../src/lib/history-schema.ts";
import { getPerformance } from "../../src/lib/performance.ts";
import type { LanguageModel } from "../../src/lib/types.ts";

const slots = ["throughputMean", "latencyMean", "answerLatencyMean"] as const;

/** Fill only missing v3 means for models already in the archived day. */
export function fillPerformanceMeans(snapshot: HistorySnapshot, models: LanguageModel[]) {
  let rows = 0;
  let values = 0;
  for (const model of models) {
    if (!Object.hasOwn(snapshot.models, model.id)) continue;
    const row = snapshot.models[model.id]!;
    const { throughput, ttft, ttfat } = getPerformance(model);
    let next: typeof row | undefined;
    [throughput, ttft, ttfat].forEach((value, i) => {
      const slot = METRIC_KEYS.indexOf(slots[i]!);
      if (value === null || row[slot] != null) return;
      next ??= [...row];
      // Older archive tuples may omit all fields added after their creation.
      while (next.length <= slot) next.push(null);
      next[slot] = value;
      values++;
    });
    if (next) {
      snapshot.models[model.id] = next;
      rows++;
    }
  }
  return { rows, values };
}
