"use client";

import type { ReactNode } from "react";
import { VendorIcon } from "@/components/vendor-icon";

type Props = {
  name: string;
  creator?: string | null;
  href?: string;
  size?: number;
  showCreator?: boolean;
  className?: string;
};

export function MetricBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center shrink-0 rounded-md border hairline-border bg-secondary px-2 py-0.5 font-mono text-xs font-semibold text-foreground tabular-nums">
      {children}
    </span>
  );
}

export function ModelNameCell({
  name,
  creator,
  href,
  size = 18,
  showCreator = true,
  className = "",
}: Props) {
  const title = (
    <span className="font-semibold text-foreground truncate block" title={name}>
      {name}
    </span>
  );

  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      <VendorIcon name={creator} size={size} className="shrink-0" />
      <div className="flex flex-col min-w-0">
        {href ? (
          <a
            href={href}
            className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer block truncate"
            title={name}
          >
            {name}
          </a>
        ) : (
          title
        )}
        {showCreator && creator ? (
          <span className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate">
            {creator}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Model row with metric value(s) as compact badge(s) after the name. */
export function ModelNameWithBadges({
  name,
  creator,
  href,
  badges,
  size = 18,
}: {
  name: string;
  creator?: string | null;
  href?: string;
  badges: string[];
  size?: number;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="min-w-0 flex-1">
        <ModelNameCell
          name={name}
          creator={creator}
          href={href}
          size={size}
        />
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {badges.map((badge) => (
          <MetricBadge key={badge}>{badge}</MetricBadge>
        ))}
      </div>
    </div>
  );
}
