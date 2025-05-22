"use client";

import type { ReactNode } from "react";

interface ColorGridProps {
  children: ReactNode;
  columns?: number;
  gap?: string;
  className?: string;
}

export default function ColorGrid({
  children,
  columns = 11,
  gap = "gap-1.5",
  className = "",
}: ColorGridProps) {
  return (
    <div
      className={`grid ${gap} ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {children}
    </div>
  );
}
