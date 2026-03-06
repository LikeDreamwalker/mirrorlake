"use client";

import type React from "react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Copy, Plus, Trash2, Dices } from "lucide-react";
import { toast } from "sonner";
import { useColorStore } from "@/provider";
import { copyToClipboard as copyToClipboardOriginal } from "@/lib/utils";

export function ColorDetails() {
  const {
    hexValue,
    hexError,
    setHexValue,
    setHexError,
    colorName,
    currentColor,
    getFullColor,
    setColorFromHex,
    generateRandomColor,
    colors,
    removeColor,
    addColor,
  } = useColorStore((state) => ({
    hexValue: state.pickerHexInput,
    hexError: state.pickerHexError,
    setHexValue: state.setPickerHexInput,
    setHexError: state.setPickerHexError,
    colorName: state.currentColorInfo.name,
    currentColor: state.currentColor,
    getFullColor: state.getFullColor,
    setColorFromHex: state.setColorFromHex,
    generateRandomColor: state.generateRandomColor,
    colors: state.colors,
    removeColor: state.removeColor,
    addColor: state.addColor,
  }));

  const color = useMemo(() => currentColor, [currentColor]);

  const currentColorInTheme = useMemo(
    () => colors.find((c) => c.color.toLowerCase() === color.toLowerCase()),
    [colors, color]
  );

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexValue(value);
    setHexError("");
    if (value && !/^#?[0-9A-Fa-f]{0,8}$/.test(value)) {
      setHexError("Invalid hex format");
    }
  };

  const handleHexBlur = () => {
    if (!hexValue) {
      setHexValue(getFullColor());
      setHexError("");
      return;
    }
    if (!/^#?[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(hexValue)) {
      setHexError("Invalid hex color");
      setHexValue(getFullColor());
      return;
    }
    const formattedValue = hexValue.startsWith("#") ? hexValue : `#${hexValue}`;
    setHexValue(formattedValue.toUpperCase());
    setColorFromHex(formattedValue);
  };

  const handleHexKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleHexBlur();
    }
  };

  const copyToClipboard = async (value: string) => {
    const res = await copyToClipboardOriginal(value);
    if (res) {
      toast("Copied!", { description: value, duration: 2000 });
    }
  };

  const handleRemoveCurrentColor = () => {
    if (currentColorInTheme) {
      removeColor(currentColorInTheme.id);
      toast("Color removed", { description: `${color} removed from theme`, duration: 2000 });
    }
  };

  const handleAddToTheme = () => {
    if (!currentColorInTheme) {
      addColor(color, colorName);
      toast("Color added", { description: `${color} added to theme`, duration: 2000 });
    }
  };

  return (
    <div className="space-y-3">
      {/* Color name + swatch */}
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-lg border border-border shrink-0"
          style={{ backgroundColor: currentColor }}
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{colorName}</div>
        </div>
      </div>

      {/* HEX input + copy */}
      <div className="flex gap-2">
        <Input
          value={hexValue}
          onChange={handleHexChange}
          onBlur={handleHexBlur}
          onKeyDown={handleHexKeyDown}
          className={`font-mono uppercase flex-1 text-xs h-8 ${hexError ? "border-destructive" : ""}`}
          maxLength={9}
          aria-label="Hex color value"
        />
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(hexValue)} aria-label="Copy hex">
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
      {hexError && (
        <div className="text-destructive text-xs flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          {hexError}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {currentColorInTheme ? (
          <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={handleRemoveCurrentColor}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Remove
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={handleAddToTheme}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add to Theme
          </Button>
        )}
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={generateRandomColor} aria-label="Random color">
          <Dices className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
