type Props = {
  eyebrow?: string;
  title: string;
  description: string;
  meta?: string;
};

export function PageHero({ eyebrow, title, description, meta }: Props) {
  return (
    <section className="flex flex-col gap-2.5 sm:gap-3 pb-5 sm:pb-6 border-b border-border">
      {eyebrow && (
        <div className="terminal-label inline-flex items-center gap-1.5 mb-1 sm:mb-2 w-fit">
          <span className="inline-block h-1 w-1 rounded-full bg-oriel-gold" aria-hidden />
          {eyebrow}
        </div>
      )}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground wrap-break-word">
        {title}
      </h1>
      <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
        {description}
      </p>
      {meta && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
          <span className="bg-secondary px-2 py-0.5 rounded text-secondary-foreground">
            {meta}
          </span>
        </div>
      )}
    </section>
  );
}
