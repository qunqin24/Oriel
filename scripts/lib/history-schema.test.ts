import assert from "node:assert/strict";
import test from "node:test";
import type { LanguageModel } from "../../src/lib/types.ts";
import {
  METRIC_KEYS,
  diffSnapshots,
  readMetric,
  toMetricTuple,
  type HistorySnapshot,
  type MetricKey,
  type ModelIdentity,
} from "../../src/lib/history-schema.ts";

const NEW_KEYS = [
  "finance",
  "strategy",
  "legal",
  "healthcare",
  "engineering",
  "economics",
  "indexCost",
  "taskCost",
] as const;

const OLD_KEYS = [
  "intelligence",
  "coding",
  "agentic",
  "priceIn",
  "priceOut",
  "throughput",
  "latency",
] as const;

/** 测试用的模型：只填写用例关心的字段，其余留空，贴近上游缺字段的真实形状。 */
function model(partial: Record<string, unknown>): LanguageModel {
  return { id: "m1", slug: "m1", name: "M1", ...partial } as unknown as LanguageModel;
}

const FULL_MODEL = model({
  evaluations: {
    artificial_analysis_intelligence_index: 50.1,
    artificial_analysis_coding_index: 51.2,
    artificial_analysis_agentic_index: 52.3,
    artificial_analysis_finance_and_accounting_index: 11.1,
    artificial_analysis_strategy_and_ops_index: 22.2,
    artificial_analysis_legal_index: 33.3,
    artificial_analysis_healthcare_and_medical_index: 44.4,
    artificial_analysis_engineering_index: 55.5,
    artificial_analysis_economics_index: 66.6,
  },
  artificial_analysis_intelligence_index_cost: {
    total_cost: 4222.12,
    cost_per_task: { total_cost: 3.6937 },
  },
  pricing: { price_1m_input_tokens: 1.5, price_1m_output_tokens: 6 },
  performance: {
    median_output_tokens_per_second: 77.7,
    median_time_to_first_token_seconds: 0.8,
  },
});

const FULL_EXPECTED: Record<MetricKey, number> = {
  intelligence: 50.1,
  coding: 51.2,
  agentic: 52.3,
  priceIn: 1.5,
  priceOut: 6,
  throughput: 77.7,
  latency: 0.8,
  finance: 11.1,
  strategy: 22.2,
  legal: 33.3,
  healthcare: 44.4,
  engineering: 55.5,
  economics: 66.6,
  indexCost: 4222.12,
  taskCost: 3.6937,
};

test("METRIC_KEYS：前 7 个顺序不变，新增 8 个按约定顺序追加", () => {
  assert.deepEqual([...METRIC_KEYS], [...OLD_KEYS, ...NEW_KEYS]);
  assert.equal(METRIC_KEYS.length, 15);
});

test("toMetricTuple 长度等于 METRIC_KEYS.length，并按 METRIC_KEYS 的顺序放值", () => {
  const tuple = toMetricTuple(FULL_MODEL);
  assert.equal(tuple.length, METRIC_KEYS.length);
  METRIC_KEYS.forEach((key, index) => {
    assert.equal(tuple[index], FULL_EXPECTED[key], `${key} 应在第 ${index} 位`);
    assert.equal(readMetric(tuple, key), FULL_EXPECTED[key], `readMetric(${key})`);
  });
});

test("只设评测成本时，indexCost / taskCost 位置正确，其余新指标为 null", () => {
  const tuple = toMetricTuple(
    model({
      evaluations: {},
      artificial_analysis_intelligence_index_cost: {
        total_cost: 123.45,
        cost_per_task: { total_cost: 0.67 },
      },
    })
  );
  assert.equal(tuple[METRIC_KEYS.indexOf("indexCost")], 123.45);
  assert.equal(tuple[METRIC_KEYS.indexOf("taskCost")], 0.67);
  for (const key of [...OLD_KEYS, "finance", "strategy", "legal", "healthcare", "engineering", "economics"] as const) {
    assert.equal(readMetric(tuple, key), null, `${key} 应为 null`);
  }
});

test("价格为 0 的免费模型：成本 0 是真实值，保留为 0 而不是 null", () => {
  const tuple = toMetricTuple(
    model({
      evaluations: { artificial_analysis_intelligence_index: 20 },
      pricing: { price_1m_input_tokens: 0, price_1m_output_tokens: 0 },
      artificial_analysis_intelligence_index_cost: {
        total_cost: 0,
        cost_per_task: { total_cost: 0 },
      },
    })
  );
  assert.equal(readMetric(tuple, "indexCost"), 0);
  assert.equal(readMetric(tuple, "taskCost"), 0);
  assert.equal(readMetric(tuple, "priceIn"), 0);
});

