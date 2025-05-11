"use client";

import { ColorItem, useStore } from "@/store";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import ColorBlock from "./color-block";
import ColorGrid from "./color-grid";
import { Separator } from "@/components/ui/separator";
import { ColorPreview } from "@/components/color-assistant/color-preview";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";

export default function CurrentTheme() {
  const { colors, setColorFromHex, removeColor } = useStore();

  const handleSelectColor = (hex: string) => {
    setColorFromHex(hex);
    toast("Color selected", {
      description: `${hex} is now the active color`,
      duration: 1500,
    });
  };

  const handleRemoveCurrentColor = (color: ColorItem) => {
    removeColor(color.id);
    toast("Color removed", {
      description: `${color.color} has been removed from your theme`,
      duration: 2000,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center w-full pb-2">
        <h3 className="font-medium text-lg">Current Theme</h3>
        <Badge variant="outline">{colors.length} colors</Badge>
      </CardHeader>

      <CardContent>
        <ScrollArea className="w-full h-[50vh] rounded-lg">
          {colors.length === 0 ? (
            <EmptyState />
          ) : (
            colors.map((color) => (
              <Card
                key={color.id}
                className="w-full rounded-xl overflow-hidden my-2"
              >
                <CardContent
                  className="h-20"
                  style={{
                    backgroundColor: color.color,
                  }}
                ></CardContent>
                <Separator />
                <CardFooter className="p-4 flex justify-between items-center">
                  <span className="text-lg font-bold">{color.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveCurrentColor(color)}
                      className="h-8 w-8"
                      aria-label="Remove color from theme"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ColorPreview
                      colorCode={color.color}
                      // className="h-4"
                    ></ColorPreview>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="h-24 bg-muted/30 rounded-md flex items-center justify-center">
      <span className="text-muted-foreground">No colors in your theme yet</span>
    </div>
  );
}
