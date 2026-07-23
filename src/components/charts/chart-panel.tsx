import type { ReactNode } from "react";

type Props = {
  title: string;
  note?: string;
  children: ReactNode;
};

export function ChartPanel({ title, note, children }: Props) {
  return (
    <section className="instrument-panel px-6 py-6 sm:px-8 flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
          {note ? <p className="font-mono text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded shrink-0">{note}</p> : null}
        </div>
      </header>
      <div className="pt-2">{children}</div>
    </section>
  );
}
