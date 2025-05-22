// @ts-ignore - Ignore TypeScript errors for color-name-list
import { colornames } from "color-name-list";
import { colord, extend, type RgbColor } from "colord";
import namesPlugin from "colord/plugins/names";

// Extend colord with the names plugin
extend([namesPlugin]);

// Type for our color database
interface ColorEntry {
  name: string;
  hex: string;
  rgb: RgbColor;
}

// Create our color database with pre-calculated RGB values from color-name-list
// We're using the @ts-ignore above to handle the missing type declarations
const colorDatabase: ColorEntry[] = colornames.map((color: any) => {
  const colorObj = colord(color.hex);
  return {
    name: color.name,
    hex: color.hex,
    rgb: colorObj.toRgb(),
  };
});

/**
 * Calculate the Euclidean distance between two RGB colors
 */
function calculateColorDistance(color1: RgbColor, color2: RgbColor): number {
  return Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
      Math.pow(color1.g - color2.g, 2) +
      Math.pow(color1.b - color2.b, 2)
  );
}

/**
 * Find the nearest color name for a given color
 */
function findNearestColor(targetRgb: RgbColor): ColorEntry {
  let nearestColor = colorDatabase[0];
  let minDistance = calculateColorDistance(targetRgb, nearestColor.rgb);

  for (let i = 1; i < colorDatabase.length; i++) {
    const distance = calculateColorDistance(targetRgb, colorDatabase[i].rgb);
    if (distance < minDistance) {
      minDistance = distance;
      nearestColor = colorDatabase[i];
    }
  }

  return nearestColor;
}

/**
 * Convert a color code to the nearest color name
 * @param colorCode - Any valid CSS color format (hex, rgb, hsl, etc.)
 * @returns The name of the nearest color, or empty string if invalid
 */
export function colorToName(colorCode: string): string {
  try {
    // Validate the color code using colord
    const color = colord(colorCode);
    if (!color.isValid()) {
      return "";
    }

    // Get the RGB values
    const rgb = color.toRgb();

    // Find the nearest color
    const nearest = findNearestColor(rgb);

    return nearest.name;
  } catch (error) {
    console.error("Error in colorToName:", error);
    return "";
  }
}

/**
 * Convert a color name to its hex code
 * @param colorName - The name of the color
 * @returns The hex code of the color, or empty string if not found
 */
export function nameToColor(colorName: string): string {
  try {
    // Try to find an exact match (case insensitive)
    const exactMatch = colorDatabase.find(
      (color) => color.name.toLowerCase() === colorName.toLowerCase()
    );

    if (exactMatch) {
      return exactMatch.hex;
    }

    // If no exact match, try to find a partial match
    const partialMatches = colorDatabase.filter((color) =>
      color.name.toLowerCase().includes(colorName.toLowerCase())
    );

    if (partialMatches.length > 0) {
      return partialMatches[0].hex;
    }

    // If no match found, return empty string
    return "";
  } catch (error) {
    console.error("Error in nameToColor:", error);
    return "";
  }
}
