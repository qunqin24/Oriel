import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { getPerformance } from "../../src/lib/performance.ts";
import { METRICS, valueScore } from "../../src/lib/metrics.ts";
import { buildMetricSeries } from "../../src/lib/history-series.ts";
import {
  buildSnapshot, diffSnapshots, readMetric, toMetricTuple,
  type MetricTuple,
} from "../../src/lib/history-schema.ts";
import type { LanguageModel } from "../../src/lib/types.ts";

const legacy = {
  median_output_tokens_per_second: 200,
  median_time_to_first_token_seconds: 0.5,
  median_time_to_first_answer_token_seconds: 1,
  median_end_to_end_response_time_seconds: 99,
};
const v3 = {
  mean_output_tokens_per_second: 75,
  mean_time_to_first_token_seconds: 2,
  mean_time_to_first_answer_token_seconds: 3,
};
function model(fields: Partial<LanguageModel> = {}): LanguageModel {
  return {
    id: "m", slug: "m", name: "Model", release_date: null,
    model_creator: { id: "v", name: "Vendor" },
    evaluations: {
      artificial_analysis_intelligence_index: 60,
      artificial_analysis_coding_index: 70,
      artificial_analysis_agentic_index: 80,
    },
    pricing: {
      price_1m_input_tokens: 0.1, price_1m_output_tokens: 0.2,
      price_1m_cache_hit_tokens: null, price_1m_cache_write_tokens: null,
    },
    ...fields,
  };
}

test("live metrics use v3 means even when legacy medians disagree", () => {
  const m = model({ performance: legacy, performance_v3: v3 });
  assert.deepEqual(getPerformance(m), { throughput: 75, ttft: 2, ttfat: 3 });
  assert.equal(METRICS.throughput.get(m), 75);
  assert.equal(METRICS.ttft.get(m), 2);
  assert.equal("e2e" in getPerformance(m), false);
});

test("legacy fields null, missing or removed never block v3", () => {
  for (const performance of [null, undefined, legacy]) {
    assert.equal(METRICS.throughput.get(model({ performance, performance_v3: v3 })), 75);
  }
});

test("v3 null, absent or partial never falls back to legacy", () => {
  for (const performance_v3 of [null, undefined, {}]) {
    assert.deepEqual(getPerformance(model({ performance: legacy, performance_v3 })), {
      throughput: null, ttft: null, ttfat: null,
    });
  }
  assert.deepEqual(getPerformance(model({ performance: legacy, performance_v3: {
    mean_output_tokens_per_second: null, mean_time_to_first_token_seconds: 2,
  } })), { throughput: null, ttft: 2, ttfat: null });
});

test("valid zero survives; negative, non-finite and malformed measurements are missing", () => {
  assert.deepEqual(getPerformance(model({ performance_v3: {
    mean_output_tokens_per_second: 0, mean_time_to_first_token_seconds: 0,
    mean_time_to_first_answer_token_seconds: 0,
  } })), { throughput: 0, ttft: 0, ttfat: 0 });
  for (const value of [NaN, Infinity, -Infinity, -1, "10"]) {
    const performance_v3 = { mean_output_tokens_per_second: value } as LanguageModel["performance_v3"];
    assert.equal(getPerformance(model({ performance_v3 })).throughput, null);
  }
});

test("discontinued indices and dependent value score cannot rank stale raw scores", () => {
  assert.equal(METRICS.coding.get(model()), null);
  assert.equal(METRICS.agentic.get(model()), null);
  assert.equal(valueScore(model()), null);
  // The historical raw observation is still retained.
  assert.equal(readMetric(toMetricTuple(model()), "coding"), 70);
});

test("7/15 element archives remain readable without interpreting medians as means", () => {
  for (const length of [7, 15]) {
    const tuple = Array.from({ length }, (_, i) => i) as MetricTuple;
    assert.equal(readMetric(tuple, "throughput"), 5);
    assert.equal(readMetric(tuple, "latency"), 6);
    for (const key of ["throughputMean", "latencyMean", "answerLatencyMean"] as const) {
      assert.equal(readMetric(tuple, key), null);
    }
  }
});

test("archives retain legacy medians and v3 means in separate immutable slots", () => {
  const before = buildSnapshot([model({ performance: legacy })], 5);
  const during = buildSnapshot([model({ performance: legacy, performance_v3: v3 })], 5);
  const after = buildSnapshot([model({ performance: null, performance_v3: v3 })], 5);
  assert.equal(readMetric(during.models.m, "throughput"), 200);
  assert.equal(readMetric(during.models.m, "throughputMean"), 75);
  assert.equal(readMetric(after.models.m, "throughput"), null);
  const snapshots = [before, during, after].map((snapshot, i) => ({ date: `2026-12-${9 + i}`, snapshot }));
  assert.deepEqual(buildMetricSeries(snapshots, "m", "throughput").flat().map(p => p.value), [200, 200]);
  assert.deepEqual(buildMetricSeries(snapshots, "m", "throughputMean").flat().map(p => p.value), [75, 75]);
  const identities = new Map([["m", { id: "m", name: "Model", slug: "m", creator: "Vendor" }]]);
  for (const [previous, current] of [[before, during], [during, after]]) {
    assert.deepEqual(diffSnapshots({ date: "2026-12-10", previous, current, identities }), []);
  }
});

test("v3 series break on missing measurements but not intelligence-index changes", () => {
  const snapshots = [
    buildSnapshot([model({ performance_v3: v3 })], 4),
    buildSnapshot([model({ performance_v3: v3 })], 5),
    buildSnapshot([model({ performance: legacy, performance_v3: null })], 5),
    buildSnapshot([model({ performance_v3: v3 })], 5),
  ].map((snapshot, i) => ({ date: `2026-12-${10 + i}`, snapshot }));
  for (const metric of ["throughputMean", "latencyMean", "answerLatencyMean"] as const) {
    assert.deepEqual(buildMetricSeries(snapshots, "m", metric).map(s => s.length), [2, 1]);
  }
  assert.deepEqual(buildMetricSeries(snapshots, "m", "intelligence").map(s => s.length), [1, 3]);
});

test("retired URL dimensions/sorts resolve to active defaults", async () => {
  const { DIMENSIONS, DIMENSION_COLUMNS, resolveDimension, resolveSortColumn } = await import("../../src/lib/explorer-config.ts");
  for (const retired of ["coding", "agentic", "value", "unknown", null, undefined]) {
    assert.equal(resolveDimension(retired), "overview");
    assert.equal(resolveSortColumn(retired, "overview"), "intelligence");
    assert.equal(resolveSortColumn(retired, "speed"), "throughput");
  }
  for (const dimension of DIMENSIONS) {
    assert.equal(resolveDimension(dimension), dimension);
    assert.equal(resolveSortColumn(null, dimension), DIMENSION_COLUMNS[dimension].sort);
    for (const column of DIMENSION_COLUMNS[dimension].columns) {
      assert.equal(["coding", "agentic", "value"].includes(column), false);
    }
  }
  assert.equal(resolveSortColumn("priceOut", "overview"), "priceOut");
});

test("trajectory flat labels count only comparable observations, not the entire archive", () => {
  const component = readFileSync(new URL("../../src/components/trajectory.astro", import.meta.url), "utf8");
  assert.match(component, /const days = latest\.length/);
  assert.doesNotMatch(component, /const days = SNAPSHOT_DATES\.length/);
});
