/**
 * 抓取 Artificial Analysis 的当日快照，写入 data/，并把语言模型部分归档进 data/history/。
 *
 * 由 .github/workflows/daily-data-update.yml 每天 00:23 UTC 触发。
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { recordSnapshot, summarize } from "./lib/record.ts";
import type { LanguageModel } from "../src/lib/types.ts";

const BASE_URL = "https://artificialanalysis.ai/api/v2";
const OUT_DIR = path.join(process.cwd(), "data");

const apiKey = process.env.AA_API_KEY;
if (!apiKey) {
  console.error("Missing AA_API_KEY env var");
  process.exit(1);
}

const MEDIA_ENDPOINTS = [
  "media/text-to-image/models/free",
  "media/image-editing/models/free",
  "media/text-to-video/models/free",
  "media/image-to-video/models/free",
  "media/text-to-video-audio/models/free",
  "media/image-to-video-audio/models/free",
  "media/text-to-speech/models/free",
  "media/speech-to-speech/models/free",
  "media/speech-to-text/models/free",
  "media/music/instrumental/models/free",
  "media/music/with-vocals/models/free",
] as const;

/** 整轮抓取共用一个时间戳，让所有快照文件与历史归档指向同一个时刻。 */
const fetchedAt = new Date().toISOString();

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: { "x-api-key": apiKey! } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${url}: ${body}`);
  }
  return res.json();
}

function fileName(endpoint: string) {
  return endpoint.replace(/\/models\/free$/, "").replaceAll("/", "-");
}

async function save(name: string, payload: unknown) {
  const file = `${name}.json`;
  await writeFile(
    path.join(OUT_DIR, file),
    JSON.stringify({ fetched_at: fetchedAt, ...(payload as object) }, null, 2)
  );
  console.log(`saved data/${file}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const first = await fetchJson(`${BASE_URL}/language/models/free?page=1`);
  const models = [...first.data];
  const intelligenceIndexVersion = first.intelligence_index_version;
  while (models.length > 0) {
    const lastPage = first.pagination.total_pages;
    const fetchedPages = Math.ceil(models.length / first.pagination.page_size);
    if (fetchedPages >= lastPage) break;
    const next = await fetchJson(
      `${BASE_URL}/language/models/free?page=${fetchedPages + 1}`
    );
    models.push(...next.data);
  }
  await save("language-models", {
    intelligence_index_version: intelligenceIndexVersion,
    data: models,
  });

  // 快照存档 + 与前一日的差分。前端的时间维度全部建立在这上面。
  const recorded = await recordSnapshot({
    models: models as LanguageModel[],
    indexVersion: intelligenceIndexVersion ?? null,
    fetchedAt,
  });
  console.log(`archived ${summarize(recorded)}`);

  for (const endpoint of MEDIA_ENDPOINTS) {
    const json = await fetchJson(`${BASE_URL}/${endpoint}`);
    await save(fileName(endpoint), json);
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
