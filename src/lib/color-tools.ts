import { useStore } from "@/store";
import {
  hexToRgb,
  rgbToHsl,
  calculateLuminance,
  getContrastColor,
  generateColorName,
} from "@/store";

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

// Helper functions for color harmony
function calculateComplementary(hexColor: string): string {
  const rgb = hexToRgb(hexColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Complementary color is 180 degrees away on the color wheel
  const complementaryHue = (hsl.h + 180) % 360;

  // Convert back to RGB and then to hex
  const complementaryRgb = hslToRgb(complementaryHue, hsl.s, hsl.l);
  return rgbToHex(complementaryRgb.r, complementaryRgb.g, complementaryRgb.b);
}

function calculateAnalogous(
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

// You'll need to import or define these functions if they're not already available
function hslToRgb(
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } {
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
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")
  );
}

export const colorToolRegistry = {
  addColorsToTheme: handleAddColorsToTheme,
  getCurrentColors: handleGetCurrentColors,
  getColorInfo: handleGetColorInfo,
};
