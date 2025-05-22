import { colord, extend } from "colord";
import cmykPlugin from "colord/plugins/cmyk";
import namesPlugin from "colord/plugins/names";
import a11yPlugin from "colord/plugins/a11y";
import harmoniesPlugin from "colord/plugins/harmonies";
import mixPlugin from "colord/plugins/mix";
import { colorToName } from "@/app/actions/color";

// Extend colord with plugins
extend([cmykPlugin, namesPlugin, a11yPlugin, harmoniesPlugin, mixPlugin]);

// Basic color conversion functions
export const hexToRgb = (hex: string) => {
  const rgb = colord(hex).toRgb();
  return {
    r: rgb.r,
    g: rgb.g,
    b: rgb.b,
    a: colord(hex).alpha(),
  };
};

export const rgbToHsl = (r: number, g: number, b: number) => {
  const hsl = colord({ r, g, b }).toHsl();
  return { h: hsl.h, s: hsl.s, l: hsl.l };
};

export const hslToRgb = (h: number, s: number, l: number) => {
  const rgb = colord({ h, s, l }).toRgb();
  return { r: rgb.r, g: rgb.g, b: rgb.b };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return colord({ r, g, b }).toHex().toUpperCase();
};

export const hslToHex = (h: number, s: number, l: number): string => {
  return colord({ h, s, l }).toHex().toUpperCase();
};

export const hexToHsl = (hex: string) => {
  const hsl = colord(hex).toHsl();
  return hsl;
};

export const alphaToHex = (alpha: number): string => {
  return Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
};

// Color analysis functions
export const isColorDark = (hex: string): boolean => {
  return colord(hex).isDark();
};

export const calculateLuminance = (r: number, g: number, b: number): number => {
  return colord({ r, g, b }).luminance();
};

export const getContrastColor = (hex: string): string => {
  return colord(hex).isDark() ? "#FFFFFF" : "#000000";
};

export const getContrastRatio = (
  foreground: string,
  background: string
): number => {
  return colord(foreground).contrast(colord(background));
};

export const getReadableTextColor = (backgroundColor: string): string => {
  return colord(backgroundColor).isDark() ? "#FFFFFF" : "#000000";
};

// Color name functions
export const getColorName = async (color: string): Promise<string | null> => {
  // First try the colord built-in name function
  const colorName = colord(color).toName();
  if (colorName) return colorName;

  // If that fails, use our server action
  try {
    return await colorToName(color);
  } catch (error) {
    console.error("Error getting color name:", error);
    return null;
  }
};

// Color manipulation functions
export const mixColors = (
  color1: string,
  color2: string,
  ratio = 0.5
): string => {
  return colord(color1).mix(color2, ratio).toHex().toUpperCase();
};

export const adjustColorBrightness = (
  color: string,
  amount: number
): string => {
  return amount > 0
    ? colord(color).lighten(amount).toHex().toUpperCase()
    : colord(color).darken(Math.abs(amount)).toHex().toUpperCase();
};

export const saturateColor = (color: string, amount: number): string => {
  return amount > 0
    ? colord(color).saturate(amount).toHex().toUpperCase()
    : colord(color).desaturate(Math.abs(amount)).toHex().toUpperCase();
};

export const rotateHue = (color: string, degrees: number): string => {
  return colord(color).rotate(degrees).toHex().toUpperCase();
};

// Color palette generation
export const getColorTints = (color: string, count = 5): string[] => {
  const tints: string[] = [];
  const c = colord(color);

  for (let i = 1; i <= count; i++) {
    const amount = i / (count + 1);
    tints.push(c.mix("white", amount).toHex().toUpperCase());
  }

  return tints;
};

export const getColorShades = (color: string, count = 5): string[] => {
  const shades: string[] = [];
  const c = colord(color);

  for (let i = 1; i <= count; i++) {
    const amount = i / (count + 1);
    shades.push(c.mix("black", amount).toHex().toUpperCase());
  }

  return shades;
};

