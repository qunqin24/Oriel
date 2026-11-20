import assert from "node:assert/strict";
import { test } from "node:test";
import type { HistorySnapshot } from "../../src/lib/history-schema.ts";
import type { LanguageModel } from "../../src/lib/types.ts";
import { fillPerformanceMeans } from "./backfill-performance.ts";

const model = (id: string, performance_v3: LanguageModel["performance_v3"]) =>
  ({ id, performance_v3 } as LanguageModel);

test("only fills missing v3 slots on existing IDs and preserves all prior fields", () => {
  const old = [12, null, 14, 15, 16, 17, 18, null, null, null, null, null, null, 24, 25];
  const models = { legacy: [...old], short: [1], current: [...old, 52, null, 54], untouched: [7] };
  const snapshot = { index_version: 5, count: 4, models } as unknown as HistorySnapshot;
  const measured = {
    mean_output_tokens_per_second: 0,
    mean_time_to_first_token_seconds: 2,
    mean_time_to_first_answer_token_seconds: 3,
  };
  const source = [
    model("legacy", measured), model("current", measured), model("absent", measured),
    model("short", { ...measured, mean_output_tokens_per_second: -1, mean_time_to_first_token_seconds: Infinity }),
    model("untouched", null),
  ];
  assert.deepEqual(fillPerformanceMeans(snapshot, source), { rows: 3, values: 5 });
  assert.deepEqual(snapshot.models.legacy, [...old, 0, 2, 3]);
  assert.deepEqual(snapshot.models.current, [...old, 52, 2, 54]);
  assert.deepEqual(snapshot.models.short, [1, ...Array(16).fill(null), 3]);
  assert.deepEqual(snapshot.models.untouched, [7]);
  assert.equal(Object.hasOwn(snapshot.models, "absent"), false);
  assert.equal(snapshot.index_version, 5);
  assert.equal(snapshot.count, 4);
  assert.deepEqual(fillPerformanceMeans(snapshot, source), { rows: 0, values: 0 });
});
