"use client";

import { cn, copyToClipboard } from "@/lib/utils";
import { useColorStore } from "@/provider";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { colord, extend } from "colord";
import namesPlugin from "colord/plugins/names";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Copy, Pipette, Plus, Trash2 } from "lucide-react";

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
  const {
    setColorFromHex,
    getColorName,
    addColor,
    removeColor,
    colors = [],
  } = useColorStore((state) => ({
    setColorFromHex: state.setColorFromHex,
    getColorName: state.getColorName,
    addColor: state.addColor,
    removeColor: state.removeColor,
    colors: state.colors,
  }));
  const [hexColor, setHexColor] = useState("");
  const [isValidColor, setIsValidColor] = useState(true);
  const [colorName, setColorName] = useState("");

  // Find if this color exists in the current theme (memoized)
  const currentColorInTheme = useMemo(
    () => colors.find((c) => c.color.toLowerCase() === colorCode.toLowerCase()),
    [colors, colorCode]
  );

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
    const res = await copyToClipboard(hexColor);
    if (res) {
      toast("Copied!", {
        description: `${hexColor} has been copied to clipboard`,
        duration: 2000,
      });
    } else {
      toast.error("Failed to copy", {
        description: "Please try again",
      });
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

  // Add current color to theme
  const handleAddToTheme = () => {
    if (!isValidColor || !hexColor) return;
    if (!currentColorInTheme) {
      addColor(hexColor, colorName);
      toast("Color added", {
        description: `${hexColor} has been added to your theme`,
        duration: 2000,
      });
    }
  };

  // Remove current color from theme
  const handleRemoveFromTheme = () => {
    if (currentColorInTheme) {
      removeColor(currentColorInTheme.id);
      toast("Color removed", {
        description: `${hexColor} has been removed from your theme`,
        duration: 2000,
      });
    }
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
            {currentColorInTheme ? (
              <Button
                variant="outline"
                size="icon"
                onClick={handleRemoveFromTheme}
                aria-label="Remove color from theme"
              >
                <Trash2 />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                onClick={handleAddToTheme}
                aria-label="Add color to theme"
              >
                <Plus />
              </Button>
            )}
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