// Color harmony functions
export const calculateComplementary = (hexColor: string): string => {
  const complementaryColors = colord(hexColor).harmonies("complementary");
  return complementaryColors[1].toHex().toUpperCase();
};

export const calculateAnalogous = (
  hexColor: string,
  hsl?: { h: number; s: number; l: number }
): string[] => {
  const analogousColors = colord(hexColor).harmonies("analogous");
  // Return the two analogous colors (excluding the base color)
  return [
    analogousColors[1].toHex().toUpperCase(),
    analogousColors[2].toHex().toUpperCase(),
  ];
};

export const calculateTriadic = (hexColor: string): string[] => {
  const triadicColors = colord(hexColor).harmonies("triadic");
  // Return the two triadic colors (excluding the base color)
  return [
    triadicColors[1].toHex().toUpperCase(),
    triadicColors[2].toHex().toUpperCase(),
  ];
};

export const calculateTetradic = (hexColor: string): string[] => {
  const tetradicColors = colord(hexColor).harmonies("tetradic");
  // Return the three tetradic colors (excluding the base color)
  return [
    tetradicColors[1].toHex().toUpperCase(),
    tetradicColors[2].toHex().toUpperCase(),
    tetradicColors[3].toHex().toUpperCase(),
  ];
};

export const getColorPalette = (
  color: string,
  type: "analogous" | "complementary" | "triadic" | "tetradic"
) => {
  return colord(color)
    .harmonies(type)
    .map((c) => c.toHex().toUpperCase());
};

// Color attributes by hue range
export const COLOR_ATTRIBUTES: Record<string, string[]> = {
  red: ["energetic", "passionate", "attention-grabbing", "bold", "exciting"],
  orange: ["warm", "energetic", "friendly", "playful", "inviting"],
  yellow: ["cheerful", "optimistic", "stimulating", "bright", "sunny"],
  green: ["natural", "fresh", "growth-oriented", "calming", "balanced"],
  cyan: ["calm", "refreshing", "technological", "clean", "modern"],
  blue: ["trustworthy", "calm", "professional", "reliable", "peaceful"],
  purple: ["creative", "luxurious", "mysterious", "royal", "imaginative"],
  magenta: ["innovative", "energetic", "emotional", "romantic", "bold"],
  pink: ["playful", "feminine", "delicate", "romantic", "youthful"],
  brown: ["earthy", "warm", "natural", "reliable", "comforting"],
  gray: ["neutral", "balanced", "conservative", "timeless", "versatile"],
  black: ["elegant", "sophisticated", "formal", "mysterious", "dramatic"],
  white: ["clean", "pure", "minimalist", "airy", "spacious"],
};

/**
 * Helper function to get attributes based on color properties
 */
export function getColorAttributes(
  colorName: string,
  hsl: { h: number; s: number; l: number }
): string[] {
  // Try to find attributes based on color name
  for (const [baseColor, attributes] of Object.entries(COLOR_ATTRIBUTES)) {
    if (colorName.toLowerCase().includes(baseColor)) {
      return attributes;
    }
  }

  // If no match by name, determine by hue
  const { h, s, l } = hsl;

  // For grayscale colors
  if (s < 15) {
    if (l < 20) return COLOR_ATTRIBUTES.black;
    if (l > 80) return COLOR_ATTRIBUTES.white;
    return COLOR_ATTRIBUTES.gray;
  }

  // For colors with saturation, determine by hue
  if ((h >= 0 && h < 30) || (h >= 330 && h <= 360)) return COLOR_ATTRIBUTES.red;
  if (h >= 30 && h < 60) return COLOR_ATTRIBUTES.orange;
  if (h >= 60 && h < 90) return COLOR_ATTRIBUTES.yellow;
  if (h >= 90 && h < 150) return COLOR_ATTRIBUTES.green;
  if (h >= 150 && h < 210) return COLOR_ATTRIBUTES.cyan;
  if (h >= 210 && h < 270) return COLOR_ATTRIBUTES.blue;
  if (h >= 270 && h < 330) return COLOR_ATTRIBUTES.purple;

  // Default
  return COLOR_ATTRIBUTES.gray;
}

