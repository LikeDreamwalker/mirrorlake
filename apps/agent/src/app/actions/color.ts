"use server";

import {
  nameToColor as nameToColorM,
  colorToName as colorToNameM,
} from "@mirrorlake/color-tools";

/**
 * Convert a color code to the nearest color name
 * @param colorCode - Any valid CSS color format (hex, rgb, hsl, etc.)
 * @returns The name of the nearest color, or empty string if invalid
 */
export async function colorToName(colorCode: string): Promise<string> {
  return colorToNameM(colorCode);
}

/**
 * Convert a color name to its hex code
 * @param colorName - The name of the color
 * @returns The hex code of the color, or empty string if not found
 */
export async function nameToColor(colorName: string): Promise<string> {
  return nameToColorM(colorName);
}
