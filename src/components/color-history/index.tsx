"use client";

import { useState, useEffect } from "react";
import { useStore, type ColorItem } from "@/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Copy, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ColorHistory() {
  const {
    colors,
    toggleFavorite,
    removeColor,
    baseColor,
    hue,
    saturation,
    lightness,
    rgb,
  } = useStore();
  const [selectedColor, setSelectedColor] = useState<ColorItem | null>(null);
  const [userSelected, setUserSelected] = useState(false);

  // Initialize with current color info when component mounts
  useEffect(() => {
    if (colors.length > 0 && !selectedColor) {
      // If we have colors but no selection, select the first one
      setSelectedColor(colors[0]);
    } else if (!selectedColor) {
      // Create a virtual color item for the current color if no colors exist
      setSelectedColor(createCurrentColorItem());
    }
  }, [colors, selectedColor]);

  // Create a current color item based on the current state
  const createCurrentColorItem = (): ColorItem => {
    return {
      id: "current",
      name: "Current Color",
      color: baseColor,
      rgb: rgb,
      hsl: { h: hue, s: saturation, l: lightness },
      alpha: 1,
      createdAt: new Date(),
    };
  };

  // Update the selected color when the current color changes
  // but only if the user hasn't manually selected a color
  useEffect(() => {
    // Only update the selected color when the current color changes
    // if the user hasn't manually selected a color
    if (!userSelected) {
      setSelectedColor(createCurrentColorItem());
    }
  }, [baseColor, rgb, hue, saturation, lightness]);

  // Add a debounced effect to handle color selection reset
  useEffect(() => {
    // Reset userSelected flag after a delay when the current color changes
    // This allows the color info card to update to the new current color
    // after the user changes colors in the picker
    if (userSelected) {
      const timeoutId = setTimeout(() => {
        setUserSelected(false);
      }, 500); // Reset after half a second of no changes

      return () => clearTimeout(timeoutId);
    }
  }, [baseColor, userSelected]);

  // Handle copying color to clipboard
  const copyToClipboard = (color: string, format = "hex") => {
    navigator.clipboard.writeText(color);
    toast("Copied!", {
      description: `${color} has been copied to clipboard`,
      duration: 2000,
    });
  };

  // Handle color selection
  const handleSelectColor = (color: ColorItem) => {
    setSelectedColor(color);
    setUserSelected(true); // Mark that user has manually selected a color
  };

  // Handle color removal
  const handleRemoveColor = (colorId: string) => {
    removeColor(colorId);
    // If we're removing the selected color, select the first available color
    if (selectedColor?.id === colorId) {
      if (colors.length > 1) {
        // Find the next color that's not being removed
        const nextColor = colors.find((c) => c.id !== colorId);
        if (nextColor) {
          setSelectedColor(nextColor);
          setUserSelected(true);
        }
      } else {
        // Reset to current color if no colors will be left
        setSelectedColor(createCurrentColorItem());
        setUserSelected(false);
      }
    }
  };

  // Reset to current color
  const resetToCurrentColor = () => {
    setSelectedColor(createCurrentColorItem());
    setUserSelected(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Color History</h2>
        <Badge variant="outline">{colors.length} colors</Badge>
      </div>

      {/* Color Info Card - Always shown at the top */}
      {selectedColor && (
        <div className="mb-4">
          <ColorDetails
            color={selectedColor}
            onCopy={copyToClipboard}
            isCurrentColor={selectedColor.id === "current"}
            onResetToCurrent={resetToCurrentColor}
            userSelected={userSelected}
          />
        </div>
      )}

      {/* If theme has no colors */}
      {colors.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1">
          <p className="text-muted-foreground">
            No colors in your collection yet
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Use the color picker to add colors
          </p>
        </div>
      ) : (
        /* Use ScrollArea with a fixed height */
        <div className="h-[400px]">
          <ScrollArea className="h-full">
            <div className="grid grid-cols-1 gap-3 pr-4">
              {colors.map((color) => (
                <ColorCard
                  key={color.id}
                  color={color}
                  isSelected={selectedColor?.id === color.id}
                  onSelect={() => handleSelectColor(color)}
                  onCopy={() => copyToClipboard(color.color)}
                  onToggleFavorite={() => toggleFavorite(color.id)}
                  onRemove={() => handleRemoveColor(color.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

interface ColorCardProps {
  color: ColorItem;
  isSelected: boolean;
  onSelect: () => void;
  onCopy: () => void;
  onToggleFavorite: () => void;
  onRemove: () => void;
}

function ColorCard({
  color,
  isSelected,
  onSelect,
  onCopy,
  onToggleFavorite,
  onRemove,
}: ColorCardProps) {
  return (
    <Card
      className={`p-3 flex items-center cursor-pointer transition-all ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      <div
        className="w-10 h-10 rounded-md mr-3 flex-shrink-0"
        style={{ backgroundColor: color.color }}
      ></div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{color.name}</div>
        <div className="text-xs text-muted-foreground truncate">
          {color.color}
        </div>
      </div>
      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
              >
                <Star
                  className={`h-4 w-4 ${
                    color.favorite ? "fill-yellow-400 text-yellow-400" : ""
                  }`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {color.favorite ? "Remove from favorites" : "Add to favorites"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy color</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove color</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </Card>
  );
}

interface ColorDetailsProps {
  color: ColorItem;
  onCopy: (value: string, format?: string) => void;
  isCurrentColor?: boolean;
  onResetToCurrent?: () => void;
  userSelected?: boolean;
}

function ColorDetails({
  color,
  onCopy,
  isCurrentColor = false,
  onResetToCurrent,
  userSelected = false,
}: ColorDetailsProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center mb-3">
        <div
          className="w-12 h-12 rounded-md mr-3"
          style={{ backgroundColor: color.color }}
        ></div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">{color.name}</h3>
            {userSelected && onResetToCurrent && !isCurrentColor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetToCurrent}
                className="h-8 px-2 text-xs"
              >
                Show current
              </Button>
            )}
          </div>
          {color.info && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Info className="h-3 w-3 mr-1" />
              {color.info}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <DetailItem
          label="HEX"
          value={color.color}
          onClick={() => onCopy(color.color, "hex")}
        />
        <DetailItem
          label="RGB"
          value={`rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`}
          onClick={() =>
            onCopy(`rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`, "rgb")
          }
        />
        <DetailItem
          label="HSL"
          value={`hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`}
          onClick={() =>
            onCopy(
              `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`,
              "hsl"
            )
          }
        />
        <DetailItem
          label={color.id === "current" ? "Status" : "Created"}
          value={
            color.id === "current"
              ? "Active color"
              : new Date(color.createdAt).toLocaleDateString()
          }
        />
      </div>
    </Card>
  );
}

interface DetailItemProps {
  label: string;
  value: string;
  onClick?: () => void;
}

function DetailItem({ label, value, onClick }: DetailItemProps) {
  return (
    <div
      className={`p-2 rounded-md bg-muted ${
        onClick ? "cursor-pointer hover:bg-muted/80" : ""
      }`}
      onClick={onClick}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-sm truncate">{value}</div>
      {onClick && (
        <div className="text-xs text-muted-foreground mt-1 flex items-center">
          <Copy className="h-3 w-3 mr-1" /> Click to copy
        </div>
      )}
    </div>
  );
}
