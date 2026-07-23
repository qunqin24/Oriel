import { formatRelativeFetched } from "@/lib/format";

export function SiteFooter({ fetchedAt }: { fetchedAt?: string }) {
  return (
    <footer className="border-t hairline-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <p className="font-bold text-foreground text-lg tracking-tight">Oriel</p>
          <p className="text-sm text-muted-foreground mt-1 font-mono uppercase tracking-wider text-[10px]">独立 AI 模型评测</p>
        </div>
        <div className="flex flex-col items-center sm:items-end text-center sm:text-right gap-2">
          <p className="text-sm text-muted-foreground">
            数据来源{" "}
            <a
              href="https://artificialanalysis.ai"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground hover:underline underline-offset-4"
            >
              Artificial Analysis
            </a>
            。
          </p>
          {fetchedAt ? (
            <p className="text-[11px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">
              数据快照 · {formatRelativeFetched(fetchedAt)}
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
