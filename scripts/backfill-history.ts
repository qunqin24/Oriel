/**
 * 从 git 历史回填 data/history/。
 *
 * 每日抓取脚本以前直接覆盖 data/language-models.json，历史只剩在 commit 里。
 * 这个脚本把那些 commit 里的快照取出来，用与每日抓取完全相同的逻辑重放一遍，
 * 让站点上线时就有一段真实历史，而不是从零开始。
 *
 * 一次性脚本，但幂等，可以安全重跑：
 *   pnpm backfill:history          在现有历史之上补齐
 *   pnpm backfill:history --reset  先清空 data/history/ 再重放
 */

import { execFileSync } from "node:child_process";
import { rm } from "node:fs/promises";
import { HISTORY_DIR } from "./lib/archive.ts";
import { recordSnapshot, summarize } from "./lib/record.ts";
import { snapshotDate } from "../src/lib/history-schema.ts";
import type { LanguageModel } from "../src/lib/types.ts";

const TRACKED_FILE = "data/language-models.json";

type Candidate = {
  sha: string;
  date: string;
  fetchedAt: string;
  models: LanguageModel[];
  indexVersion: number | null;
};

function git(args: string[]): string {
  return execFileSync("git", args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

/** 改动过该文件的所有 commit，最旧在前。 */
function commitsTouching(file: string): string[] {
  return git(["log", "--format=%H", "--reverse", "--", file])
    .split("\n")
    .filter(Boolean);
}

function readAtCommit(sha: string, file: string): Candidate | null {
  let raw: string;
  try {
    raw = git(["show", `${sha}:${file}`]);
  } catch {
    // 该 commit 里这个文件还不存在。
    return null;
  }

  const parsed = JSON.parse(raw) as {
    fetched_at?: string;
    intelligence_index_version?: number;
    data?: LanguageModel[];
  };
  if (!parsed.fetched_at || !Array.isArray(parsed.data)) return null;

  return {
    sha: sha.slice(0, 7),
    date: snapshotDate(parsed.fetched_at),
    fetchedAt: parsed.fetched_at,
    models: parsed.data,
    indexVersion: parsed.intelligence_index_version ?? null,
  };
}

async function main() {
  if (process.argv.includes("--reset")) {
    await rm(HISTORY_DIR, { recursive: true, force: true });
    console.log("已清空 data/history/");
  }

  const shas = commitsTouching(TRACKED_FILE);
  console.log(`扫描到 ${shas.length} 个改动过 ${TRACKED_FILE} 的 commit`);

  // 一天可能有多个 commit（比如手动触发过一次）。同日只保留最后抓的那份，
  // 因为它才是当天最终的状态。
  const byDate = new Map<string, Candidate>();
  for (const sha of shas) {
    const candidate = readAtCommit(sha, TRACKED_FILE);
    if (!candidate) continue;
    const existing = byDate.get(candidate.date);
    if (!existing || existing.fetchedAt < candidate.fetchedAt) {
      byDate.set(candidate.date, candidate);
    }
  }

  const ordered = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  if (ordered.length === 0) {
    console.log("没有可回填的快照");
    return;
  }

  console.log(`去重后得到 ${ordered.length} 天：${ordered.map((c) => c.date).join(", ")}\n`);

  for (const candidate of ordered) {
    const result = await recordSnapshot({
      models: candidate.models,
      indexVersion: candidate.indexVersion,
      fetchedAt: candidate.fetchedAt,
    });
    console.log(`  ${candidate.sha}  ${summarize(result)}`);
  }

  console.log("\n回填完成");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
