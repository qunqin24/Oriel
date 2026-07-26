/**
 * code_v3 类目的单元格语义。
 *
 * 这个类目不是打分制，是「结果状态 + 字母评级」的矩阵：
 * Pass（直接通过）、Skip（未测）、Pending（结果未定）、Failed(n/m)（失败，
 * 括号里是通过的用例数）、或形如 "16/B" 的「n 轮修正 / 最终评级」。
 * 解析规则照抄源站前端 app.js 里的 getCodeV3StatusClass /
 * parseCodeV3RankGrade，保证呈现和原站一致。
 */

export type CodeV3Cell =
  | { kind: "pass" }
  | { kind: "skip" }
  | { kind: "pending" }
  | { kind: "failed"; detail: string }
  | { kind: "rank-grade"; rounds: string; grade: string }
  | { kind: "text"; value: string };

export function parseCodeV3Cell(raw: string): CodeV3Cell {
  const value = raw.trim();
  if (!value) return { kind: "text", value: "" };

  const lower = value.toLowerCase();
  if (lower === "pass") return { kind: "pass" };
  if (lower === "skip") return { kind: "skip" };
  if (lower === "pending") return { kind: "pending" };

  const failed = value.match(/^Failed\((.+)\)$/i);
  if (failed) return { kind: "failed", detail: failed[1]! };

  const rankGrade = value.match(/^(.+?)\/([ABCD][+-]?)$/i);
  if (rankGrade) {
    return { kind: "rank-grade", rounds: rankGrade[1]!.trim(), grade: rankGrade[2]!.toUpperCase() };
  }

  return { kind: "text", value };
}

/**
 * 哪些表头是"辅助信息"而非按项目打分——渲染时用不同的样式区分。
 * Think 单独处理（见 cat-board.ts 的 isThinkHeader/isThinkOn），
 * 不算在这里面：它是布尔开关，不是自由文本。
 */
const AUXILIARY_HEADERS = new Set(["unprompted", "ide/cli"]);

export function isAuxiliaryColumn(header: string): boolean {
  return AUXILIARY_HEADERS.has(header.trim().toLowerCase());
}
