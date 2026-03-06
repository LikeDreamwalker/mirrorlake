"use client";

import { useColorStore } from "@/provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function RecentColors() {
  const { recentColors, setColorFromHex } = useColorStore((state) => ({
    recentColors: state.recentColors,
    setColorFromHex: state.setColorFromHex,
  }));

  if (recentColors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      <div className="text-xs text-muted-foreground">Recent Colors</div>
      <div className="flex gap-1.5">
        {recentColors.map((color, i) => (
          <Tooltip key={`${color}-${i}`}>
            <TooltipTrigger asChild>
              <button
                className="h-7 w-7 rounded-md border border-border cursor-pointer transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ backgroundColor: color }}
                onClick={() => setColorFromHex(color)}
                aria-label={`Select recent color ${color}`}
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
