import type { ReactNode } from "react";

type TabItem = {
  id: string;
  label: string;
  count?: number;
  content: ReactNode;
};

export function StaticSegmentedTabs({ tabs }: { tabs: TabItem[] }) {
  return (
    <div className="flex flex-col gap-6 mt-6" data-segmented-tabs>
      <div
        className="flex gap-1 border-b border-border overflow-x-auto"
        role="tablist"
        aria-label="榜单分类"
      >
        {tabs.map((tab, index) => {
          const selected = index === 0;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              data-tab-id={tab.id}
              className="segmented-tab px-4 pb-2 pt-1 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2"
            >
              {tab.label}
              {typeof tab.count === "number" ? (
                <span className="segmented-tab-count px-1.5 py-0.5 text-[10px] rounded-md font-mono">
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          role="tabpanel"
          data-tab-panel={tab.id}
          className="w-full"
          hidden={index !== 0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
