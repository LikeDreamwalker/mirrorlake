"use client";

import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ColorTooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

export default function ColorTooltip({
  children,
  content,
  side = "bottom",
}: ColorTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip
        onOpenChange={() => {
          console.log(123456);
        }}
      >
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side}>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
