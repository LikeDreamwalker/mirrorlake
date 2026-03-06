"use client";

import { ColorItem } from "@/store";
import { useColorStore } from "@/provider";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function CurrentTheme() {
  const { colors, removeColor, resetTheme, setColorFromHex } = useColorStore((state) => ({
    colors: state.colors,
    removeColor: state.removeColor,
    resetTheme: state.resetTheme,
    setColorFromHex: state.setColorFromHex,
  }));

  const handleRemove = (color: ColorItem) => {
    removeColor(color.id);
    toast("Color removed", { description: `${color.color} removed`, duration: 2000 });
  };

  if (colors.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground">
        No colors in your theme yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Theme ({colors.length})</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-muted-foreground px-2"
          onClick={() => {
            resetTheme();
            toast("Theme cleared", { duration: 2000 });
          }}
        >
          Clear
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {colors.map((color) => (
          <Tooltip key={color.id}>
            <TooltipTrigger asChild>
              <button
                className="group relative h-8 w-8 rounded-md border border-border cursor-pointer transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ backgroundColor: color.color }}
                onClick={() => setColorFromHex(color.color)}
                aria-label={`Select ${color.name}`}
              >
                <span
                  className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(color);
                  }}
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <div>{color.name}</div>
              <div className="font-mono text-muted-foreground">{color.color.toUpperCase()}</div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
