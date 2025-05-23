import { colord, extend } from "colord";
import cmykPlugin from "colord/plugins/cmyk";
import namesPlugin from "colord/plugins/names";
import a11yPlugin from "colord/plugins/a11y";
import harmoniesPlugin from "colord/plugins/harmonies";
import mixPlugin from "colord/plugins/mix";
import { colorToName, nameToColor } from "./color-names";

// Extend colord with plugins
extend([cmykPlugin, namesPlugin, a11yPlugin, harmoniesPlugin, mixPlugin]);

// --- Color Regexes and Detection Utilities ---

export const COLOR_REGEXES = [
  {
    format: "hexa",
    regex: /#([0-9A-Fa-f]{4}|[0-9A-Fa-f]{8})(?![0-9A-Fa-f])/g,
  },
  {
    format: "hex",
    regex: /#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})(?![0-9A-Fa-f])/g,
  },
  {
    format: "rgba",
    regex:
      /rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)/gi,
  },
  {
    format: "rgb",
    regex: /rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)/gi,
  },
  {
    format: "hsla",
    regex:
      /hsla\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*,\s*(0|1|0?\.\d+)\s*\)/gi,
  },
  {
    format: "hsl",
    regex: /hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)/gi,
  },
  {
    format: "named",
    // Matches CSS identifiers (words), not numbers, not followed by '(' (to avoid functions)
    regex: /\b([a-zA-Z][a-zA-Z0-9-]*)\b(?!\s*\()/g,
  },
  {
    format: "hsl4",
    // Matches: 240 3.7% 15.9% / 0.7 or hsl(240 3.7% 15.9% / 0.7)
    regex:
      /(?:hsl[a]?\()?(\d{1,3})\s+(\d{1,3}(?:\.\d+)?)%\s+(\d{1,3}(?:\.\d+)?)%(?:\s*\/\s*(\d*\.?\d+))?\)?/gi,
  },
];

/**
 * Try to match a color string and return its format and match.
 */
export function matchColorString(
  str: string
): { format: string; match: string } | null {
  for (const { format, regex } of COLOR_REGEXES) {
    regex.lastIndex = 0; // Reset regex state for global regexes
    const match = regex.exec(str);
    if (match) {
      return { format, match: match[0] };
    }
  }
  return null;
}

// --- Color Conversion and Analysis Functions (unchanged) ---

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

export const getColorName = async (color: string): Promise<string | null> => {
  const colorName = colord(color).toName();
  if (colorName) return colorName;
  try {
    return await colorToName(color);
  } catch (error) {
    console.error("Error getting color name:", error);
    return null;
  }
};

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

export const calculateComplementary = (hexColor: string): string => {
  const complementaryColors = colord(hexColor).harmonies("complementary");
  return complementaryColors[1].toHex().toUpperCase();
};

export const calculateAnalogous = (
  hexColor: string,
  hsl?: { h: number; s: number; l: number }
): string[] => {
  const analogousColors = colord(hexColor).harmonies("analogous");
  return [
    analogousColors[1].toHex().toUpperCase(),
    analogousColors[2].toHex().toUpperCase(),
  ];
};

export const calculateTriadic = (hexColor: string): string[] => {
  const triadicColors = colord(hexColor).harmonies("triadic");
  return [
    triadicColors[1].toHex().toUpperCase(),
    triadicColors[2].toHex().toUpperCase(),
  ];
};

