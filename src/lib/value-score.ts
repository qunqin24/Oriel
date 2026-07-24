import type { LanguageModel } from "@/lib/types";

export type ValueScoreMetrics = {
  score: number;
  benchmarkAverage: number;
  benchmarkCount: number;
  outputPrice: number;
};

export function getValueScoreMetrics(
  model: LanguageModel
): ValueScoreMetrics | null {
  const benchmarkScores = [
    model.evaluations.artificial_analysis_intelligence_index,
    model.evaluations.artificial_analysis_coding_index,
    model.evaluations.artificial_analysis_agentic_index,
  ].filter((score): score is number => score != null && Number.isFinite(score));
  const outputPrice = model.pricing?.price_1m_output_tokens;

  if (
    benchmarkScores.length < 2 ||
    outputPrice == null ||
    !Number.isFinite(outputPrice) ||
    outputPrice <= 0
  ) {
    return null;
  }

  const benchmarkAverage =
    benchmarkScores.reduce((sum, score) => sum + score, 0) /
    benchmarkScores.length;

  return {
    score: benchmarkAverage / outputPrice,
    benchmarkAverage,
    benchmarkCount: benchmarkScores.length,
    outputPrice,
  };
}

export function getValueScore(model: LanguageModel): number | null {
  return getValueScoreMetrics(model)?.score ?? null;
}