/**
 * Gets color name and attributes using the existing colorToName function
 */
export async function getColorNameAndAttributes(
  hexColor: string
): Promise<{ name: string; attributes: string[] }> {
  // Get the color name using the existing function
  const name = await colorToName(hexColor);

  // Get color attributes based on the name and HSL values
  const c = colord(hexColor);
  const hsl = c.toHsl();
  const attributes = getColorAttributes(name, hsl);

  return { name, attributes };
}

// Color blindness simulation
export type ColorBlindnessSimulation = {
  protanopia: string;
  deuteranopia: string;
  tritanopia: string;
};

/**
 * Helper function to simulate color blindness
 */
export function simulateColorBlindness(
  hexColor: string
): ColorBlindnessSimulation {
  const c = colord(hexColor);
  const rgb = c.toRgb();
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  // Simplified simulation matrices
  // Protanopia (red-blind)
  const protanopia = colord({
    r: Math.round((0.567 * r + 0.433 * g) * 255),
    g: Math.round((0.558 * r + 0.442 * g) * 255),
    b: Math.round((0.242 * g + 0.758 * b) * 255),
  });

  // Deuteranopia (green-blind)
  const deuteranopia = colord({
    r: Math.round((0.625 * r + 0.375 * g) * 255),
    g: Math.round((0.7 * r + 0.3 * g) * 255),
    b: Math.round((0.3 * g + 0.7 * b) * 255),
  });

  // Tritanopia (blue-blind)
  const tritanopia = colord({
    r: Math.round((0.95 * r + 0.05 * g) * 255),
    g: Math.round((0.433 * g + 0.567 * b) * 255),
    b: Math.round((0.475 * g + 0.525 * b) * 255),
  });

  return {
    protanopia: protanopia.toHex().toUpperCase(),
    deuteranopia: deuteranopia.toHex().toUpperCase(),
    tritanopia: tritanopia.toHex().toUpperCase(),
  };
}

/**
 * Check if a color is accessible for color blind users
 */
export function checkColorBlindAccessibility(
  foreground: string,
  background: string
): { accessible: boolean; issues: string[] } {
  const issues: string[] = [];

  // Simulate color blindness for both foreground and background
  const fgBlind = simulateColorBlindness(foreground);
  const bgBlind = simulateColorBlindness(background);

  // Check contrast ratios for each type of color blindness
  const protanopiaContrast = colord(fgBlind.protanopia).contrast(
    bgBlind.protanopia
  );
  const deuteranopiaContrast = colord(fgBlind.deuteranopia).contrast(
    bgBlind.deuteranopia
  );
  const tritanopiaContrast = colord(fgBlind.tritanopia).contrast(
    bgBlind.tritanopia
  );

  // WCAG requires a contrast ratio of at least 4.5:1 for normal text
  const minContrast = 4.5;

  if (protanopiaContrast < minContrast) {
    issues.push("Low contrast for red-blind (protanopia) users");
  }

  if (deuteranopiaContrast < minContrast) {
    issues.push("Low contrast for green-blind (deuteranopia) users");
  }

  if (tritanopiaContrast < minContrast) {
    issues.push("Low contrast for blue-blind (tritanopia) users");
  }

  return {
    accessible: issues.length === 0,
    issues,
  };
}

export function isValidHexColor(color: string): boolean {
  // Remove the hash if it exists
  const hex = color.replace(/^#/, "");

  // Check if it's a valid hex color (3 or 6 characters)
  return /^([0-9A-Fa-f]{3}){1,2}$/.test(hex);
}
