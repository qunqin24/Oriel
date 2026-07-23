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
      variantClasses = "bg-emerald-100 text-emerald-800 border border-emerald-200";
      break;
    case "warning":
      variantClasses = "bg-amber-100 text-amber-800 border border-amber-200";
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
