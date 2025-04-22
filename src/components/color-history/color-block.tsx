"use client";

import type { ReactNode, MouseEvent } from "react";

interface ColorBlockProps {
  color: string;
  onClick?: () => void;
  children?: ReactNode;
  className?: string;
}

export default function ColorBlock({
  color,
  onClick,
  children,
  className = "",
}: ColorBlockProps) {
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    // Only call onClick if provided, but don't stop propagation
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`aspect-square rounded-md border border-border hover:ring-2 hover:ring-primary transition-all ${className}`}
      style={{ backgroundColor: color }}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}
