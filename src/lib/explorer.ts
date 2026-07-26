import { MODELS } from "./data.ts";
import { valueScore } from "./metrics.ts";
import { packRow, type ExplorerRow, type PackedRow } from "./explorer-config.ts";

/**
 * 传给探索器 island 的精简行。**仅构建期使用**。
 *
 * 完整的 language-models.json 是 585KB，整份塞进 HTML 当 props 不可接受。
 * 这里只投影出表格真正要用的字段，约 70KB（gzip 后约 12KB）。
 *
 * 配置和纯函数在 explorer-config.ts——那个文件才是 island 该 import 的，
 * 因为它不碰数据文件。
 */
const ROWS: ExplorerRow[] = MODELS.map((model) => ({
  slug: model.slug,
  name: model.name,
  creator: model.model_creator?.name ?? "",
  intelligence: model.evaluations.artificial_analysis_intelligence_index,
  coding: model.evaluations.artificial_analysis_coding_index,
  agentic: model.evaluations.artificial_analysis_agentic_index,
  value: valueScore(model),
  priceIn: model.pricing?.price_1m_input_tokens ?? null,
  priceOut: model.pricing?.price_1m_output_tokens ?? null,
  throughput: model.performance?.median_output_tokens_per_second ?? null,
  ttft: model.performance?.median_time_to_first_token_seconds ?? null,
  release: model.release_date,
}));

/** 传给 island 的形态：定长数组，省掉 586 份重复的字段名。 */
export const EXPLORER_ROWS: PackedRow[] = ROWS.map(packRow);
