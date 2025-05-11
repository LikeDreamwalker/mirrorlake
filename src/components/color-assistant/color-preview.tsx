"use client";

import { cn } from "@/lib/utils";
import { useStore } from "@/store";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { colord, extend } from "colord";
import namesPlugin from "colord/plugins/names";

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
  const { setColorFromHex, getColorName } = useStore();
  const [hexColor, setHexColor] = useState("");
  const [isValidColor, setIsValidColor] = useState(true);
  const [colorName, setColorName] = useState("");

  // Process the color code and convert it to HEX
  useEffect(() => {
    const processColorCode = async () => {
      const trimmedColor = colorCode.trim();

      // Use colord directly to validate the color
      const color = colord(trimmedColor);
      if (color.isValid()) {
        setHexColor(color.toHex());
        const colorName = await getColorName({ color: color.toHex() });
        setColorName(colorName);
        setIsValidColor(true);
      } else {
        setIsValidColor(false);
        setHexColor(""); // Reset HEX color if invalid
      }
    };

    processColorCode();
  }, [colorCode, getColorName]);

  // Handle click action
  const handleClick = () => {
    if (!isValidColor || !hexColor) {
      toast.error("Invalid color format", {
        description: `${colorCode} is not supported for now.`,
      });
      return;
    }

    try {
      // Set the color in the store
      setColorFromHex(hexColor);

      // Show confirmation toast
      toast("Color selected", {
        description: `${hexColor} is now the active color.`,
      });
    } catch (error) {
      console.error("Error selecting color:", error);

      // Fallback to clipboard copy if selection fails
      navigator.clipboard.writeText(hexColor);
      toast("Color copied", {
        description: `${hexColor} has been copied to clipboard.`,
      });
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 p-1 leading-tight rounded-md border cursor-pointer transition-colors",
              !isValidColor && "opacity-50",
              reverseTheme
                ? "bg-primary text-primary-foreground border-muted-foreground hover:border-primary-blue"
                : "bg-background text-foreground border-border hover:border-primary-blue",
              className
            )}
            onClick={handleClick}
          >
            {isValidColor && hexColor && (
              <span
                className="inline-block w-4 h-4 rounded-md border border-border shadow-sm"
                style={{ backgroundColor: hexColor }}
              />
            )}
            <code className="font-mono">{colorCode.trim()}</code>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          {isValidColor ? (
            <>
              <p className="text-xs">Select {colorName}</p>
            </>
          ) : (
            <p className="text-xs">Not supported yet</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
