import { generateBalancedPalette } from "@mirrorlake/color-tools";
import type { AdvancedColorData } from "./types";

/**
 * Generate advanced color data using the balanced palette algorithm.
 */
export function getAdvancedColorData(hexColor: string): AdvancedColorData {
  try {
    const palette = generateBalancedPalette(hexColor, 5);
    return { palette };
  } catch (error) {
    console.error("Error generating advanced color data:", error);
    return { palette: [] };
  }
}
