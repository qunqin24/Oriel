import type { ReactNode } from "react";

type Props = {
  title: string;
  note?: string;
  children: ReactNode;
};

export function ChartPanel({ title, note, children }: Props) {
  return (
    <section className="instrument-panel px-4 py-4 sm:px-6 sm:py-6 md:px-8 flex flex-col gap-3 sm:gap-4 min-w-0">
      <header className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <h3 className="terminal-label !text-[11px] text-foreground/80 leading-snug">
            {title}
          </h3>
          {note ? (
            <p className="font-mono text-[11px] sm:text-xs text-muted-foreground border hairline-border px-2 py-0.5 rounded w-fit max-w-full">
              {note}
            </p>
          ) : null}
        </div>
      </header>
      <div className="pt-1 sm:pt-2 min-w-0 overflow-x-auto">{children}</div>
    </section>
  );
}
