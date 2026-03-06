"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useColorStore } from "@/provider";
import { cn } from "@/lib/utils";

interface ColorStripProps {
  colors: string[];
  label?: string;
  className?: string;
}

export function ColorStrip({ colors, label, className }: ColorStripProps) {
  const setColorFromHex = useColorStore((state) => state.setColorFromHex);

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <div className="text-xs text-muted-foreground">{label}</div>}
      <div className="flex gap-1">
        {colors.map((color, i) => (
          <Tooltip key={`${color}-${i}`}>
            <TooltipTrigger asChild>
              <button
                className="flex-1 h-8 rounded-md border border-border cursor-pointer hover:scale-110 hover:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{
                  backgroundColor: color,
                  transition: "background-color 0.2s ease, transform 0.15s ease",
                }}
                onClick={() => setColorFromHex(color)}
                aria-label={`Select color ${color}`}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs font-mono">
              {color.toUpperCase()}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
