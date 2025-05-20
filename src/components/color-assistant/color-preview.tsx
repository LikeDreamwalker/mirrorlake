"use client";

import { cn } from "@/lib/utils";
import { useStore } from "@/store";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { colord, extend } from "colord";
import namesPlugin from "colord/plugins/names";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Copy, Pipette } from "lucide-react";

// Extend colord with the names plugin for better color name support
extend([namesPlugin]);

interface ColorPreviewProps {
  colorCode: string;
  reverseTheme?: boolean;
  className?: string;
}

export function ColorPreview({
  colorCode,
  reverseTheme = false,
  className,
}: ColorPreviewProps) {
  const { setColorFromHex, getColorName, addColor } = useStore();
  const [hexColor, setHexColor] = useState("");
  const [isValidColor, setIsValidColor] = useState(true);
  const [colorName, setColorName] = useState("");

  // Process the color code and convert it to HEX
  useEffect(() => {
    const processColorCode = async () => {
      const trimmedColor = colorCode.trim();
      const color = colord(trimmedColor);
      if (color.isValid()) {
        setHexColor(color.toHex());
        const colorName = await getColorName({ color: color.toHex() });
        setColorName(colorName);
        setIsValidColor(true);
      } else {
        setIsValidColor(false);
        setHexColor("");
      }
    };
    processColorCode();
  }, [colorCode, getColorName]);

  // Copy color to clipboard
  const handleCopy = async () => {
    if (!isValidColor || !hexColor) return;
    try {
      await navigator.clipboard.writeText(hexColor);
      toast.success("Copied!", {
        description: `${hexColor} copied to clipboard.`,
      });
    } catch {
      toast.error("Copy failed");
    }
  };

  // Select color job
  const handleSelect = () => {
    if (!isValidColor || !hexColor) {
      toast.error("Invalid color format", {
        description: `${colorCode} is not supported for now.`,
      });
      return;
    }
    setColorFromHex(hexColor);
    toast("Color selected", {
      description: `${hexColor} is now the active color.`,
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 p-1 leading-tight rounded-md border cursor-pointer transition-colors",
            !isValidColor && "opacity-50",
            reverseTheme
              ? "bg-primary text-primary-foreground border-muted-foreground hover:border-primary-blue"
              : "bg-background text-foreground border-border hover:border-primary-blue",
            className
          )}
        >
          {isValidColor && hexColor && (
            <span
              className="inline-block w-4 h-4 rounded-md border border-border shadow-sm"
              style={{ backgroundColor: hexColor }}
            />
          )}
          <code className="font-mono">{colorCode.trim()}</code>
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="flex items-center justify-start gap-2 w-auto"
        side="top"
      >
        {isValidColor ? (
          <>
            <div className="flex items-center gap-2 mr-4">
              <span
                className="inline-block w-6 h-6 rounded-md border border-border"
                style={{ backgroundColor: hexColor }}
              />
              <span className="text-sm font-semibold">
                {colorName || hexColor}
              </span>
            </div>
            <Button variant="outline" size="icon" onClick={handleCopy}>
              <Copy />
            </Button>
            <Button variant="outline" size="icon" onClick={handleSelect}>
              <Pipette />
            </Button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">
            Not supported yet
          </span>
        )}
      </PopoverContent>
    </Popover>
  );
}
