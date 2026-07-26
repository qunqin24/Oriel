/**
 * 把一天的语言模型快照记进 data/history/。
 *
 * 每日抓取和一次性回填共用这一份逻辑——两条路径如果各写各的，
 * 回填出来的历史和后续每天累积的历史会悄悄分叉。
 *
 * 按日期幂等：同一天重复记录会覆盖该日的快照并替换该日的事件，
 * 所以重跑不会产生重复事件。
 */

import {
  buildSnapshot,
  catalogIdentities,
  diffSnapshots,
  monthOf,
  snapshotDate,
  sortEvents,
  toIdentity,
  updateCatalog,
} from "../../src/lib/history-schema.ts";
import type { ChangeEvent } from "../../src/lib/history-schema.ts";
import type { LanguageModel } from "../../src/lib/types.ts";
import {
  putSnapshot,
  readAllSnapshots,
  readCatalog,
  readEventLog,
  writeCatalog,
  writeEventLog,
} from "./archive.ts";

export type RecordResult = {
  date: string;
  modelCount: number;
  events: ChangeEvent[];
  /** 首日没有可比的前一天，事件流从第二天才开始有内容。 */
  isFirstSnapshot: boolean;
};

export async function recordSnapshot(args: {
  models: LanguageModel[];
  indexVersion: number | null;
  fetchedAt: string;
}): Promise<RecordResult> {
  const { models, indexVersion, fetchedAt } = args;
  const date = snapshotDate(fetchedAt);
  const snapshot = buildSnapshot(models, indexVersion);

  // 名录先更新，这样差分时新模型的名字已经可查。
  const catalog = updateCatalog(await readCatalog(), models.map(toIdentity), date);
  await writeCatalog(catalog);

  // 前一天 = 已归档快照里日期小于今天的最后一个。
  // 用「小于」而不是「前一个自然日」，因为抓取可能漏跑，历史会有缺口。
  const archived = await readAllSnapshots();
  const previous = archived.filter((entry) => entry.date < date).at(-1);

  await putSnapshot(monthOf(date), date, snapshot);

  const events = previous
    ? diffSnapshots({
        date,
        previous: previous.snapshot,
        current: snapshot,
        identities: catalogIdentities(catalog),
      })
    : [];

  const log = await readEventLog();
  await writeEventLog({
    generated_at: new Date().toISOString(),
    events: sortEvents([
      ...log.events.filter((event) => event.date !== date),
      ...events,
    ]),
  });

  return {
    date,
    modelCount: models.length,
    events,
    isFirstSnapshot: !previous,
  };
}

/** 把一次记录的结果打成一行人类可读的日志。 */
export function summarize(result: RecordResult): string {
  if (result.isFirstSnapshot) {
    return `${result.date}  ${result.modelCount} 模型  (首个快照，无可比对象)`;
  }
  const counts = { added: 0, removed: 0, score: 0, price: 0 };
  for (const event of result.events) counts[event.type] += 1;
  return (
    `${result.date}  ${result.modelCount} 模型  ` +
    `新增 ${counts.added} · 下架 ${counts.removed} · ` +
    `分数变动 ${counts.score} · 价格变动 ${counts.price}`
  );
}
