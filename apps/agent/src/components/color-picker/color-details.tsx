"use client";

import type React from "react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Copy, Plus, Trash2, Dices } from "lucide-react";
import { toast } from "sonner";
import { useColorPicker } from "./context";
import { DetailItem } from "./detail-item";
import { useColorStore } from "@/provider";
import { copyToClipboard as copyToClipboardOriginal } from "@/lib/utils";

export function ColorDetails() {
  const { hexValue, hexError, setHexValue, setHexError, colorName } =
    useColorPicker();

  const {
    currentColorInfo,
    currentColor,
    getFullColor,
    setColorFromHex,
    generateRandomColor,
    colors,
    removeColor,
    addColor,
  } = useColorStore((state) => ({
    currentColorInfo: state.currentColorInfo,
    currentColor: state.currentColor,
    getFullColor: state.getFullColor,
    setColorFromHex: state.setColorFromHex,
    generateRandomColor: state.generateRandomColor,
    colors: state.colors,
    removeColor: state.removeColor,
    addColor: state.addColor,
  }));

  // Memoize values from currentColorInfo to avoid unnecessary re-renders
  const color = useMemo(() => currentColorInfo.color, [currentColorInfo.color]);
  const rgb = useMemo(() => currentColorInfo.rgb, [currentColorInfo.rgb]);
  const hsl = useMemo(() => currentColorInfo.hsl, [currentColorInfo.hsl]);
  const alpha = useMemo(() => currentColorInfo.alpha, [currentColorInfo.alpha]);

  // Handle hex input change
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexValue(value);
    setHexError("");

    // Validate hex format
    if (value && !/^#?[0-9A-Fa-f]{0,8}$/.test(value)) {
      setHexError("Invalid hex format");
      return;
    }
  };

  // Handle hex input blur - apply the color when editing is complete
  const handleHexBlur = () => {
    // If the hex is empty, reset to current color
    if (!hexValue) {
      setHexValue(getFullColor());
      setHexError("");
      return;
    }

    // If the hex is invalid or incomplete, show error and reset
    if (!/^#?[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(hexValue)) {
      setHexError("Invalid hex color. Format: #RRGGBB or #RRGGBBAA");
      setHexValue(getFullColor());
      return;
    }

    // Format and apply the hex value
    const formattedValue = hexValue.startsWith("#") ? hexValue : `#${hexValue}`;
    setHexValue(formattedValue.toUpperCase());
    setColorFromHex(formattedValue);
  };

  // Add a key handler to apply the color on Enter key
  const handleHexKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleHexBlur();
    }
  };

  // Copy color to clipboard
  const copyToClipboard = async (value: string) => {
    const res = await copyToClipboardOriginal(value);
    if (res) {
      toast("Copied!", {
        description: `${value} has been copied to clipboard`,
        duration: 2000,
      });
    } else {
      toast.error("Failed to copy", {
        description: "Please try again",
      });
    }
  };

  // Helper to render error message
  const renderErrorMessage = (error: string) => {
    if (!error) return null;
    return (
      <div className="text-destructive text-xs flex items-center mt-1">
        <AlertCircle className="h-3 w-3 mr-1" />
        {error}
      </div>
    );
  };

  // Find if this color exists in the current theme (memoized)
  const currentColorInTheme = useMemo(
    () => colors.find((c) => c.color.toLowerCase() === color.toLowerCase()),
    [colors, color]
  );

  // Handle removing the current color from the theme
  const handleRemoveCurrentColor = () => {
    if (currentColorInTheme) {
      removeColor(currentColorInTheme.id);
      toast("Color removed", {
        description: `${color} has been removed from your theme`,
        duration: 2000,
      });
    }
  };

  // Add current color to theme
  const handleAddToTheme = () => {
    // Only add if it doesn't already exist in the theme
    if (!currentColorInTheme) {
      addColor(color, colorName);
      toast("Color added", {
        description: `${color} has been added to your theme`,
        duration: 2000,
      });
    }
  };

  return (
    <>
      <div className="flex items-center">
        <div
          className="w-12 h-12 rounded-md mr-3"
          style={{ backgroundColor: currentColor }}
        ></div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">{colorName}</h3>
            <div className="flex gap-2">
              {currentColorInTheme ? (
                <Button
                  variant="outline"
                  onClick={handleRemoveCurrentColor}
                  aria-label="Remove color from theme"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove from Theme
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleAddToTheme}
                  aria-label="Add color to theme"
                >
                  <Plus className="h-4 w-4" />
                  Add to Theme
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={generateRandomColor}
                aria-label="Generate random color"
              >
                <Dices className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-4">
        {/* HEX Input */}
        <div>
          <Label htmlFor="hex-input" className="text-sm font-medium mb-1 block">
            HEX Value
          </Label>
          <div className="flex gap-2">
            <Input
              id="hex-input"
              value={hexValue}
              onChange={handleHexChange}
              onBlur={handleHexBlur}
              onKeyDown={handleHexKeyDown}
              className={`font-mono uppercase flex-1 ${
                hexError ? "border-destructive" : ""
              }`}
              maxLength={9}
              aria-label="Hex color value"
              aria-invalid={!!hexError}
              aria-describedby={hexError ? "hex-error" : undefined}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(hexValue)}
              aria-label="Copy hex value"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {renderErrorMessage(hexError)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Color format values for copying */}
        <DetailItem
          label="HEX"
          value={color}
          onClick={() => copyToClipboard(color)}
        />
        <DetailItem
          label="RGB"
          value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}
          onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}
        />
        <DetailItem
          label="HSL"
          value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}
          onClick={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}
        />
        <DetailItem
          label="RGBA"
          value={`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(2)})`}
          onClick={() =>
            copyToClipboard(
              `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(2)})`
            )
          }
        />
      </div>
    </>
  );
}
