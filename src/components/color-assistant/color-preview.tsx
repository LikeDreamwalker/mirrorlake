"use client";

import { useStore } from "@/store";
import { toast } from "sonner";

interface ColorPreviewProps {
  colorCode: string;
}

export function ColorPreview({ colorCode }: ColorPreviewProps) {
  const { setColorFromHex } = useStore();

  // Normalize the color code
  const normalizedColor = colorCode.trim();

  // Convert rgb/rgba/hsl/hsla to hex if needed
  const getHexColor = (color: string): string => {
    // If it's already a hex color, just return it
    if (color.startsWith("#")) {
      return color;
    }

    // Create a temporary element to use the browser's color parsing
    const tempEl = document.createElement("div");
    tempEl.style.color = color;
    document.body.appendChild(tempEl);

    // Get the computed color value
    const computedColor = window.getComputedStyle(tempEl).color;

    // Remove the element
    document.body.removeChild(tempEl);

    // If the computed color is in rgb format, convert it to hex
    if (computedColor.startsWith("rgb")) {
      // Extract the rgb values
      const rgbMatch = computedColor.match(/rgb$$(\d+),\s*(\d+),\s*(\d+)$$/);
      if (rgbMatch) {
        const [_, r, g, b] = rgbMatch.map(Number);
        // Convert to hex
        return `#${r.toString(16).padStart(2, "0")}${g
          .toString(16)
          .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
      }
    }

    // If we couldn't convert it, just return the original
    return color;
  };

  const handleClick = () => {
    try {
      // Try to convert to hex if it's not already
      const hexColor = getHexColor(normalizedColor);

      // Set the color in the store
      setColorFromHex(hexColor);

      // Show confirmation toast
      toast("Color selected", {
        description: `${hexColor} is now the active color`,
      });
    } catch (error) {
      console.error("Error selecting color:", error);

      // Fallback to clipboard copy if selection fails
      navigator.clipboard.writeText(normalizedColor);
      toast("Color copied", {
        description: `${normalizedColor} has been copied to clipboard`,
      });
    }
  };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-background/90 cursor-pointer hover:bg-background transition-colors"
      onClick={handleClick}
    >
      <span
        className="inline-block w-4 h-4 rounded-md border border-border shadow-sm"
        style={{ backgroundColor: normalizedColor }}
      />
      <code className="font-mono">{normalizedColor}</code>
    </span>
  );
}
