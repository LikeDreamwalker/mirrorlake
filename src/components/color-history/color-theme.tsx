"use client";

import { useStore } from "@/store";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import ColorBlock from "./color-block";
import ColorGrid from "./color-grid";

export default function CurrentTheme() {
  const { colors, setColorFromHex } = useStore();

  const handleSelectColor = (hex: string) => {
    setColorFromHex(hex);
    toast("Color selected", {
      description: `${hex} is now the active color`,
      duration: 1500,
    });
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="flex flex-row justify-between items-center w-full">
          <h3 className="font-medium">Current Theme</h3>
          <Badge variant="outline">{colors.length} colors</Badge>
        </CardHeader>

        <CardContent>
          {colors.length === 0 ? (
            <EmptyState />
          ) : (
            <ColorGrid columns={11} gap="gap-1.5">
              {colors.map((color) => (
                <Tooltip key={color.id}>
                  <TooltipTrigger asChild>
                    <div className="w-full cursor-pointer">
                      <ColorBlock
                        color={color.color}
                        onClick={() => handleSelectColor(color.color)}
                        className="w-full"
                      >
                        {color.favorite && (
                          <div className="absolute top-1 left-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          </div>
                        )}
                      </ColorBlock>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{color.name}</p>
                    <p className="text-xs font-mono">{color.color}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </ColorGrid>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

function EmptyState() {
  return (
    <div className="h-24 bg-muted/30 rounded-md flex items-center justify-center">
      <span className="text-muted-foreground">No colors in your theme yet</span>
    </div>
  );
}
