import { useState, type ReactNode } from "react";

export type TabItem = {
  id: string;
  label: string;
  count?: number;
  content: ReactNode;
};

export function SegmentedTabs({ tabs }: { tabs: TabItem[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <div className="flex flex-col gap-4 sm:gap-6 mt-4 sm:mt-6 min-w-0">
      <div
        className="flex gap-1 border-b border-border overflow-x-auto scrollbar-none overscroll-x-contain -mx-1 px-1"
        role="tablist"
        aria-label="榜单分类"
      >
        {tabs.map((tab) => {
          const selected = tab.id === current?.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`shrink-0 px-3 sm:px-4 pb-2 pt-1 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 sm:gap-2 ${
                selected
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActive(tab.id)}
            >
              {tab.label}
              {typeof tab.count === "number" ? (
                <span
                  className={`px-1.5 py-0.5 text-[10px] rounded-md font-mono ${
                    selected
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div key={current?.id} role="tabpanel" className="w-full">
        {current?.content}
      </div>
    </div>
  );
}
