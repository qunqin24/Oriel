import assert from "node:assert/strict";
import test from "node:test";
import { inspectFrontier } from "./verify-frontier.mjs";

const model = (score = 30, date = "2026-10-01") => ({
  release_date: date,
  evaluations: { artificial_analysis_intelligence_index: score },
});
const point = '<circle data-frontier-point cx="12.5" cy="20" r="2.2" />';
const plot = (content) =>
  `<svg viewBox="0 0 900 340" aria-labelledby="frontier-title frontier-desc">${content}</svg>`;

test("少于 500 个有分模型也按快照完整性验证，未评测模型不画成 0", () => {
  const models = [
    ...Array.from({ length: 89 }, () => model()),
    ...Array.from({ length: 629 }, () => model(null)),
  ];
  assert.deepEqual(inspectFrontier(plot(point.repeat(89)), models), {
    expected: 89,
    actual: 89,
    ok: true,
  });
});

test("覆盖量恢复到 500 以上时仍要求全部模型点", () => {
  const models = Array.from({ length: 704 }, () => model());
  assert.equal(inspectFrontier(plot(point.repeat(704)), models).ok, true);
  assert.equal(inspectFrontier(plot(point.repeat(703)), models).ok, false);
});

test("零分与负分有效；缺失分数或无效发布日期不计入期望", () => {
  const models = [
    model(0), model(-1), model(null), model(NaN), model(Infinity),
    model(30, null), model(30, ""), model(30, "invalid"),
    { release_date: "2026-10-01", evaluations: {} },
  ];
  assert.deepEqual(inspectFrontier(plot(point.repeat(2)), models), {
    expected: 2,
    actual: 2,
    ok: true,
  });
});

test("不把领先者圆环或其它 SVG 的圆圈算成模型点", () => {
  const decoration = '<circle cx="12.5" cy="20" r="5.5" />';
  const html = `<svg>${point.repeat(600)}</svg>${plot(point + decoration)}`;
  assert.equal(inspectFrontier(html, [model()]).ok, true);
  assert.equal(inspectFrontier(html, [model(), model()]).ok, false);
});

test("即使超过旧阈值，少画、多画或重复画模型点仍失败", () => {
  const models = Array.from({ length: 600 }, () => model());
  for (const count of [0, 599, 601]) {
    assert.equal(inspectFrontier(plot(point.repeat(count)), models).ok, false);
  }
});

test("缺失或损坏的 SVG、非有限坐标不能通过", () => {
  for (const html of [
    "", `<svg>${point}</svg>`,
    plot(point).replace('viewBox="0 0 900 340"', ""),
    plot(point).replace('cx="12.5"', 'cx="NaN"'),
    plot(point).replace('cy="20"', 'cy="Infinity"'),
    plot(point).replace('cx="12.5"', 'cx=" "'),
    plot(point).replace('cy="20"', ""),
  ]) {
    assert.equal(inspectFrontier(html, [model()]).ok, false);
  }
});

test("整榜缺失或全部未评测时仍拦截，不让空图的 0 === 0 放行", () => {
  assert.equal(inspectFrontier(plot(""), []).ok, false);
  assert.equal(inspectFrontier(plot(""), [model(null)]).ok, false);
});
