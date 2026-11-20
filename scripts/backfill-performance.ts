/**
 * Restore only missing v3 performance means from committed raw snapshots.
 * Default is a dry run. Pass --apply to write changed monthly archives.
 */
import { execFileSync } from "node:child_process";
import { rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { monthOf, snapshotDate, type HistoryMonth } from "../src/lib/history-schema.ts";
import type { LanguageModel } from "../src/lib/types.ts";
import { HISTORY_DIR, readMonth, stringifyMonth } from "./lib/archive.ts";
import { fillPerformanceMeans } from "./lib/backfill-performance.ts";

const tracked = "data/language-models.json";
const git = (args: string[]) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

async function main() {
  const args = process.argv.slice(2);
  if (args.length && !(args.length === 1 && args[0] === "--apply")) {
    throw new Error("Usage: pnpm backfill:performance [--apply]");
  }
  if (git(["rev-parse", "--is-shallow-repository"]).trim() === "true") {
    throw new Error("Backfill needs a complete Git history. Fetch the full history first.");
  }
  const latest = new Map<string, { fetchedAt: number; models: LanguageModel[] }>();
  for (const sha of git(["log", "--diff-filter=AM", "--format=%H", "--reverse", "--", tracked]).trim().split("\n").filter(Boolean)) {
    const raw = JSON.parse(git(["show", `${sha}:${tracked}`])) as {
      fetched_at?: string;
      data?: LanguageModel[];
    };
    const fetchedAt = Date.parse(raw.fetched_at ?? "");
    if (!Number.isFinite(fetchedAt) || !Array.isArray(raw.data)) continue;
    const date = snapshotDate(raw.fetched_at!);
    const previous = latest.get(date);
    if (!previous || previous.fetchedAt < fetchedAt) latest.set(date, { fetchedAt, models: raw.data });
  }

  const months = new Map<string, HistoryMonth | null>();
  const changed = new Set<HistoryMonth>();
  let dates = 0;
  let rows = 0;
  let values = 0;
  for (const [date, { models }] of latest) {
    const month = monthOf(date);
    if (!months.has(month)) months.set(month, await readMonth(month));
    const archive = months.get(month);
    const snapshot = archive?.snapshots[date];
    if (!archive || !snapshot) continue;
    const result = fillPerformanceMeans(snapshot, models);
    if (result.values === 0) continue;
    changed.add(archive);
    dates++;
    rows += result.rows;
    values += result.values;
  }

  if (args[0] === "--apply") {
    for (const archive of changed) {
      const file = path.join(HISTORY_DIR, `${archive.month}.json`);
      const temporary = `${file}.${process.pid}.tmp`;
      try {
        await writeFile(temporary, `${stringifyMonth(archive)}\n`, { flag: "wx" });
        await rename(temporary, file);
      } finally {
        await rm(temporary, { force: true });
      }
    }
  }
  console.log(`${args.length ? "Filled" : "Would fill"} ${values} means across ${rows} model-days, ${dates} dates, ${changed.size} months.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
