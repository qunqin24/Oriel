import { ArenaBoard } from "@/components/boards";
import { BarChart } from "@/components/charts/bar-chart";
import { ChartPanel } from "@/components/charts/chart-panel";
import type { ArenaModel } from "@/lib/types";

export function ArenaTab({
  rows,
  metric = "Elo",
}: {
  rows: ArenaModel[];
  metric?: string;
}) {
  const top10 = rows.slice(0, 10).map((m) => ({
    label: m.name,
    value: m.elo,
    creator: m.model_creator?.name,
  }));
  return (
    <div className="flex flex-col gap-8 mt-6">
      <ChartPanel
        title={`${metric} Top 10`}
        note={`共 ${rows.length} 个模型`}
      >
        <BarChart items={top10} digits={0} />
      </ChartPanel>
      <ArenaBoard rows={rows} />
    </div>
  );
}
