import React from "react";

interface StatusBadgeProps {
  label: string;
  variant?: "neutral" | "positive" | "warning" | "outline";
  className?: string;
}

export function StatusBadge({ label, variant = "neutral", className = "" }: StatusBadgeProps) {
  const baseClasses = "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider font-mono";
  
  let variantClasses = "";
  switch (variant) {
    case "positive":
      variantClasses = "bg-positive/10 text-positive border border-positive/25";
      break;
    case "warning":
      variantClasses = "bg-gold/10 text-gold border border-gold/25";
      break;
    case "outline":
      variantClasses = "bg-transparent text-muted-foreground border hairline-border";
      break;
    case "neutral":
    default:
      variantClasses = "bg-secondary text-secondary-foreground border border-border";
      break;
  }

  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {label}
    </span>
  );
}