export const calculateTetradic = (hexColor: string): string[] => {
  const tetradicColors = colord(hexColor).harmonies("tetradic");
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

export function getColorAttributes(
  colorName: string,
  hsl: { h: number; s: number; l: number }
): string[] {
  for (const [baseColor, attributes] of Object.entries(COLOR_ATTRIBUTES)) {
    if (colorName.toLowerCase().includes(baseColor)) {
      return attributes;
    }
  }
  const { h, s, l } = hsl;
  if (s < 15) {
    if (l < 20) return COLOR_ATTRIBUTES.black;
    if (l > 80) return COLOR_ATTRIBUTES.white;
    return COLOR_ATTRIBUTES.gray;
  }
  if ((h >= 0 && h < 30) || (h >= 330 && h <= 360)) return COLOR_ATTRIBUTES.red;
  if (h >= 30 && h < 60) return COLOR_ATTRIBUTES.orange;
  if (h >= 60 && h < 90) return COLOR_ATTRIBUTES.yellow;
  if (h >= 90 && h < 150) return COLOR_ATTRIBUTES.green;
  if (h >= 150 && h < 210) return COLOR_ATTRIBUTES.cyan;
  if (h >= 210 && h < 270) return COLOR_ATTRIBUTES.blue;
  if (h >= 270 && h < 330) return COLOR_ATTRIBUTES.purple;
  return COLOR_ATTRIBUTES.gray;
}

export async function getColorNameAndAttributes(
  hexColor: string
): Promise<{ name: string; attributes: string[] }> {
  const name = await colorToName(hexColor);
  const c = colord(hexColor);
  const hsl = c.toHsl();
  const attributes = getColorAttributes(name, hsl);
  return { name, attributes };
}

// --- Color Blindness and Accessibility (unchanged) ---

export type ColorBlindnessSimulation = {
  protanopia: string;
  deuteranopia: string;
  tritanopia: string;
};

export function simulateColorBlindness(
  hexColor: string
): ColorBlindnessSimulation {
  const c = colord(hexColor);
  const rgb = c.toRgb();
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const protanopia = colord({
    r: Math.round((0.567 * r + 0.433 * g) * 255),
    g: Math.round((0.558 * r + 0.442 * g) * 255),
    b: Math.round((0.242 * g + 0.758 * b) * 255),
  });

  const deuteranopia = colord({
    r: Math.round((0.625 * r + 0.375 * g) * 255),
    g: Math.round((0.7 * r + 0.3 * g) * 255),
    b: Math.round((0.3 * g + 0.7 * b) * 255),
  });

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

export function checkColorBlindAccessibility(
  foreground: string,
  background: string
): { accessible: boolean; issues: string[] } {
  const issues: string[] = [];
  const fgBlind = simulateColorBlindness(foreground);
  const bgBlind = simulateColorBlindness(background);

  const protanopiaContrast = colord(fgBlind.protanopia).contrast(
    bgBlind.protanopia
  );
  const deuteranopiaContrast = colord(fgBlind.deuteranopia).contrast(
    bgBlind.deuteranopia
  );
  const tritanopiaContrast = colord(fgBlind.tritanopia).contrast(
    bgBlind.tritanopia
  );

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
  const hex = color.replace(/^#/, "");
  return /^([0-9A-Fa-f]{3}){1,2}$/.test(hex);
}

export function parseHsl4(
  str: string
): { h: number; s: number; l: number; a: number } | null {
  // Matches: 240 3.7% 15.9% / 0.7 or hsl(240 3.7% 15.9% / 0.7)
  const match =
    /(?:hsl[a]?\()?(\d{1,3})\s+(\d{1,3}(?:\.\d+)?)%\s+(\d{1,3}(?:\.\d+)?)%(?:\s*\/\s*(\d*\.?\d+))?\)?/.exec(
      str
    );
  if (!match) return null;
  return {
    h: Number(match[1]),
    s: Number(match[2]),
    l: Number(match[3]),
    a: match[4] !== undefined ? Number(match[4]) : 1,
  };
}

export function toHsl4String(
  h: number,
  s: number,
  l: number,
  a: number = 1
): string {
  return `${h} ${s}% ${l}%${a < 1 ? ` / ${a}` : ""}`;
}

// --- Types ---

export type ColorFormat =
  | "hex"
  | "hexa"
  | "rgb"
  | "rgba"
  | "hsl"
  | "hsla"
  | "named"
  | "unknown"
  | "hsl4";

export interface ParsedColorResult {
  input: string;
  format: ColorFormat;
  normalized: string; // normalized color string (hex by default)
  valid: boolean;
}

// --- Main Color Parser/Normalizer ---

/**
 * Systematic color parser and normalizer.
 * - Detects color format using shared regexes and matchColorString
 * - Resolves named colors using nameToColor
 * - Normalizes to hex (or other formats if needed)
 */
export async function parseAndNormalizeColor(
  input: string,
  normalizeTo: "hex" | "rgb" | "hsl" = "hex"
): Promise<ParsedColorResult> {
  const trimmed = input.trim();

  // Try regex-based detection first
  const match = matchColorString(trimmed);
  if (match) {
    // Special handling for hsl4 (space-separated HSL/alpha)
    if (match.format === "hsl4") {
      const hsl = parseHsl4(match.match);
      if (hsl) {
        // Use colord to convert to other formats
        const c = colord({ h: hsl.h, s: hsl.s, l: hsl.l, a: hsl.a });
        return {
          input,
          format: "hsl4",
          normalized:
            normalizeTo === "hex"
              ? c.toHex()
              : normalizeTo === "rgb"
                ? c.toRgbString()
                : toHsl4String(hsl.h, hsl.s, hsl.l, hsl.a),
          valid: c.isValid(),
        };
      }
    }

    // All other formats: let colord handle
    const c = colord(match.match);
    return {
      input,
      format: match.format as ColorFormat,
      normalized: c.isValid()
        ? normalizeTo === "hex"
          ? c.toHex()
          : normalizeTo === "rgb"
            ? c.toRgbString()
            : c.toHslString()
        : "",
      valid: c.isValid(),
    };
  }

  // Try named color
  const namedHex = nameToColor(trimmed);
  if (namedHex) {
    const c = colord(namedHex);
    return {
      input,
      format: "named",
      normalized: c.isValid()
        ? normalizeTo === "hex"
          ? c.toHex()
          : normalizeTo === "rgb"
            ? c.toRgbString()
            : c.toHslString()
        : "",
      valid: c.isValid(),
    };
  }

  // Try colord fallback (for any other valid CSS color)
  const c = colord(trimmed);
  if (c.isValid()) {
    return {
      input,
      format: "unknown",
      normalized:
        normalizeTo === "hex"
          ? c.toHex()
          : normalizeTo === "rgb"
            ? c.toRgbString()
            : c.toHslString(),
      valid: true,
    };
  }

  // Not a valid color
  return {
    input,
    format: "unknown",
    normalized: "",
    valid: false,
  };
}

/**
 * Returns a CSS color string with the given alpha (opacity).
 * Supports hex, rgb(a), hsl(a), and named colors.
 */
export function buildColorWithAlpha(input: string, alpha: number): string {
  const c = colord(input);
  if (!c.isValid()) return input;
  const { r, g, b } = c.toRgb();
  return `rgba(${r},${g},${b},${alpha})`;
}

export function getAlphaFromColorString(color: string): number {
  const c = colord(color);
  if (!c.isValid()) return 1;
  return c.alpha();
}
