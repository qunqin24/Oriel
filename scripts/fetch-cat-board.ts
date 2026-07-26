/**
 * 抓取「猫榜」——llm2014/llm_benchmark 的民间自费评测数据。
 *
 * 这不是 Oriel 自己的评测，是第三方社区数据。仓库没有 LICENSE 文件，
 * 但作者在 README 里明确写着"分享一种评测思路"、并维护了公开查询站，
 * 处理方式与 Artificial Analysis 数据一致：拉取 + 显著署名 + 回链原站，
 * 不做二次加工或重新计分。
 *
 * 三个类别的表结构彼此完全不同（logic 是打分制，code_v3 是 Pass/Fail+
 * 字母评级，vision 又是另一套分数体系），且 logic 的表头本身在源仓库
 * 28 个月历史里换过 4 次、code 经历过 v1→v3 的方法论改版。
 * 所以这里只抓每个类别的**最新一个月**，不追历史、不做跨版本的趋势——
 * 那和 AA 的 intelligence_index_version 是同一类陷阱，源数据自己都没有
 * 版本号来标注可比性边界，贸然连线只会做出一条撒谎的曲线。
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseCsvTable } from "./lib/csv.ts";

const RAW_BASE = "https://raw.githubusercontent.com/llm2014/llm_benchmark/main/docs";
// manifest 里的 csv 字段已经带 "data/" 前缀（如 "data/logic/2026-07.csv"）。
const MANIFEST_URL = `${RAW_BASE}/data/datasets.json`;
const OUT_FILE = path.join(process.cwd(), "data", "cat-board.json");

type ManifestEntry = {
  category: string;
  reportDate: string;
  tableIndex: number;
  title: string;
  csv: string;
};

/** 页面要展示的三个类别，及它们在源 manifest 里对应的 category key。 */
const CATEGORIES = [
  { id: "logic", sourceCategory: "logic" },
  // code 类目经历过 v1→v3 的方法论改版，v3 是当前有效的一代。
  { id: "code", sourceCategory: "code_v3" },
  { id: "vision", sourceCategory: "vision" },
] as const;

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function latestEntry(
  manifest: ManifestEntry[],
  sourceCategory: string
): ManifestEntry {
  // manifest 按时间顺序追加，同类目里最后一条就是最新月份。
  const matches = manifest.filter(
    (entry) => entry.category === sourceCategory && entry.tableIndex === 0
  );
  const latest = matches.at(-1);
  if (!latest) throw new Error(`manifest 里没有 category="${sourceCategory}" 的条目`);
  return latest;
}

async function main() {
  const manifest = JSON.parse(await fetchText(MANIFEST_URL))
    .datasets as ManifestEntry[];

  const categories: Record<
    string,
    { reportDate: string; headers: string[]; rows: string[][] }
  > = {};

  for (const { id, sourceCategory } of CATEGORIES) {
    const entry = latestEntry(manifest, sourceCategory);
    const csvText = await fetchText(`${RAW_BASE}/${entry.csv}`);
    const table = parseCsvTable(csvText);
    categories[id] = {
      reportDate: entry.reportDate,
      headers: table.headers,
      rows: table.rows,
    };
    console.log(
      `${id.padEnd(6)} ${entry.reportDate}  ${table.rows.length} 个模型  (${entry.csv})`
    );
  }

  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(
    OUT_FILE,
    `${JSON.stringify(
      {
        fetched_at: new Date().toISOString(),
        source_repo: "https://github.com/llm2014/llm_benchmark",
        source_site: "https://llm2014.github.io/llm_benchmark/",
        categories,
      },
      null,
      2
    )}\n`
  );
  console.log(`saved ${path.relative(process.cwd(), OUT_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
