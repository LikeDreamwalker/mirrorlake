import { useStore } from "@/store";
import { generateColorName } from "@/store";

// Create a store instance that can be used outside of React components
// This is needed because we can't use hooks in server-side code
let storeInstance: ReturnType<typeof useStore.getState> | null = null;

// Function to safely get the store state
const getStore = () => {
  // If we're in a browser environment, we can use the store directly
  if (typeof window !== "undefined") {
    return useStore.getState();
  }

  // If we already have a store instance, use it
  if (storeInstance) {
    return storeInstance;
  }

  // Otherwise, create a new instance
  try {
    storeInstance = useStore.getState();
    return storeInstance;
  } catch (error) {
    console.error("Error accessing store state:", error);
    // Return a minimal mock implementation to prevent crashes
    return {
      baseColor: "#0066FF",
      colors: [],
      addColor: (color: string, name: string) => {
        console.warn("Mock addColor called - store not properly initialized");
      },
      removeColor: (id: string) => {
        console.warn(
          "Mock removeColor called - store not properly initialized"
        );
      },
      toggleFavorite: (id: string) => {
        console.warn(
          "Mock toggleFavorite called - store not properly initialized"
        );
      },
    };
  }
};

// Tool implementations
export function handleAddColorsToTheme(params: {
  themeName: string;
  colors: Array<{ color: string; name: string }>;
}) {
  const store = getStore();

  console.log("Adding colors to theme:", params.themeName, params.colors);

  // Add each color to the store
  params.colors.forEach((colorItem) => {
    store.addColor(colorItem.color, colorItem.name);
  });

  return {
    success: true,
    message: `Added ${params.colors.length} colors with theme "${params.themeName}"`,
    colors: params.colors,
  };
}

export function handleUpdateTheme(params: {
  themeName: string;
  colors: Array<{ color: string; name: string }>;
}) {
  const store = getStore();

  console.log("Updating theme:", params.themeName, params.colors);

  // Add each color to the store, replacing any existing colors with the same name
  params.colors.forEach((colorItem) => {
    // Check if a color with this name already exists
    const existingColors = store.colors.filter(
      (c) => c.name === colorItem.name
    );

    // Remove existing colors with the same name
    existingColors.forEach((color) => {
      store.removeColor(color.id);
    });

    // Add the new color
    store.addColor(colorItem.color, colorItem.name);
  });

  return {
    success: true,
    message: `Updated theme "${params.themeName}" with ${params.colors.length} colors`,
    colors: params.colors,
  };
}

export function handleResetTheme() {
  const store = getStore();

  console.log("Resetting theme");

  // Get all color IDs
  const colorIds = store.colors.map((color) => color.id);

  // Remove all colors
  colorIds.forEach((id) => {
    store.removeColor(id);
  });

  return {
    success: true,
    message: "Theme has been reset. All colors have been removed.",
  };
}

export function handleRemoveColorsFromTheme(params: { colorNames: string[] }) {
  const store = getStore();

  console.log("Removing colors from theme:", params.colorNames);

  let removedCount = 0;

  // Remove colors by name
  params.colorNames.forEach((name) => {
    const colorsToRemove = store.colors.filter(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );

    colorsToRemove.forEach((color) => {
      store.removeColor(color.id);
      removedCount++;
    });
  });

  return {
    success: true,
    message: `Removed ${removedCount} colors from the theme`,
    removedColors: params.colorNames,
  };
}

export function handleMarkColorAsFavorite(params: { colorName: string }) {
  const store = getStore();

  console.log("Marking color as favorite:", params.colorName);

  // Find the color by name
  const color = store.colors.find(
    (c) => c.name.toLowerCase() === params.colorName.toLowerCase()
  );

  if (color) {
    store.toggleFavorite(color.id);
    return {
      success: true,
      message: `Marked "${params.colorName}" as favorite`,
      color: color.color,
    };
  }

  return {
    success: false,
    message: `Color "${params.colorName}" not found in the theme`,
  };
}

export function handleGetCurrentColors() {
  const store = getStore();

  console.log("Getting current colors");

  return {
    currentColor: store.baseColor,
    savedColors: store.colors.map((color) => ({
      id: color.id,
      name: color.name,
      color: color.color,
      favorite: color.favorite || false,
    })),
  };
}

