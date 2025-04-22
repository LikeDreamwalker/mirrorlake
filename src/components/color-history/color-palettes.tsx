"use client";

import { useStore } from "@/store";
import { tailwindColors } from "@/lib/tailwind-colors";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import ColorBlock from "./color-block";
import ColorGrid from "./color-grid";

export default function ColorPalettes() {
  const { setColorFromHex } = useStore();

  const handleSelectColor = (hex: string) => {
    setColorFromHex(hex);
    toast("Color selected", {
      description: `${hex} is now the active color`,
      duration: 1500,
    });
  };

  return (
    <Card className="h-[30%]">
      <CardHeader>
        <h3 className="font-medium">Palettes</h3>
      </CardHeader>

      <CardContent>
        <TooltipProvider>
          <div className="space-y-3">
            {Object.entries(tailwindColors).map(([key, colorFamily]) => (
              <div key={key} className="space-y-1">
                <ColorGrid columns={11} gap="gap-1.5">
                  {colorFamily.colors.map((color) => (
                    <Tooltip key={`${key}-${color.value}`}>
                      <TooltipTrigger asChild>
                        <div className="w-full cursor-pointer">
                          <ColorBlock
                            color={color.hex}
                            onClick={() => handleSelectColor(color.hex)}
                            className="w-full"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">
                          {colorFamily.name}-{color.value}
                        </p>
                        <p className="text-xs font-mono">
                          {color.hex.toUpperCase()}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </ColorGrid>
              </div>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
