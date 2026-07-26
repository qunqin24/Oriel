/**
 * data/history/ 的读写。
 *
 * 纯粹的 fs 层——所有格式和差分逻辑在 src/lib/history-schema.ts，
 * 那个模块前端也要用，所以不能碰 fs。
 *
 * 目录结构：
 *   data/history/2026-07.json   按月分文件的全量快照
 *   data/history/catalog.json   模型名录（含已下架的），跨月累积
 *   data/history/events.json    派生的变化事件流
 */

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  Catalog,
  EventLog,
  HistoryMonth,
  HistorySnapshot,
} from "../../src/lib/history-schema.ts";

export const HISTORY_DIR = path.join(process.cwd(), "data", "history");

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function writeText(file: string, text: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text.endsWith("\n") ? text : `${text}\n`);
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await writeText(file, JSON.stringify(value, null, 2));
}

/**
 * 每个模型一行地序列化月度快照。
 *
 * 直接 JSON.stringify(…, 2) 会把每个 7 元组摊成 9 行，文件大三倍，
 * 而且 git diff 完全没法看。一行一模型既省空间，又让「今天哪些模型变了」
 * 在 diff 里一目了然——这个文件每天都会被 commit，可读性是硬需求。
 */
function stringifyMonth(month: HistoryMonth): string {
  const dates = Object.keys(month.snapshots).sort();
  const blocks = dates.map((date) => {
    const snapshot = month.snapshots[date]!;
    const rows = Object.keys(snapshot.models)
      .sort()
      .map((id) => `        ${JSON.stringify(id)}: ${JSON.stringify(snapshot.models[id])}`)
      .join(",\n");
    return [
      `    ${JSON.stringify(date)}: {`,
      `      "index_version": ${JSON.stringify(snapshot.index_version)},`,
      `      "count": ${snapshot.count},`,
      `      "models": {`,
      rows,
      `      }`,
      `    }`,
    ].join("\n");
  });

  return [
    `{`,
    `  "month": ${JSON.stringify(month.month)},`,
    `  "snapshots": {`,
    blocks.join(",\n"),
    `  }`,
    `}`,
  ].join("\n");
}

/** 同理，名录也是一条一行——它每天都会被追加，diff 要看得懂。 */
function stringifyCatalog(catalog: Catalog): string {
  const rows = Object.keys(catalog)
    .sort()
    .map((id) => `  ${JSON.stringify(id)}: ${JSON.stringify(catalog[id])}`)
    .join(",\n");
  return `{\n${rows}\n}`;
}

const monthFile = (month: string) => path.join(HISTORY_DIR, `${month}.json`);
const catalogFile = () => path.join(HISTORY_DIR, "catalog.json");
const eventsFile = () => path.join(HISTORY_DIR, "events.json");

export function readMonth(month: string): Promise<HistoryMonth | null> {
  return readJson<HistoryMonth>(monthFile(month));
}

/** 写入一天的快照；同月已有的其它日期保持不动，同日重复写则覆盖。 */
export async function putSnapshot(
  month: string,
  date: string,
  snapshot: HistorySnapshot
): Promise<void> {
  const existing = (await readMonth(month)) ?? { month, snapshots: {} };
  const snapshots = { ...existing.snapshots, [date]: snapshot };
  const ordered: HistoryMonth["snapshots"] = {};
  for (const key of Object.keys(snapshots).sort()) {
    ordered[key] = snapshots[key]!;
  }
  await writeText(monthFile(month), stringifyMonth({ month, snapshots: ordered }));
}

/** 全部月份的快照，按日期升序摊平。 */
export async function readAllSnapshots(): Promise<
  Array<{ date: string; snapshot: HistorySnapshot }>
> {
  let files: string[];
  try {
    files = await readdir(HISTORY_DIR);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const months = files.filter((name) => /^\d{4}-\d{2}\.json$/.test(name)).sort();
  const all: Array<{ date: string; snapshot: HistorySnapshot }> = [];
  for (const name of months) {
    const month = await readJson<HistoryMonth>(path.join(HISTORY_DIR, name));
    if (!month) continue;
    for (const [date, snapshot] of Object.entries(month.snapshots)) {
      all.push({ date, snapshot });
    }
  }
  return all.sort((a, b) => a.date.localeCompare(b.date));
}

export async function readCatalog(): Promise<Catalog> {
  return (await readJson<Catalog>(catalogFile())) ?? {};
}

export async function writeCatalog(catalog: Catalog): Promise<void> {
  await writeText(catalogFile(), stringifyCatalog(catalog));
}

export async function readEventLog(): Promise<EventLog> {
  return (
    (await readJson<EventLog>(eventsFile())) ?? {
      generated_at: new Date().toISOString(),
      events: [],
    }
  );
}

export async function writeEventLog(log: EventLog): Promise<void> {
  await writeJson(eventsFile(), log);
}
