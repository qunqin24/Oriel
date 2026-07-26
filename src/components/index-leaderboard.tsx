import { BarChart } from "@/components/charts/bar-chart";
import type { LanguageModel } from "@/lib/types";

type Props = {
  models: LanguageModel[];
};

type MetricType = "intelligence" | "coding" | "agentic";

export function IndexLeaderboard({ models }: Props) {
  // 根据选定指标排序并取 Top 10
  const getTop10 = (type: MetricType) => {
    return [...models]
      .filter((m) => {
        if (type === "intelligence")
          return m.evaluations.artificial_analysis_intelligence_index != null;
        if (type === "coding")
          return m.evaluations.artificial_analysis_coding_index != null;
        if (type === "agentic")
          return m.evaluations.artificial_analysis_agentic_index != null;
        return false;
      })
      .sort((a, b) => {
        const valA =
          type === "intelligence"
            ? a.evaluations.artificial_analysis_intelligence_index
            : type === "coding"
            ? a.evaluations.artificial_analysis_coding_index
            : a.evaluations.artificial_analysis_agentic_index;
        const valB =
          type === "intelligence"
            ? b.evaluations.artificial_analysis_intelligence_index
            : type === "coding"
            ? b.evaluations.artificial_analysis_coding_index
            : b.evaluations.artificial_analysis_agentic_index;
        return (valB ?? -Infinity) - (valA ?? -Infinity);
      })
      .slice(0, 10)
      .map((m) => ({
        label: m.name,
        creator: m.model_creator?.name,
        value:
          type === "intelligence"
            ? m.evaluations.artificial_analysis_intelligence_index
            : type === "coding"
            ? m.evaluations.artificial_analysis_coding_index
            : m.evaluations.artificial_analysis_agentic_index,
      }));
  };

  const topIntelligence = getTop10("intelligence");
  const topCoding = getTop10("coding");
  const topAgentic = getTop10("agentic");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
      <div className="instrument-panel p-4 sm:p-5 flex flex-col gap-3 min-w-0">
        <h3 className="text-sm font-semibold text-foreground">
          综合智能指数 Top 10
        </h3>
        <BarChart items={topIntelligence} digits={1} />
      </div>

      <div className="instrument-panel p-4 sm:p-5 flex flex-col gap-3 min-w-0">
        <h3 className="text-sm font-semibold text-foreground">
          编程代码指数 Top 10
        </h3>
        <BarChart items={topCoding} digits={1} />
      </div>

      <div className="instrument-panel p-4 sm:p-5 flex flex-col gap-3 min-w-0">
        <h3 className="text-sm font-semibold text-foreground">
          智能体决策指数 Top 10
        </h3>
        <BarChart items={topAgentic} digits={1} />
      </div>
    </div>
  );
}
