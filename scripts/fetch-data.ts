/**
 * 抓取 Artificial Analysis 的当日快照，写入 data/，并把语言模型部分归档进 data/history/。
 *
 * 由 .github/workflows/daily-data-update.yml 每天 21:00 UTC（北京时间次日 05:00）触发。
 */

import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeModelList } from "./lib/model-list.ts";
import { recordSnapshot, summarize } from "./lib/record.ts";
import type { LanguageModel } from "../src/lib/types.ts";

const BASE_URL = "https://artificialanalysis.ai/api/v2";
const OUT_DIR = path.join(process.cwd(), "data");
const FETCH_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 15_000;

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

class HttpResponseError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpResponseError";
  }
}

function isTransientFetchError(error: unknown) {
  return (
    !(error instanceof HttpResponseError) ||
    error.status === 429 ||
    error.status >= 500
  );
}

async function fetchJson(url: string) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt += 1) {
    let res: Response | undefined;
    try {
      res = await fetch(url, {
        headers: { "x-api-key": apiKey! },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (error) {
      lastError = error;
    }

    if (res?.ok) return res.json();
    if (res) {
      const body = (await res.text()).slice(0, 500);
      const error = new HttpResponseError(
        res.status,
        `${res.status} ${url}: ${body}`
      );
      if (!isTransientFetchError(error)) throw error;
      lastError = error;
    }

    if (attempt < FETCH_ATTEMPTS) {
      const delay = attempt * 1_000;
      console.warn(
        `fetch failed (${attempt}/${FETCH_ATTEMPTS}), ${delay}ms 后重试: ${url}`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

function fileName(endpoint: string) {
  return endpoint.replace(/\/models\/free$/, "").replaceAll("/", "-");
}

function snapshotPath(endpoint: string) {
  return path.join(OUT_DIR, `${fileName(endpoint)}.json`);
}

async function hasSnapshot(endpoint: string) {
  try {
    await access(snapshotPath(endpoint));
    return true;
  } catch {
    return false;
  }
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
  const fetchedModels = [...first.data] as LanguageModel[];
  const intelligenceIndexVersion = first.intelligence_index_version;
  while (fetchedModels.length > 0) {
    const lastPage = first.pagination.total_pages;
    const fetchedPages = Math.ceil(
      fetchedModels.length / first.pagination.page_size
    );
    if (fetchedPages >= lastPage) break;
    const next = await fetchJson(
      `${BASE_URL}/language/models/free?page=${fetchedPages + 1}`
    );
    fetchedModels.push(...next.data);
  }

  const { models, duplicateIds } = normalizeModelList(fetchedModels);
  if (duplicateIds.length > 0) {
    console.warn(
      `分页结果含 ${duplicateIds.length} 个重复模型，已按 id 去重: ${duplicateIds.join(", ")}`
    );
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

  const staleMediaEndpoints: string[] = [];
  for (const endpoint of MEDIA_ENDPOINTS) {
    try {
      const json = await fetchJson(`${BASE_URL}/${endpoint}`);
      await save(fileName(endpoint), json);
    } catch (error) {
      // 媒体榜单彼此独立。上游短暂故障时保留已有快照，不能拖垮
      // 语言模型和其余媒体数据的更新；确定性的 4xx 仍然立即失败。
      if (!isTransientFetchError(error) || !(await hasSnapshot(endpoint))) {
        throw error;
      }
      staleMediaEndpoints.push(endpoint);
      console.warn(
        `上游暂时不可用，保留已有快照 data/${fileName(endpoint)}.json:`,
        error
      );
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  if (staleMediaEndpoints.length > 0) {
    console.warn(
      `done with ${staleMediaEndpoints.length} stale media snapshot(s): ${staleMediaEndpoints.join(", ")}`
    );
  } else {
    console.log("done");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
