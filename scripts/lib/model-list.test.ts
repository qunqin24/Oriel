import assert from "node:assert/strict";
import test from "node:test";
import type { LanguageModel } from "../../src/lib/types.ts";
import { normalizeModelList } from "./model-list.ts";

function model(
  id: string,
  slug: string,
  name = slug,
  marker = 1
): LanguageModel {
  return { id, slug, name, marker } as unknown as LanguageModel;
}

test("相邻分页重复同一个 id 时去重并保留后一份", () => {
  const first = model("model-1", "same-model", "Same model", 1);
  const second = model("model-1", "same-model", "Same model", 2);

  const result = normalizeModelList([first, second]);

  assert.deepEqual(result.duplicateIds, ["model-1"]);
  assert.equal(result.models.length, 1);
  assert.equal((result.models[0] as unknown as { marker: number }).marker, 2);
});

test("同一个 id 在一次抓取中改变 slug 时拒绝生成不一致快照", () => {
  assert.throws(
    () => normalizeModelList([model("model-1", "old"), model("model-1", "new")]),
    /同一个模型 id 返回了不同 slug/
  );
});

test("不同 id 共用 slug 时给出可定位的错误", () => {
  assert.throws(
    () =>
      normalizeModelList([
        model("model-1", "shared", "First"),
        model("model-2", "shared", "Second"),
      ]),
    /不同模型共用了 slug "shared".*model-1.*model-2/
  );
});

test("缺少路由身份字段时拒绝写入", () => {
  assert.throws(() => normalizeModelList([model("", "slug")]), /缺少 id/);
  assert.throws(() => normalizeModelList([model("model-1", "")]), /缺少 slug/);
});