test("缺字段的模型得到 null：不抛错，也不是 0", () => {
  const cases: Record<string, LanguageModel> = {
    "evaluations 里没有行业指数、成本为 null": model({
      evaluations: { artificial_analysis_intelligence_index: 10 },
      artificial_analysis_intelligence_index_cost: null,
    }),
    "成本字段整个缺失（undefined）": model({
      evaluations: { artificial_analysis_intelligence_index: 10 },
    }),
    "evaluations 整个缺失": model({}),
    "成本对象存在但数值为 null": model({
      evaluations: {},
      artificial_analysis_intelligence_index_cost: {
        total_cost: null,
        cost_per_task: { total_cost: null },
      },
    }),
    "成本对象缺 cost_per_task": model({
      evaluations: {},
      artificial_analysis_intelligence_index_cost: { total_cost: null },
    }),
  };

  for (const [label, m] of Object.entries(cases)) {
    let tuple: ReturnType<typeof toMetricTuple> | undefined;
    assert.doesNotThrow(() => {
      tuple = toMetricTuple(m);
    }, label);
    assert.equal(tuple!.length, METRIC_KEYS.length, label);
    for (const key of [
      "finance",
      "strategy",
      "legal",
      "healthcare",
      "engineering",
      "economics",
      "indexCost",
      "taskCost",
    ] as const) {
      assert.equal(readMetric(tuple!, key), null, `${label}：${key} 应为 null`);
    }
  }
});

test("向后兼容：旧 7 元组读新 key 得到 null，读旧 key 值不变", () => {
  const legacy = [1, 2, 3, 4, 5, 6, 7];
  for (const key of NEW_KEYS) {
    assert.equal(readMetric(legacy as any, key), null, `${key} 在旧元组里应为 null`);
  }
  OLD_KEYS.forEach((key, index) => {
    assert.equal(readMetric(legacy as any, key), index + 1, `${key} 值不变`);
  });
  // 旧元组里的 0（免费模型的价格）读出来仍是 0，不被当成缺失。
  assert.equal(readMetric([0, null, null, 0, 0, 0, 0] as any, "priceIn"), 0);
});

// ── diffSnapshots ────────────────────────────────────────────────

const IDENTITY: ModelIdentity = { id: "m1", name: "M1", slug: "m1", creator: "Acme" };
const identities = new Map([[IDENTITY.id, IDENTITY]]);

const LEGACY_VALUES = [50, 51, 52, 1.5, 6, 70, 0.8];
const NEW_VALUES = [11, 22, 33, 44, 55, 66, 4000, 3.5];

function legacy(overrides: Record<number, number | null> = {}) {
  return LEGACY_VALUES.map((v, i) => (i in overrides ? overrides[i] : v)) as any;
}

function full(overrides: Record<number, number | null> = {}) {
  return [...LEGACY_VALUES, ...NEW_VALUES].map((v, i) =>
    i in overrides ? overrides[i] : v
  ) as any;
}

function snapshot(tuple: any, indexVersion: number | null = 4): HistorySnapshot {
  return { index_version: indexVersion, count: 1, models: { m1: tuple } };
}

function diff(previous: HistorySnapshot, current: HistorySnapshot) {
  return diffSnapshots({ date: "2026-10-16", previous, current, identities });
}

test("diffSnapshots：前一天 7 元组、今天 15 元组且旧值不变，不产生任何事件", () => {
  assert.deepEqual(diff(snapshot(legacy()), snapshot(full())), []);
});

test("diffSnapshots：新指标（行业/成本）变化不产生事件", () => {
  const index = (key: MetricKey) => METRIC_KEYS.indexOf(key);
  const changed = full({
    [index("finance")]: 99,
    [index("engineering")]: null,
    [index("indexCost")]: 9999,
    [index("taskCost")]: 0,
  });
  assert.deepEqual(diff(snapshot(full()), snapshot(changed)), []);
  // 新指标从有值变回缺失（以及反过来）同样不记。
  assert.deepEqual(diff(snapshot(changed), snapshot(full())), []);
});

test("diffSnapshots：旧指标变化仍然产生事件", () => {
  const events = diff(
    snapshot(full()),
    snapshot(full({ [METRIC_KEYS.indexOf("intelligence")]: 55 }))
  );
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "score");
  assert.equal(events[0].metric, "intelligence");
  assert.equal(events[0].from, 50);
  assert.equal(events[0].to, 55);

  // 7 → 15 的过渡日里旧指标变了，也只记旧指标。
  const crossing = diff(
    snapshot(legacy()),
    snapshot(full({ [METRIC_KEYS.indexOf("priceIn")]: 1 }))
  );
  assert.equal(crossing.length, 1);
  assert.equal(crossing[0].type, "price");
  assert.equal(crossing[0].metric, "priceIn");
  assert.equal(crossing[0].from, 1.5);
  assert.equal(crossing[0].to, 1);
});

test("diffSnapshots：新指标变化与旧指标变化同时发生时只记旧指标", () => {
  const events = diff(
    snapshot(full()),
    snapshot(
      full({
        [METRIC_KEYS.indexOf("coding")]: 60,
        [METRIC_KEYS.indexOf("legal")]: 1,
        [METRIC_KEYS.indexOf("indexCost")]: 1,
      })
    )
  );
  assert.deepEqual(
    events.map((e) => e.metric),
    ["coding"]
  );
});

test("diffSnapshots：指数换版（index_version 不同）时分数变化不产生事件", () => {
  const events = diff(
    snapshot(full(), 4),
    snapshot(
      full({
        [METRIC_KEYS.indexOf("intelligence")]: 20,
        [METRIC_KEYS.indexOf("coding")]: 20,
        [METRIC_KEYS.indexOf("agentic")]: 20,
        [METRIC_KEYS.indexOf("engineering")]: 20,
      }),
      5
    )
  );
  assert.deepEqual(events, []);
});