export function handleGetColorInfo(params: { color: string }) {
  const { color } = params;

  console.log("Getting color info for:", color);

  // Use the imported utility functions directly
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Calculate luminance using the imported function
  const luminance = calculateLuminance(rgb.r, rgb.g, rgb.b);

  // Get contrast color using the imported function
  const contrastColor = getContrastColor(color);

  // Generate a color name based on HSL values
  const colorName = generateColorName(hsl.h, hsl.s, hsl.l);

  return {
    formats: {
      hex: color,
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(
        hsl.l
      )}%)`,
    },
    properties: {
      name: colorName,
      isLight: luminance > 0.5,
      luminance: luminance.toFixed(2),
      contrastColor: contrastColor,
    },
    harmony: {
      complementary: calculateComplementary(color),
      analogous: calculateAnalogous(color, hsl),
    },
  };
}

export function handleGenerateColorPalette(params: {
  baseColor: string;
  paletteType:
    | "analogous"
    | "complementary"
    | "triadic"
    | "tetradic"
    | "monochromatic";
  count?: number;
}) {
  const { baseColor, paletteType, count = 5 } = params;

  console.log(`Generating ${paletteType} palette based on ${baseColor}`);

  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  let palette: Array<{ color: string; name: string }> = [];

  switch (paletteType) {
    case "analogous": {
      // Generate analogous colors (adjacent on the color wheel)
      const colors = [];
      for (let i = -2; i <= 2; i++) {
        if (i === 0) continue; // Skip the base color
        const newHue = (hsl.h + i * 30 + 360) % 360;
        const newRgb = hslToRgb(newHue, hsl.s, hsl.l);
        const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        const name = generateColorName(newHue, hsl.s, hsl.l);
        colors.push({ color: newHex, name });
      }
      palette = colors;
      break;
    }
    case "complementary": {
      // Generate complementary color (opposite on the color wheel)
      const complementaryHue = (hsl.h + 180) % 360;
      const complementaryRgb = hslToRgb(complementaryHue, hsl.s, hsl.l);
      const complementaryHex = rgbToHex(
        complementaryRgb.r,
        complementaryRgb.g,
        complementaryRgb.b
      );
      const name = generateColorName(complementaryHue, hsl.s, hsl.l);
      palette = [{ color: complementaryHex, name }];
      break;
    }
    case "triadic": {
      // Generate triadic colors (evenly spaced around the color wheel)
      const colors = [];
      for (let i = 1; i <= 2; i++) {
        const newHue = (hsl.h + i * 120) % 360;
        const newRgb = hslToRgb(newHue, hsl.s, hsl.l);
        const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        const name = generateColorName(newHue, hsl.s, hsl.l);
        colors.push({ color: newHex, name });
      }
      palette = colors;
      break;
    }
    case "tetradic": {
      // Generate tetradic colors (rectangle on the color wheel)
      const colors = [];
      for (let i = 1; i <= 3; i++) {
        const newHue = (hsl.h + i * 90) % 360;
        const newRgb = hslToRgb(newHue, hsl.s, hsl.l);
        const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        const name = generateColorName(newHue, hsl.s, hsl.l);
        colors.push({ color: newHex, name });
      }
      palette = colors;
      break;
    }
    case "monochromatic": {
      // Generate monochromatic colors (same hue, different lightness/saturation)
      const colors = [];
      // Vary lightness
      for (let i = 1; i <= Math.min(count, 4); i++) {
        const newLightness = Math.max(
          10,
          Math.min(90, hsl.l + (i % 2 === 0 ? i * 10 : -i * 10))
        );
        const newRgb = hslToRgb(hsl.h, hsl.s, newLightness);
        const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        const name = generateColorName(hsl.h, hsl.s, newLightness);
        colors.push({ color: newHex, name });
      }
      palette = colors;
      break;
    }
  }

  // Add the base color to the palette
  const baseName = generateColorName(hsl.h, hsl.s, hsl.l);
  palette.unshift({ color: baseColor, name: baseName });

  // Limit to requested count
  palette = palette.slice(0, count);

  return {
    success: true,
    baseColor,
    paletteType,
    palette,
  };
}

// Helper functions for color harmony
export function calculateComplementary(hexColor: string): string {
  const rgb = hexToRgb(hexColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Complementary color is 180 degrees away on the color wheel
  const complementaryHue = (hsl.h + 180) % 360;

  // Convert back to RGB and then to hex
  const complementaryRgb = hslToRgb(complementaryHue, hsl.s, hsl.l);
  return rgbToHex(complementaryRgb.r, complementaryRgb.g, complementaryRgb.b);
}

export function calculateAnalogous(
  hexColor: string,
  hsl: { h: number; s: number; l: number }
): string[] {
  // Analogous colors are 30 degrees away on either side
  const hue1 = (hsl.h + 30) % 360;
  const hue2 = (hsl.h + 330) % 360; // equivalent to (hsl.h - 30 + 360) % 360

  // Convert to RGB and then to hex
  const rgb1 = hslToRgb(hue1, hsl.s, hsl.l);
  const rgb2 = hslToRgb(hue2, hsl.s, hsl.l);

  return [rgbToHex(rgb1.r, rgb1.g, rgb1.b), rgbToHex(rgb2.r, rgb2.g, rgb2.b)];
}

export const colorToolRegistry = {
  addColorsToTheme: handleAddColorsToTheme,
  updateTheme: handleUpdateTheme,
  resetTheme: handleResetTheme,
  removeColorsFromTheme: handleRemoveColorsFromTheme,
  markColorAsFavorite: handleMarkColorAsFavorite,
  getCurrentColors: handleGetCurrentColors,
  getColorInfo: handleGetColorInfo,
  generateColorPalette: handleGenerateColorPalette,
};

// Color utility functions
export const hslToRgb = (
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } => {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return (
    "#" +
    [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")
  );
};

export const hslToHex = (h: number, s: number, l: number): string => {
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
};

export const alphaToHex = (alpha: number): string => {
  return Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
};

export const hexToRgb = (
  hex: string
): { r: number; g: number; b: number; a?: number } => {
  // Remove the # if present
  hex = hex.replace(/^#/, "");

  // Ensure we have at least 6 characters for a valid hex color
  if (!/^[0-9A-Fa-f]{6,8}$/.test(hex)) {
    return { r: 0, g: 0, b: 0 }; // Return black for invalid hex
  }

  // Parse the hex values
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);

  // Check if we have an alpha channel
  let a: number | undefined = undefined;
  if (hex.length >= 8) {
    a = Number.parseInt(hex.slice(6, 8), 16) / 255;
  }

  return { r, g, b, a };
};

export const rgbToHsl = (
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

export const hexToHsl = (
  hex: string
): { h: number; s: number; l: number; a?: number } => {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return { ...hsl, a: rgb.a };
};

// Calculate luminance for WCAG contrast
export const calculateLuminance = (r: number, g: number, b: number): number => {
  // Convert RGB to linear values
  const rsrgb = r / 255;
  const gsrgb = g / 255;
  const bsrgb = b / 255;

  // Convert to linear RGB
  const rlinear =
    rsrgb <= 0.03928 ? rsrgb / 12.92 : Math.pow((rsrgb + 0.055) / 1.055, 2.4);
  const glinear =
    gsrgb <= 0.03928 ? gsrgb / 12.92 : Math.pow((gsrgb + 0.055) / 1.055, 2.4);
  const blinear =
    bsrgb <= 0.03928 ? bsrgb / 12.92 : Math.pow((bsrgb + 0.055) / 1.055, 2.4);

  // Calculate luminance
  return 0.2126 * rlinear + 0.7152 * glinear + 0.0722 * blinear;
};

export const getContrastColor = (hex: string): string => {
  const rgb = hexToRgb(hex);
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
};

// Determine if a color is dark (for theme switching)
export const isColorDark = (hex: string): boolean => {
  const rgb = hexToRgb(hex);
  const luminance = calculateLuminance(rgb.r, rgb.g, rgb.b);
  // Using 0.5 as threshold - colors with luminance < 0.5 are considered dark
  return luminance < 0.5;
};
