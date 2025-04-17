"use client";
import { useStore } from "@/store";
import type React from "react";
import { tailwindColors } from "@/lib/tailwind-colors";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

export default function ColorHistory() {
  const { colors, setColorFromHex, toggleFavorite, removeColor } = useStore();

  // Handle color selection
  const handleSelectColor = (hex: string) => {
    setColorFromHex(hex);
    toast("Color selected", {
      description: `${hex} is now the active color`,
      duration: 1500,
    });
  };

  // Common color block component
  const ColorBlock = ({
    color,
    onClick,
    children,
  }: {
    color: string;
    onClick: () => void;
    children?: React.ReactNode;
  }) => (
    <div
      className="w-full aspect-square rounded-md border border-border hover:ring-2 hover:ring-primary transition-all cursor-pointer"
      style={{ backgroundColor: color }}
      onClick={onClick}
    >
      {children}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-6">
        {/* Current Theme Section */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-center w-full">
            <h3 className="font-medium">Current Theme</h3>
            <Badge variant="outline">{colors.length} colors</Badge>
          </CardHeader>

          <CardContent>
            {colors.length === 0 ? (
              <div className="h-24 bg-muted/30 rounded-md flex items-center justify-center">
                <span className="text-muted-foreground">
                  No colors in your theme yet
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-11 gap-1.5">
                {colors.map((color) => (
                  <TooltipProvider key={color.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="group relative">
                          <ColorBlock
                            color={color.color}
                            onClick={() => handleSelectColor(color.color)}
                          >
                            {/* Favorite indicator */}
                            {color.favorite && (
                              <div className="absolute top-1 left-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              </div>
                            )}
                          </ColorBlock>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{color.name}</p>
                        <p className="text-xs font-mono">{color.color}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tailwind Color Palettes Section */}
        <Card className="h-[30%]">
          <CardHeader>
            <h3 className="font-medium">Palettes</h3>
          </CardHeader>

          <CardContent>
            <div className="space-y-1.5">
              {Object.entries(tailwindColors).map(([key, colorFamily]) => (
                <div key={key} className="grid grid-cols-11 gap-1.5">
                  {colorFamily.colors.map((color) => (
                    <TooltipProvider key={`${key}-${color.value}`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ColorBlock
                            color={color.hex}
                            onClick={() => handleSelectColor(color.hex)}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs">
                            {colorFamily.name}-{color.value}
                          </p>
                          <p className="text-xs font-mono">{color.hex}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
